import React, { useMemo } from 'react';
import Icon from '../components/common/Icon.tsx';
import { Course, Lecture } from '../types.ts';

interface CourseDetailProps {
  course: Course;
  navigateToLecture: (course: Course, lecture: Lecture) => void;
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
  <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/10">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100 dark:from-white/20" />
    <div className="relative flex items-start gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary shadow-inner shadow-white/70 transition-colors duration-500 group-hover:bg-brand-primary/25 dark:bg-brand-primary/25">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
        <p className="text-lg font-semibold text-slate-800 transition-colors duration-500 dark:text-slate-100">{value}</p>
      </div>
    </div>
  </div>
);

const LectureItem: React.FC<{ lecture: Lecture; index: number; onClick: () => void }> = ({ lecture, index, onClick }) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-4 text-left transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-primary/50 hover:bg-white shadow-sm hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/5 dark:bg-white/5 dark:hover:border-brand-primary/40 dark:hover:bg-white/10"
  >
    <div className="flex items-center gap-4">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold transition-all duration-500 group-hover:scale-105 ${
          lecture.isCompleted
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
            : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-200'
        }`}
      >
        {lecture.isCompleted ? <Icon name="check" className="h-5 w-5" /> : index + 1}
      </span>
      <div>
        <h4 className="text-lg font-semibold text-slate-800 transition-colors duration-500 group-hover:text-brand-primary dark:text-slate-100">
          {lecture.title}
        </h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lecture.duration}</p>
      </div>
    </div>
    <Icon name="arrowRight" className="h-5 w-5 text-brand-primary transition-transform duration-500 group-hover:translate-x-1" />
  </button>
);

const CourseDetail: React.FC<CourseDetailProps> = ({ course, navigateToLecture }) => {
  const computedDuration = useMemo(() => {
    if (course.totalDuration) {
      return course.totalDuration;
    }

    const minutes = course.lectures.reduce((total, lecture) => total + parseDurationToMinutes(lecture.duration), 0);
    return minutes ? formatMinutes(minutes) : '';
  }, [course]);

  const primaryLecture = course.lectures[0];
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

  return (
    <div className="relative space-y-10">
      <div className="absolute -left-24 top-20 hidden h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl md:block" />
      <div className="absolute -right-16 bottom-10 hidden h-72 w-72 rounded-full bg-sky-500/20 blur-[120px] md:block" />

      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.18)] backdrop-blur-3xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-[0_35px_80px_rgba(2,6,23,0.6)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_75%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row">
          <div className="group relative flex-1 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-primary/30 via-transparent to-brand-secondary/25 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <img
              src={course.thumbnailUrl ?? course.thumbnail}
              alt={course.title}
              className="relative h-64 w-full rounded-3xl object-cover shadow-[0_30px_60px_rgba(15,23,42,0.35)] transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="pointer-events-none absolute inset-x-6 bottom-6 flex flex-wrap items-center gap-2">
              {(course.tags?.length ? course.tags : [course.category]).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col justify-between gap-6 lg:max-w-md">
            <div className="space-y-4">
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
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:bg-white/10 dark:text-slate-200"
              >
                <Icon name="chevronLeft" className="h-4 w-4" /> Back to courses
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 transition-colors duration-500 dark:text-white sm:text-4xl">
                  {course.title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">{course.description}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <MetaStat key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
              ))}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!primaryLecture}
                onClick={() => primaryLecture && navigateToLecture(course, primaryLecture)}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition-transform duration-500 ${
                  primaryLecture
                    ? 'bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary hover:-translate-y-0.5 hover:shadow-2xl'
                    : 'cursor-not-allowed bg-slate-400/60 text-white/70 shadow-none'
                }`}
              >
                <Icon name="play" className="h-5 w-5" /> Start learning
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                <Icon name="bookmark" className="h-5 w-5" /> Save for later
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {lectureSections.map((section) => (
            <div key={section.title} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.15)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-[0_28px_70px_rgba(2,6,23,0.55)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Curriculum</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
                </div>
                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                  {section.lectures.length} lessons
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {section.lectures.map((lecture, index) => (
                  <LectureItem
                    key={lecture.id}
                    lecture={lecture}
                    index={index}
                    onClick={() => navigateToLecture(course, lecture)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-[0_28px_70px_rgba(2,6,23,0.5)]">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">What you'll learn</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
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
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/70 dark:shadow-[0_28px_70px_rgba(2,6,23,0.5)]">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Frequently asked</h3>
            <div className="mt-4 space-y-4">
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
                <div key={faq.question} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-sm shadow-sm transition-colors duration-500 dark:border-white/5 dark:bg-white/5">
                  <p className="font-semibold text-slate-800 dark:text-white">{faq.question}</p>
                  <p className="mt-2 text-slate-500 dark:text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default CourseDetail;
