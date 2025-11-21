


import React, { useState, useMemo } from 'react';
import { User, Course, Task } from '../types.ts';
import Icon from './common/Icon.tsx';

interface MyLearningsProps {
  user: User;
  courses: Course[];
  navigateToCourse: (course: Course) => void;
}

type Tab = 'courses' | 'wishlist' | 'tasks';

const CourseCard: React.FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
    <div
        onClick={onClick}
        className="interactive-card neon-border bg-white/80 dark:bg-slate-900/70 rounded-xl border border-white/40 dark:border-slate-700 overflow-hidden group cursor-pointer flex flex-col backdrop-blur-xl"
    >
        <div className="relative">
            <img src={course.thumbnailUrl ?? course.thumbnail} alt={course.title} className="w-full h-40 object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-2 right-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform-gpu group-hover:scale-110">
                <Icon name="play" className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-md text-gray-900 dark:text-white flex-grow mb-1">{course.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{course.author.name}</p>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mb-4">
                <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary h-1.5 rounded-full transition-all" style={{ width: `${course.progress}%` }}></div>
            </div>
            <span className="text-sm font-semibold text-brand-primary dark:text-brand-light mt-auto text-left uppercase tracking-wide">
                {course.progress > 0 ? 'Continue' : 'Start Course'}
            </span>
        </div>
    </div>
);

const TaskItem: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => (
    <div onClick={onClick} className="interactive-card bg-white/80 dark:bg-slate-900/70 rounded-xl p-4 flex items-center justify-between border border-white/50 dark:border-slate-700 cursor-pointer hover-gradient">
        <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{task.text}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-red-500">{task.dueDate}</span> - from: {task.courseTitle}
            </p>
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-slate-400" />
    </div>
);

const MyLearnings: React.FC<MyLearningsProps> = ({ user, courses, navigateToCourse }) => {
    const [activeTab, setActiveTab] = useState<Tab>('courses');
    const [searchTerm, setSearchTerm] = useState('');

    const ongoingCourses = useMemo(() => 
        user.ongoingCourses
            .map(id => courses.find(c => c.id === id))
            .filter((c): c is Course => !!c), 
        [user.ongoingCourses, courses]
    );

    const wishlistCourses = useMemo(() => 
        user.wishlist
            .map(id => courses.find(c => c.id === id))
            .filter((c): c is Course => !!c), 
        [user.wishlist, courses]
    );

    const filteredCourses = useMemo(() => {
        return ongoingCourses.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ongoingCourses, searchTerm]);

    const filteredWishlist = useMemo(() => {
        return wishlistCourses.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [wishlistCourses, searchTerm]);

    const filteredTasks = useMemo(() => {
        return user.pendingTasks.filter(task =>
            task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [user.pendingTasks, searchTerm]);
    
    const renderContent = () => {
        let content;
        let count = 0;
        switch (activeTab) {
            case 'courses':
                content = filteredCourses;
                count = content.length;
                break;
            case 'wishlist':
                content = filteredWishlist;
                count = content.length;
                break;
            case 'tasks':
                 content = filteredTasks;
                 count = content.length;
                 break;
            default:
                content = [];
        }

        if (count === 0) {
            return (
                <div className="text-center py-16">
                    <Icon name="search" className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                    <h3 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">No items found</h3>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        {searchTerm ? 'Try adjusting your search term.' : `Your ${activeTab} is empty.`}
                    </p>
                </div>
            )
        }
        
        if (activeTab === 'tasks') {
             return (
                <div className="space-y-4">
                    {(content as Task[]).map(task => {
                        const course = courses.find(c => c.id === task.courseId);
                        return course ? <TaskItem key={task.id} task={task} onClick={() => navigateToCourse(course)} /> : null;
                    })}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(content as Course[]).map(course => (
                    <CourseCard key={course.id} course={course} onClick={() => navigateToCourse(course)} />
                ))}
            </div>
        )
    };
    
    const TabButton: React.FC<{ tabId: Tab, label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 font-semibold text-sm rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 ${
                activeTab === tabId
                    ? 'bg-white dark:bg-slate-700 text-brand-primary shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-900/50'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">My Learning</h1>
                <p className="text-sm text-slate-500 dark:text-slate-300">A fluid, high-frame-rate hub for everything you are mastering.</p>
            </div>

            <div className="glass-ambient rounded-2xl p-4 sm:p-5 dark:bg-[var(--glass-dark)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-2 rounded-full bg-white/70 p-1 shadow-inner shadow-white/60 backdrop-blur-lg dark:bg-white/5 dark:shadow-brand-primary/20 self-start">
                        <TabButton tabId="courses" label="All Courses" />
                        <TabButton tabId="wishlist" label="Wishlist" />
                        <TabButton tabId="tasks" label="Pending Tasks" />
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <input
                            type="text"
                            placeholder="Search my content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none backdrop-blur"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Icon name="search" className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="animate-fade-in-up min-h-[400px]">
                {renderContent()}
            </div>
        </div>
    );
};

export default MyLearnings;