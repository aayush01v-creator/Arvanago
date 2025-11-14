
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Course, Lecture, AppView, PageView, User } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import CourseList from './components/CourseList.tsx';
import CourseDetail from './components/CourseDetail.tsx';
import CoursePreview from './components/CoursePreview.tsx';
import LectureView from './components/LectureView.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import Profile from './components/Profile.tsx';
import Header from './components/Header.tsx';
import Icon from './components/common/Icon.tsx';
import Homepage from './components/Homepage.tsx';
import LoginPage from './components/LoginPage.tsx';
import MyLearnings from './components/MyLearnings.tsx';
// FIX: Removed incorrect modular import for onAuthStateChanged. The compat version is called on the auth instance.
import { auth } from './services/firebase.ts';
import { getOrCreateUser, getCourses } from './services/firestoreService.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PageView>('homepage');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isDarkMode, setDarkMode] = useState(false); // Default to light mode
  const [isScrolled, setIsScrolled] = useState(false);
  const mainPanelRef = useRef<HTMLDivElement>(null);

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
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            // Handle error state if necessary
        }
    };
    fetchCourseData();
  }, []);

  useEffect(() => {
    // Listen for authentication state changes using the modular onAuthStateChanged function.
    // FIX: Use compat version of onAuthStateChanged.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email, firebaseUser.photoURL);
          setUser(appUser);
          setView('dashboard');
        } catch (error) {
          console.error("Error getting user data:", error);
          setUser(null);
          setView('homepage');
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setView('homepage');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const mainPanel = mainPanelRef.current;
    if (!mainPanel || view === 'coursePreview') return;

    const handleScroll = () => {
        setIsScrolled(mainPanel.scrollTop > 10);
    };

    mainPanel.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainPanel.removeEventListener('scroll', handleScroll);
  }, [user, view]); 

  const navigateToLogin = () => setView('login');
  const navigateToHomepage = () => {
    setView('homepage');
    setSelectedCourse(null);
  };
  const setAppView = (appView: AppView) => setView(appView);

  const navigateToFilteredCourses = useCallback((category: string) => {
    setCategoryFilter(category);
    setView('courses');
  }, []);
  
  const handleCourseSelect = useCallback((course: Course) => {
    setSelectedCourse(course);
    if (user) {
      setView('courseDetail');
    } else {
      setView('coursePreview');
    }
  }, [user]);

  const navigateToLecture = useCallback((course: Course, lecture: Lecture) => {
    setSelectedCourse(course);
    setSelectedLecture(lecture);
    setView('lecture');
  }, []);

  const navigateBackToCourse = useCallback(() => {
    setView('courseDetail');
    setSelectedLecture(null);
  }, []);
  
  const navigateBackToDashboard = useCallback(() => {
    setView('dashboard');
    setSelectedCourse(null);
    setSelectedLecture(null);
  }, []);

  const handleProfileUpdate = (updatedUserData: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...updatedUserData } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
      </div>
    );
  }
  
  // Standalone Views (No main layout)
  if (!user) {
    if (view === 'login') {
      return <LoginPage onNavigateHome={navigateToHomepage} />;
    }
    if (view === 'coursePreview' && selectedCourse) {
      return <CoursePreview course={selectedCourse} onLoginClick={navigateToLogin} onBack={navigateToHomepage} isDarkMode={isDarkMode} setDarkMode={setDarkMode}/>;
    }
    return <Homepage onNavigateToLogin={navigateToLogin} onCourseSelect={handleCourseSelect} courses={courses} />;
  }
  
  if (view === 'coursePreview' && selectedCourse) {
    return <CoursePreview course={selectedCourse} onLoginClick={navigateToLogin} onBack={() => setView('dashboard')} isDarkMode={isDarkMode} setDarkMode={setDarkMode} />;
  }

  if (view === 'lecture' && selectedCourse && selectedLecture) {
    return <LectureView user={user} course={selectedCourse} lecture={selectedLecture} onBack={navigateBackToCourse} onExit={navigateBackToDashboard}/>
  }

  // Main App Layout (Sidebar + Header + Content)
  const renderContent = (currentUser: User, currentView: AppView) => {
    let content;
    switch (currentView) {
      case 'dashboard':
        content = <Dashboard user={currentUser} courses={courses} navigateToFilteredCourses={navigateToFilteredCourses} navigateToCourse={handleCourseSelect} />;
        break;
      case 'myLearnings':
        content = <MyLearnings user={currentUser} courses={courses} navigateToCourse={handleCourseSelect} />;
        break;
      case 'courses':
        content = <CourseList courses={courses} navigateToCourse={handleCourseSelect} initialCategory={categoryFilter} />;
        break;
      case 'courseDetail':
        content = selectedCourse ? <CourseDetail course={selectedCourse} navigateToLecture={navigateToLecture} /> : <Dashboard user={currentUser} courses={courses} navigateToFilteredCourses={navigateToFilteredCourses} navigateToCourse={handleCourseSelect} />;
        break;
      case 'leaderboard':
        content = <Leaderboard />;
        break;
      case 'profile':
        content = <Profile user={currentUser} onProfileUpdate={handleProfileUpdate} />;
        break;
      default:
        content = <Dashboard user={currentUser} courses={courses} navigateToFilteredCourses={navigateToFilteredCourses} navigateToCourse={handleCourseSelect} />;
    }
    
    return <div className="p-0 sm:p-0 lg:p-0">{content}</div>;
  };
  
  return (
    <div className="min-h-screen text-slate-800 dark:text-gray-200 flex bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        currentView={view as AppView} 
        setView={setAppView} 
        isSidebarOpen={isSidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        isDarkMode={isDarkMode}
        setDarkMode={setDarkMode}
      />
      <div ref={mainPanelRef} className="flex-1 flex flex-col h-screen relative overflow-y-auto">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} isScrolled={isScrolled} />
        <main className="flex-1">
          <div key={view} className="animate-fade-in-up">
            {renderContent(user, view as AppView)}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;