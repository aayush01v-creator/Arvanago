
import React from 'react';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';
import { LOGO_URL } from '../constants.ts';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
  isScrolled: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick, isScrolled }) => {
  return (
    <header className={`sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'} border-b border-slate-200 dark:border-slate-700`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="text-slate-600 dark:text-slate-300 md:hidden" aria-label="Open menu">
            <Icon name="menu" className="w-6 h-6" />
          </button>
           <div className="flex items-center md:hidden">
             <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8" />
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <span className="font-semibold text-slate-700 dark:text-slate-200 hidden sm:block">
                {user.name}
            </span>
            <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-full border-2 border-brand-primary shadow-sm"
            />
        </div>
      </div>
    </header>
  );
};

export default Header;