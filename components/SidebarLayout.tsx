import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import { Course, User } from '@/types';

export interface SidebarLayoutContext {
  user: User;
  courses: Course[];
  onProfileUpdate: (updates: Partial<User>) => void;
  coursesLoading: boolean;
  coursesError: string | null;
}

interface SidebarLayoutProps {
  user: User;
  courses: Course[];
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
  onProfileUpdate: (updates: Partial<User>) => void;
  coursesLoading: boolean;
  coursesError: string | null;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  user,
  courses,
  isDarkMode,
  onThemeToggle,
  onProfileUpdate,
  coursesLoading,
  coursesError,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mainPanelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const panel = mainPanelRef.current;
    if (!panel) return;

    const handleScroll = () => setIsScrolled(panel.scrollTop > 10);
    panel.addEventListener('scroll', handleScroll, { passive: true });
    return () => panel.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const panel = mainPanelRef.current;
    if (panel) {
      panel.scrollTo({ top: 0 });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen text-slate-800 dark:text-gray-200 flex bg-slate-50 dark:bg-slate-900">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDarkMode={isDarkMode}
        setDarkMode={onThemeToggle}
      />
      <div ref={mainPanelRef} className="flex-1 flex flex-col h-screen relative overflow-y-auto">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} isScrolled={isScrolled} />
        <main className="flex-1">
          <div className="animate-fade-in-up">
            <Outlet context={{ user, courses, onProfileUpdate, coursesLoading, coursesError }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
