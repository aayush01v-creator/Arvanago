import React, { useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Dashboard from '@/components/Dashboard.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const DashboardPage: React.FC = () => {
  const { user, courses, coursesLoading } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const handleNavigateToFilteredCourses = useCallback(
    (category: string) => {
      const params = new URLSearchParams();
      params.set('category', category);
      navigate({ pathname: '/explore', search: params.toString() });
    },
    [navigate],
  );

  const handleCourseSelect = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}/learn`);
    },
    [navigate],
  );

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      courses={courses}
      navigateToFilteredCourses={handleNavigateToFilteredCourses}
      navigateToCourse={handleCourseSelect}
    />
  );
};

export default DashboardPage;
