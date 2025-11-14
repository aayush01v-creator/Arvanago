import React, { useCallback } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import CourseList from '@/components/CourseList.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const ExploreCoursesPage: React.FC = () => {
  const { courses, coursesLoading, coursesError } = useOutletContext<SidebarLayoutContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCategory = searchParams.get('category') ?? 'All';

  const handleCourseSelect = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}`);
    },
    [navigate],
  );

  return (
    <CourseList
      courses={courses}
      navigateToCourse={handleCourseSelect}
      initialCategory={initialCategory}
      isLoading={coursesLoading}
      errorMessage={coursesError}
    />
  );
};

export default ExploreCoursesPage;
