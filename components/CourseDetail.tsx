import React, { useCallback, useMemo, useState } from 'react';
import Icon from './common/Icon.tsx';
import { Course, CourseInstructor, Lecture, SuggestedCourseSummary } from '../types.ts';

interface CourseDetailProps {
  course: Course;
  navigateToLecture: (course: Course, lecture: Lecture) => void;
  onNavigateToCourse: (courseId: string) => void;
  onStartLearning?: (course: Course) => void;
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

const formatCurrency = (price?: number, currency?: string): string | null => {
  if (price == null) {
    return null;
  }

  const currencyCode = currency ?? 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return `${currency ?? '$'}${price}`;
  }
};

const formatSuggestedPrice = (course: SuggestedCourseSummary): string => {
  if (!course.isPaid) {
    return 'Free';
  }

  if (course.price == null) {
    return 'Premium';
  }

  return formatCurrency(course.price, course.currency) ?? 'Premium';
};

const getDefaultLearningOutcomes = (): string[] => [
  'Build confidence with hands-on projects and peer feedback.',
  'Understand fundamentals through concise, high-impact lessons.',
  'Access downloadable resources to support your progress.',
  'Earn a shareable certificate upon completion.',
];

const getDefaultRequirements = (): string[] => [
  'No prior experience required—perfect for motivated beginners.',
  'A computer or tablet with a reliable internet connection.',
  'Dedicate a few hours each week to stay on track.',
];

const getDefaultFeatures = (): string[] => [
  'On-demand video lessons',
  'Downloadable resources',
  'Accessible on mobile and TV',
  'Certificate of completion',
];

const getInstructorList = (course: Course): CourseInstructor[] => {
  if (course.instructors && course.instructors.length > 0) {
    return course.instructors;
  }

  const fallback: CourseInstructor = {
    id: course.author.uid,
    name: course.author.name,
    title: course.author.bio,
    avatar: course.author.avatar,
    totalStudents: course.studentCount,
  };

  return [fallback];
};

const getLectureSections = (course: Course) =>
  course.sections?.length
    ? course.sections
    : [
        {
          title: 'Course curriculum',
          lectures: course.lectures,
        },
      ];

const CourseMetaItem: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/80">
    <Icon name={icon} className="h-4 w-4" />
    {label}
  </span>
);

const InfoCard: React.FC<{
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, eyebrow, children, footer }) => (
  <section className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_28px_70px_rgba(2,6,23,0.55)]">
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

