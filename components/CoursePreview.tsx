import React, { useState, useEffect, useMemo } from 'react';
import { Course, Lecture, CourseSection } from '../types.ts';
import Icon from './common/Icon.tsx';
import { LOGO_URL } from '../constants.ts';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

interface CoursePreviewProps {
  course: Course;
  onLoginClick: () => void;
  onBack: () => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
}

const getInitialLecture = (course: Course): Lecture | null => {
    return course.sections?.[0]?.lectures.find(l => l.isPreview) || course.sections?.[0]?.lectures[0] || null;
}

const SectionItem: React.FC<{ section: CourseSection, selectedLecture: Lecture | null, onSelectLecture: (lecture: Lecture) => void, onLockedClick: () => void }> = ({ section, selectedLecture, onSelectLecture, onLockedClick }) => {
    const [isOpen, setIsOpen] = useState(section.lectures.some(l => l.id === selectedLecture?.id));

    return (
        <div className="border-b border-slate-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left">
                <span className="font-bold text-white">{section.title}</span>
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className="w-5 h-5 text-slate-400" />
            </button>
            {isOpen && (
                <ul className="pb-2">
                    {section.lectures.map((lecture, index) => (
                        <li key={lecture.id}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    lecture.isPreview ? onSelectLecture(lecture) : onLockedClick();
                                }}
                                className={`flex items-start gap-4 p-4 text-sm transition-colors ${selectedLecture?.id === lecture.id ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                            >
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 font-mono text-xs mt-0.5">
                                    {lecture.isPreview ? <Icon name="play" className="w-3 h-3 text-white"/> : index + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <span>{lecture.title}</span>
                                      {lecture.isPreview && <span className="text-xs text-brand-secondary uppercase font-semibold">Preview</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                        {!lecture.isPreview && <Icon name="lock" className="w-3 h-3" />}
                                        <span>{lecture.duration}</span>
                                    </div>
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const FaqItem: React.FC<{ faq: { question: string; answer: string } }> = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-5 text-left font-semibold text-lg text-slate-800 dark:text-slate-100"
            >
                <span>{faq.question}</span>
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className={`w-5 h-5 transition-transform text-slate-500 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <p className="pb-5 text-slate-600 dark:text-slate-400">
                    {faq.answer}
                </p>
            </div>
        </div>
    );
};

const readWishlistFromStorage = (): string[] => {
    const storedWishlist = safeLocalStorage.get('wishlist');
    if (!storedWishlist) {
        return [];
    }

    try {
        const parsed = JSON.parse(storedWishlist);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Unable to parse wishlist from storage.', error);
        return [];
    }
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center text-yellow-400">
            {[...Array(fullStars)].map((_, i) => <Icon key={`full-${i}`} name="star-filled" className="w-5 h-5" />)}
            {halfStar && <Icon name="star-half" className="w-5 h-5" />}
            {[...Array(emptyStars)].map((_, i) => <Icon key={`empty-${i}`} name="star" className="w-5 h-5 text-slate-300 dark:text-slate-600" />)}
        </div>
    );
};


const CoursePreview: React.FC<CoursePreviewProps> = ({ course, onLoginClick, onBack, isDarkMode, setDarkMode }) => {
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(getInitialLecture(course));
    const [isWishlisted, setIsWishlisted] = useState(false);
    const isPaid = course.isPaid ?? !course.isFree;

    const formattedPrice = useMemo(() => {
        if (!isPaid) {
            return 'Included';
        }

        if (course.price == null) {
            return 'Premium';
        }

        const currency = course.currency ?? 'USD';

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                currencyDisplay: 'symbol',
                maximumFractionDigits: 2,
            }).format(course.price);
        } catch (error) {
            console.warn('Unable to format course price', error);
            return `${course.currency ?? '$'}${course.price}`;
        }
    }, [course.currency, course.price, isPaid]);

    const formattedOriginalPrice = useMemo(() => {
        if (!isPaid || course.originalPrice == null) {
            return null;
        }

        const currency = course.currency ?? 'USD';

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                currencyDisplay: 'symbol',
                maximumFractionDigits: 2,
            }).format(course.originalPrice);
        } catch (error) {
            console.warn('Unable to format original course price', error);
            return `${course.currency ?? '$'}${course.originalPrice}`;
        }
    }, [course.currency, course.originalPrice, isPaid]);

    const discount = useMemo(() => {
        if (!isPaid || course.price == null || course.originalPrice == null || course.originalPrice === 0) {
            return null;
        }

        const computed = Math.round(100 - (course.price / course.originalPrice) * 100);
        return Number.isFinite(computed) && computed > 0 ? computed : null;
    }, [course.originalPrice, course.price, isPaid]);

    const priceHelper = useMemo(() => {
        if (!isPaid) {
            return 'Access included with your membership.';
        }

        if (course.price == null) {
            return 'Pricing will appear once instructors publish their rate.';
        }

        if (course.currency) {
            return `Billed in ${course.currency.toUpperCase()} with secure checkout.`;
        }

        return 'Secure checkout with your saved payment method.';
    }, [course.currency, course.price, isPaid]);

    useEffect(() => {
        const wishlist = readWishlistFromStorage();
        setIsWishlisted(wishlist.includes(course.id));
    }, [course.id]);

    const toggleWishlist = () => {
        const wishlist = readWishlistFromStorage();
        const newWishlist = isWishlisted ? wishlist.filter((id: string) => id !== course.id) : [...wishlist, course.id];
        safeLocalStorage.set('wishlist', JSON.stringify(newWishlist));
        setIsWishlisted(!isWishlisted);
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            {/* Left Curriculum Panel */}
            <aside className="w-80 h-screen sticky top-0 bg-[#1e202e] text-white flex-col hidden lg:flex">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 h-20 flex-shrink-0">
                    <div className="flex items-center">
                        <img src={LOGO_URL} alt="Edusimulate Logo" className="h-8 mr-2" />
                        <span className="text-xl font-extrabold text-white tracking-tight">Edusimulate</span>
                    </div>
                     <button 
                        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                        onClick={() => setDarkMode(!isDarkMode)} 
                        className={`p-2 rounded-full transition-colors ${ isDarkMode ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-white'}`}
                      >
                        <Icon name={isDarkMode ? 'sun' : 'moon'} className="w-5 h-5 transition-transform duration-500 transform" style={{ transform: isDarkMode ? 'rotate(360deg)' : 'rotate(0deg)'}} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 border-b border-slate-700">
                        <button onClick={onBack} className="flex items-center text-sm text-slate-300 hover:text-white mb-2">
                            <Icon name="chevronLeft" className="w-4 h-4 mr-1" />
                            Back to courses
                        </button>
                        <h2 className="text-lg font-bold">{course.title}</h2>
                    </div>
                    <div>
                        {course.sections?.map(section => (
                            <SectionItem 
                                key={section.title} 
                                section={section}
                                selectedLecture={selectedLecture}
                                onSelectLecture={setSelectedLecture}
                                onLockedClick={onLoginClick}
                            />
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto">
                <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Center Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="aspect-w-16 aspect-h-9 relative group">
                                    <img src={course.thumbnailUrl ?? course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <button onClick={onLoginClick} aria-label="Play course preview" className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300">
                                            <Icon name="play" className="w-10 h-10 ml-1" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 p-4">
                                        <p className="text-white font-semibold text-shadow">{selectedLecture?.title || 'Course Introduction'}</p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img src={course.author.avatar} alt={course.author.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{course.author.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Publisher</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400">
                                    <button onClick={toggleWishlist} className={`flex items-center space-x-1.5 transition-colors ${isWishlisted ? 'text-red-500' : 'hover:text-red-500'}`}>
                                        <Icon name={isWishlisted ? 'heart-filled' : 'heart'} className="w-6 h-6" />
                                        <span className="font-semibold text-sm">982</span>
                                    </button>
                                    <button className="flex items-center space-x-1.5 hover:text-brand-primary">
                                        <Icon name="share" className="w-6 h-6" />
                                        <span className="font-semibold text-sm">Share</span>
                                    </button>
                                    <button className="hover:text-slate-800 dark:hover:text-slate-200">
                                        <Icon name="more-horizontal" className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Description</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{course.description}</p>
                            </div>

                             <div>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Course details</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"><span className="font-bold block">{course.lessonsCount}</span><span className="text-sm text-slate-500">Lessons</span></div>
                                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"><span className="font-bold block">{course.totalDuration}</span><span className="text-sm text-slate-500">Duration</span></div>
                                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"><span className="font-bold block">{course.skillLevel}</span><span className="text-sm text-slate-500">Skill level</span></div>
                                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"><span className="font-bold block">{course.views?.toLocaleString()}</span><span className="text-sm text-slate-500">Views</span></div>
                                </div>
                            </div>

                            {course.faqs && course.faqs.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Frequently asked questions</h2>
                                    <div>{course.faqs.map((faq, index) => <FaqItem key={index} faq={faq} />)}</div>
                                </div>
                            )}

                             <div>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Publisher</h2>
                                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="flex items-center space-x-4 mb-3">
                                        <img src={course.author.avatar} alt={course.author.name} className="w-16 h-16 rounded-full" />
                                        <div>
                                            <p className="font-bold text-xl text-slate-800 dark:text-slate-100">{course.author.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">3D Artist</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{course.author.bio}</p>
                                    <div className="flex space-x-6 text-sm">
                                        <div className="flex items-center"><Icon name="star" className="w-4 h-4 mr-1.5 text-yellow-500" />4.8 Instructor rating</div>
                                        <div className="flex items-center"><Icon name="award" className="w-4 h-4 mr-1.5 text-slate-500" />889 Reviews</div>
                                        <div className="flex items-center"><Icon name="profile" className="w-4 h-4 mr-1.5 text-slate-500" />4,887 Students</div>
                                        <div className="flex items-center"><Icon name="courses" className="w-4 h-4 mr-1.5 text-slate-500" />{course.author.coursesAuthored} Courses</div>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Right Column (Sticky) */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg space-y-4">
                                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{formattedPrice}</span>
                                        {formattedOriginalPrice && (
                                            <span className="text-lg text-slate-400 line-through">{formattedOriginalPrice}</span>
                                        )}
                                        {discount && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 text-xs font-semibold rounded-full">{discount}% OFF</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{priceHelper}</p>
                                    {course.includes && (
                                       <div>
                                            <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200">Course includes:</h3>
                                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                                {course.includes.map((item, index) => (
                                                    <li key={index} className="flex items-center space-x-3">
                                                        <Icon name={item.includes('video') ? 'video' : item.includes('Article') ? 'file-text' : item.includes('resource') ? 'download' : 'smartphone'} className="w-4 h-4 text-slate-500" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="space-y-3 pt-2">
                                        <button
                                            onClick={onLoginClick}
                                            className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-violet-700 transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-brand-primary/30"
                                        >
                                            {isPaid ? 'Add to cart' : 'Start learning'}
                                        </button>
                                        {isPaid && (
                                            <button
                                                onClick={onLoginClick}
                                                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                                            >
                                                Buy now
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">30-Day Money-Back Guarantee</p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                   <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Rating</h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                            <span className="w-10 h-10 bg-yellow-400/20 text-yellow-500 dark:text-yellow-300 rounded-full flex items-center justify-center font-bold text-lg">{course.rating}</span>
                                            <StarRating rating={course.rating ?? 0} />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{course.studentCount?.toLocaleString()} Students</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoursePreview;