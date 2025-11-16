import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, User } from '@/types';

interface HomePageProps {
  user: User | null;
  courses?: Course[];
  isLoading?: boolean;
  error?: string | null;
  onCourseSelect?: (course: Course) => void;
  onRefreshCourses?: () => void;
}

const sellingPoints = [
  {
    title: 'Adaptive mocks',
    description: 'Stay exam-ready with personalised mock tests that adapt to your progress.',
  },
  {
    title: 'Mentor support',
    description: 'Get nudges and doubts solved by verified mentors right inside the app.',
  },
  {
    title: 'Daily practice',
    description: 'Micro-sprints and streaks to help you build confident study habits.',
  },
];

const HomePage: React.FC<HomePageProps> = ({
  user,
  // courses,
  // isLoading,
  // error,
  // onCourseSelect,
  // onRefreshCourses,
}) => {
  const navigate = useNavigate();

  // If user is already logged in and hits "/", send them to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  console.log('HOMEPAGE_RENDER', { user });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-primary">Edusimulate</span>
            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
              Beta
            </span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-brand-primary dark:text-slate-200"
          >
            Login / Register
          </button>
        </header>

        <div className="mt-12 rounded-3xl bg-gradient-to-r from-violet-600 via-brand-primary to-sky-500 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Featured course
          </p>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">NEET 2025 Prep Course</h1>
          <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">
            New batches starting soon. Get personalised mentorship, adaptive mock tests, and daily
            practice sprints crafted by top mentors.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/explore')}
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg transition hover:-translate-y-0.5"
            >
              Tap to Explore
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Join the waitlist
            </button>
          </div>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {sellingPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">
                Why learners love it
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {point.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {point.description}
              </p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
};

export default HomePage;
