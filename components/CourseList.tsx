import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import SkeletonCard from './common/SkeletonCard.tsx';

interface CourseListProps {
  courses: Course[];
  navigateToCourse: (course: Course) => void;
  onPreviewCourse?: (course: Course) => void;
  onToggleWishlist?: (course: Course) => void;
  wishlistCourseIds?: string[];
  initialCategory?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

interface CourseCardProps {
  course: Course;
  onEnrollCourse: (course: Course) => void;
  onPreviewCourse: (course: Course) => void;
  onToggleWishlist?: (course: Course) => void;
  isWishlisted?: boolean;
}

const CourseCardComponent: React.FC<CourseCardProps> = ({
  course,
  onEnrollCourse,
  onPreviewCourse,
  onToggleWishlist,
  isWishlisted = false,
}) => {
  const coverImage = course.thumbnailUrl ?? course.thumbnail;
  const isPaid = course.isPaid ?? !course.isFree;
  const wishlisted = isWishlisted;

  const handleWishlistClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleWishlist?.(course);
  };
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
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent opacity-90 transition duration-500 group-hover:opacity-100" />
        <img
          src={coverImage}
          alt={course.title}
          className="h-52 w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-primary shadow-lg shadow-brand-primary/30 backdrop-blur-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white shadow-md shadow-brand-primary/40">
            <Icon name={course.level === 'Advanced' ? 'flame' : course.level === 'Intermediate' ? 'sparkle' : 'sparkles'} className="h-3.5 w-3.5" />
          </span>
          {course.level ?? 'All levels'}
        </div>
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <button
            onClick={handleWishlistClick}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/80 ${wishlisted ? 'ring-2 ring-red-300' : ''}`}
          >
            <Icon name={wishlisted ? 'heart-filled' : 'heart'} className={`h-4 w-4 ${wishlisted ? 'text-red-400' : ''}`} />
          </button>
          <div className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {priceLabel}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-3 text-sm text-white">
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2 overflow-hidden rounded-full border border-white/30 bg-white/10 px-2 py-1">
              {course.participants?.slice(0, 3).map((participant, index) => (
                <img
                  key={`${participant}-${index}`}
                  src={participant}
                  alt="Participant"
                  className="h-6 w-6 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
              ))}
              <span className="ml-2 text-xs font-semibold">{(course.participants?.length ?? 0) + 12}+ enrolled</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
            <Icon name="star" className="h-4 w-4 text-amber-300" />
            <span className="font-semibold">{course.rating || '4.8'}</span>
          </div>
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => onEnrollCourse(course)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-primary/40 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-brand-primary/60"
              >
                <Icon name="unlock" className="h-4 w-4" /> Enroll course
              </button>
              <button
                onClick={() => onPreviewCourse(course)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:text-brand-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                <Icon name="play" className="h-4 w-4" /> Preview
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEnrollCourse(course)}
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
  onPreviewCourse,
  onToggleWishlist,
  wishlistCourseIds,
  initialCategory = 'All',
  isLoading = false,
  errorMessage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

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

  const handleEnrollCourse = useCallback((course: Course) => {
    navigateToCourse(course);
  }, [navigateToCourse]);

  const handlePreview = useCallback((course: Course) => {
    if (onPreviewCourse) {
      onPreviewCourse(course);
      return;
    }

    navigateToCourse(course);
  }, [navigateToCourse, onPreviewCourse]);

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
              onEnrollCourse={handleEnrollCourse}
              onPreviewCourse={handlePreview}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={wishlistCourseIds?.includes(course.id)}
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
    </div>
  );
};

export default CourseList;
