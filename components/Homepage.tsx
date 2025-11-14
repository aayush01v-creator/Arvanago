
import React, { useEffect, useMemo, useState } from 'react';
import Icon from './common/Icon.tsx';
import { useScrollAnimation } from '../hooks/useScrollAnimation.ts';
import { Course } from '../types.ts';
import { LOGO_URL } from '../constants.ts';
import { useTypingEffect } from '../hooks/useTypingEffect.ts';
import QuickExploreCard from './QuickExploreCard.tsx';

interface HomepageProps {
  onNavigateToLogin: () => void;
  onCourseSelect: (course: Course) => void;
  courses: Course[];
}

const CategoryCard: React.FC<{ category: { name: string; icon: string; tags: string[] } }> = ({ category }) => {
    const ref = useScrollAnimation();
    return (
        <div ref={ref} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-6 flex flex-col h-full scroll-animate transition-all duration-300 hover:-translate-y-1.5 hover:shadow-brand-primary/20">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{category.name}</h3>
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
                   <Icon name={category.icon} className="w-6 h-6 text-brand-primary" />
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {category.tags.map(tag => (
                     <span key={tag} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{tag}</span>
                ))}
            </div>
            <a href="#" onClick={e => e.preventDefault()} className="inline-flex items-center mt-auto text-sm font-semibold text-brand-primary hover:underline">
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
    className="flex items-center p-4 bg-white dark:bg-slate-700/50 rounded-lg cursor-pointer transition-all duration-300 hover:bg-brand-light dark:hover:bg-slate-700 hover:shadow-md transform hover:scale-[1.02]"
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
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 animate-fade-in pt-16 sm:pt-20">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl m-4 animate-scale-in flex flex-col max-h-[70vh]"
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

const Homepage: React.FC<HomepageProps> = ({ onNavigateToLogin, onCourseSelect, courses }) => {
  const introRef = useScrollAnimation();
  const metricsRef = useScrollAnimation();
  const categoriesRef = useScrollAnimation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isQuickExploreOpen, setQuickExploreOpen] = useState(false);
  const [highlightCourseId, setHighlightCourseId] = useState<string | null>(null);

  const prioritizedCourses = useMemo(() => {
    if (!courses || courses.length === 0) {
      return [] as Course[];
    }

    const sorted = [...courses].sort((a, b) => {
      const priorityA = a.featuredPriority ?? Number.POSITIVE_INFINITY;
      const priorityB = b.featuredPriority ?? Number.POSITIVE_INFINITY;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const ratingA = typeof a.rating === 'number' ? a.rating : 0;
      const ratingB = typeof b.rating === 'number' ? b.rating : 0;
      return ratingB - ratingA;
    });

    const featured = sorted.filter(course => course.isFeaturedOnHome);
    return featured.length > 0 ? featured : sorted;
  }, [courses]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    
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

  const handleOpenQuickExplore = (courseId?: string) => {
    if (prioritizedCourses.length === 0) {
      return;
    }

    setHighlightCourseId(courseId ?? prioritizedCourses[0]?.id ?? null);
    setQuickExploreOpen(true);
  };

  const handleCourseSelection = (course: Course) => {
    setIsSearchModalOpen(false);
    handleOpenQuickExplore(course.id);
  };

  const handleQuickExploreClose = () => {
    setQuickExploreOpen(false);
    setHighlightCourseId(null);
  };

  const handleQuickExplorePrimary = (course: Course) => {
    setQuickExploreOpen(false);
    setHighlightCourseId(null);
    onCourseSelect(course);
  };

  const handleQuickExploreSecondary = () => {
    setQuickExploreOpen(false);
    setHighlightCourseId(null);
    onNavigateToLogin();
  };

  return (
    <>
      <QuickExploreCard
        isOpen={isQuickExploreOpen}
        courses={prioritizedCourses}
        onClose={handleQuickExploreClose}
        onExploreCourse={handleQuickExplorePrimary}
        onSecondaryAction={handleQuickExploreSecondary}
        secondaryLabel="Login / Register"
        primaryLabel="Explore this course"
        highlightCourseId={highlightCourseId ?? undefined}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-sans overflow-x-hidden relative">
      {/* Decorative background blobs */}
      <div className="fixed top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:opacity-30"></div>
      <div className="fixed top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:opacity-30" style={{animationDelay: '2s'}}></div>
      <div className="fixed -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:opacity-30" style={{animationDelay: '4s'}}></div>

      <header className="absolute top-0 left-0 right-0 z-30 bg-transparent">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8 mr-2" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">Edusimulate</span>
                </div>
                <button 
                  onClick={onNavigateToLogin} 
                  className="glass-reflection px-6 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-full font-semibold text-base text-slate-900 dark:text-white shadow-lg transition-all transform hover:scale-105 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 animate-glass-glow shadow-brand-primary/30 dark:shadow-brand-primary/20 duration-150 ease-in-out active:scale-95"
                  >
                    Login / Register
                </button>
            </div>
      </header>

      <main className="pt-28 md:pt-32 relative z-10">
        {/* Additional Decorative Icons for Desktop */}
        <div className="hidden lg:block absolute top-[20%] left-[5%] text-brand-primary/10 animate-float-1" style={{ animationDuration: '30s' }}>
            <Icon name="atom" className="w-24 h-24" />
        </div>
        <div className="hidden lg:block absolute top-[60%] right-[8%] text-brand-primary/10 animate-float-2" style={{ animationDuration: '35s' }}>
            <Icon name="brain-circuit" className="w-28 h-28" />
        </div>
        <div className="hidden lg:block absolute bottom-[10%] left-[10%] text-brand-primary/10 animate-float-1" style={{ animationDuration: '40s' }}>
            <Icon name="dna" className="w-20 h-20" />
        </div>

         {/* Hero Banner */}
        <section className="container mx-auto px-6 mb-16">
            <div className="relative bg-white/40 dark:bg-slate-800/30 backdrop-blur-xl rounded-2xl p-8 md:p-12 flex items-center justify-between overflow-hidden shadow-2xl border border-white/50 dark:border-slate-700/50">
                {/* Animated icons layer */}
                <div className="absolute inset-0 z-0 opacity-50 dark:opacity-20">
                    <div className="absolute top-[10%] left-[5%] animate-float-1" style={{animationDuration: '20s'}}><Icon name="iit" className="w-16 h-16 text-purple-400/30 dark:text-purple-300/20" /></div>
                    <div className="absolute top-[60%] left-[15%] animate-float-2" style={{animationDuration: '28s'}}><Icon name="test" className="w-20 h-20 text-indigo-400/30 dark:text-indigo-300/20" /></div>
                    <div className="absolute top-[20%] right-[10%] animate-float-1" style={{animationDuration: '22s'}}><Icon name="cube" className="w-12 h-12 text-pink-400/30 dark:text-pink-300/20" /></div>
                    <div className="absolute bottom-[10%] right-[20%] animate-float-2" style={{animationDuration: '25s'}}><Icon name="school" className="w-24 h-24 text-blue-400/30 dark:text-blue-300/20" /></div>
                    <div className="absolute bottom-[25%] left-[45%] animate-float-1" style={{animationDuration: '30s'}}><Icon name="neet" className="w-10 h-10 text-green-400/30 dark:text-green-300/20" /></div>
                </div>
                
                <div className="space-y-3 z-10">
                    <p className="font-semibold text-purple-800 dark:text-purple-200">NEW BATCHES STARTING SOON</p>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white text-shadow">NEET 2025 Prep Course</h2>
                    <button
                      onClick={() => handleOpenQuickExplore()}
                      className="glass-reflection bg-white/20 dark:bg-white/10 text-slate-900 dark:text-white font-bold py-2 px-5 rounded-full hover:bg-white/30 dark:hover:bg-white/20 transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md border border-white/40 dark:border-white/20 shadow-md animate-glass-glow shadow-brand-primary/30 dark:shadow-brand-primary/20 duration-150 ease-in-out"
                    >
                        Tap to Explore
                    </button>
                </div>
                <div className="hidden md:flex items-center justify-center relative w-48 h-48 lg:w-64 lg:h-64 z-10">
                    <Icon name="cube" className="w-full h-full text-white/50 animate-float-1 opacity-70" style={{animationDuration: '15s'}}/>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-full transform rotate-45"></div>
                </div>
            </div>
        </section>

        {/* Intro Section */}
        <section ref={introRef} className="container mx-auto px-6 mb-20 text-center scroll-animate">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Edusimulate's Trusted & Affordable <br/>
                <span className="text-brand-primary">Educational Platform</span>
            </h2>
            <div className="mt-6 max-w-3xl xl:max-w-4xl mx-auto min-h-[5rem] md:min-h-[4rem] flex items-center justify-center">
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-handwriting">
                    {typedSubtitle}<span className="animate-text-cursor-blink font-sans font-light">|</span>
                </p>
            </div>
            <div className="mt-8 max-w-2xl mx-auto">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Icon name="search" className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSearch() }}
                        placeholder="What do you want to learn today?"
                        aria-label="Search for courses"
                        disabled={isSearching}
                        className="w-full pl-14 pr-16 py-4 text-lg bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-brand-primary rounded-full shadow-md outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all duration-300"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        aria-label="Search courses"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-slate-200 dark:bg-slate-700 text-brand-primary rounded-full flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-all transform hover:scale-110 active:scale-95 disabled:bg-slate-400 disabled:scale-100 dark:disabled:bg-slate-600 disabled:text-white"
                    >
                        <Icon name="arrowRight" className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </section>

        {/* Metrics Section */}
        <section ref={metricsRef} className="container mx-auto px-6 mb-20 scroll-animate">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <div key={index} className="flex items-center p-4 bg-white dark:bg-slate-800/50 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 transition-transform duration-300 hover:scale-105">
                        <div className="p-3 bg-brand-light dark:bg-slate-700 rounded-lg mr-4">
                            <Icon name={metric.icon} className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">{metric.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {metric.subtitle}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Course Categories Section */}
        <section ref={categoriesRef} className="container mx-auto px-6 mb-20 scroll-animate">
            <div className="text-center mb-12">
                 <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                    Explore Our Top Categories
                 </h2>
                 <p className="text-xl text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                    Find the perfect course to match your academic goals.
                 </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {categoryDetails.map(cat => (
                    <CategoryCard key={cat.name} category={cat} />
                ))}
            </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 mb-20">
            <div className="relative bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl p-8 md:p-12 lg:p-16 text-center text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-shadow">Ready to Start Learning?</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg opacity-90">Join thousands of students who are already excelling with Edusimulate.</p>
                 <button 
                    onClick={onNavigateToLogin}
                    className="glass-reflection mt-8 px-8 py-3 bg-white/20 backdrop-blur-lg border-2 border-white/40 text-white font-bold text-lg rounded-full shadow-lg hover:bg-white/30 transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 animate-glass-glow shadow-brand-primary/30 dark:shadow-brand-primary/20 duration-150 ease-in-out"
                 >
                    Sign Up for Free
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
    </>
  );
};

export default Homepage;