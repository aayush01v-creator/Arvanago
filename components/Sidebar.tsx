

import React from 'react';
import { AppView } from '../types.ts';
import Icon from './common/Icon.tsx';
import { signOutUser } from '../services/authService.ts';
import { LOGO_URL } from '../constants.ts';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
}

const NavItem: React.FC<{
  iconName: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ iconName, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 my-1 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-brand-primary text-white shadow-md'
          : 'text-slate-500 hover:bg-brand-light hover:text-brand-primary'
      }`}
    >
      <Icon name={iconName} className="w-5 h-5" />
      <span className="ml-4 font-semibold">{label}</span>
    </a>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isSidebarOpen, setSidebarOpen, isDarkMode, setDarkMode }) => {
  const handleNavigation = (view: AppView) => {
    setView(view);
    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { view: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { view: 'myLearnings', icon: 'bookmark', label: 'My Learnings' },
    { view: 'courses', icon: 'courses', label: 'Explore Courses' },
    { view: 'leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
    { view: 'profile', icon: 'profile', label: 'Profile' },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`absolute md:relative z-40 flex flex-col w-64 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center h-20 border-b border-slate-200 dark:border-slate-700 px-6">
          <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8 mr-2" />
          <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Edusimulate</span>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul>
            {navItems.map((item) => (
              <NavItem
                key={item.view}
                iconName={item.icon}
                label={item.label}
                isActive={currentView === item.view}
                onClick={() => handleNavigation(item.view as AppView)}
              />
            ))}
          </ul>
        </nav>
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-3 my-1 rounded-lg text-slate-500 dark:text-slate-400">
            <div className="flex items-center">
                <Icon name={isDarkMode ? 'moon' : 'sun'} className="w-5 h-5" />
                <span className="ml-4 font-semibold">Theme</span>
            </div>
            <button 
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              onClick={() => setDarkMode(!isDarkMode)} 
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-brand-primary ${isDarkMode ? 'bg-brand-primary' : 'bg-slate-300'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <NavItem iconName="logout" label="Logout" isActive={false} onClick={signOutUser} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;