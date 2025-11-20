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
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="glass-reflection flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 dark:bg-slate-900/80 border border-white/40 dark:border-slate-700 shadow-xl backdrop-blur-xl text-slate-800 dark:text-white">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
          <Icon name="check" className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
};

const SectionItem: React.FC<{ section: any; index: number }> = ({ section, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);

    return (
        <div className="border border-white/30 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/60 mb-3">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isOpen ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      {index + 1}
                   </div>
                   <span className="font-semibold text-slate-900 dark:text-slate-100">{section.title}</span>
                </div>
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 text-slate-500" />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="p-2 pt-0 space-y-1">
                    {section.lectures.map((lecture: Lecture, idx: number) => (
                        <li key={lecture.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                            <Icon name={lecture.isPreview ? 'play' : 'lock'} className={`w-4 h-4 ${lecture.isPreview ? 'text-brand-secondary' : 'text-slate-400'}`} />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{lecture.title}</span>
                            <span className="text-xs text-slate-500">{lecture.duration}</span>
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

    // Handle post-login toast
    useEffect(() => {
        if (location.state && (location.state as any).showWishlistToast) {
            setToastMessage('Added to Wishlist');
            setShowToast(true);
            setIsWishlisted(true); // Optimistically set true
            // Clear state to prevent showing on reload
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Check wishlist status on mount
    useEffect(() => {
        if (user && user.wishlist) {
            setIsWishlisted(user.wishlist.includes(course.id));
        }
    }, [user, course.id]);

    const handleWishlist = async () => {
        if (!user) {
            // Not logged in: Redirect flow
            safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
            safeLocalStorage.setItem(PENDING_ACTION_STORAGE_KEY, 'wishlist');
            onLoginClick(); // Triggers redirect
            return;
        }

        // Logged in flow
        try {
            let updatedWishlist: string[];
            let message = '';

            if (isWishlisted) {
                updatedWishlist = user.wishlist.filter(id => id !== course.id);
                message = 'Removed from Wishlist';
                setIsWishlisted(false);
            } else {
                updatedWishlist = [...user.wishlist, course.id];
                message = 'Added to Wishlist';
                setIsWishlisted(true);
            }

            setToastMessage(message);
            setShowToast(true);
            
            // Optimistic update handled by local state, sync DB in background
            await updateUserProfile(user.uid, { wishlist: updatedWishlist } as any);
            
        } catch (error) {
            console.error("Wishlist update failed", error);
            setToastMessage('Something went wrong');
            setShowToast(true);
            setIsWishlisted(!isWishlisted); // Revert on error
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: course.title,
            text: `Check out this course on EduSimulate: ${course.title}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
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
    const price = course.isFree ? 'Free' : course.price ? `${course.currency || '$'}${course.price}` : 'Premium';
    const discount = course.originalPrice ? Math.round(100 - (course.price! / course.originalPrice) * 100) : 0;

    return (
        <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 overflow-x-hidden transition-colors duration-500">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-[-1]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-950 dark:via-[#0B1120] dark:to-slate-900 transition-colors duration-500" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob dark:bg-purple-900/20" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000 dark:bg-cyan-900/20" />
                <div className="absolute -bottom-32 left-20 w-[600px] h-[600px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-blob animation-delay-4000 dark:bg-pink-900/20" />
            </div>

            <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            {/* Header */}
            <header className="sticky top-0 z-50 glass-reflection border-b border-white/20 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-all group">
                            <Icon name="arrowLeft" className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2">
                            <img src={LOGO_URL} alt="Logo" className="h-8 w-8" />
                            <span className="text-lg font-bold hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Edusimulate</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={handleShare}
                            className="p-2.5 rounded-full bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:scale-110 transition-transform text-slate-600 dark:text-slate-300 hover:text-brand-primary"
                            aria-label="Share course"
                        >
                            <Icon name="share" className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleWishlist}
                            className={`p-2.5 rounded-full border hover:scale-110 transition-all duration-300 ${isWishlisted 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500' 
                                : 'bg-white/40 dark:bg-white/5 border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-red-500'}`}
                            aria-label="Add to wishlist"
                        >
                            <Icon name={isWishlisted ? 'heart-filled' : 'heart'} className={`w-5 h-5 ${isWishlisted ? 'animate-pulse' : ''}`} />
                        </button>
                        <button 
                            onClick={() => setDarkMode(!isDarkMode)} 
                            className="p-2.5 rounded-full bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:scale-110 transition-transform text-amber-500"
                        >
                            <Icon name={isDarkMode ? 'moon' : 'sun'} className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Left Column: Content */}
                    <div className="lg:col-span-8 space-y-8 animate-fade-in-up">
                        {/* Hero Section */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-brand-primary/10 dark:shadow-black/50 group border border-white/20 dark:border-white/10 bg-black">
                             <GlassPreviewPlayer 
                                videoUrl={previewVideoSource}
                                poster={previewPoster}
                                title={course.title}
                                caption={`${course.lessonsCount} Lessons • ${course.totalDuration}`}
                             />
                        </div>

                        {/* Mobile Sticky Title (Only visible on small screens) */}
                        <div className="block lg:hidden">
                             <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-2">{course.title}</h1>
                             <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{course.description}</p>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="sticky top-20 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-2 -mx-4 px-4 lg:static lg:bg-transparent lg:p-0 lg:mx-0">
                            <div className="flex p-1 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/5 backdrop-blur-sm w-full sm:w-fit overflow-x-auto">
                                {['overview', 'curriculum', 'instructor'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 capitalize whitespace-nowrap ${activeTab === tab 
                                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-105' 
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <h3 className="text-xl font-bold mb-4">About this course</h3>
                                        <p className="leading-relaxed text-slate-600 dark:text-slate-300">{course.longDescription || course.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Skill Level', value: course.skillLevel, icon: 'bar-chart' },
                                            { label: 'Students', value: course.studentCount?.toLocaleString(), icon: 'users' },
                                            { label: 'Language', value: course.language, icon: 'globe' },
                                            { label: 'Captions', value: 'Yes', icon: 'file-text' },
                                        ].map((stat) => (
                                            <div key={stat.label} className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 backdrop-blur-sm">
                                                <Icon name={stat.icon} className="w-5 h-5 text-brand-primary mb-2" />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold mb-4">What you'll learn</h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {course.learningOutcomes?.map((outcome, i) => (
                                                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                                    <Icon name="check" className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{outcome}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'curriculum' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xl font-bold">Course Content</h3>
                                        <span className="text-sm text-slate-500">{course.sections?.length || 1} Sections • {course.lessonsCount} Lectures</span>
                                    </div>
                                    <div>
                                        {course.sections?.map((section, index) => (
                                            <SectionItem key={index} section={section} index={index} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'instructor' && (
                                <div className="animate-fade-in">
                                     <div className="p-6 rounded-3xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/5 backdrop-blur-md flex flex-col sm:flex-row gap-6 items-start">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-brand-primary to-brand-secondary">
                                                <img src={course.author.avatar} alt={course.author.name} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-md">
                                                <Icon name="award" className="w-5 h-5 text-amber-500" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{course.author.name}</h3>
                                            <p className="text-brand-primary font-medium mb-3">{course.author.bio || 'Top Instructor'}</p>
                                            <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><Icon name="star-filled" className="w-4 h-4 text-amber-400" /> 4.8 Rating</span>
                                                <span className="flex items-center gap-1"><Icon name="users" className="w-4 h-4" /> {course.studentCount?.toLocaleString()} Students</span>
                                                <span className="flex items-center gap-1"><Icon name="play" className="w-4 h-4" /> {course.coursesAuthored || 5} Courses</span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                                {course.author.bio ? `${course.author.name} is a dedicated educator with a passion for simplified learning. Join thousands of students in mastering this subject.` : 'Expert instructor details coming soon.'}
                                            </p>
                                        </div>
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-28 space-y-6 animate-fade-in-down" style={{animationDelay: '0.2s'}}>
                             {/* Price Card */}
                            <div className="rounded-3xl p-6 bg-white/70 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-black/40 backdrop-blur-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total Price</h2>
                                <div className="flex items-end gap-3 mb-6">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">{price}</span>
                                    {course.originalPrice && (
                                        <span className="text-lg text-slate-400 line-through mb-1.5">{course.currency}{course.originalPrice}</span>
                                    )}
                                    {discount > 0 && (
                                        <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold mb-1.5">
                                            {discount}% OFF
                                        </span>
                                    )}
                                </div>

                                <button 
                                    onClick={onLoginClick}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <span>{course.isPaid ? 'Buy Now' : 'Enroll for Free'}</span>
                                    <Icon name="arrowRight" className="w-5 h-5" />
                                </button>
                                
                                <p className="text-center text-xs text-slate-500 mt-4">30-Day Money-Back Guarantee</p>
                            </div>

                            {/* Includes Card */}
                            <div className="rounded-3xl p-6 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 backdrop-blur-md">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">This course includes:</h3>
                                <ul className="space-y-3">
                                    {[
                                        { text: `${course.totalDuration} on-demand video`, icon: 'video' },
                                        { text: `${course.resources?.length || 5} downloadable resources`, icon: 'download' },
                                        { text: 'Full lifetime access', icon: 'infinity' },
                                        { text: 'Access on mobile and TV', icon: 'smartphone' },
                                        { text: 'Certificate of completion', icon: 'award' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                            <Icon name={item.icon} className="w-5 h-5 text-brand-primary flex-shrink-0" />
                                            <span>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                             {/* Share/Links for Mobile (Fixed Bottom) */}
                             <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 lg:hidden z-50 flex items-center gap-4">
                                 <div className="flex-1">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Price</p>
                                     <p className="text-xl font-black text-slate-900 dark:text-white">{price}</p>
                                 </div>
                                 <button 
                                    onClick={onLoginClick}
                                    className="px-8 py-3 rounded-xl bg-brand-primary text-white font-bold shadow-lg"
                                >
                                    {course.isPaid ? 'Buy' : 'Enroll'}
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoursePreview;
