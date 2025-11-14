import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Course, User } from './types.ts';
import { auth } from './services/firebase.ts';
import { getCourses, getOrCreateUser, updateUserThemePreference } from './services/firestoreService.ts';
import SidebarLayout from './components/SidebarLayout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import DashboardPage from '@/pages/DashboardPage';
import MyLearningsPage from '@/pages/MyLearningsPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ProfilePage from '@/pages/ProfilePage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseLecturePage from '@/pages/CourseLecturePage';
import HomePage from '@/pages/HomePage';
import LoginRoute from '@/pages/LoginRoute';
import CoursePreviewPage from '@/pages/CoursePreviewPage';

const GLOBAL_THEME_KEY = 'edusimulate:theme';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const stored = window.localStorage.getItem(GLOBAL_THEME_KEY);
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

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseData = await getCourses();
        setCourses(courseData);
        setCoursesError(null);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        setCoursesError('We couldn\'t load courses right now. Please try again later.');
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourseData();
  }, []);

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
        }
      } else {
        setUser(null);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const persistThemePreference = useCallback((mode: boolean, currentUser: User | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    const theme = mode ? 'dark' : 'light';
    if (currentUser) {
      window.localStorage.setItem(`${GLOBAL_THEME_KEY}:${currentUser.uid}`, theme);
    } else {
      window.localStorage.setItem(GLOBAL_THEME_KEY, theme);
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
      const stored = window.localStorage.getItem(`${GLOBAL_THEME_KEY}:${user.uid}`);
      const preference = stored ?? user.themePreference ?? 'light';
      const dark = preference === 'dark';
      setIsDarkMode(dark);
      persistThemePreference(dark, user);
    } else {
      const stored = window.localStorage.getItem(GLOBAL_THEME_KEY);
      setIsDarkMode(stored === 'dark');
    }
  }, [user, persistThemePreference]);

  const handleProfileUpdate = useCallback((updates: Partial<User>) => {
    setUser((previous) => (previous ? { ...previous, ...updates } : previous));
  }, []);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage user={user} courses={courses} isLoading={coursesLoading} error={coursesError} />} />
      <Route path="/login" element={<LoginRoute user={user} />} />
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
      <Route element={<ProtectedRoute user={user} isReady={authReady} />}>
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
            />
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-learnings" element={<MyLearningsPage />} />
          <Route path="/explore" element={<ExploreCoursesPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/courses/:courseId/lectures/:lectureId" element={<CourseLecturePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};

export default App;
