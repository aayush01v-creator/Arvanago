import React, { useEffect, useMemo, useState } from 'react';
import { Course } from '../types.ts';
import Icon from './common/Icon.tsx';

interface QuickExploreCardProps {
  isOpen: boolean;
  courses: Course[];
  onClose: () => void;
  onExploreCourse: (course: Course) => void;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
  primaryLabel?: string;
  highlightCourseId?: string;
}

const formatPrice = (course: Course): { label: string; tone: 'free' | 'paid' } => {
  const isPaid = course.isPaid ?? !course.isFree;
  if (!isPaid) {
    return { label: 'Free Course', tone: 'free' };
  }

  if (course.price == null) {
    return { label: 'Premium Access', tone: 'paid' };
  }

  const currency = course.currency ?? 'USD';

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      maximumFractionDigits: 2,
    }).format(course.price);

    return { label: formatted, tone: 'paid' };
  } catch (error) {
    console.warn('Unable to format course price in quick explore card', error);
    return { label: `${course.currency ?? '$'}${course.price}`, tone: 'paid' };
  }
};

const QuickExploreCard: React.FC<QuickExploreCardProps> = ({
  isOpen,
  courses,
  onClose,
  onExploreCourse,
  onSecondaryAction,
  secondaryLabel = 'View full catalog',
  primaryLabel = 'Go to course',
  highlightCourseId,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!courses || courses.length === 0) {
      return;
    }

    if (highlightCourseId) {
      const matchedIndex = courses.findIndex((course) => course.id === highlightCourseId);
      if (matchedIndex >= 0) {
        setActiveIndex(matchedIndex);
        return;
      }
    }

    setActiveIndex(0);
  }, [isOpen, highlightCourseId, courses]);

  const activeCourse = useMemo(() => courses?.[activeIndex], [courses, activeIndex]);

  if (!isOpen || !courses || courses.length === 0 || !activeCourse) {
    return null;
  }

  const price = formatPrice(activeCourse);
  const coverImage = activeCourse.thumbnailUrl ?? activeCourse.thumbnail;
  const courseTags = activeCourse.tags?.slice(0, 4) ?? [];

  const rotateCourse = (direction: 'next' | 'prev') => {
    if (!courses || courses.length === 0) {
      return;
    }

    setActiveIndex((current) => {
      if (direction === 'next') {
        return (current + 1) % courses.length;
      }

      return (current - 1 + courses.length) % courses.length;
    });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 px-4 py-10 backdrop-blur-[18px]">
      <div className="absolute inset-0 animate-[driftGlow_30s_ease-in-out_infinite] bg-[radial-gradient(circle_at_center,_rgba(43,131,198,0.22),_transparent_60%)]" />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/30 bg-white/25 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur-[28px] transition-colors duration-500 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-[0_50px_140px_rgba(2,6,23,0.85)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-600 shadow-lg shadow-white/40 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          aria-label="Close quick explore"
        >
          <Icon name="x" className="h-6 w-6" />
        </button>

        <div className="absolute -left-12 top-1/4 h-64 w-64 animate-[pulseGlow_18s_ease-in-out_infinite] rounded-full bg-brand-primary/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 animate-[pulseGlow_20s_ease-in-out_infinite_reverse] rounded-full bg-sky-400/25 blur-[120px]" />

        <div className="relative grid gap-10 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 flex flex-col justify-between p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 shadow-sm backdrop-blur lg:text-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
                  <Icon name="courses" className="h-4 w-4" />
                </span>
                Featured Course
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                  {activeCourse.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                  {activeCourse.description}
                </p>
              </div>
              {courseTags.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {courseTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                        <Icon name="sparkle" className="h-3.5 w-3.5" />
                      </span>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <div className={`text-sm font-semibold uppercase tracking-[0.3em] ${price.tone === 'paid' ? 'text-amber-500 dark:text-amber-300' : 'text-emerald-500 dark:text-emerald-300'}`}>
                  {price.label}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-300">
                  {activeCourse.totalDuration && (
                    <span className="inline-flex items-center gap-2">
                      <Icon name="clock" className="h-4 w-4 text-brand-primary" />
                      {activeCourse.totalDuration}
                    </span>
                  )}
                  {typeof activeCourse.lessonsCount === 'number' && (
                    <span className="inline-flex items-center gap-2">
                      <Icon name="play" className="h-4 w-4 text-brand-secondary" />
                      {activeCourse.lessonsCount} lessons
                    </span>
                  )}
                  {typeof activeCourse.studentCount === 'number' && (
                    <span className="inline-flex items-center gap-2">
                      <Icon name="users" className="h-4 w-4 text-brand-primary" />
                      {activeCourse.studentCount.toLocaleString()} learners
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => onExploreCourse(activeCourse)}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand-primary/60"
                >
                  <Icon name="arrowRight" className="h-5 w-5" />
                  {primaryLabel}
                </button>
                {onSecondaryAction && (
                  <button
                    type="button"
                    onClick={onSecondaryAction}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    <Icon name="courses" className="h-5 w-5" />
                    {secondaryLabel}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/25 via-transparent to-purple-500/20" />
            <div className="absolute inset-0 opacity-80">
              <img
                src={coverImage}
                alt={activeCourse.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_70%)]" />
            <div className="absolute left-6 top-6 inline-flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              <Icon name="sparkles" className="h-4 w-4" />
              {activeCourse.category}
            </div>
            <div className="absolute bottom-6 left-1/2 flex w-[85%] -translate-x-1/2 items-center justify-between rounded-3xl border border-white/40 bg-white/75 px-6 py-4 text-sm font-medium text-slate-600 shadow-lg backdrop-blur lg:w-[80%] dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              <span className="inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                  <Icon name="star" className="h-4 w-4" />
                </span>
                {typeof activeCourse.rating === 'number' ? `${activeCourse.rating.toFixed(1)} rating` : 'New arrival'}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-secondary/15 text-brand-secondary">
                  <Icon name="share" className="h-4 w-4" />
                </span>
                Guided by {activeCourse.author.name}
              </span>
            </div>
            <div className="absolute inset-y-1/2 left-4 z-20 flex -translate-y-1/2 flex-col gap-3">
              <button
                type="button"
                onClick={() => rotateCourse('prev')}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-600 shadow-md backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                aria-label="Show previous course"
              >
                <Icon name="chevronLeft" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => rotateCourse('next')}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-600 shadow-md backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                aria-label="Show next course"
              >
                <Icon name="chevronRight" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {courses.length > 1 && (
          <div className="relative z-20 border-t border-white/40 bg-white/25 px-10 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {courses.map((course, index) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`group relative flex min-w-[180px] items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition-all duration-300 ${
                    index === activeIndex
                      ? 'border-transparent bg-gradient-to-r from-brand-primary/90 to-brand-secondary/90 text-white shadow-lg shadow-brand-primary/40'
                      : 'border-white/40 bg-white/60 text-slate-600 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  <span className="relative inline-flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={course.thumbnailUrl ?? course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/10 to-black/40" />
                  </span>
                  <div>
                    <p className="line-clamp-2 font-semibold leading-tight">{course.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] opacity-80">{course.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickExploreCard;
