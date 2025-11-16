import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Course, User } from './types.ts';
import { auth } from './services/firebase.ts';
import { clearCoursesCache, getCourses, getOrCreateUser, updateUserThemePreference } from './services/firestoreService.ts';
import SidebarLayout from './components/SidebarLayout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { PENDING_COURSE_STORAGE_KEY } from './constants.ts';
import HomePage from '@/pages/HomePage';
import { safeLocalStorage } from '@/utils/safeStorage';
const GLOBAL_THEME_KEY = 'edusimulate:theme';

const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const MyLearningsPage = React.lazy(() => import('@/pages/MyLearningsPage'));
const PublicExplorePage = React.lazy(() => import('@/pages/PublicExplorePage'));
const LeaderboardPage = React.lazy(() => import('@/pages/LeaderboardPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const CourseDetailPage = React.lazy(() => import('@/pages/CourseDetailPage'));
const CourseLecturePage = React.lazy(() => import('@/pages/CourseLecturePage'));
const LoginRoute = React.lazy(() => import('@/pages/LoginRoute'));
const CoursePreviewPage = React.lazy(() => import('@/pages/CoursePreviewPage'));

const SuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {

    const stored = safeLocalStorage.getItem(GLOBAL_THEME_KEY);
    return stored === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchSequenceRef = useRef(0);
  const coursesLengthRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    coursesLengthRef.current = courses.length;
  }, [courses.length]);

  const fetchCourseData = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      const requestId = ++fetchSequenceRef.current;
      const shouldShowLoading = options?.forceRefresh || coursesLengthRef.current === 0;
      if (shouldShowLoading) {
        setCoursesLoading(true);
      }
      try {
        const courseData = await getCourses({ forceRefresh: options?.forceRefresh });
        if (fetchSequenceRef.current === requestId) {
          setCourses(courseData);
          coursesLengthRef.current = courseData.length;
          setCoursesError(null);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        if (fetchSequenceRef.current === requestId) {
          setCoursesError("We couldn't load courses right now. Please try again later.");
        }
      } finally {
        if (shouldShowLoading && fetchSequenceRef.current === requestId) {
          setCoursesLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void fetchCourseData();
  }, [fetchCourseData]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await getOrCreateUser(
            firebaseUser.uid,
            firebaseUser.displayName,
            firebaseUser.email,
            firebaseUser.photoURL,
          );
          setUser(appUser);
        } catch (error) {
          console.error('Error getting user data:', error);
          setUser(null);
        } finally {
          setAuthReady(true);
          void fetchCourseData({ forceRefresh: true });
        }
      } else {
        setUser(null);
        clearCoursesCache();
        setAuthReady(true);
        void fetchCourseData({ forceRefresh: true });
      }
    });

    return () => unsubscribe();
  }, [fetchCourseData]);

  const persistThemePreference = useCallback((mode: boolean, currentUser: User | null) => {
    const theme = mode ? 'dark' : 'light';
    if (currentUser) {

      safeLocalStorage.setItem(`${GLOBAL_THEME_KEY}:${currentUser.uid}`, theme);
    } else {
      safeLocalStorage.setItem(GLOBAL_THEME_KEY, theme);
    }
  }, []);

  const handleThemeToggle = useCallback(
    (mode: boolean) => {
      setIsDarkMode(mode);
      persistThemePreference(mode, user);
      if (user) {
        updateUserThemePreference(user.uid, mode ? 'dark' : 'light').catch((error) =>
          console.error('Failed to update theme preference:', error),
        );
      }
    },
    [persistThemePreference, user],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (user) {

      const stored = safeLocalStorage.getItem(`${GLOBAL_THEME_KEY}:${user.uid}`);
      const preference = stored ?? user.themePreference ?? 'light';
      const dark = preference === 'dark';
      setIsDarkMode(dark);
      persistThemePreference(dark, user);
    } else {

      const stored = safeLocalStorage.getItem(GLOBAL_THEME_KEY);
      setIsDarkMode(stored === 'dark');
    }
  }, [user, persistThemePreference]);

  const handleProfileUpdate = useCallback((updates: Partial<User>) => {
    setUser((previous) => (previous ? { ...previous, ...updates } : previous));
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const pendingCourseId = safeLocalStorage.getItem(PENDING_COURSE_STORAGE_KEY);
    if (!pendingCourseId || coursesLoading) {
      return;
    }

    safeLocalStorage.removeItem(PENDING_COURSE_STORAGE_KEY);

    const matchedCourse = courses.find((course) => course.id === pendingCourseId);
    if (matchedCourse) {
      navigate(user ? `/courses/${matchedCourse.id}` : `/courses/${matchedCourse.id}/preview`, {
        replace: true,
      });
    } else {
      navigate(user ? '/explore' : '/', { replace: true });
    }
  }, [authReady, user, coursesLoading, courses, navigate]);

  const handlePublicCourseSelect = useCallback(
    (course: Course) => {
      safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
      navigate('/login');
    },
    [navigate],
  );

  const handleExploreCourseNavigate = useCallback(
    (course: Course) => {
      if (user) {
        navigate(`/courses/${course.id}`);
        return;
      }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          fontSize: 10,
          background: 'black',
          color: 'white',
          padding: '2px 6px',
          zIndex: 9999,
        }}
      >
        APP_DEBUG authReady={String(authReady)} user={user ? 'yes' : 'no'}
      </div>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                user={user}
              courses={courses}
              isLoading={coursesLoading}
              error={coursesError}
              onCourseSelect={handleExploreCourseNavigate}
              onRefreshCourses={fetchCourseData}
            />
          }
        />
        <Route
          path="/courses/:courseId/preview"
            element={
              <CoursePreviewPage
                courses={courses}
                isDarkMode={isDarkMode}
                onToggleTheme={handleThemeToggle}
                user={user}
                isLoading={coursesLoading}
              />
            }
          />
          <Route element={<ProtectedRoute user={user} authReady={authReady} />}>
            <Route
              element={
                <SidebarLayout
                  user={user!}
                  courses={courses}
                  isDarkMode={isDarkMode}
                  onThemeToggle={handleThemeToggle}
                  onProfileUpdate={handleProfileUpdate}
                  coursesLoading={coursesLoading}
                  coursesError={coursesError}
                  onRefreshCourses={fetchCourseData}
                />
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/my-learnings" element={<MyLearningsPage />} />
              <Route path="/explore" element={<ExploreCoursesPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/courses/:courseId/lectures/:lectureId" element={<CourseLecturePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
