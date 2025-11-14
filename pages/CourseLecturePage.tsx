import React, { useMemo } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import LectureView from '@/components/LectureView.tsx';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const CourseLecturePage: React.FC = () => {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const { courses, user, coursesLoading } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const lecture = useMemo(() => course?.lectures.find((l) => l.id === lectureId), [course, lectureId]);

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (!course || !lecture) {
    return <Navigate to={course ? `/courses/${course.id}` : '/dashboard'} replace />;
  }

  return (
    <LectureView
      user={user}
      course={course}
      lecture={lecture}
      onBack={() => navigate(`/courses/${course.id}`)}
      onExit={() => navigate('/dashboard')}
    />
  );
};

export default CourseLecturePage;
