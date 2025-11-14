
// FIX: Use compat version of Timestamp for type consistency.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export type Timestamp = firebase.firestore.Timestamp;


export interface User {
  uid: string;
  name: string;
  email: string | null;
  avatar: string;
  level: number;
  points: number;
  streak: number;
  completedChallenges: number;
  ongoingCourses: string[]; // Changed from Course[]
  wishlist: string[]; // Array of course IDs
  pendingTasks: Task[];
  bio?: string;
  coursesAuthored?: number;
  lastLogin?: Timestamp | null;
  themePreference?: 'light' | 'dark';
}

export interface Comment {
    id: string;
    user: {
        name: string;
        avatar: string;
    };
    text: string;
    timestamp: string;
    replies?: Comment[];
}

export interface DownloadableResource {
    id:string;
    name: string;
    type: 'PDF' | 'ZIP' | 'Blend File';
    size: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  thumbnailUrl?: string;
  isFree: boolean;
  isPaid: boolean;
  isPublished: boolean;
  lectures: Lecture[];
  sections?: CourseSection[];
  progress: number;
  author: User;
  price?: number;
  currency?: string;
  originalPrice?: number;
  rating?: number;
  studentCount?: number;
  lessonsCount?: number;
  totalDuration?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  views?: number;
  includes?: string[];
  faqs?: { question: string; answer: string }[];
  suggestedCourses?: string[];
  // New properties for detailed lecture view
  lectureType?: string;
  critiqueSession?: string;
  tags: string[];
  comments?: Comment[];
  resources?: DownloadableResource[];
}

export interface Lecture {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  isCompleted: boolean;
  summary: string;
  isPreview?: boolean;
}


export interface CourseSection {
  title: string;
  lectures: Lecture[];
  progress?: number;
}


export interface LeaderboardEntry {
  rank: number;
  user: {
    name: string;
    avatar: string;
  };
  points: number;
}

export interface Task {
  id: string;
  text: string;
  dueDate: string;
  courseId: string;
  courseTitle: string;
}

export type AppView = 'dashboard' | 'courses' | 'leaderboard' | 'profile' | 'courseDetail' | 'lecture' | 'myLearnings';
export type PageView = 'homepage' | 'login' | 'coursePreview' | AppView;


export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
