import React, { useMemo } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import LectureView from '@/components/LectureView.tsx';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const CourseLearnPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, user, coursesLoading } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const primaryLecture = useMemo(
    () => course?.lectures.find((lecture) => lecture.isPreview) ?? course?.lectures[0],
    [course],
  );

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (!course || !primaryLecture) {
    return <Navigate to={course ? `/courses/${course.id}` : '/dashboard'} replace />;
  }

  return (
    <LectureView
      user={user}
      course={course}
      lecture={primaryLecture}
      onBack={() => navigate(`/courses/${course.id}`)}
      onExit={() => navigate('/dashboard')}
    />
  );
};

export default CourseLearnPage;
