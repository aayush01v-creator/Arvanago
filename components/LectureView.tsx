
import React, { useState } from 'react';
import { Course, Lecture, User, CourseSection, Comment, DownloadableResource } from '../types.ts';
import Icon from './common/Icon.tsx';
import AiAssistant from './AiAssistant.tsx';

interface LectureViewProps {
  user: User;
  course: Course;
  lecture: Lecture;
  onBack: () => void;
  onExit: () => void;
}

const LectureHeader: React.FC<{ user: User, onExit: () => void }> = ({ user, onExit }) => (
    <header className="flex-shrink-0 bg-white dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center space-x-4">
            <button onClick={onExit}>
                <Icon name="cube" className="w-7 h-7 text-brand-primary" />
            </button>
            <h1 className="font-bold text-lg hidden sm:block text-slate-800 dark:text-white">Creative Mind Academy</h1>
            <nav className="hidden md:flex items-center space-x-6 ml-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <a href="#" onClick={e => e.preventDefault()} className="hover:text-brand-primary">Courses</a>
                <a href="#" onClick={e => e.preventDefault()} className="hover:text-brand-primary">Tutorials</a>
                <a href="#" onClick={e => e.preventDefault()} className="hover:text-brand-primary">Livestreams</a>
                <a href="#" onClick={e => e.preventDefault()} className="hover:text-brand-primary">Subscription</a>
            </nav>
        </div>
        <div className="flex items-center space-x-4">
            <div className="relative">
                <Icon name="search" className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search..." className="bg-slate-100 dark:bg-slate-800 rounded-full pl-10 pr-4 py-2 w-40 sm:w-64 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition" />
            </div>
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full" />
        </div>
    </header>
);

