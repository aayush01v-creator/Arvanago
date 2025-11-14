import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">We couldn't load our courses right now.</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <Homepage
      onNavigateToLogin={() => navigate('/login')}
      onCourseSelect={onCourseSelect}
      courses={courses}
    />
  );
};

export default HomePage;
