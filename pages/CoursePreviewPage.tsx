
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
}

const CoursePreviewPage: React.FC<CoursePreviewPageProps> = ({ courses, isDarkMode, onToggleTheme, user, isLoading }) => {
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

  if (user && course) {
    // We allow the preview page to be viewed even if logged in, 
    // BUT the existing logic was redirecting. 
    // To support the "Toast after login" flow, we should technically allow this page to render briefly
    // or rely on the App.tsx logic to redirect to dashboard/details. 
    // However, if we want the "Toast" to appear on the *Preview* page specifically, we need to stay here.
    // But usually, logged-in users see the full course view.
    // If the user is enrolled, go to full view. If not, stay here?
    // For now, consistent with previous logic: If logged in, go to full view unless it's a new enrollment flow.
    // Actually, let's keep the redirect to full view if the user OWNS the course. 
    // For now, the simple logic:
    // return <Navigate to={courseId ? `/courses/${courseId}` : '/dashboard'} replace />;
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
    />
  );
};

export default CoursePreviewPage;
