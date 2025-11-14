import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  refreshCourses: () => Promise<void>;
}

interface SidebarLayoutProps {
  user: User;
  courses: Course[];
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
  onProfileUpdate: (updates: Partial<User>) => void;
  coursesLoading: boolean;
  coursesError: string | null;
  onRefreshCourses: () => Promise<void>;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  user,
  courses,
  isDarkMode,
  onThemeToggle,
  onProfileUpdate,
  coursesLoading,
  coursesError,
  onRefreshCourses,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mainPanelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [pointerPosition, setPointerPosition] = useState({ x: 50, y: 50 });
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

  const handlePanelPointerMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const panel = mainPanelRef.current;
    if (!panel) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setPointerPosition({
        x: Math.min(100, Math.max(0, nextX)),
        y: Math.min(100, Math.max(0, nextY)),
      });
    });
  }, []);

  const handlePanelPointerLeave = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      setPointerPosition({ x: 50, y: 50 });
    });
  }, []);

  useEffect(() => () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-gray-200">
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full bg-brand-primary/40 blur-3xl opacity-70" style={{ animation: 'pulseGlow 14s ease-in-out infinite' }} />
      <div className="pointer-events-none fixed bottom-[-6rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-400/30 blur-[120px] opacity-70" style={{ animation: 'pulseGlow 18s ease-in-out infinite reverse' }} />
      <div className="pointer-events-none fixed top-1/3 right-[-8rem] h-96 w-96 rounded-full bg-purple-500/40 blur-[120px] opacity-60" style={{ animation: 'driftGlow 22s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(43,131,198,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(43,131,198,0.18),_transparent_60%)]" />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          setDarkMode={onThemeToggle}
          onExploreClick={onRefreshCourses}
        />
        <div
          ref={mainPanelRef}
          className="relative flex flex-1 flex-col overflow-y-auto"
          onMouseMove={handlePanelPointerMove}
          onMouseLeave={handlePanelPointerLeave}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-90 transition-[background] duration-700 ease-out"
            style={{
              background: `radial-gradient(ellipse at ${pointerPosition.x}% ${pointerPosition.y}%, rgba(43,131,198,0.18), rgba(43,131,198,0) 55%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,0.08)_55%,rgba(255,255,255,0)_100%)] mix-blend-screen" />
          <Header user={user} onMenuClick={() => setSidebarOpen(true)} isScrolled={isScrolled} />
          <main className="relative z-10 flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
            <div className="relative mx-auto max-w-6xl">
              <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/40 bg-white/30 shadow-[0_12px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/40 dark:shadow-[0_18px_70px_rgba(15,23,42,0.55)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_70%)]" />
                <div className="pointer-events-none absolute -top-20 -left-10 h-40 w-40 rounded-full bg-brand-primary/30 blur-3xl opacity-70" style={{ animation: 'pulseGlow 16s ease-in-out infinite' }} />
                <div className="pointer-events-none absolute bottom-[-3rem] right-[-2rem] h-48 w-48 rounded-full bg-sky-500/40 blur-3xl opacity-80" style={{ animation: 'pulseGlow 20s ease-in-out infinite alternate' }} />
                <div className="relative z-10 p-4 sm:p-6 lg:p-10">
                  <div className="animate-fade-in-up">
                    <Outlet
                      context={{
                        user,
                        courses,
                        onProfileUpdate,
                        coursesLoading,
                        coursesError,
                        refreshCourses: onRefreshCourses,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
