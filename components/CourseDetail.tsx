import React, { useMemo } from 'react';
import Icon from '../components/common/Icon.tsx';
import { Course, Lecture, SuggestedCourseSummary } from '../types.ts';

interface CourseDetailProps {
  course: Course;
  navigateToLecture: (course: Course, lecture: Lecture) => void;
  onNavigateToCourse: (courseId: string) => void;
}

const parseDurationToMinutes = (value?: string): number => {
  if (!value) {
    return 0;
  }

  const compact = value.trim();
  if (!compact) {
    return 0;
  }

  const colonMatch = compact.match(/^(\d+):(\d{2})$/);
  if (colonMatch) {
    const [, hours, minutes] = colonMatch;
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  }

  const hourMatch = compact.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/i);
  const minuteMatch = compact.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/i);

  let minutes = 0;

  if (hourMatch) {
    minutes += Math.round(parseFloat(hourMatch[1]) * 60);
  }

  if (minuteMatch) {
    minutes += Math.round(parseFloat(minuteMatch[1]));
  }

  if (minutes > 0) {
    return minutes;
  }

  const numericMatch = compact.match(/(\d+(?:\.\d+)?)/);
  if (!numericMatch) {
    return 0;
  }

  const numericValue = parseFloat(numericMatch[1]);
  if (numericValue === 0) {
    return 0;
  }

  return numericValue > 10 ? Math.round(numericValue) : Math.round(numericValue * 60);
};

const formatMinutes = (minutes: number): string => {
  if (!minutes) {
    return '';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!mins) {
    return `${hrs}h`;
  }

  return `${hrs}h ${mins}m`;
};

const MetaStat: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
      <Icon name={icon} className="h-5 w-5" />
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

const SectionCard: React.FC<{ title: string; eyebrow?: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
  title,
  eyebrow,
  children,
  footer,
}) => (
  <section className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_28px_70px_rgba(2,6,23,0.55)]">
    <div className="space-y-2">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-primary/90 dark:text-brand-primary/70">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">{children}</div>
    {footer}
  </section>
);

