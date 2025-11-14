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
}

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/my-learnings', icon: 'bookmark', label: 'My Learnings' },
  { to: '/explore', icon: 'courses', label: 'Explore Courses' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
];

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, isDarkMode, setDarkMode }) => {
  const handleNavigate = () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`glass-reflection absolute md:relative z-40 flex h-full w-64 flex-col overflow-hidden border-r border-white/30 bg-white/30 text-slate-800 shadow-[0_10px_45px_rgba(43,131,198,0.18)] backdrop-blur-2xl transition-transform duration-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-white dark:shadow-[0_18px_60px_rgba(15,23,42,0.65)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.3),_transparent_75%)]" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-primary/30 blur-3xl" style={{ animation: 'pulseGlow 18s ease-in-out infinite alternate' }} />
        <div className="pointer-events-none absolute bottom-[-4rem] right-[-3rem] h-56 w-56 rounded-full bg-sky-500/20 blur-[100px]" style={{ animation: 'driftGlow 26s ease-in-out infinite' }} />
        <div className="relative flex items-center h-20 border-b border-white/30 px-6 dark:border-white/10">
          <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8 mr-2" />
          <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">Edusimulate</span>
        </div>
        <nav className="relative flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    `group flex items-center rounded-xl p-3 transition-all duration-300 ease-out ${
                      isActive
                        ? 'bg-brand-primary/90 text-white shadow-[0_10px_30px_rgba(43,131,198,0.35)] backdrop-blur'
                        : 'text-slate-600 hover:bg-white/40 hover:text-brand-primary dark:text-slate-300 dark:hover:bg-white/10'
                    }`
                  }
                >
                  <span className="relative mr-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/50 text-brand-primary shadow-inner shadow-white/40 transition-transform duration-300 group-hover:scale-110 dark:bg-white/10 dark:text-brand-secondary">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="font-semibold tracking-wide">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative space-y-3 border-t border-white/20 px-4 py-6 dark:border-white/10">
          <div className="flex items-center justify-between rounded-xl bg-white/40 p-3 text-slate-600 shadow-inner shadow-white/40 backdrop-blur-md transition-colors dark:bg-white/5 dark:text-slate-300">
            <div className="flex items-center space-x-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 text-brand-primary shadow-md shadow-white/40 dark:bg-white/10 dark:text-brand-secondary">
                <Icon name={isDarkMode ? 'moon' : 'sun'} className="h-5 w-5" />
              </span>
              <span className="font-semibold">Theme</span>
            </div>
            <button
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              onClick={() => setDarkMode(!isDarkMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full border border-white/50 bg-white/60 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-white/10 dark:focus:ring-offset-slate-900 ${
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
            className="glass-reflection group flex w-full items-center justify-between rounded-xl border border-white/40 bg-white/50 px-4 py-3 text-slate-600 transition-all duration-300 hover:translate-y-[-2px] hover:bg-white/70 hover:text-brand-primary hover:shadow-[0_12px_30px_rgba(43,131,198,0.25)] dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
          >
            <div className="flex items-center space-x-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 text-brand-primary shadow-md shadow-white/40 transition-transform duration-300 group-hover:scale-110 dark:bg-white/10 dark:text-brand-secondary">
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
