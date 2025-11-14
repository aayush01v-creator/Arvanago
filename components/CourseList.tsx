import React, { useEffect, useMemo, useState } from 'react';
import { Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import SkeletonCard from './common/SkeletonCard.tsx';

interface CourseListProps {
  courses: Course[];
  navigateToCourse: (course: Course) => void;
  initialCategory?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

interface UnlockModalProps {
  course: Course;
  onClose: () => void;
  onUnlock: (course: Course) => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ course, onClose, onUnlock }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = () => {
    if (code.trim() === '') {
      setError('Please enter an access code.');
      return;
    }

    // In a real app, this would be a network request to validate the code.
    // For this simulation, any code works.
    setError('');
    onUnlock(course);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Unlock Course</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>
        <p className="mb-2 text-gray-600 dark:text-gray-300">Enter the access code for:</p>
        <h3 className="text-lg font-semibold text-brand-primary mb-6">{course.title}</h3>

        <input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) {
              setError('');
            }
          }}
          placeholder="Enter access code"
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-lg outline-none transition"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          onClick={handleUnlock}
          className="w-full mt-6 bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-secondary transition-all duration-300 shadow-lg hover:shadow-brand-primary/50 transform hover:scale-105 active:scale-95"
        >
          Unlock Now
        </button>
      </div>
    </div>
  );
};

const CourseCard: React.FC<{ course: Course; onCardClick: () => void; onUnlockClick: () => void }> = ({
  course,
  onCardClick,
  onUnlockClick,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
    <div className="relative overflow-hidden">
      <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-black/20"></div>
      <div className={`absolute top-3 right-3 px-3 py-1 text-sm font-semibold rounded-full text-white ${course.isFree ? 'bg-green-500' : 'bg-red-500'} shadow-md`}>
        {course.isFree ? 'Free' : 'Paid'}
      </div>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <span className="text-xs font-semibold text-brand-primary dark:text-purple-400 uppercase">{course.category}</span>
      <h3 className="font-bold text-xl mt-1 text-gray-900 dark:text-white flex-grow">{course.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 mb-4">{course.description}</p>
      {course.isFree ? (
        <button
          onClick={onCardClick}
          className="mt-auto w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-brand-primary/40"
        >
          Start Learning
        </button>
      ) : (
        <button
          onClick={onUnlockClick}
          className="mt-auto w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center transform hover:scale-105 active:scale-95"
        >
          <Icon name="lock" className="w-4 h-4 mr-2" />
          Unlock Course
        </button>
      )}
    </div>
  </div>
);

const CourseList: React.FC<CourseListProps> = ({
  courses,
  navigateToCourse,
  initialCategory = 'All',
  isLoading = false,
  errorMessage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [unlockingCourse, setUnlockingCourse] = useState<Course | null>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(courses.map(course => course.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'All') {
      return courses;
    }

    return courses.filter(course => course.category === selectedCategory);
  }, [selectedCategory, courses]);

  const handleUnlock = (course: Course) => {
    // In real app, you'd update the user's unlocked courses state
    console.log(`Unlocking ${course.title}`);
    navigateToCourse(course);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explore Courses</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Find your next learning adventure.</p>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap transform hover:-translate-y-0.5 active:scale-95 ${
              selectedCategory === category
                ? 'bg-brand-primary text-white shadow-lg'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow border border-slate-200 dark:border-slate-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
        ) : errorMessage ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-red-200 dark:border-red-900/60 text-center">
            <Icon name="alert-triangle" className="w-12 h-12 text-red-400 dark:text-red-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Something went wrong</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">{errorMessage}</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onCardClick={() => navigateToCourse(course)}
              onUnlockClick={() => setUnlockingCourse(course)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
            <Icon name="search" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No courses available</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              We couldn&apos;t find any courses for the selected category. Please try a different category or check back later.
            </p>
          </div>
        )}
      </div>

      {unlockingCourse && (
        <UnlockModal course={unlockingCourse} onClose={() => setUnlockingCourse(null)} onUnlock={handleUnlock} />
      )}
    </div>
  );
};

export default CourseList;
