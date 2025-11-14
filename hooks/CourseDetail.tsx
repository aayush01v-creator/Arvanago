

import React from 'react';
import { Course, Lecture } from '../types.ts';
import Icon from '../components/common/Icon.tsx';

interface CourseDetailProps {
  course: Course;
  navigateToLecture: (course: Course, lecture: Lecture) => void;
}

const LectureItem: React.FC<{ lecture: Lecture; index: number; onClick: () => void }> = ({ lecture, index, onClick }) => (
  <li
    onClick={onClick}
    className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-300 bg-white dark:bg-gray-800 hover:bg-brand-light dark:hover:bg-gray-700 border border-slate-100 dark:border-slate-700 hover:shadow-md transform hover:-translate-y-1 group"
  >
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${lecture.isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'} text-white font-bold transition-colors duration-300 group-hover:bg-brand-primary`}>
        {lecture.isCompleted ? <Icon name="check" className="w-6 h-6" /> : <span className="text-slate-600 dark:text-slate-200 group-hover:text-white">{index + 1}</span>}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{lecture.title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{lecture.duration}</p>
      </div>
    </div>
    <Icon name="play" className="w-6 h-6 text-brand-primary group-hover:animate-pulse" />
  </li>
);

const CourseDetail: React.FC<CourseDetailProps> = ({ course, navigateToLecture }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img className="h-48 w-full object-cover md:w-64" src={course.thumbnail} alt={course.title} />
          </div>
          <div className="p-8 flex-1">
            <div className="uppercase tracking-wide text-sm text-brand-primary font-semibold">{course.category}</div>
            <h1 className="block mt-1 text-3xl leading-tight font-extrabold text-gray-900 dark:text-white">{course.title}</h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{course.description}</p>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course Progress</span>
                <span className="text-sm font-medium text-brand-primary">{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2.5 rounded-full animate-pan-bg" 
                  style={{ width: `${course.progress}%`, backgroundSize: '200% 100%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Lectures</h2>
        <ul className="space-y-4">
          {course.lectures.map((lecture, index) => (
            <LectureItem key={lecture.id} lecture={lecture} index={index} onClick={() => navigateToLecture(course, lecture)} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseDetail;