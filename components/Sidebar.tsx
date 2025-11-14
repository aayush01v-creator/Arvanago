import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './common/Icon.tsx';
import { signOutUser } from '../services/authService.ts';
import { LOGO_URL } from '../constants.ts';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  onExploreClick?: () => Promise<void> | void;
}

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/my-learnings', icon: 'bookmark', label: 'My Learnings' },
  { to: '/explore', icon: 'courses', label: 'Explore Courses' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
];

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, isDarkMode, setDarkMode, onExploreClick }) => {
  const handleNavigate = () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`glass-reflection fixed inset-y-0 left-0 z-40 flex w-72 max-w-[18rem] flex-col overflow-hidden border-r border-white/30 bg-white/80 text-slate-800 shadow-[0_28px_80px_rgba(43,131,198,0.16)] backdrop-blur-2xl transition-transform duration-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:shadow-[0_28px_80px_rgba(8,12,24,0.65)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:w-64 md:max-w-none md:translate-x-0`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_75%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_80%)]" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-primary/25 blur-3xl" style={{ animation: 'pulseGlow 18s ease-in-out infinite alternate' }} />
        <div className="pointer-events-none absolute bottom-[-5rem] right-[-4rem] h-56 w-56 rounded-full bg-sky-500/20 blur-[110px]" style={{ animation: 'driftGlow 26s ease-in-out infinite' }} />
        <div className="relative flex h-20 items-center border-b border-white/60 px-6 dark:border-white/10">
          <img src={LOGO_URL} alt="Edusimulate Logo" className="mr-3 h-8" />
          <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">Edusimulate</span>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-2.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={async () => {
                    if (item.to === '/explore' && onExploreClick) {
                      try {
                        await onExploreClick();
                      } catch (error) {
                        console.error('Failed to refresh courses before navigating to Explore.', error);
                      }
                    }
                    handleNavigate();
                  }}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ease-out ${
                      isActive
                        ? 'border-white/40 bg-white/90 text-brand-primary shadow-[0_12px_36px_rgba(43,131,198,0.25)] backdrop-blur'
                        : 'text-slate-600 hover:border-white/50 hover:bg-white/60 hover:text-brand-primary dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`relative flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-all duration-300 ${
                          isActive
                            ? 'bg-brand-primary/20 text-brand-primary shadow-white/50'
                            : 'bg-white/70 text-slate-500 shadow-white/50 group-hover:bg-brand-primary/20 group-hover:text-brand-primary dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        <Icon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative space-y-4 border-t border-white/30 px-5 py-6 dark:border-white/10">
          <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 p-3 text-slate-600 shadow-inner shadow-white/50 backdrop-blur-md transition-colors dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            <div className="flex items-center space-x-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-brand-primary shadow-md shadow-white/50 dark:bg-white/10 dark:text-brand-secondary">
                <Icon name={isDarkMode ? 'moon' : 'sun'} className="h-5 w-5" />
              </span>
              <span className="font-semibold">Theme</span>
            </div>
            <button
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              onClick={() => setDarkMode(!isDarkMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full border border-white/60 bg-white/70 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-white/10 dark:focus:ring-offset-slate-900 ${
                isDarkMode ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white shadow-md shadow-brand-primary/30 transition-transform duration-300" />
            </button>
          </div>
          <button
            onClick={() => {
              signOutUser();
              handleNavigate();
            }}
            className="glass-reflection group flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/90 hover:text-brand-primary hover:shadow-[0_16px_40px_rgba(43,131,198,0.25)] dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
          >
            <div className="flex items-center space-x-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-brand-primary shadow-md shadow-white/50 transition-transform duration-300 group-hover:scale-110 dark:bg-white/10 dark:text-brand-secondary">
                <Icon name="logout" className="h-5 w-5" />
              </span>
              <span className="font-semibold">Logout</span>
            </div>
            <Icon name="chevronRight" className="h-5 w-5 text-current transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
