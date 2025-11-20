
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Course, Lecture, User } from '../types.ts';
import Icon from './common/Icon.tsx';
import GlassPreviewPlayer from './media/GlassPreviewPlayer.tsx';
import { LOGO_URL, PENDING_ACTION_STORAGE_KEY, PENDING_COURSE_STORAGE_KEY } from '../constants.ts';
import { safeLocalStorage } from '@/utils/safeStorage';
import { updateUserProfile } from '@/services/firestoreService.ts';

interface CoursePreviewProps {
  course: Course;
  onLoginClick: () => void;
  onBack: () => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  user: User | null;
}

const Toast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/90 dark:bg-slate-800/90 border border-white/40 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl text-slate-800 dark:text-white">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white shadow-sm">
          <Icon name="check" className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-wide">{message}</span>
      </div>
    </div>
  );
};

const SectionItem: React.FC<{ section: any; index: number }> = ({ section, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);

    return (
        <div className="border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center py-4 text-left group"
            >
                <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isOpen ? 'bg-brand-primary text-white shadow-brand-primary/30 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                      {index + 1}
                   </div>
                   <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{section.title}</span>
                </div>
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 text-slate-400 transition-transform duration-300" />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                <ul className="space-y-1 pl-12">
                    {section.lectures.map((lecture: Lecture) => (
                        <li key={lecture.id} className="flex items-center gap-3 py-2 text-sm text-slate-600 dark:text-slate-400 group/lecture cursor-default">
                            <Icon name={lecture.isPreview ? 'play' : 'lock'} className={`w-3.5 h-3.5 ${lecture.isPreview ? 'text-brand-secondary' : 'text-slate-400'}`} />
                            <span className="flex-1 group-hover/lecture:text-slate-900 dark:group-hover/lecture:text-slate-200 transition-colors line-clamp-1">{lecture.title}</span>
                            <span className="text-xs opacity-60">{lecture.duration}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const CoursePreview: React.FC<CoursePreviewProps> = ({ course, onLoginClick, onBack, isDarkMode, setDarkMode, user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor'>('overview');

    // Check if we should show toast from redirection (after login)
    useEffect(() => {
        if (location.state && (location.state as any).showWishlistToast) {
            setToastMessage(`"${course.title}" added to Wishlist`);
            setShowToast(true);
            setIsWishlisted(true);
            // Clear state so it doesn't persist on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location, course.title]);

    // Sync local wishlist state with user object
    useEffect(() => {
        if (user && user.wishlist) {
            setIsWishlisted(user.wishlist.includes(course.id));
        }
    }, [user, course.id]);

    const handleWishlist = async () => {
        if (!user) {
            // Guest: Save intent and redirect to login
            safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
            safeLocalStorage.setItem(PENDING_ACTION_STORAGE_KEY, 'wishlist');
            onLoginClick(); // Triggers navigation to login
            return;
        }

        // Logged in: Toggle state immediately (Optimistic UI)
        const wasWishlisted = isWishlisted;
        const newStatus = !wasWishlisted;
        setIsWishlisted(newStatus);
        
        const message = newStatus ? 'Added to Wishlist' : 'Removed from Wishlist';
        setToastMessage(message);
        setShowToast(true);

        try {
            let updatedWishlist: string[];
            if (newStatus) {
                updatedWishlist = [...(user.wishlist || []), course.id];
            } else {
                updatedWishlist = (user.wishlist || []).filter(id => id !== course.id);
            }
            // Persist to Firestore
            await updateUserProfile(user.uid, { wishlist: updatedWishlist } as any);
        } catch (error) {
            console.error("Wishlist sync failed", error);
            // Revert on error
            setIsWishlisted(wasWishlisted);
            setToastMessage('Failed to update wishlist');
            setShowToast(true);
        }
    };

    const handleEnroll = () => {
        if (!user) {
            // Guest: Save intent for enrollment
            safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
            // If we want a specific action for enrollment post-login, we could add it, 
            // but default App.tsx logic redirects to course detail which is sufficient.
            onLoginClick();
        } else {
            // User is logged in: "Enroll" means go to the course detail page.
            // In a real app, this might trigger a payment modal if `course.isPaid`.
            navigate(`/courses/${course.id}`);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: course.title,
                    text: `Check out this course: ${course.title}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setToastMessage('Link copied to clipboard');
                setShowToast(true);
            } catch (err) {
                setToastMessage('Failed to copy link');
                setShowToast(true);
            }
        }
    };

    const previewVideoSource = course.previewVideoUrl || course.lectures[0]?.videoUrl;
    const previewPoster = course.previewImageUrl ?? course.thumbnailUrl ?? course.thumbnail;
    const priceLabel = course.isFree ? 'Free' : course.price ? `${course.currency || '$'}${course.price}` : 'Premium';
    const originalPriceLabel = course.originalPrice ? `${course.currency || '$'}${course.originalPrice}` : null;
    const discount = course.originalPrice && course.price ? Math.round(100 - (course.price / course.originalPrice) * 100) : 0;

    return (
        <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 selection:bg-brand-primary/30">
            
            <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            {/* Sticky Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                            <Icon name="arrowLeft" className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <img src={LOGO_URL} alt="Logo" className="h-7 w-7" />
                            <span className="font-bold text-slate-900 dark:text-white hidden sm:inline-block">Edusimulate</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 transition-colors">
                            <Icon name={isDarkMode ? 'moon' : 'sun'} className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleEnroll} 
                            className="hidden sm:block px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                        >
                            {user ? 'Go to Course' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Background */}
            <div className="relative pt-16 pb-12 lg:pt-24 lg:pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                     <img src={previewPoster} alt="" className="w-full h-full object-cover opacity-20 dark:opacity-10 blur-3xl scale-110" />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/80 to-slate-50 dark:via-slate-950/80 dark:to-slate-950" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                        {/* Main Content Column */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* Title Block */}
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                                    <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                        {course.category}
                                    </span>
                                    {course.rating && (
                                        <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                            <Icon name="star-filled" className="w-3.5 h-3.5" />
                                            {course.rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                                    {course.title}
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                                    {course.headline || course.description}
                                </p>
                                <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400 pt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border border-white dark:border-slate-700 shadow-sm">
                                            <img src={course.author.avatar} alt={course.author.name} className="w-full h-full object-cover" />
                                        </span>
                                        <span>Created by <span className="font-semibold text-slate-900 dark:text-white">{course.author.name}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="refreshCw" className="w-4 h-4" />
                                        <span>Updated {course.lastUpdated || 'Recently'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="globe" className="w-4 h-4" />
                                        <span>{course.language || 'English'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Video Player */}
                            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-brand-primary/10 dark:shadow-black/40 border border-slate-200 dark:border-slate-800 bg-black animate-scale-in">
                                <GlassPreviewPlayer 
                                    videoUrl={previewVideoSource}
                                    poster={previewPoster}
                                    title={course.title}
                                    caption="Free Preview"
                                />
                            </div>

                            {/* Tabs Navigation */}
                            <div className="border-b border-slate-200 dark:border-slate-800 sticky top-16 bg-slate-50/95 dark:bg-slate-950/95 z-20 backdrop-blur-sm pt-4">
                                <nav className="flex gap-8 overflow-x-auto pb-1 no-scrollbar">
                                    {['overview', 'curriculum', 'instructor'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`pb-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all border-b-2 ${activeTab === tab 
                                                ? 'border-brand-primary text-brand-primary' 
                                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[300px] animate-fade-in">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Description</h3>
                                            <div dangerouslySetInnerHTML={{ __html: course.descriptionHtml || `<p>${course.longDescription || course.description}</p>` }} />
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">What you'll learn</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {(course.learningOutcomes || []).map((outcome, i) => (
                                                    <div key={i} className="flex gap-3">
                                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mt-0.5">
                                                            <Icon name="check" className="w-3 h-3" />
                                                        </span>
                                                        <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{outcome}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {course.requirements && (
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Requirements</h3>
                                                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 marker:text-brand-primary">
                                                    {course.requirements.map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'curriculum' && (
                                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Course Content</h3>
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                {course.sections?.length || 1} Sections • {course.lessonsCount} Lectures • {course.totalDuration} Total
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {course.sections?.map((section, index) => (
                                                <SectionItem key={index} section={section} index={index} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'instructor' && (
                                    <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex flex-col sm:flex-row gap-8 items-start">
                                            <div className="flex-shrink-0 mx-auto sm:mx-0">
                                                <img src={course.author.avatar} alt={course.author.name} className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg" />
                                            </div>
                                            <div className="flex-1 text-center sm:text-left">
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{course.author.name}</h3>
                                                <p className="text-brand-primary font-medium mb-4">{course.author.bio || 'Instructor'}</p>
                                                
                                                <div className="flex flex-wrap gap-6 justify-center sm:justify-start mb-6 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="flex items-center gap-2"><Icon name="star" className="w-4 h-4" /> 4.8 Instructor Rating</span>
                                                    <span className="flex items-center gap-2"><Icon name="users" className="w-4 h-4" /> {course.studentCount?.toLocaleString()} Students</span>
                                                    <span className="flex items-center gap-2"><Icon name="play" className="w-4 h-4" /> {course.coursesAuthored || 5} Courses</span>
                                                </div>
                                                
                                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                                    {course.author.bio ? `${course.author.name} is a dedicated educator with a passion for simplifying complex topics. With years of experience in the field, they bring practical insights and real-world examples to help you master the subject.` : 'Expert instructor details coming soon.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <div className="lg:col-span-4 relative z-30">
                            <div className="sticky top-24 space-y-6 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-white/50 dark:border-slate-700 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-black/50">
                                    
                                    <div className="mb-6">
                                        <div className="flex items-end gap-3 mb-2">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{priceLabel}</span>
                                            {originalPriceLabel && (
                                                <span className="text-lg text-slate-400 line-through mb-1.5 decoration-2">{originalPriceLabel}</span>
                                            )}
                                        </div>
                                        {discount > 0 && (
                                            <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                                                {discount}% Off
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <button 
                                            onClick={handleEnroll}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:brightness-110 text-white font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                                        >
                                            <span>{course.isPaid ? 'Buy Now' : 'Enroll Now'}</span>
                                            <Icon name="arrowRight" className="w-5 h-5" />
                                        </button>
                                        
                                        <button 
                                            onClick={handleWishlist}
                                            className={`w-full py-3 rounded-xl font-bold border-2 transition-all duration-300 flex items-center justify-center gap-2 ${isWishlisted 
                                                ? 'border-red-100 bg-red-50 text-red-500 dark:border-red-900/30 dark:bg-red-900/10' 
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <Icon name={isWishlisted ? 'heart-filled' : 'heart'} className={`w-5 h-5 ${isWishlisted ? 'text-red-500' : ''}`} />
                                            <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                                        </button>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <p className="font-bold text-slate-900 dark:text-white mb-4 text-sm">This course includes:</p>
                                        <ul className="space-y-3">
                                            {[
                                                { text: `${course.totalDuration} on-demand video`, icon: 'video' },
                                                { text: `${course.resources?.length || 5} downloadable resources`, icon: 'download' },
                                                { text: 'Full lifetime access', icon: 'infinity' },
                                                { text: 'Access on mobile and TV', icon: 'smartphone' },
                                                { text: 'Certificate of completion', icon: 'award' },
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <Icon name={item.icon} className="w-4 h-4 text-brand-primary mt-0.5" />
                                                    <span>{item.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    <div className="mt-6 flex justify-center">
                                        <button onClick={handleShare} className="text-xs font-semibold text-slate-500 hover:text-brand-primary flex items-center gap-1 transition-colors">
                                            <Icon name="share" className="w-3.5 h-3.5" /> Share this course
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePreview;
