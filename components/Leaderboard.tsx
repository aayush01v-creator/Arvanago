import React, { useMemo, useState } from 'react';
import { dailyLeaderboard, allTimeLeaderboard } from '../constants.ts';
import { LeaderboardEntry } from '../types.ts';

const RankMedal: React.FC<{ rank: number }> = ({ rank }) => {
  const gradients = [
    'from-yellow-300 via-amber-200 to-yellow-500',
    'from-slate-200 via-slate-100 to-slate-400',
    'from-amber-500 via-orange-400 to-amber-600',
  ];

  const glow = ['shadow-yellow-300/50', 'shadow-slate-200/50', 'shadow-amber-400/40'][rank - 1] ?? 'shadow-slate-200/40';

  return (
    <div className={`badge-pulse inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${gradients[rank - 1] ?? 'from-slate-200 to-slate-400'} text-slate-900 shadow-lg ${glow}`}>
      <span className="font-extrabold">{rank}</span>
    </div>
  );
};

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => {
  const isTop = entry.rank <= 3;

  return (
    <tr className="group border-b border-white/50 bg-white/60 transition-all duration-200 last:border-b-0 hover:-translate-y-0.5 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/80">
      <td className="p-4 text-center">
        <RankMedal rank={entry.rank} />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/50 bg-white/60 shadow-md dark:border-slate-700/70 dark:bg-slate-800/60">
            <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
            {isTop && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{entry.user.name}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{entry.user.title ?? 'Learner'}</p>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-primary/10 px-3 py-1 text-sm font-bold text-brand-primary dark:from-brand-primary/20 dark:via-brand-secondary/20 dark:to-brand-primary/20">
          {entry.points.toLocaleString()} pts
        </div>
      </td>
    </tr>
  );
};

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'allTime'>('daily');

  const data = useMemo(() => (activeTab === 'daily' ? dailyLeaderboard : allTimeLeaderboard), [activeTab]);
  const spotlight = useMemo(() => data.slice(0, 3), [data]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="glass-ambient rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl dark:bg-[var(--glass-dark)] dark:text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">Community Pulse</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Leaderboard</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Smooth, glassy rankings with neon accents that mirror the homepage aesthetic.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 p-1 shadow-inner shadow-white/50 backdrop-blur-lg dark:bg-white/5 dark:shadow-brand-primary/20">
            <button
              onClick={() => setActiveTab('daily')}
              className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/40'
                  : 'text-slate-700 hover:text-brand-primary dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Daily momentum
            </button>
            <button
              onClick={() => setActiveTab('allTime')}
              className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'allTime'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/40'
                  : 'text-slate-700 hover:text-brand-primary dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              All-time legends
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {spotlight.map((entry) => (
            <div
              key={entry.rank}
              className="interactive-card neon-border rounded-2xl bg-white/70 p-4 backdrop-blur-2xl dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between">
                <RankMedal rank={entry.rank} />
                <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-inner shadow-white/60 dark:bg-white/10 dark:text-slate-200">{entry.user.title ?? 'Learner'}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/60 shadow-md dark:border-slate-700">
                  <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{entry.user.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{entry.points.toLocaleString()} points</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary"
                  style={{ width: `${Math.min(100, Math.max(40, entry.rank === 1 ? 100 : entry.rank === 2 ? 86 : 78))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-ambient rounded-3xl border border-white/40 bg-white/70 p-0 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(124,58,237,0.12),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(34,211,238,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(124,58,237,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.18),transparent_30%)]" />
          <table className="relative z-10 w-full">
            <thead className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              <tr>
                <th className="px-4 py-4 text-center sm:px-6">Rank</th>
                <th className="px-4 py-4 sm:px-6">Student</th>
                <th className="px-4 py-4 text-right sm:px-6">Points</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <LeaderboardRow key={entry.rank} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
