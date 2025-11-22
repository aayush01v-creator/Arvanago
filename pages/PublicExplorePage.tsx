import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseList from '@/components/CourseList.tsx';
import type { Course } from '@/types';
import { PENDING_ACTION_STORAGE_KEY, PENDING_COURSE_STORAGE_KEY } from '@/constants.ts';
import { safeLocalStorage } from '@/utils/safeStorage';

interface PublicExplorePageProps {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  onCourseSelect: (course: Course) => void;
  onRefreshCourses: (options?: { forceRefresh?: boolean }) => Promise<void>;
}

const PublicExplorePage: React.FC<PublicExplorePageProps> = ({
  courses,
  isLoading,
  error,
  onCourseSelect,
  onRefreshCourses,
}) => {
  const navigate = useNavigate();

  const handlePreviewCourse = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}`);
    },
    [navigate],
  );

  const handleWishlistRequest = useCallback(
    (course: Course) => {
      safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
      safeLocalStorage.setItem(PENDING_ACTION_STORAGE_KEY, 'wishlist');
      navigate('/login');
    },
    [navigate],
  );

  useEffect(() => {
    void onRefreshCourses();
  }, [onRefreshCourses]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        <header className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">Course catalog</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Explore our live classroom</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Browse curated programs with live progress tracking. Join now or bookmark a course to continue after logging in.
          </p>
        </header>

        <div className="rounded-3xl border border-white/40 bg-white/70 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
          <CourseList
            courses={courses}
            navigateToCourse={onCourseSelect}
            onPreviewCourse={handlePreviewCourse}
            onToggleWishlist={handleWishlistRequest}
            isLoading={isLoading}
            errorMessage={error}
          />
        </div>
      </div>
    </main>
  );
};

export default PublicExplorePage;
