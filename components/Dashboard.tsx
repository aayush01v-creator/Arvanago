
import React, { memo, useMemo } from 'react';
import { User, Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import { useScrollAnimation } from '../hooks/useScrollAnimation.ts';

interface DashboardProps {
  user: User;
  courses: Course[];
  navigateToFilteredCourses: (category: string) => void;
  navigateToCourse: (course: Course) => void;
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
  delay?: number;
}

const StatCardComponent: React.FC<StatCardProps> = ({ icon, value, label, color, delay = 0 }) => {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex items-center shadow-md dark:shadow-dark-glow border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-dark-glow-hover dark:hover:border-brand-primary/30 scroll-animate"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`p-4 rounded-full mr-5 ${color}`}>
        <Icon name={icon} className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
};

const StatCard = memo(StatCardComponent);

interface DashboardCourseCardProps {
  course: Course;
  navigateToCourse: (course: Course) => void;
}

const DashboardCourseCardComponent: React.FC<DashboardCourseCardProps> = ({ course, navigateToCourse }) => {
  const ref = useScrollAnimation();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-dark-glow border border-slate-100 dark:border-slate-700 overflow-hidden group transition-all duration-300 hover:shadow-xl dark:hover:shadow-dark-glow-hover hover:-translate-y-1 scroll-animate flex flex-col" ref={ref}>
      <img
        src={course.thumbnailUrl ?? course.thumbnail}
        alt={course.title}
        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate flex-grow">{course.title}</h3>
        <div className="mt-4 mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-xs font-medium text-brand-primary">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${course.progress}%` }} />
          </div>
        </div>
        <button
          onClick={() => navigateToCourse(course)}
          className="w-full bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-light font-semibold py-2 px-4 rounded-lg hover:bg-brand-secondary/20 dark:hover:bg-brand-primary/40 transition-all duration-300 transform active:scale-95"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
};

const DashboardCourseCard = memo(DashboardCourseCardComponent);

interface CategoryCardProps {
  category: { name: string; icon: string; color: string };
  navigateToFilteredCourses: (category: string) => void;
}

const CategoryCardComponent: React.FC<CategoryCardProps> = ({ category, navigateToFilteredCourses }) => {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      onClick={() => navigateToFilteredCourses(category.name)}
      className="flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-dark-glow border border-slate-100 dark:border-slate-700 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-dark-glow-hover dark:hover:border-brand-primary/30 scroll-animate"
    >
      <div className={`p-4 rounded-full mb-3 transition-all duration-300 ${category.color} group-hover:brightness-110 dark:group-hover:bg-opacity-80`}>
        <Icon name={category.icon} className="w-8 h-8 text-white" />
      </div>
      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{category.name}</p>
    </div>
  );
};

const CategoryCard = memo(CategoryCardComponent);

const CATEGORY_DETAILS = [
  { name: 'NEET', icon: 'neet', color: 'bg-red-500' },
  { name: 'IIT JEE', icon: 'iit', color: 'bg-blue-500' },
  { name: 'School Preparation', icon: 'school', color: 'bg-green-500' },
  { name: 'UPSC', icon: 'upsc', color: 'bg-purple-500' },
  { name: 'Govt Job Exams', icon: 'government', color: 'bg-yellow-500' },
  { name: 'Defence', icon: 'defence', color: 'bg-indigo-500' },
] as const;

const Dashboard: React.FC<DashboardProps> = ({ user, courses, navigateToFilteredCourses, navigateToCourse }) => {
  const welcomeRef = useScrollAnimation();
  const continueLearningRef = useScrollAnimation();
  const exploreRef = useScrollAnimation();

  const ongoingCourses = useMemo(() => 
    user.ongoingCourses
      .map(courseId => courses.find(c => c.id === courseId))
      .filter((c): c is Course => !!c), 
    [user.ongoingCourses, courses]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-10">
      {/* Header */}
      <div ref={welcomeRef} className="scroll-animate">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Welcome back, <span className="text-brand-primary dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.7)]">{user.name.split(' ')[0]}</span>!
        </h1>
        <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Let's make today a productive day.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon="star" value={user.points.toLocaleString()} label="Points Earned" color="bg-yellow-400" />
        <StatCard icon="flame" value={`${user.streak} Days`} label="Learning Streak" color="bg-red-500" delay={100}/>
        <StatCard icon="check" value="8" label="Courses Completed" color="bg-green-500" delay={200}/>
      </div>

      {/* Ongoing Courses */}
      <div ref={continueLearningRef} className="scroll-animate">
        <h2 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-slate-100 dark:to-slate-300 dark:bg-clip-text dark:text-transparent mb-5">Continue Learning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ongoingCourses.length > 0 ? (
            ongoingCourses.map((course) => (
              <DashboardCourseCard key={course.id} course={course} navigateToCourse={navigateToCourse} />
            ))
          ) : (
             <div className="col-span-full text-center py-10 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-gray-500 dark:text-gray-400">You have no ongoing courses. Time to explore!</p>
             </div>
          )}
        </div>
      </div>

      {/* Explore Categories */}
      <div ref={exploreRef} className="scroll-animate">
        <h2 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-slate-100 dark:to-slate-300 dark:bg-clip-text dark:text-transparent mb-5">Explore Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {CATEGORY_DETAILS.map(cat => (
            <CategoryCard key={cat.name} category={cat} navigateToFilteredCourses={navigateToFilteredCourses} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;