
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
  onProfileUpdate: (updates: Partial<User>) => void;
}

const Toast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="glass-reflection flex items-center gap-3 px-6 py-3 rounded-full bg-white/90 dark:bg-slate-800/90 border border-white/40 dark:border-slate-700 shadow-2xl backdrop-blur-md text-slate-800 dark:text-white">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md">
          <Icon name="check" className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-wide">{message}</span>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: string; 
    label: string 
}> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-300 rounded-full ${
            active 
                ? 'text-white bg-gradient-to-r from-brand-primary to-brand-secondary shadow-lg shadow-brand-primary/30 scale-105' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-brand-primary dark:hover:text-white'
        }`}
    >
        <Icon name={icon} className={`w-4 h-4 ${active ? 'text-white' : ''}`} />
        {label}
    </button>
);

const SectionItem: React.FC<{ section: any; index: number }> = ({ section, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);

    return (
        <div className="border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:hover:bg-slate-800/60 mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-5 text-left transition-colors hover:bg-white/40 dark:hover:bg-white/5"
            >
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${isOpen ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {String(index + 1).padStart(2, '0')}
                   </div>
                   <div>
                        <span className="block text-base font-bold text-slate-900 dark:text-slate-100">{section.title}</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{section.lectures.length} lectures</span>
                   </div>
                </div>
                <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100 dark:bg-slate-700' : ''}`}>
                    <Icon name="chevronDown" className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
            </button>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="p-2 pb-4 space-y-1">
                    {section.lectures.map((lecture: Lecture, idx: number) => (
                        <li key={lecture.id} className="group flex items-center gap-3 p-3 mx-3 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 transition-all cursor-default border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm">
                            <div className={`p-2 rounded-lg ${lecture.isPreview ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                <Icon name={lecture.isPreview ? 'play' : 'lock'} className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-brand-primary transition-colors">{lecture.title}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-500">{lecture.duration}</span>
                            </div>
                            {lecture.isPreview && (
                                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary bg-brand-secondary/10 rounded-md">
                                    Preview
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const CoursePreview: React.FC<CoursePreviewProps> = ({ course, onLoginClick, onBack, isDarkMode, setDarkMode, user, onProfileUpdate }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor'>('overview');
    
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [couponCode, setCouponCode] = useState('');

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) return;
        setToastMessage(`Coupon "${couponCode}" applied!`);
        setShowCouponInput(false);
        setCouponCode('');
        setShowToast(true);
    };

    // Handle post-login toast
  useEffect(() => {
    if (location.state && (location.state as any).showWishlistToast) {
      setToastMessage(`(${course.title}) added to wishlist`);
      setShowToast(true);
      setIsWishlisted(true); // Optimistically set true
      // Clear state to prevent showing on reload
      window.history.replaceState({}, document.title);
    }
    }, [location, course.title]);

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
        message = `(${course.title}) added to wishlist`;
        setIsWishlisted(true);
      }

            setToastMessage(message);
            setShowToast(true);
            
            // Optimistic update handled by local state, sync DB in background
            await updateUserProfile(user.uid, { wishlist: updatedWishlist });
            
            if (onProfileUpdate) {
                onProfileUpdate({ wishlist: updatedWishlist });
            }
            
        } catch (error) {
            console.error("Wishlist update failed", error);
            setToastMessage('Something went wrong');
            setShowToast(true);
            setIsWishlisted(!isWishlisted); // Revert on error
        }
    };

    const handleEnroll = async () => {
        if (!user) {
            safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
            onLoginClick();
            return;
        }

        const alreadyEnrolled = user.enrolledCourses.includes(course.id) || user.ongoingCourses.includes(course.id);

        if (!alreadyEnrolled) {
            const updatedOngoingCourses = [...user.ongoingCourses, course.id];
            const updatedEnrolledCourses = [...user.enrolledCourses, course.id];

            try {
                await updateUserProfile(user.uid, {
                    ongoingCourses: updatedOngoingCourses,
                    enrolledCourses: updatedEnrolledCourses,
                });

                onProfileUpdate({
                    ongoingCourses: updatedOngoingCourses,
                    enrolledCourses: updatedEnrolledCourses,
                });

                setToastMessage(`Enrolled in ${course.title}`);
                setShowToast(true);
            } catch (error) {
                console.error('Failed to enroll user', error);
            }
        }

        navigate(`/courses/${course.id}`);
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
    const discount = course.originalPrice && course.price ? Math.round(100 - (course.price / course.originalPrice) * 100) : 0;

    return (
        <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 overflow-x-hidden transition-colors duration-500 bg-slate-50 dark:bg-slate-950 selection:bg-brand-primary/30">
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-400/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[20%] right-[0%] w-[40%] h-[60%] bg-brand-primary/10 dark:bg-brand-primary/10 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-0 left-[20%] w-[60%] h-[40%] bg-teal-400/10 dark:bg-teal-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/30 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors">
                                <Icon name="arrowLeft" className="w-5 h-5" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2">
                                <img src={LOGO_URL} alt="Logo" className="h-8 w-auto" />
                                <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">Edusimulate</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary transition-all">
                                <Icon name={isDarkMode ? 'sun' : 'moon'} className="w-5 h-5" />
                            </button>
                            {user ? (
                                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-semibold hidden sm:block">{user.name}</span>
                                    <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                                </div>
                            ) : (
                                <button onClick={onLoginClick} className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:scale-105 transition-transform shadow-lg shadow-slate-900/20">
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            <div className="relative z-10 pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 animate-fade-in">
                    <span onClick={onBack} className="cursor-pointer hover:text-brand-primary">Home</span>
                    <Icon name="chevronRight" className="w-3 h-3" />
                    <span className="cursor-pointer hover:text-brand-primary">{course.category}</span>
                    <Icon name="chevronRight" className="w-3 h-3" />
                    <span className="text-slate-800 dark:text-white font-medium truncate max-w-[200px] sm:max-w-none">{course.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Content */}
                    <div className="lg:col-span-2 space-y-8 animate-fade-in-up">
                        {/* Hero Section */}
                        <div className="space-y-4">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                {course.headline || course.subtitle || course.description.slice(0, 150) + '...'}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium">
                                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                                    <Icon name="star-filled" className="w-4 h-4" />
                                    <span>{course.rating || '4.8'}</span>
                                    <span className="opacity-60">({course.reviewCount || 450})</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                    <Icon name="users" className="w-4 h-4" />
                                    <span>{course.studentCount?.toLocaleString() || '1.2k'} students</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                    <Icon name="globe" className="w-4 h-4" />
                                    <span>{course.language || 'English'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                    <Icon name="refreshCw" className="w-4 h-4" />
                                    <span>Updated {course.lastUpdated || 'Recently'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Video Player */}
                        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-brand-primary/10 border border-slate-200 dark:border-slate-700 bg-black relative aspect-video group">
                            <GlassPreviewPlayer
                                videoUrl={previewVideoSource}
                                poster={previewPoster}
                                title={course.title}
                                caption="Course Preview"
                            />
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200 dark:border-slate-700/50">
                            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="file-text" label="Overview" />
                            <TabButton active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')} icon="courses" label="Curriculum" />
                            <TabButton active={activeTab === 'instructor'} onClick={() => setActiveTab('instructor')} icon="users" label="Instructor" />
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <h3 className="text-xl font-bold mb-4">About this course</h3>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{course.longDescription || course.description}</p>
                                    </div>

                                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700/50 backdrop-blur-sm">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Icon name="target" className="w-5 h-5 text-brand-primary" />
                                            What you'll learn
                                        </h3>
                                        <ul className="grid sm:grid-cols-2 gap-3">
                                            {(course.learningOutcomes || ['Master core concepts', 'Build real-world projects', 'Advanced techniques', 'Industry best practices']).map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                                    <Icon name="check" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold mb-4">Requirements</h3>
                                        <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300 text-sm marker:text-brand-primary">
                                            {(course.requirements || ['No prior experience required', 'A computer with internet access']).map((req, idx) => (
                                                <li key={idx}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'curriculum' && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="flex justify-between items-end mb-4">
                                        <h3 className="text-xl font-bold">Course Content</h3>
                                        <span className="text-sm text-slate-500">{course.sections?.length || 1} sections • {course.lessonsCount || course.lectures.length} lectures • {course.totalDuration || '10h 30m'} total</span>
                                    </div>
                                    {(course.sections || [{ title: 'Getting Started', lectures: course.lectures }]).map((section, idx) => (
                                        <SectionItem key={idx} section={section} index={idx} />
                                    ))}
                                </div>
                            )}

                            {activeTab === 'instructor' && (
                                <div className="animate-fade-in">
                                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-700/50 backdrop-blur-sm flex flex-col sm:flex-row gap-6 items-start">
                                        <img 
                                            src={course.author.avatar} 
                                            alt={course.author.name} 
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                                        />
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{course.author.name}</h3>
                                                <p className="text-brand-primary font-medium">{course.author.bio || 'Lead Instructor & Expert'}</p>
                                            </div>
                                            <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><Icon name="star" className="w-4 h-4" /> {course.author.rating || '4.9'} Instructor Rating</span>
                                                <span className="flex items-center gap-1"><Icon name="users" className="w-4 h-4" /> {course.author.totalStudents?.toLocaleString() || '25,000'} Students</span>
                                                <span className="flex items-center gap-1"><Icon name="play" className="w-4 h-4" /> {course.author.coursesAuthored || 12} Courses</span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                                {course.author.bio || "I'm a passionate instructor with over 10 years of experience in the industry. My goal is to make complex topics easy to understand and help you achieve your career goals through practical, hands-on learning."}
                                            </p>
                                            <div className="pt-2 flex gap-3">
                                                <button className="text-xs font-bold uppercase tracking-wider border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">View Profile</button>
                                                <button className="text-xs font-bold uppercase tracking-wider border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Website</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="glass-reflection bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                                {/* Decorative glow behind card */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl -z-10"></div>

                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <div className="flex items-end gap-3">
                                            <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                                {price}
                                            </span>
                                            {discount > 0 && (
                                                <>
                                                    <span className="text-lg text-slate-400 line-through font-medium mb-1">
                                                        ${course.originalPrice}
                                                    </span>
                                                    <span className="text-sm font-bold text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg mb-1">
                                                        {discount}% OFF
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {discount > 0 && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                                                <Icon name="clock" className="w-3.5 h-3.5" />
                                                <span className="animate-pulse">Offer ends in 5 hours!</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleEnroll}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-lg shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 group"
                                        >
                                            {user ? 'Enroll Now' : 'Join to Enroll'}
                                            <Icon name="arrowRight" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        
                                        <div className="grid grid-cols-5 gap-3">
                                            <button 
                                                onClick={handleWishlist}
                                                className={`col-span-4 py-3 rounded-xl border font-semibold transition-all flex items-center justify-center gap-2 ${isWishlisted 
                                                    ? 'border-red-200 bg-red-50 text-red-500 dark:bg-red-900/20 dark:border-red-800' 
                                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
                                            >
                                                <Icon name={isWishlisted ? 'heart-filled' : 'heart'} className={`w-5 h-5 ${isWishlisted ? 'animate-scale-in' : ''}`} />
                                                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                                            </button>
                                            <button 
                                                onClick={handleShare}
                                                className="col-span-1 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                                            >
                                                <Icon name="share" className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Coupon Code Section */}
                                        <div className="pt-2">
                                            {!showCouponInput ? (
                                                <button 
                                                    onClick={() => setShowCouponInput(true)}
                                                    className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-semibold hover:border-brand-primary hover:text-brand-primary dark:hover:border-brand-primary dark:hover:text-brand-primary transition-all duration-300 flex justify-center items-center gap-2 group"
                                                >
                                                    <Icon name="ticket" className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                                    Apply Coupon Code
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 animate-fade-in">
                                                    <div className="relative flex-1">
                                                        <input 
                                                            type="text" 
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                            placeholder="Enter code"
                                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all uppercase placeholder:normal-case"
                                                            autoFocus
                                                        />
                                                        <Icon name="ticket" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    </div>
                                                    <button 
                                                        onClick={handleApplyCoupon}
                                                        className="p-2.5 bg-brand-primary text-white rounded-xl shadow-lg hover:shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                                        disabled={!couponCode.trim()}
                                                    >
                                                        <Icon name="check" className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowCouponInput(false)}
                                                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        <Icon name="x" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white mb-3">This course includes:</p>
                                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                            {[
                                                { icon: 'video', text: `${course.totalDuration || '12 hours'} on-demand video` },
                                                { icon: 'file', text: `${course.resources?.length || 5} downloadable resources` },
                                                { icon: 'smartphone', text: 'Access on mobile and TV' },
                                                { icon: 'infinity', text: 'Full lifetime access' },
                                                { icon: 'award', text: 'Certificate of completion' },
                                            ].map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <Icon name={feature.icon} className="w-4 h-4 text-slate-400" />
                                                    <span>{feature.text}</span>
                                                </li>
                                            ))}
                                        </ul>
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
