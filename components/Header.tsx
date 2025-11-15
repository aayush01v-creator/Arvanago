
import React from 'react';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';
import { LOGO_URL } from '../constants.ts';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
  isScrolled: boolean;
  pageTitle: string;
  pageSubtitle?: string;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onMenuClick,
  isScrolled,
  pageTitle,
  pageSubtitle,
}) => {
  return (
    <header
      className={`glass-reflection sticky top-0 z-30 border-b transition-all duration-500 ${
        isScrolled
          ? 'border-white/20 bg-white/75 shadow-[0_12px_30px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_16px_40px_rgba(15,23,42,0.55)]'
          : 'border-white/10 bg-white/40 shadow-[0_8px_22px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/40 dark:shadow-[0_12px_32px_rgba(15,23,42,0.45)]'
      }`}
    >
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-slate-600 shadow-md shadow-white/40 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            aria-label="Open menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="md:hidden">
            <div className="inline-flex max-w-[11rem] items-center gap-2 rounded-xl border border-white/40 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm shadow-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              <Icon name="sparkle" className="h-3 w-3 text-brand-primary" />
              <span className="truncate">{pageTitle}</span>
            </div>
          </div>
          <div className="hidden items-center space-x-2 md:flex">
            <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">Edusimulate</span>
          </div>
        </div>
        <div className="hidden flex-1 justify-center md:flex">
          <div className="group relative inline-flex items-center gap-4 rounded-2xl border border-white/40 bg-white/70 px-6 py-2 text-center shadow-md shadow-white/40 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-[0_18px_40px_rgba(15,23,42,0.55)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary shadow-[0_8px_20px_rgba(43,131,198,0.35)] dark:bg-brand-primary/25">
              <Icon name="sparkle" className="h-4 w-4" />
            </div>
            <div className="flex min-w-[10rem] flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-brand-primary/80 dark:text-brand-primary/60">
                {pageSubtitle ?? 'Now viewing'}
              </span>
              <span className="text-lg font-semibold uppercase tracking-[0.35em] text-slate-700 dark:text-slate-100">
                {pageTitle}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">{user.name}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">Learner</span>
          </div>
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-brand-primary/40 blur-md opacity-60" />
            <img
              src={user.avatar}
              alt={user.name}
              className="relative h-11 w-11 rounded-full border-2 border-white/70 shadow-[0_6px_18px_rgba(43,131,198,0.35)] dark:border-white/30"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;