const CurriculumSidebar: React.FC<{
    course: Course;
    currentLecture: Lecture;
    onSelectLecture: (lecture: Lecture) => void;
}> = ({ course, currentLecture, onSelectLecture }) => {
    const [openSection, setOpenSection] = useState(() =>
        course.sections?.find(s => s.lectures.some(l => l.id === currentLecture.id))?.title || course.sections?.[0]?.title
    );

    const getLectureIcon = (lecture: Lecture) => {
        if (lecture.isCompleted) return 'check-circle';
        // if (lecture.id === currentLecture.id) return 'play'; // Could add this for more dynamic state
        return 'circle';
    };
    
    return (
        <aside className="w-[340px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            {course.sections?.map((section) => {
                // FIX: Check if all lectures in a section are completed to determine section's completed status.
                const isSectionCompleted = section.lectures.length > 0 && section.lectures.every(l => l.isCompleted);
                return (
                <div key={section.title} className="border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setOpenSection(openSection === section.title ? null : section.title)} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-brand-primary">
                                {section.progress || 0}%
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">{section.title}</h3>
                                {isSectionCompleted && <p className="text-xs text-green-500">Completed</p>}
                            </div>
                        </div>
                        <Icon name={openSection === section.title ? 'chevronUp' : 'chevronDown'} className="w-5 h-5 text-slate-400" />
                    </button>
                    {openSection === section.title && (
                        <div className="p-4 relative">
                           <div className="absolute left-[30px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                           <ul className="space-y-2">
                               {section.lectures.map(lecture => (
                                   <li key={lecture.id}>
                                       <a href="#" onClick={(e) => {e.preventDefault(); onSelectLecture(lecture)}} className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${currentLecture.id === lecture.id ? 'bg-brand-light dark:bg-brand-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
                                           <div className="relative z-10 mt-1">
                                               <Icon name={getLectureIcon(lecture)} className={`w-5 h-5 ${lecture.isCompleted ? 'text-orange-500' : 'text-slate-400'} ${currentLecture.id === lecture.id ? 'text-orange-500' : ''}`} />
                                           </div>
                                           <div className="flex-1">
                                                <p className={`font-medium text-sm ${currentLecture.id === lecture.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{lecture.title}</p>
                                                <p className="text-xs text-slate-500">{lecture.duration}</p>
                                           </div>
                                       </a>
                                   </li>
                               ))}
                           </ul>
                        </div>
                    )}
                </div>
            )})}
        </aside>
    );
};

const InfoSidebar: React.FC<{ course: Course }> = ({ course }) => (
    <aside className="w-80 flex-shrink-0 space-y-6 hidden lg:block">
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Lecture Details</h3>
            <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Lecture Type</span> <span className="font-semibold text-slate-700 dark:text-slate-200">{course.lectureType}</span></li>
                <li className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Skills Level</span> <span className="font-semibold text-slate-700 dark:text-slate-200">{course.skillLevel}</span></li>
                <li className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Duration</span> <span className="font-semibold text-slate-700 dark:text-slate-200">{course.totalDuration}</span></li>
                <li className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Critique Session</span> <span className="font-semibold text-slate-700 dark:text-slate-200">{course.critiqueSession}</span></li>
            </ul>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex space-x-1 mb-4 border-b border-slate-200 dark:border-slate-700">
                <button className="flex-1 pb-2 text-sm font-semibold border-b-2 border-slate-800 dark:border-white text-slate-800 dark:text-white"><Icon name="file-text" className="w-4 h-4 mr-2 inline-block" />Overview</button>
                <button className="flex-1 pb-2 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"><Icon name="users" className="w-4 h-4 mr-2 inline-block" />Instructors</button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Course by <a href="#" className="text-orange-500 font-semibold">{course.author.name}</a> in <a href="#" className="font-semibold text-slate-700 dark:text-slate-200">{course.category}</a></p>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-3">{course.title}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
                {course.tags?.map(tag => (
                    <span key={tag} className="text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300 px-2 py-1 rounded-md">{tag}</span>
                ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{course.description}</p>
            <h4 className="font-semibold text-sm mb-2 text-slate-800 dark:text-white">The course will have five stages:</h4>
            <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                {course.sections?.map(s => (
                    <li key={s.title} className="flex items-center"><Icon name="check" className="w-4 h-4 mr-2 text-orange-500" />{s.title.replace('Stage ' + s.title.split(':')[0].slice(-1) + ': ', '')}</li>
                ))}
            </ul>
        </div>
    </aside>
);

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
    <div className="flex items-start space-x-4">
        <img src={comment.user.avatar} alt={comment.user.name} className="w-10 h-10 rounded-full" />
        <div className="flex-1">
            <div className="flex items-baseline space-x-2">
                <p className="font-semibold text-slate-800 dark:text-white">{comment.user.name}</p>
                <p className="text-xs text-slate-500">{comment.timestamp}</p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{comment.text}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                <button className="hover:text-brand-primary">Like</button>
                <button className="hover:text-brand-primary">Reply</button>
            </div>
            {comment.replies?.map(reply => (
                <div key={reply.id} className="mt-4 flex items-start space-x-4">
                     <img src={reply.user.avatar} alt={reply.user.name} className="w-8 h-8 rounded-full" />
                     <div className="flex-1">
                        <div className="flex items-baseline space-x-2">
                            <p className="font-semibold text-sm text-slate-800 dark:text-white">{reply.user.name}</p>
                            <p className="text-xs text-slate-500">{reply.timestamp}</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{reply.text}</p>
                     </div>
                </div>
            ))}
        </div>
    </div>
);

const LectureView: React.FC<LectureViewProps> = ({ user, course, lecture, onBack, onExit }) => {
    const [currentLecture, setCurrentLecture] = useState(lecture);
    const [activeTab, setActiveTab] = useState<'comments' | 'downloads'>('comments');
    const [isAssistantOpen, setAssistantOpen] = useState(false);
    
    const sectionTitle = course.sections?.find(s => s.lectures.some(l => l.id === currentLecture.id))?.title || 'Lesson';

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900/50 font-sans">
            <LectureHeader user={user} onExit={onExit} />
            <div className="flex-1 flex overflow-hidden">
                <CurriculumSidebar course={course} currentLecture={currentLecture} onSelectLecture={setCurrentLecture} />
                <main className="flex-1 flex gap-6 p-6 overflow-y-auto">
                    <div className="flex-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
                            <div className="aspect-w-16 aspect-h-9">
                                <iframe
                                    src={currentLecture.videoUrl}
                                    title={currentLecture.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full rounded-xl"
                                ></iframe>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{sectionTitle}</p>
                            <h2 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{currentLecture.title}</h2>
                        </div>
                        
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                             <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'border-b-2 border-slate-800 dark:border-white text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
                                <Icon name="message-circle" className="w-4 h-4 mr-2 inline-block" /> Comments ({course.comments?.length || 0})
                            </button>
                             <button onClick={() => setActiveTab('downloads')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'downloads' ? 'border-b-2 border-slate-800 dark:border-white text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
                                <Icon name="download" className="w-4 h-4 mr-2 inline-block" /> Downloads ({course.resources?.length || 0})
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            {activeTab === 'comments' ? (
                                <div className="space-y-6">
                                    {course.comments?.map(comment => <CommentItem key={comment.id} comment={comment} />)}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {course.resources?.map(res => (
                                        <li key={res.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <Icon name={res.type === 'PDF' ? 'file-text' : 'download'} className="w-5 h-5 text-slate-500" />
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{res.name}</p>
                                                    <p className="text-xs text-slate-500">{res.type} - {res.size}</p>
                                                </div>
                                            </div>
                                            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                                <Icon name="download" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="w-80 flex-shrink-0">
                         <div className="sticky top-6">
                            <InfoSidebar course={course} />
                         </div>
                    </div>
                </main>
            </div>
            <button
              type="button"
              aria-label="Open AI Assistant"
              onClick={() => setAssistantOpen(true)}
              className="fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 active:scale-95 z-20 bg-brand-primary/80 dark:bg-brand-primary/70 backdrop-blur-md border border-white/20 shadow-lg shadow-brand-primary/50 dark:shadow-brand-primary/40 animate-glow hover:shadow-brand-primary/60"
            >
              <Icon name="bot" className="w-8 h-8" />
            </button>
            {isAssistantOpen && (
                <AiAssistant
                    lectureTitle={currentLecture.title}
                    lectureSummary={currentLecture.summary}
                    onClose={() => setAssistantOpen(false)}
                />
            )}
        </div>
    );
};

export default LectureView;