const LectureItem: React.FC<{ lecture: Lecture; index: number; onClick: () => void }> = ({ lecture, index, onClick }) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-primary/40 dark:hover:bg-white/10"
  >
    <div className="flex items-center gap-4">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 group-hover:scale-[1.02] ${
          lecture.isCompleted
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200'
        }`}
      >
        {lecture.isCompleted ? <Icon name="check" className="h-4 w-4" /> : index + 1}
      </span>
      <div>
        <p className="text-base font-semibold text-slate-800 transition-colors duration-300 group-hover:text-brand-primary dark:text-slate-100">
          {lecture.title}
        </p>
        {lecture.duration && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lecture.duration}</p>}
      </div>
    </div>
    <Icon name="arrowRight" className="h-5 w-5 text-brand-primary transition-transform duration-300 group-hover:translate-x-1" />
  </button>
);

const formatPrice = (course: Course, isPaid: boolean): { label: string; helper?: string } => {
  if (!isPaid) {
    return { label: 'Included', helper: 'Enjoy unlimited access as part of your plan.' };
  }

  if (course.price == null) {
    return { label: 'Premium', helper: 'Instructor pricing will appear here once configured.' };
  }

  const currency = course.currency ?? 'USD';

  try {
    return {
      label: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
        maximumFractionDigits: 2,
      }).format(course.price),
      helper: course.originalPrice && course.originalPrice > course.price
        ? `Save ${(100 - Math.round((course.price / course.originalPrice) * 100)).toFixed(0)}% compared to the original ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(course.originalPrice)} price.`
        : `Charged in ${currency}. One-time secure payment.`,
    };
  } catch (error) {
    console.warn('Unable to format course price', error);
    return {
      label: `${course.currency ?? '$'}${course.price}`,
      helper: 'Final amount displayed by your payment provider.',
    };
  }
};

const formatSuggestedPrice = (course: SuggestedCourseSummary): string => {
  if (!course.isPaid) {
    return 'Free';
  }

  if (course.price == null) {
    return 'Premium';
  }

  const currency = course.currency ?? 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      maximumFractionDigits: 2,
    }).format(course.price);
  } catch (error) {
    console.warn('Unable to format suggested course price', error);
    return `${course.currency ?? '$'}${course.price}`;
  }
};

const CourseDetail: React.FC<CourseDetailProps> = ({ course, navigateToLecture, onNavigateToCourse }) => {
  const computedDuration = useMemo(() => {
    if (course.totalDuration) {
      return course.totalDuration;
    }

    const minutes = course.lectures.reduce((total, lecture) => total + parseDurationToMinutes(lecture.duration), 0);
    return minutes ? formatMinutes(minutes) : '';
  }, [course]);

  const primaryLecture = course.lectures[0];
  const isPaid = course.isPaid ?? !course.isFree;
  const priceInfo = formatPrice(course, isPaid);

  const stats = [
    {
      icon: 'users',
      label: 'Learners',
      value: course.studentCount != null ? course.studentCount.toLocaleString() : '1.2k+',
    },
    {
      icon: 'star',
      label: 'Rating',
      value: `${(course.rating ?? 4.8).toFixed(1)} / 5`,
    },
    {
      icon: 'bar-chart',
      label: 'Level',
      value: course.skillLevel ?? 'All Levels',
    },
    {
      icon: 'clock',
      label: 'Duration',
      value: computedDuration || 'Self-paced',
    },
  ].filter((stat) => stat.value);

  const lectureSections = course.sections?.length
    ? course.sections
    : [
        {
          title: 'Course content',
          lectures: course.lectures,
        },
      ];

  const suggestedCourses = course.suggestedCourseDetails ?? [];

  return (
    <div className="relative mx-auto max-w-7xl space-y-12 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brand-primary/15 via-white/70 to-transparent dark:via-slate-900/70" />

      <section className="grid gap-8 rounded-[2.5rem] border border-slate-200/70 bg-white/95 p-8 shadow-[0_35px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_45px_120px_rgba(2,6,23,0.55)] lg:grid-cols-[minmax(0,7fr)_minmax(260px,5fr)] lg:p-10">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined') {
                  return;
                }

                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/explore';
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              <Icon name="chevronLeft" className="h-4 w-4" /> Explore catalog
            </button>
            {course.updatedAt && (
              <span className="rounded-full bg-brand-secondary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-secondary dark:bg-brand-secondary/25">
                Updated {course.updatedAt}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">
              {course.category}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">{course.title}</h1>
            {course.subtitle && <p className="text-lg font-medium text-brand-primary/90 dark:text-brand-primary/70">{course.subtitle}</p>}
            <p className="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">{course.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-brand-primary">
              <Icon name="star" className="h-4 w-4" />
              {(course.rating ?? 4.8).toFixed(1)} rating
            </span>
            <span>({course.reviewCount?.toLocaleString() ?? '2k+'} reviews)</span>
            <span>•</span>
            <span>{course.studentCount?.toLocaleString() ?? '1.2k+'} learners</span>
            {course.language && (
              <>
                <span>•</span>
                <span>{course.language}</span>
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <MetaStat key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!primaryLecture}
              onClick={() => primaryLecture && navigateToLecture(course, primaryLecture)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-all duration-300 ${
                primaryLecture
                  ? 'bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary hover:-translate-y-0.5 hover:shadow-brand-primary/60'
                  : 'cursor-not-allowed bg-slate-400/60 text-white/70 shadow-none'
              }`}
            >
              <Icon name="play" className="h-5 w-5" /> Start learning
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              <Icon name="bookmark" className="h-5 w-5" /> Save for later
            </button>
          </div>
        </div>

        <aside className="space-y-6 lg:pl-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.25)] transition-colors duration-300 dark:border-white/10 dark:bg-slate-950">
            <img
              src={course.thumbnailUrl ?? course.thumbnail}
              alt={course.title}
              className="h-56 w-full object-cover sm:h-64"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              {(course.tags?.length ? course.tags : [course.category]).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-3 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_35px_90px_rgba(2,6,23,0.55)]">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">Course access</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{priceInfo.label}</p>
              {priceInfo.helper && <p className="text-sm text-slate-600 dark:text-slate-300">{priceInfo.helper}</p>}
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Icon name="infinity" className="h-4 w-4 text-brand-primary" /> Lifetime access
              </li>
              <li className="flex items-center gap-2">
                <Icon name="smartphone" className="h-4 w-4 text-brand-primary" /> Learn on any device
              </li>
              <li className="flex items-center gap-2">
                <Icon name="award" className="h-4 w-4 text-brand-primary" /> Certificate of completion
              </li>
            </ul>
          </div>
        </aside>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(320px,4fr)]">
        <div className="space-y-6">
          {lectureSections.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              eyebrow="Curriculum"
              footer={
                <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                  {section.lectures.length} lessons
                </span>
              }
            >
              <div className="space-y-3">
                {section.lectures.map((lecture, index) => (
                  <LectureItem
                    key={lecture.id}
                    lecture={lecture}
                    index={index}
                    onClick={() => navigateToLecture(course, lecture)}
                  />
                ))}
              </div>
            </SectionCard>
          ))}

          <SectionCard title="Frequently asked" eyebrow="Support">
            <div className="space-y-4">
              {(course.faqs?.length
                ? course.faqs
                : [
                    {
                      question: 'How long do I have access to the course?',
                      answer: 'Enjoy lifetime access and revisit lessons whenever you need a refresher.',
                    },
                    {
                      question: 'Is the course beginner-friendly?',
                      answer: 'Yes! We start with the basics and layer in advanced workflows step by step.',
                    },
                  ]).map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-800 dark:text-white">{faq.question}</p>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <SectionCard title="What you'll learn" eyebrow="Outcomes">
            <ul className="space-y-3">
              {(course.includes?.length
                ? course.includes
                : [
                    'Build confidence with hands-on projects and peer feedback.',
                    'Understand fundamentals through concise, high-impact lessons.',
                    'Access downloadable resources to support your progress.',
                  ]).map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Course resources" eyebrow="Downloads">
            <ul className="space-y-3">
              {(course.resources?.length
                ? course.resources.map((resource) => `${resource.name} · ${resource.type} · ${resource.size}`)
                : [
                    'Downloadable project files with every module.',
                    'Reference sheets summarising complex workflows.',
                    'Cheat-sheets designed for quick revision.',
                  ]).map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-secondary">
                    <Icon name="download" className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {suggestedCourses.length > 0 && (
            <SectionCard title="Suggested for you" eyebrow="Continue learning">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Continue your momentum with another course tailored to your interests.
              </p>
              <div className="space-y-4">
                {suggestedCourses.map((suggested) => (
                  <button
                    key={suggested.id}
                    type="button"
                    onClick={() => onNavigateToCourse(suggested.id)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:bg-white dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="relative inline-flex h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={suggested.thumbnailUrl ?? `https://picsum.photos/seed/${suggested.id}/160/160`}
                        alt={suggested.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/10 to-black/40" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 transition-colors duration-300 group-hover:text-brand-primary dark:text-white">
                            {suggested.title}
                          </p>
                          <p className="text-xs uppercase tracking-[0.3em] text-brand-primary/80 dark:text-brand-primary/60">
                            {suggested.category}
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary dark:bg-brand-primary/20">
                          {formatSuggestedPrice(suggested)}
                        </span>
                      </div>
                      {suggested.tags && suggested.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggested.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-200/70 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Icon name="arrowRight" className="h-5 w-5 text-brand-primary transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </SectionCard>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CourseDetail;
