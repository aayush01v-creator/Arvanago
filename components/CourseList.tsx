import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import SkeletonCard from './common/SkeletonCard.tsx';

interface CourseListProps {
  courses: Course[];
  navigateToCourse: (course: Course) => void;
  initialCategory?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

interface UnlockModalProps {
  course: Course;
  onClose: () => void;
  onUnlock: (course: Course) => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ course, onClose, onUnlock }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = () => {
    if (code.trim() === '') {
      setError('Please enter an access code.');
      return;
    }

    // In a real app, this would be a network request to validate the code.
    // For this simulation, any code works.
    setError('');
    onUnlock(course);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="m-4 w-full max-w-md rounded-3xl border border-white/30 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.35)] backdrop-blur-3xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_30px_90px_rgba(2,6,23,0.85)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">Premium course</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Unlock {course.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-transparent bg-white/70 p-2 text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:bg-white/5 dark:text-slate-300"
            aria-label="Close unlock modal"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Enter the instructor-provided access code to instantly unlock this premium learning journey.
        </p>

        <input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) {
              setError('');
            }
          }}
          placeholder="Access code"
          className="mt-6 w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 dark:bg-white/10 dark:text-slate-200"
        />
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

        <button
          onClick={handleUnlock}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-brand-primary/60"
        >
          <Icon name="unlock" className="h-4 w-4" /> Unlock now
        </button>
      </div>
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  onOpenCourse: (course: Course) => void;
  onUnlockCourse: (course: Course) => void;
}

const CourseCardComponent: React.FC<CourseCardProps> = ({
  course,
  onOpenCourse,
  onUnlockCourse,
}) => {
  const coverImage = course.thumbnailUrl ?? course.thumbnail;
  const isPaid = course.isPaid ?? !course.isFree;
  const priceLabel = (() => {
    if (!isPaid) {
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
      console.warn('Unable to format course price', error);
      return `${course.currency ?? '$'}${course.price}`;
    }
  })();

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-900/70">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_65%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_70%)]" />
        <img
          src={coverImage}
          alt={course.title}
          className="relative z-10 h-48 w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm dark:bg-black/40">
            {course.category}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur ${
              isPaid ? 'bg-amber-500/90' : 'bg-emerald-500/90'
            }`}
          >
            {priceLabel}
          </span>
        </div>
      </div>
      <div className="relative z-10 flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-900 transition-colors duration-500 group-hover:text-brand-primary dark:text-white">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{course.description}</p>
        </div>
        {course.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors duration-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Icon name="clock" className="h-4 w-4 text-brand-primary" /> {course.totalDuration ?? 'Self-paced'}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="users" className="h-4 w-4 text-brand-secondary" />
              {(course.studentCount ?? 0).toLocaleString()} learners
            </span>
          </div>
          {isPaid ? (
            <button
              onClick={() => onUnlockCourse(course)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-brand-primary/60"
            >
              <Icon name="lock" className="h-4 w-4" /> Unlock course
            </button>
          ) : (
            <button
              onClick={() => onOpenCourse(course)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              <Icon name="play" className="h-4 w-4" /> Start learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseCard = memo(CourseCardComponent);

const CourseList: React.FC<CourseListProps> = ({
  courses,
  navigateToCourse,
  initialCategory = 'All',
  isLoading = false,
  errorMessage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [unlockingCourse, setUnlockingCourse] = useState<Course | null>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const publishedCourses = useMemo(() => courses.filter((course) => course.isPublished), [courses]);

  const deferredCategory = useDeferredValue(selectedCategory);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(publishedCourses.map((course) => course.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, [publishedCourses]);

  const filteredCourses = useMemo(() => {
    if (deferredCategory === 'All') {
      return publishedCourses;
    }

    return publishedCourses.filter((course) => course.category === deferredCategory);
  }, [deferredCategory, publishedCourses]);

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleOpenCourse = useCallback((course: Course) => {
    navigateToCourse(course);
  }, [navigateToCourse]);

  const handleUnlockRequest = useCallback((course: Course) => {
    setUnlockingCourse(course);
  }, []);

  const handleUnlock = useCallback((course: Course) => {
    // In real app, you'd update the user's unlocked courses state
    console.log(`Unlocking ${course.title}`);
    navigateToCourse(course);
  }, [navigateToCourse]);

  const handleCloseUnlock = useCallback(() => {
    setUnlockingCourse(null);
  }, []);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/70">
        <div className="relative">
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-8 h-32 w-32 rounded-full bg-brand-secondary/20 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Explore Courses</h2>
          <p className="relative mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Discover immersive lessons curated for modern creators, with live Firestore content keeping every visit fresh.
          </p>
          <div className="relative mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleSelectCategory(category)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'border-transparent bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/40'
                    : 'border-white/60 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
        ) : errorMessage ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-rose-200/60 bg-white/80 p-16 text-center shadow-inner shadow-rose-100/40 dark:border-rose-500/30 dark:bg-rose-500/10">
            <Icon name="alert-triangle" className="mb-4 h-12 w-12 text-rose-400 dark:text-rose-300" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Something went wrong</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-300">{errorMessage}</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onOpenCourse={handleOpenCourse}
              onUnlockCourse={handleUnlockRequest}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-white/30 bg-white/70 p-16 text-center shadow-inner shadow-white/50 backdrop-blur-xl dark:border-white/5 dark:bg-white/5">
            <Icon name="search" className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No courses available</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-300">
              We couldn&apos;t find any courses for the selected category. Please try a different category or check back later.
            </p>
          </div>
        )}
      </div>

      {unlockingCourse && (
        <UnlockModal course={unlockingCourse} onClose={handleCloseUnlock} onUnlock={handleUnlock} />
      )}
    </div>
  );
};

export default CourseList;
