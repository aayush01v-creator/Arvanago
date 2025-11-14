
import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col animate-pulse">
    <div className="w-full h-48 bg-slate-200 dark:bg-slate-700"></div>
    <div className="p-5 flex flex-col flex-grow">
      <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
      <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
      <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
      <div className="mt-auto h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
    </div>
  </div>
);

export default SkeletonCard;