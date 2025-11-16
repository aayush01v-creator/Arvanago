import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Homepage from '@/components/Homepage.tsx';
import { Course, User } from '@/types';

interface HomePageProps {
  user: User | null;
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  onCourseSelect: (course: Course) => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, courses, isLoading, error, onCourseSelect }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  console.log('HOMEPAGE_RENDER', { user });

  if (error && courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">We couldn't load our courses right now.</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-amber-50 text-amber-900 px-4 py-3 text-sm text-center">
          <p>
            {error} — showing the latest available preview instead.
          </p>
        </div>
      )}
      <Homepage
        onNavigateToLogin={() => navigate('/login')}
        onCourseSelect={onCourseSelect}
        courses={courses}
        isLoadingCourses={isLoading}
      />
    </>
  );
};

export default HomePage;
