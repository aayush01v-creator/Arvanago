
import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CoursePreview from '@/components/CoursePreview.tsx';
import { Course, User } from '@/types';

interface CoursePreviewPageProps {
  courses: Course[];
  isDarkMode: boolean;
  onToggleTheme: (isDark: boolean) => void;
  user: User | null;
  isLoading: boolean;
  onProfileUpdate: (updates: Partial<User>) => void;
}

const CoursePreviewPage: React.FC<CoursePreviewPageProps> = ({ courses, isDarkMode, onToggleTheme, user, isLoading, onProfileUpdate }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (!course) {
    return <Navigate to="/" replace />;
  }

  return (
    <CoursePreview
      course={course}
      onLoginClick={() => navigate('/login')}
      onBack={() => navigate('/')}
      isDarkMode={isDarkMode}
      setDarkMode={onToggleTheme}
      user={user}
      onProfileUpdate={onProfileUpdate}
    />
  );
};

export default CoursePreviewPage;
