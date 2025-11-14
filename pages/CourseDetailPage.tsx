import React, { useMemo } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import CourseDetail from '@/components/CourseDetail.tsx';
import { Lecture } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, coursesLoading } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (!course) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <CourseDetail
      course={course}
      navigateToLecture={(selectedCourse, lecture: Lecture) =>
        navigate(`/courses/${selectedCourse.id}/lectures/${lecture.id}`)
      }
    />
  );
};

export default CourseDetailPage;
