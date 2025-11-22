import React, { useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import CourseList from '@/components/CourseList.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';

const ExploreCoursesPage: React.FC = () => {
  const { user, courses, coursesLoading, coursesError, refreshCourses, onProfileUpdate } = useOutletContext<SidebarLayoutContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCategory = searchParams.get('category') ?? 'All';

  const handleCourseSelect = useCallback(
    (course: Course) => {
      if (user) {
        const alreadyEnrolled = user.ongoingCourses.includes(course.id);
        const updatedCourses = alreadyEnrolled ? user.ongoingCourses : [...user.ongoingCourses, course.id];

        if (!alreadyEnrolled) {
          onProfileUpdate({ ongoingCourses: updatedCourses });
          void updateUserProfile(user.uid, { ongoingCourses: updatedCourses });
        }
      }

      navigate(`/courses/${course.id}/learn`);
    },
    [navigate, onProfileUpdate, user],
  );

  const handlePreviewCourse = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}/preview`);
    },
    [navigate],
  );

  const handleWishlistToggle = useCallback(
    (course: Course) => {
      if (!user) return;

      const isWishlisted = user.wishlist.includes(course.id);
      const updatedWishlist = isWishlisted
        ? user.wishlist.filter((id) => id !== course.id)
        : [...user.wishlist, course.id];

      onProfileUpdate({ wishlist: updatedWishlist });
      void updateUserProfile(user.uid, { wishlist: updatedWishlist });
    },
    [onProfileUpdate, user],
  );

  useEffect(() => {
    void refreshCourses();
  }, [refreshCourses]);

  return (
    <CourseList
      courses={courses}
      navigateToCourse={handleCourseSelect}
      onPreviewCourse={handlePreviewCourse}
      onToggleWishlist={handleWishlistToggle}
      wishlistCourseIds={user?.wishlist}
      initialCategory={initialCategory}
      isLoading={coursesLoading}
      errorMessage={coursesError}
    />
  );
};

export default ExploreCoursesPage;