const CourseContentSection: React.FC<{
  sectionTitle: string;
  lectures: Lecture[];
  isOpen: boolean;
  toggle: () => void;
  onLectureClick: (lecture: Lecture) => void;
}> = ({ sectionTitle, lectures, isOpen, toggle, onLectureClick }) => {
  const sectionDuration = useMemo(() => {
    const minutes = lectures.reduce((total, lecture) => total + parseDurationToMinutes(lecture.duration), 0);
    return minutes ? formatMinutes(minutes) : undefined;
  }, [lectures]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-slate-900 transition-colors duration-300 hover:bg-white dark:text-white dark:hover:bg-white/10"
      >
        <span>{sectionTitle}</span>
        <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
          {lectures.length} lectures
          {sectionDuration && (
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-semibold text-brand-primary">
              <Icon name="clock" className="h-3.5 w-3.5" /> {sectionDuration}
            </span>
          )}
          <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className="h-4 w-4" />
        </span>
      </button>
      <div className={`${isOpen ? 'max-h-[999px] opacity-100' : 'max-h-0 opacity-0'} space-y-2 px-5 pb-5 transition-all duration-500 ease-in-out`}> 
        {lectures.map((lecture, index) => (
          <button
            key={lecture.id}
            type="button"
            onClick={() => onLectureClick(lecture)}
            className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 transition-colors duration-300 group-hover:bg-brand-primary group-hover:text-white dark:bg-white/10 dark:text-slate-400">
                {lecture.isPreview ? <Icon name="play" className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-800 transition-colors duration-300 group-hover:text-brand-primary dark:text-slate-100">
                  {lecture.title}
                </p>
                {lecture.duration && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lecture.duration}</p>}
              </div>
            </div>
            {lecture.isPreview ? (
              <span className="rounded-full bg-brand-secondary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-secondary">
                Preview
              </span>
            ) : (
              <Icon name="arrowRight" className="h-4 w-4 text-brand-primary transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const InstructorCard: React.FC<{ instructor: CourseInstructor }> = ({ instructor }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition-colors duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg dark:border-white/10 dark:bg-white/10">
    <div className="flex items-center gap-4">
      <span className="relative inline-flex h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-brand-primary/10">
        {instructor.avatar ? (
          <img src={instructor.avatar} alt={instructor.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-primary">
            {instructor.name[0]}
          </span>
        )}
      </span>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{instructor.name}</p>
        {instructor.title && <p className="text-sm text-brand-primary/80 dark:text-brand-primary/60">{instructor.title}</p>}
        {instructor.headline && <p className="text-sm text-slate-500 dark:text-slate-400">{instructor.headline}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {instructor.rating && (
            <span className="inline-flex items-center gap-1">
              <Icon name="star" className="h-4 w-4 text-amber-400" />
              {instructor.rating.toFixed(1)} rating
            </span>
          )}
          {instructor.totalStudents && (
            <span className="inline-flex items-center gap-1">
              <Icon name="users" className="h-4 w-4" />
              {instructor.totalStudents.toLocaleString()} students
            </span>
          )}
          {instructor.totalReviews && (
            <span className="inline-flex items-center gap-1">
              <Icon name="message-circle" className="h-4 w-4" />
              {instructor.totalReviews.toLocaleString()} reviews
            </span>
          )}
        </div>
      </div>
    </div>
    {instructor.bio && <p className="text-sm text-slate-600 dark:text-slate-300">{instructor.bio}</p>}
    {instructor.description && <p className="text-sm text-slate-600 dark:text-slate-300">{instructor.description}</p>}
    {instructor.socialLinks && instructor.socialLinks.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {instructor.socialLinks.map((link) => (
          <a
            key={`${instructor.id}-${link.label}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 px-3 py-1 text-xs font-semibold text-brand-primary transition-colors duration-300 hover:bg-brand-primary hover:text-white"
          >
            <Icon name="externalLink" className="h-3.5 w-3.5" /> {link.label}
          </a>
        ))}
      </div>
    )}
  </div>
);

const CourseDetail: React.FC<CourseDetailProps> = ({ course, navigateToLecture, onNavigateToCourse, onStartLearning }) => {
  const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(0);

  const primaryLecture = course.lectures.find((lecture) => lecture.isPreview) ?? course.lectures[0];
  const instructors = useMemo(() => getInstructorList(course), [course]);

  const handleStartLearning = useCallback(() => {
    if (!primaryLecture) return;

    if (onStartLearning) {
      onStartLearning(course);
      return;
    }

    navigateToLecture(course, primaryLecture);
  }, [course, navigateToLecture, onStartLearning, primaryLecture]);

  const computedDuration = useMemo(() => {
    if (course.totalDuration) {
      return course.totalDuration;
    }

    const minutes = course.lectures.reduce((total, lecture) => total + parseDurationToMinutes(lecture.duration), 0);
    return minutes ? formatMinutes(minutes) : '';
  }, [course]);

  const lectureSections = useMemo(() => getLectureSections(course), [course]);

  const totalLectures = useMemo(
    () => lectureSections.reduce((count, section) => count + section.lectures.length, 0),
    [lectureSections],
  );

  const learningOutcomes = course.learningOutcomes?.length ? course.learningOutcomes : getDefaultLearningOutcomes();
  const requirements = course.requirements?.length ? course.requirements : getDefaultRequirements();
  const features = course.includes?.length ? course.includes : getDefaultFeatures();

  const formattedPrice = formatCurrency(course.price, course.currency);
  const formattedOriginalPrice = formatCurrency(course.originalPrice, course.currency);
  const discount =
    course.price != null && course.originalPrice != null && course.originalPrice > 0
      ? Math.max(0, Math.round(100 - (course.price / course.originalPrice) * 100))
      : null;

  const courseSummary = `${lectureSections.length} section${lectureSections.length === 1 ? '' : 's'} • ${totalLectures} lecture${
    totalLectures === 1 ? '' : 's'
  } • ${computedDuration || 'Self-paced'} total length`;

  const suggestedCourses = course.suggestedCourseDetails ?? [];

  const descriptionBlocks = useMemo(() => {
    if (course.descriptionHtml) {
      return [{ type: 'html', content: course.descriptionHtml } as const];
    }

    const sections = course.descriptionSections?.map((section) => ({
      type: 'section' as const,
      title: section.title,
      content: section.content,
    }));

    if (sections && sections.length > 0) {
      return sections;
    }

    const raw = course.longDescription ?? course.description;
    return raw
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({ type: 'text' as const, content: paragraph }));
  }, [course]);

  return (
    <div className="relative bg-slate-50 pb-16 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brand-primary/15 via-white/70 to-transparent dark:via-slate-900/70" />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/10 bg-slate-950 text-white shadow-[0_35px_90px_rgba(15,23,42,0.35)] sm:rounded-[2.5rem]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,7fr)_minmax(280px,4fr)] lg:items-start lg:gap-12 lg:px-12 lg:py-14">
            <div className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:text-white"
                >
                  <Icon name="chevronLeft" className="h-4 w-4" /> Explore catalog
                </button>
                <span className="rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-secondary">
                  {course.category}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{course.title}</h1>
                {course.headline || course.subtitle ? (
                  <p className="text-lg font-semibold text-brand-primary/80 dark:text-brand-primary/70">
                    {course.headline ?? course.subtitle}
                  </p>
                ) : null}
                <p className="max-w-3xl text-base leading-relaxed text-white/80">{course.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-white/70 sm:gap-3">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Icon name="star" className="h-4 w-4" />
                  {(course.rating ?? 4.8).toFixed(1)} rating
                </span>
                <span>({course.reviewCount?.toLocaleString() ?? '2k+'} reviews)</span>
                <span>•</span>
                <span>{course.studentCount?.toLocaleString() ?? '1.2k+'} learners</span>
                {instructors.length > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Created by{' '}
                      {instructors
                        .map((instructor) => instructor.name)
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60 sm:gap-3">
                {course.lastUpdated ?? course.updatedAt ? (
                  <CourseMetaItem icon="refreshCw" label={`Updated ${course.lastUpdated ?? course.updatedAt}`} />
                ) : null}
                {course.language ? <CourseMetaItem icon="globe" label={course.language} /> : null}
                {course.skillLevel ? <CourseMetaItem icon="bar-chart" label={course.skillLevel} /> : null}
                {computedDuration ? <CourseMetaItem icon="clock" label={computedDuration} /> : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!primaryLecture}
                  onClick={handleStartLearning}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-all duration-300 ${
                    primaryLecture
                      ? 'bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary hover:-translate-y-0.5 hover:shadow-brand-primary/60'
                      : 'cursor-not-allowed bg-white/20 text-white/60 shadow-none'
                  }`}
                >
                  <Icon name="play" className="h-5 w-5" /> Start learning
                </button>
                {course.previewVideoUrl && (
                  <a
                    href={course.previewVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
                  >
                    <Icon name="video" className="h-5 w-5" /> Preview this course
                  </a>
                )}
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/40">
                <img
                  src={course.previewImageUrl ?? course.thumbnailUrl ?? course.thumbnail}
                  alt={course.title}
                  className="h-56 w-full object-cover sm:h-64"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {course.previewVideoUrl && (
                  <a
                    href={course.previewVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-x-6 bottom-6 inline-flex items-center justify-center gap-2 rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <Icon name="play" className="h-5 w-5" /> Preview this course
                  </a>
                )}
              </div>

              <div className="space-y-5 rounded-3xl bg-white/95 p-6 text-slate-900 shadow-[0_25px_70px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:bg-slate-900/90 dark:text-white">
                <div className="space-y-2">
                  <div className="flex items-end gap-3 text-3xl font-bold">
                    <span>{formattedPrice ?? 'Included'}</span>
                    {formattedOriginalPrice && (
                      <span className="text-lg font-semibold text-slate-400 line-through">{formattedOriginalPrice}</span>
                    )}
                  </div>
                  {discount ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                      <Icon name="trendingUp" className="h-4 w-4" /> {discount}% off today
                    </span>
                  ) : null}
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {course.price == null
                      ? 'Pricing will be visible once the instructor sets it.'
                      : course.currency
                        ? `Billed in ${course.currency.toUpperCase()} with secure checkout.`
                        : 'Secure checkout with your saved payment method.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartLearning}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand-primary/60"
                >
                  <Icon name="play" className="h-5 w-5" /> Start learning now
                </button>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                    This course includes
                  </p>
                  <ul className="space-y-2">
                    {features.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Icon name="check" className="h-4 w-4 text-brand-primary" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-12 grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(320px,4fr)] lg:gap-14">
          <div className="space-y-8">
            <InfoCard title="What you'll learn" eyebrow="Outcomes">
              <ul className="grid gap-3 md:grid-cols-2">
                {learningOutcomes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>

            <InfoCard title="Course content" eyebrow="Curriculum" footer={<p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">{courseSummary}</p>}>
              <div className="space-y-3">
                {lectureSections.map((section, index) => (
                  <CourseContentSection
                    key={section.title}
                    sectionTitle={section.title}
                    lectures={section.lectures}
                    isOpen={openSectionIndex === index}
                    toggle={() => setOpenSectionIndex(openSectionIndex === index ? null : index)}
                    onLectureClick={(lecture) => navigateToLecture(course, lecture)}
                  />
                ))}
              </div>
            </InfoCard>

            <InfoCard title="Requirements" eyebrow="Before you begin">
              <ul className="space-y-2">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-brand-primary/50" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>

            <InfoCard title="Course description" eyebrow="Inside the course">
              {descriptionBlocks.map((block, index) => {
                if (block.type === 'html') {
                  return (
                    <div
                      key={`description-html-${index}`}
                      className="prose prose-slate max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  );
                }

                if (block.type === 'section') {
                  return (
                    <div key={`description-section-${index}`} className="space-y-2">
                      {block.title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{block.title}</h3>}
                      <p>{block.content}</p>
                    </div>
                  );
                }

                return <p key={`description-text-${index}`}>{block.content}</p>;
              })}
            </InfoCard>

            <InfoCard title="Instructors" eyebrow="Meet your mentors">
              <div className="space-y-4">
                {instructors.map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
            </InfoCard>

            <InfoCard title="Frequently asked" eyebrow="Support">
              <div className="space-y-3">
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
                  <details
                    key={faq.question}
                    className="group rounded-2xl border border-slate-200/70 bg-white/90 p-4 transition-colors duration-300 open:border-brand-primary/40 open:shadow-lg dark:border-white/10 dark:bg-white/5"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-semibold text-slate-900 transition-colors duration-300 marker:hidden group-open:text-brand-primary dark:text-white">
                      {faq.question}
                      <Icon name="chevronDown" className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </InfoCard>
          </div>

          <aside className="space-y-8">
            {course.resources && course.resources.length > 0 && (
              <InfoCard title="Course resources" eyebrow="Downloads">
                <ul className="space-y-3">
                  {course.resources.map((resource) => (
                    <li key={resource.id} className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-secondary/15 text-brand-secondary">
                        <Icon name="download" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{resource.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {resource.type} • {resource.size}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </InfoCard>
            )}

            {suggestedCourses.length > 0 && (
              <InfoCard title="Suggested for you" eyebrow="Continue learning">
                <p>
                  Continue your momentum with another course tailored to your interests.
                </p>
                <div className="space-y-4">
                  {suggestedCourses.map((suggested) => (
                    <button
                      key={suggested.id}
                      type="button"
                      onClick={() => onNavigateToCourse(suggested.id)}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/95 p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
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
              </InfoCard>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
