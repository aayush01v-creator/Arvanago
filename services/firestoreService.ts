// FIX: Use compat version of Firebase for Firestore operations.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from './firebase.ts';
import { User, Course, Timestamp, Lecture } from '../types.ts';

export const getOrCreateUser = async (uid: string, displayName: string | null, email: string | null, photoURL?: string | null): Promise<User> => {
    // FIX: Use compat syntax for document reference.
    const userRef = db.collection('users').doc(uid);
    // FIX: Use compat syntax for getting a document.
    const userSnap = await userRef.get();

    if (userSnap.exists) {
        // FIX: userSnap.data() can be undefined, but with exists check it's safe.
        const firestoreData = userSnap.data()!;
        const lastLogin = firestoreData.lastLogin as Timestamp | null;
        let newStreak = firestoreData.streak || 0;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (lastLogin) {
            const lastLoginDate = lastLogin.toDate();
            const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
            
            const diffTime = today.getTime() - lastLoginDay.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak++;
            } else if (diffDays > 1) {
                newStreak = 1; // Reset streak
            }
        } else {
            newStreak = 1; // First login
        }
        
        // FIX: Use compat version of Timestamp.
        const updates: { [key: string]: any } = {
            lastLogin: firebase.firestore.Timestamp.now(),
            streak: newStreak,
        };
        
        const isDefaultAvatar = firestoreData.avatar?.includes('pravatar.cc');
        if (photoURL && (!firestoreData.avatar || isDefaultAvatar)) {
            updates.avatar = photoURL;
        }

        await userRef.update(updates);
        
        // Merge fetched data with defaults to ensure type safety.
        // This prevents crashes if the user object in Firestore is missing fields.
        const user: User = {
            uid: uid,
            name: firestoreData.name || displayName || 'New Learner',
            email: firestoreData.email || email,
            avatar: updates.avatar || firestoreData.avatar || `https://i.pravatar.cc/150?u=${uid}`,
            level: firestoreData.level || 1,
            points: firestoreData.points || 0,
            completedChallenges: firestoreData.completedChallenges || 0,
            ongoingCourses: firestoreData.ongoingCourses || [],
            wishlist: firestoreData.wishlist || [],
            pendingTasks: firestoreData.pendingTasks || [],
            bio: firestoreData.bio,
            coursesAuthored: firestoreData.coursesAuthored,
            streak: newStreak,
            lastLogin: updates.lastLogin
        };
        return user;

    } else {
        const newUser: User = {
            uid,
            name: displayName || 'New Learner',
            email: email,
            avatar: photoURL || `https://i.pravatar.cc/150?u=${uid}`,
            level: 1,
            points: 0,
            streak: 1,
            completedChallenges: 0,
            ongoingCourses: [],
            wishlist: [],
            pendingTasks: [],
            // FIX: Use compat version of Timestamp.
            lastLogin: firebase.firestore.Timestamp.now(),
        };
        // FIX: Use compat syntax for setting a document.
        await userRef.set(newUser);
        return newUser;
    }
};

export const updateUserProfile = async (uid: string, updates: { name?: string; bio?: string }): Promise<void> => {
    const userRef = db.collection('users').doc(uid);
    await userRef.update(updates);
};


export const getCourses = async (): Promise<Course[]> => {
    // FIX: Changed collection from 'courses' to 'lectures' to match Firestore screenshot.
    const coursesCol = db.collection('lectures');
    const coursesSnapshot = await coursesCol.get();

    // The app expects a full User object for the author. Provide a default.
    const defaultAuthor: User = {
        uid: 'unknown-author',
        name: 'EduSimulate Staff',
        email: null,
        avatar: `https://i.pravatar.cc/150?u=edusimulate`,
        level: 5,
        points: 10000,
        streak: 100,
        completedChallenges: 10,
        ongoingCourses: [],
        wishlist: [],
        pendingTasks: [],
        bio: 'An instructor at EduSimulate.',
        coursesAuthored: 5
    };

    const coursesListPromises = coursesSnapshot.docs.map(async (courseDoc) => {
        // FIX: Fetch nested 'lectures' sub-collection for each course.
        const lecturesSubCol = courseDoc.ref.collection('lectures');
        const lecturesSnapshot = await lecturesSubCol.get();

        const lectures: Lecture[] = lecturesSnapshot.docs.map(lectureDoc => {
            const data = lectureDoc.data();
            // FIX: Map fields from Firestore (youtubeUrl, description) to the 'Lecture' type (videoUrl, summary) and add defaults.
            return {
                id: lectureDoc.id,
                title: data.title || 'Untitled Lecture',
                duration: data.duration || '5:00',
                videoUrl: data.youtubeUrl || '',
                isCompleted: data.isCompleted || false,
                summary: data.description || 'No summary available.',
                isPreview: data.isPreview || false,
            };
        });
        
        const courseData = courseDoc.data();
        
        // Calculate progress based on completed lectures if not present
        const completedLectures = lectures.filter(l => l.isCompleted).length;
        const totalLectures = lectures.length;
        const progress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
        
        // FIX: Construct a full Course object with defaults to prevent UI errors, as the parent course document's fields are not visible in the screenshot.
        // The UI relies on many of these fields.
        return {
            id: courseDoc.id,
            title: courseData.title || 'Untitled Course',
            description: courseData.description || 'Learn about an exciting new topic. This course provides in-depth lessons and practical examples.',
            category: courseData.category || 'General',
            thumbnail: courseData.thumbnail || `https://picsum.photos/seed/${courseDoc.id}/400/225`,
            isFree: typeof courseData.isFree === 'boolean' ? courseData.isFree : true,
            lectures: lectures,
            sections: courseData.sections || [{ title: 'Course Modules', lectures: lectures, progress: progress }],
            progress: courseData.progress || progress,

            // Course Preview fields
            price: courseData.price || 49.99,
            originalPrice: courseData.originalPrice || 99.99,
            rating: courseData.rating || 4.5,
            studentCount: courseData.studentCount || 1234,
            lessonsCount: totalLectures,
            totalDuration: courseData.totalDuration || '2h 30m',
            skillLevel: courseData.skillLevel || 'Beginner',
            views: courseData.views || 5678,
            includes: courseData.includes || ['10 hours on-demand video', '5 Articles', 'Downloadable resources', 'Access on mobile and TV'],
            faqs: courseData.faqs || [
                { question: 'Is this course for beginners?', answer: 'Absolutely! We start with the basics and build up from there.' },
                { question: 'What do I get with the course?', answer: 'You get lifetime access to all course videos, articles, and downloadable resources.' }
            ],
            
            // Lecture View fields
            lectureType: courseData.lectureType || 'Video-based',
            critiqueSession: courseData.critiqueSession || 'Available',
            tags: courseData.tags || ['New', 'Popular'],
            comments: courseData.comments || [
                { id: 'c1', user: { name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex' }, text: 'Great lecture, very informative!', timestamp: '2 days ago' }
            ],
            resources: courseData.resources || [
                { id: 'r1', name: 'Lecture Slides', type: 'PDF', size: '2.5 MB' }
            ],
            
            // Use default author as a fallback
            author: courseData.author || defaultAuthor,
        } as Course;
    });

    const coursesList = await Promise.all(coursesListPromises);
    return coursesList;
};
