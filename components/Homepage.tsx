
import React, { useState } from 'react';
import Icon from './common/Icon.tsx';
import { useScrollAnimation } from '../hooks/useScrollAnimation.ts';
import { Course } from '../types.ts';
import { LOGO_URL } from '../constants.ts';
import { useTypingEffect } from '../hooks/useTypingEffect.ts';
import InfoModal from './InfoModal.tsx';

interface HomepageProps {
  onNavigateToLogin: () => void;
  onCourseSelect: (course: Course) => void;
  courses: Course[];
  isLoadingCourses?: boolean;
}

const CategoryCard: React.FC<{ category: { name: string; icon: string; tags: string[] } }> = ({ category }) => {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className="interactive-tile motion-card panel-glass bg-white/80 dark:bg-slate-900/60 rounded-xl border border-white/40 dark:border-slate-800 p-6 flex flex-col h-full scroll-animate shadow-md"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{category.name}</h3>
        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
          <Icon name={category.icon} className="w-6 h-6 text-brand-primary" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {category.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center mt-auto text-sm font-semibold text-brand-primary hover:underline"
      >
        Explore Category <Icon name="arrowRight" className="w-4 h-4 ml-1" />
      </a>
    </div>
  );
};

const SearchResultCourseCard: React.FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => {
  const previewImage = course.thumbnailUrl ?? course.thumbnail;
  return (
    <div
      onClick={onClick}
      className="motion-card interactive-tile flex items-center p-4 bg-white/90 dark:bg-slate-800/60 rounded-lg cursor-pointer hover:bg-brand-light/60 dark:hover:bg-slate-700 hover:shadow-md"
    >
      <img src={previewImage} alt={course.title} className="w-24 h-16 object-cover rounded-md mr-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-brand-primary dark:text-purple-400 uppercase">{course.category}</span>
        <h4 className="font-bold text-slate-800 dark:text-white truncate">{course.title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{course.description}</p>
      </div>
      <Icon name="chevronRight" className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
    </div>
  );
};

const SearchResultsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  results: Course[];
  onCourseSelect: (course: Course) => void;
  searchQuery: string;
}> = ({ isOpen, onClose, isLoading, results, onCourseSelect, searchQuery }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 modal-backdrop flex items-start justify-center z-50 animate-fade-in pt-16 sm:pt-20"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel-glass bg-slate-50/80 dark:bg-slate-900/70 rounded-2xl shadow-2xl w-full max-w-2xl m-4 animate-scale-in flex flex-col max-h-[70vh] border border-white/40 dark:border-slate-700"
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
            Results for "{searchQuery}"
          </h2>
          <button onClick={onClose} aria-label="Close search results" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="x" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Icon name="spinner" className="w-10 h-10 text-brand-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map(course => (
                <SearchResultCourseCard key={course.id} course={course} onClick={() => onCourseSelect(course)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="search" className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">No Courses Found</h3>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Try a different search term to find your perfect course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Homepage: React.FC<HomepageProps> = ({ onNavigateToLogin, onCourseSelect, courses, isLoadingCourses = false }) => {
  const introRef = useScrollAnimation();
  const metricsRef = useScrollAnimation();
  const categoriesRef = useScrollAnimation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const subtitles = [
    "Unlock your potential with Edusimulate — where learning comes alive.",
    "Interactive. Intelligent. Immersive. That’s Edusimulate.",
    "Where knowledge meets simulation — Edusimulate.",
    "Learn by Doing.",
  ];
  const typedSubtitle = useTypingEffect(subtitles);
  
   const categoryDetails = [
    { name: 'NEET', icon: 'neet', tags: ['Class 11', 'Class 12', 'Dropper'] },
    { name: 'IIT JEE', icon: 'iit', tags: ['Class 11', 'Class 12', 'Dropper'] },
    { name: 'School Preparation', icon: 'school', tags: ['Class 6', 'Class 10', 'CBSE'] },
    { name: 'UPSC', icon: 'upsc', tags: ['Prelims', 'Mains', 'CSE'] },
  ];

  const metrics = [
    { icon: 'live', title: 'Daily Live', subtitle: 'Interactive classes' },
    { icon: 'test', title: '10 Million+', subtitle: 'Tests, papers & notes' },
    { icon: 'doubt', title: '24 x 7', subtitle: 'Doubt solving sessions' },
    { icon: 'cube', title: '100+', subtitle: 'Immersive 3D Models' },
  ];

  const heroHighlights = [
    { icon: 'live', title: 'Live mentorship', subtitle: 'Guided cohorts with fast feedback' },
    { icon: 'target', title: 'Adaptive paths', subtitle: 'Smart pacing tuned to your progress' },
    { icon: 'sparkles', title: 'Immersive labs', subtitle: '3D visuals and simulations that feel fluid' },
  ];

  const canSearch = Boolean(searchQuery.trim()) && !isSearching && !isLoadingCourses;

  const handleSearch = async () => {
    if (!canSearch) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setIsSearchModalOpen(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const query = searchQuery.toLowerCase().trim();
      const results = courses.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query)
      );
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCourseSelection = (course: Course) => {
    setIsSearchModalOpen(false);
    onCourseSelect(course);
  };

  return (
    <>
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-sans overflow-x-hidden">
        <div className="absolute inset-0 surface-grid" aria-hidden="true" />
        <div
          className="glow-orb"
          style={{ background: 'radial-gradient(circle, rgba(43,131,198,0.28), rgba(43,131,198,0))', top: '-6rem', left: '-4rem' }}
          aria-hidden="true"
        />
        <div
          className="glow-orb is-secondary"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.24), rgba(99,102,241,0))', top: '15%', right: '-6rem' }}
          aria-hidden="true"
        />
        <div
          className="glow-orb is-tertiary"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2), rgba(236,72,153,0))', bottom: '-10%', left: '8%' }}
          aria-hidden="true"
        />

        <header className="absolute top-0 left-0 right-0 z-30">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Edusimulate Logo" className="h-9 w-9 rounded-xl shadow-sm" />
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Edusimulate</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">Smart Learning</span>
              </div>
            </div>
            <button
              onClick={onNavigateToLogin}
              className="motion-pill glass-reflection bg-white/80 dark:bg-white/10 text-slate-900 dark:text-white font-semibold text-sm md:text-base"
            >
              <Icon name="arrowRight" className="w-4 h-4" />
              Login / Register
            </button>
          </div>
        </header>

        <main className="relative z-10 pt-28 md:pt-32 pb-12">
          {/* Hero Banner */}
          <section className="container mx-auto px-6 mb-16">
            <div className="relative overflow-hidden panel-glass interactive-tile motion-card rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row gap-8 items-center justify-between border border-white/40 dark:border-slate-800 shadow-2xl">
              <div className="absolute inset-0 opacity-50 dark:opacity-25">
                <div className="absolute top-10 left-6 text-brand-primary/15 animate-float-1" style={{ animationDuration: '20s' }}>
                  <Icon name="iit" className="w-16 h-16" />
                </div>
                <div className="absolute bottom-6 right-10 text-indigo-400/20 dark:text-indigo-300/15 animate-float-2" style={{ animationDuration: '26s' }}>
                  <Icon name="cube" className="w-20 h-20" />
                </div>
              </div>

              <div className="space-y-4 z-10 max-w-2xl">
                <span className="motion-pill text-brand-primary bg-white/80 dark:bg-white/10 border-white/60 dark:border-white/10 shadow-brand-primary/20">
                  <Icon name="sparkles" className="w-4 h-4" />
                  Fluid, glassy UI without the choppiness
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Modern motion design for immersive learning
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
                  Delightfully smooth animations, responsive interactions, and performance-minded visuals that keep every tap and scroll feeling effortless.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onNavigateToLogin}
                    className="glass-reflection inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-3 text-white font-semibold shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Start exploring
                    <Icon name="arrowRight" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-5 py-3 text-slate-800 shadow-sm backdrop-blur hover:-translate-y-0.5 transition-transform duration-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    Preview courses
                    <Icon name="search" className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto z-10">
                {heroHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="motion-card interactive-tile rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-white/40 dark:border-slate-800/80 p-4 min-w-[180px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
                        <Icon name={item.icon as any} className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Intro Section */}
          <section ref={introRef} className="container mx-auto px-6 mb-20 text-center scroll-animate">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Edusimulate's Trusted & Affordable <br />
              <span className="text-brand-primary accent-underline is-visible">Educational Platform</span>
            </h2>
            <div className="mt-6 max-w-3xl xl:max-w-4xl mx-auto min-h-[5rem] md:min-h-[4rem] flex items-center justify-center">
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-handwriting">
                {typedSubtitle}
                <span className="animate-text-cursor-blink font-sans font-light">|</span>
              </p>
            </div>
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative panel-glass motion-card rounded-full p-2 bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-lg">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Icon name="search" className="w-5 h-5" />
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="What do you want to learn today?"
                  aria-label="Search for courses"
                  disabled={isSearching}
                  className="w-full pl-12 pr-16 py-4 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
                />
                <button
                  onClick={handleSearch}
                  disabled={!canSearch}
                  aria-label="Search courses"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-slate-900 text-white dark:bg-white/10 dark:text-white flex items-center justify-center shadow-md transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:scale-100 disabled:opacity-60"
                >
                  <Icon name="arrowRight" className="w-6 h-6" />
                </button>
              </div>
            </div>
            {isLoadingCourses && (
              <div
                className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400"
                role="status"
                aria-live="polite"
              >
                <Icon name="spinner" className="w-4 h-4 animate-spin text-brand-primary" />
                <span>Loading featured courses…</span>
              </div>
            )}
          </section>

        {/* Metrics Section */}
          <section ref={metricsRef} className="container mx-auto px-6 mb-20 scroll-animate">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="motion-card interactive-tile flex items-center p-5 rounded-xl bg-white/85 dark:bg-slate-900/70 shadow-md border border-white/60 dark:border-slate-800"
                >
                  <div className="p-3 bg-brand-light dark:bg-slate-700 rounded-lg mr-4">
                    <Icon name={metric.icon} className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{metric.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{metric.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        {/* Course Categories Section */}
        <section ref={categoriesRef} className="container mx-auto px-6 mb-20 scroll-animate">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              <span className="accent-underline is-visible">Explore Our Top Categories</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
              Find the perfect course to match your academic goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categoryDetails.map((cat) => (
              <CategoryCard key={cat.name} category={cat} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 mb-20">
          <div className="relative interactive-tile motion-card overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary to-purple-600 p-8 md:p-12 lg:p-16 text-center text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-shadow">Ready to Start Learning?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg opacity-90">
              Join thousands of students who are already excelling with Edusimulate.
            </p>
            <button
              onClick={onNavigateToLogin}
              className="glass-reflection mt-8 inline-flex items-center justify-center gap-3 px-8 py-3 bg-white/20 backdrop-blur-lg border-2 border-white/40 text-white font-bold text-lg rounded-full shadow-lg hover:bg-white/30 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 animate-glass-glow shadow-brand-primary/30 dark:shadow-brand-primary/20"
            >
              Sign Up for Free
              <Icon name="arrowRight" className="w-5 h-5" />
            </button>
          </div>
        </section>

      </main>

      <footer className="relative z-10 bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700/50 mt-10">
        <div className="container mx-auto px-6 py-8 text-center text-slate-500 dark:text-slate-400">
             <div className="flex justify-center items-center mb-4 text-slate-700 dark:text-slate-200">
                 <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8 mr-2" />
                 <span className="text-lg font-semibold">Edusimulate</span>
             </div>
             <p>&copy; {new Date().getFullYear()} Edusimulate. All rights reserved.</p>
             <p className="text-sm mt-2">Empowering the next generation of learners through technology.</p>
             <div className="mt-6 flex justify-center">
                <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-brand-primary/90 text-white font-medium px-5 py-2 rounded-full shadow-md hover:bg-brand-primary hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 text-sm"
                >
                    <Icon name="info" className="w-4 h-4" />
                    Contact & Terms
                </button>
             </div>
        </div>
      </footer>

        <SearchResultsModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          isLoading={isSearching}
          results={searchResults}
          onCourseSelect={handleCourseSelection}
          searchQuery={searchQuery}
        />

        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
        />
        </div>
      </>
    );
  };

export default Homepage;
