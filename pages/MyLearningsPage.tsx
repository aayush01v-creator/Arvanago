import React, { useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import MyLearnings from '@/components/MyLearnings.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const MyLearningsPage: React.FC = () => {
  const { user, courses, coursesLoading } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const handleCourseSelect = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}`);
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

  return <MyLearnings user={user} courses={courses} navigateToCourse={handleCourseSelect} />;
};

export default MyLearningsPage;
