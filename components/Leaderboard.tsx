

import React, { useState } from 'react';
import { dailyLeaderboard, allTimeLeaderboard } from '../constants.ts';
import { LeaderboardEntry } from '../types.ts';

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => {
  const rankColor =
    entry.rank === 1 ? 'bg-yellow-400' :
    entry.rank === 2 ? 'bg-gray-300' :
    entry.rank === 3 ? 'bg-amber-600' : 'bg-gray-200 dark:bg-gray-600';
  const rankTextColor = 
    entry.rank <= 3 ? 'text-white font-extrabold' : 'text-gray-700 dark:text-gray-300 font-bold';
  const glowEffect = entry.rank <=3 ? 'animate-pulse' : '';
    
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
       <td className="p-4 text-center">
        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm mx-auto shadow-md ${rankColor} ${rankTextColor} ${glowEffect}`}>
          {entry.rank}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center">
          <img src={entry.user.avatar} alt={entry.user.name} className="w-10 h-10 rounded-full mr-4 border-2 border-white dark:border-gray-600" />
          <span className="font-semibold text-gray-900 dark:text-white">{entry.user.name}</span>
        </div>
      </td>
      <td className="p-4 text-right">
        <span className="font-bold text-lg text-brand-primary">{entry.points.toLocaleString()}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400"> pts</span>
      </td>
    </tr>
  );
};

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'allTime'>('daily');

  const data = activeTab === 'daily' ? dailyLeaderboard : allTimeLeaderboard;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
       <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">See where you stand among your peers.</p>
      </div>
      
      <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full p-1 flex">
        <button
          onClick={() => setActiveTab('daily')}
          className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-gray-800 text-brand-primary shadow' : 'text-gray-600 dark:text-gray-300'}`}
        >
          Daily
        </button>
        <button
          onClick={() => setActiveTab('allTime')}
          className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all ${activeTab === 'allTime' ? 'bg-white dark:bg-gray-800 text-brand-primary shadow' : 'text-gray-600 dark:text-gray-300'}`}
        >
          All-Time
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 text-center">Rank</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
              <th className="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody>
            {data.map(entry => <LeaderboardRow key={entry.rank} entry={entry} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;