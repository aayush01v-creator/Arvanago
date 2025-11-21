import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Homepage from '@/components/Homepage.tsx';
import { Course, User } from '@/types';

interface HomePageProps {
  user: User | null;
  courses?: Course[];
  isLoading?: boolean;
  error?: string | null;
  onCourseSelect?: (course: Course) => void;
  onRefreshCourses?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  courses = [],
  isLoading = false,
  error,
  onCourseSelect,
  onRefreshCourses,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      console.error('Unable to load courses for homepage:', error);
    }
  }, [error]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleCourseSelect = useCallback(
    (course: Course) => {
      onCourseSelect?.(course);
    },
    [onCourseSelect],
  );

  if (error && onRefreshCourses) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-center dark:bg-slate-950">
        <div className="max-w-lg rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:bg-white/5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">Something went wrong</p>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">We couldn't load the latest courses</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <button
            onClick={onRefreshCourses}
            className="mt-6 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <Homepage
      onNavigateToLogin={handleNavigateToLogin}
      onCourseSelect={handleCourseSelect}
      courses={courses}
      isLoadingCourses={isLoading}
    />
  );
};

export default HomePage;
