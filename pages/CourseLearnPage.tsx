import React, { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import LectureView from '@/components/LectureView.tsx';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';

const CourseLearnPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, user, coursesLoading, onProfileUpdate } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const primaryLecture = useMemo(
    () => course?.lectures.find((lecture) => lecture.isPreview) ?? course?.lectures[0],
    [course],
  );

  useEffect(() => {
    if (!user || !course) return;

    const isEnrolled = user.enrolledCourses.includes(course.id);
    const isOngoing = user.ongoingCourses.includes(course.id);

    if (isEnrolled && isOngoing) return;

    const updatedEnrolledCourses = isEnrolled ? user.enrolledCourses : [...user.enrolledCourses, course.id];
    const updatedOngoingCourses = isOngoing ? user.ongoingCourses : [...user.ongoingCourses, course.id];

    onProfileUpdate({
      enrolledCourses: updatedEnrolledCourses,
      ongoingCourses: updatedOngoingCourses,
    });

    void updateUserProfile(user.uid, {
      enrolledCourses: updatedEnrolledCourses,
      ongoingCourses: updatedOngoingCourses,
    });
  }, [course, onProfileUpdate, user]);

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
