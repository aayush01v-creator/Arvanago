import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { db } from './firebase.ts';
import type {
  Course,
  CourseInstructor,
  CourseSection,
  CourseSocialLink,
  Lecture,
  SuggestedCourseSummary,
  Timestamp,
  User,
} from '../types.ts';

const COURSE_CACHE_TTL_MS = 1000 * 60 * 5;
let cachedCourses: Course[] | null = null;
let coursesCacheTimestamp = 0;
let inflightCoursesPromise: Promise<Course[]> | null = null;

const defaultAuthor: User = {
  uid: 'default-author',
  name: 'EduSimulate Instructor',
  email: null,
  avatar: 'https://i.pravatar.cc/150?u=edusimulate-author',
  level: 5,
  points: 2500,
  streak: 42,
  completedChallenges: 18,
  enrolledCourses: [],
  ongoingCourses: [],
  wishlist: [],
  pendingTasks: [],
  bio: 'Instructor profiles will appear here once connected to Firestore.',
  coursesAuthored: 3,
};

const FALLBACK_COURSE_SEEDS: ReadonlyArray<Course> = [
  {
    id: 'iit-jee-physics-foundations',
    title: 'IIT JEE Physics Foundations',
    description:
      'Strengthen your physics fundamentals with immersive visualisations, targeted assignments, and weekly live doubt solving.',
    category: 'IIT JEE',
    thumbnail: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
    isFree: true,
    isPaid: false,
    isPublished: true,
    isFeaturedOnHome: true,
    featuredPriority: 1,
    lectures: [
      {
        id: 'iit-jee-physics-foundations-lecture-1',
        title: 'Vectors & Motion',
        duration: '18m',
        videoUrl: 'https://player.vimeo.com/video/652519260',
        isCompleted: false,
        summary: 'Master the fundamentals of vectors and motion in a plane with guided problem walkthroughs.',
      },
      {
        id: 'iit-jee-physics-foundations-lecture-2',
        title: 'Newtonian Dynamics',
        duration: '22m',
        videoUrl: 'https://player.vimeo.com/video/652519261',
        isCompleted: false,
        summary: 'Tackle force and friction problems with live strategy breakdowns.',
      },
      {
        id: 'iit-jee-physics-foundations-lecture-3',
        title: 'Work, Power & Energy Labs',
        duration: '26m',
        videoUrl: 'https://player.vimeo.com/video/652519262',
        isCompleted: false,
        summary: 'Experiment with interactive energy conservation scenarios and timed drills.',
      },
    ],
    progress: 0,
    author: {
      ...defaultAuthor,
      uid: 'mentor-anika',
      name: 'Anika Sharma',
      avatar: 'https://i.pravatar.cc/150?u=mentor-anika',
      bio: 'Lead Physics Mentor, Ex-IIT Bombay',
    },
    price: 0,
    currency: 'INR',
    rating: 4.8,
    reviewCount: 1890,
    studentCount: 12500,
    lessonsCount: 48,
    totalDuration: '18h',
    skillLevel: 'Intermediate',
    views: 32000,
    subtitle: 'Daily problem-solving drills for confident ranks.',
    headline: 'Structured Physics prep for IIT JEE 2025 aspirants.',
    lastUpdated: '2024-07-10',
    updatedAt: '2024-07-10',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519260',
    previewImageUrl: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Apply mechanics concepts to multi-step questions.',
      'Decode frequently tested question patterns.',
      'Build speed with timed drills and live competitions.',
    ],
    requirements: [
      'Comfort with class 11 Physics basics.',
      'Notebook for derivations and problem-solving.',
    ],
    includes: [
      'Live doubt solving rooms',
      'Downloadable practice sheets',
      'Weekly mock tests',
    ],
    faqs: [
      {
        question: 'Will sessions be recorded?',
        answer: 'Yes, every live class is available on-demand within an hour.',
      },
      {
        question: 'Do I get personal mentorship?',
        answer: 'Dedicated mentors host weekly 1:1 strategy sessions.',
      },
    ],
    suggestedCourses: ['neet-biology-masterclass', 'upsc-answer-writing-lab'],
    tags: ['Physics', 'IIT JEE', 'Problem Solving'],
  },
  {
    id: 'neet-biology-masterclass',
    title: 'NEET Biology Masterclass',
    description:
      'Learn high-yield NCERT biology with mnemonics, live quizzes, and rapid revision notes designed for NEET toppers.',
    category: 'NEET',
    thumbnail: 'https://images.unsplash.com/photo-1559757175-5700dde6753d?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde6753d?auto=format&fit=crop&w=800&q=80',
    isFree: false,
    isPaid: true,
    isPublished: true,
    isFeaturedOnHome: true,
    featuredPriority: 2,
    lectures: [
      {
        id: 'neet-biology-masterclass-lecture-1',
        title: 'Plant Physiology Power Hour',
        duration: '20m',
        videoUrl: 'https://player.vimeo.com/video/652519270',
        isCompleted: false,
        summary: 'Visual mnemonics to master transport in plants and mineral nutrition.',
      },
      {
        id: 'neet-biology-masterclass-lecture-2',
        title: 'Human Reproduction Blueprint',
        duration: '24m',
        videoUrl: 'https://player.vimeo.com/video/652519271',
        isCompleted: false,
        summary: 'Decode frequently asked NEET questions with examiner tips.',
      },
      {
        id: 'neet-biology-masterclass-lecture-3',
        title: 'Genetics Rapid Revision',
        duration: '28m',
        videoUrl: 'https://player.vimeo.com/video/652519272',
        isCompleted: false,
        summary: 'Use story-based mnemonics to remember complex inheritance patterns.',
      },
    ],
    progress: 0,
    author: {
      ...defaultAuthor,
      uid: 'mentor-raghav',
      name: 'Dr. Raghav Menon',
      avatar: 'https://i.pravatar.cc/150?u=mentor-raghav',
      bio: 'Senior Biology Faculty, 12+ years of NEET mentoring.',
    },
    price: 5999,
    originalPrice: 8999,
    currency: 'INR',
    rating: 4.9,
    reviewCount: 2480,
    studentCount: 18200,
    lessonsCount: 60,
    totalDuration: '24h',
    skillLevel: 'Intermediate',
    views: 41000,
    subtitle: 'Complete NCERT coverage with daily active recall.',
    headline: 'Master every biology diagram and concept for NEET 2025.',
    lastUpdated: '2024-08-22',
    updatedAt: '2024-08-22',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519270',
    previewImageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde6753d?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Retain biology facts using smart mnemonics.',
      'Solve NCERT exemplar questions with confidence.',
      'Practice exam-level MCQs under time pressure.',
    ],
    requirements: [
      'Basic understanding of class 11 biology.',
      'Consistency to attempt daily practice quizzes.',
    ],
    includes: [
      '4000+ exam-style MCQs',
      'Rapid revision flashcards',
      'Daily live quizzes',
    ],
    faqs: [
      {
        question: 'Is this course aligned with NCERT?',
        answer: '100% NCERT coverage with additional PYQ focus sessions.',
      },
    ],
    suggestedCourses: ['iit-jee-physics-foundations', 'upsc-answer-writing-lab'],
    tags: ['Biology', 'NEET', 'NCERT'],
  },
  {
    id: 'upsc-answer-writing-lab',
    title: 'UPSC Answer Writing Lab',
    description: 'Upgrade your GS mains answers with live evaluation, peer reviews, and the 7-5-3 framework.',
    category: 'UPSC',
    thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    isFree: false,
    isPaid: true,
    isPublished: true,
    isFeaturedOnHome: false,
    lectures: [
      {
        id: 'upsc-answer-writing-lab-lecture-1',
        title: '7-5-3 Framework Deep Dive',
        duration: '16m',
        videoUrl: 'https://player.vimeo.com/video/652519280',
        isCompleted: false,
        summary: 'Craft impactful introductions, body, and conclusions for GS answers.',
      },
      {
        id: 'upsc-answer-writing-lab-lecture-2',
        title: 'Daily Drill & Feedback Loop',
        duration: '21m',
        videoUrl: 'https://player.vimeo.com/video/652519281',
        isCompleted: false,
        summary: 'Learn how to internalise examiner expectations with iterative feedback.',
      },
      {
        id: 'upsc-answer-writing-lab-lecture-3',
        title: 'Case Study Closers',
        duration: '19m',
        videoUrl: 'https://player.vimeo.com/video/652519282',
        isCompleted: false,
        summary: 'Practise ethics case studies with structured approaches.',
      },
    ],
    progress: 0,
    author: {
      ...defaultAuthor,
      uid: 'mentor-isha',
      name: 'Isha Verma',
      avatar: 'https://i.pravatar.cc/150?u=mentor-isha',
      bio: 'Former Civil Servant & UPSC mentor.',
    },
    price: 2999,
    originalPrice: 4999,
    currency: 'INR',
    rating: 4.7,
    reviewCount: 980,
    studentCount: 6200,
    lessonsCount: 36,
    totalDuration: '15h',
    skillLevel: 'Advanced',
    views: 15200,
    subtitle: 'Craft high-scoring answers with actionable feedback.',
    headline: 'Daily writing drills, evaluated by former civil servants.',
    lastUpdated: '2024-06-18',
    updatedAt: '2024-06-18',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519280',
    previewImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Structure GS answers for maximum impact.',
      'Practise answer writing under exam constraints.',
      'Internalise scoring rubrics with peer review.',
    ],
    requirements: [
      'Working knowledge of the GS syllabus.',
      'Commitment to daily writing practice.',
    ],
    includes: [
      'Weekly evaluated mocks',
      'Personalised feedback reports',
      'Live strategy workshops',
    ],
    faqs: [
      {
        question: 'Do I need an optional subject decided?',
        answer: 'Not necessary, but a clear GS foundation helps you apply feedback faster.',
      },
    ],
    suggestedCourses: ['iit-jee-physics-foundations'],
    tags: ['UPSC', 'Answer Writing', 'Mains'],
  },
];

const cloneFallbackCourse = (course: Course, courseMap: Map<string, Course>): Course => {
  const lectures = course.lectures.map((lecture) => ({ ...lecture }));
  const sections = course.sections?.map((section) => ({
    ...section,
    lectures: section.lectures.map((lecture) => ({ ...lecture })),
  }));

  const suggestedCourseDetails = course.suggestedCourses
    ?.map((id) => {
      const suggested = courseMap.get(id);
      if (!suggested) {
        return null;
      }

      return {
        id: suggested.id,
        title: suggested.title,
        category: suggested.category,
        thumbnailUrl: suggested.thumbnailUrl ?? suggested.thumbnail,
        price: suggested.price,
        currency: suggested.currency,
        isPaid: suggested.isPaid,
        tags: suggested.tags,
      } satisfies SuggestedCourseSummary;
    })
    .filter((detail): detail is SuggestedCourseSummary => Boolean(detail) && Boolean(detail.id));

  return {
    ...course,
    author: {
      ...course.author,
      ongoingCourses: [...course.author.ongoingCourses],
      wishlist: [...course.author.wishlist],
      pendingTasks: [...course.author.pendingTasks],
    },
    lectures,
    sections,
    suggestedCourseDetails:
      suggestedCourseDetails && suggestedCourseDetails.length > 0
        ? suggestedCourseDetails
        : course.suggestedCourseDetails,
  } satisfies Course;
};

const buildFallbackCourses = (): Course[] => {
  const courseMap = new Map(FALLBACK_COURSE_SEEDS.map((course) => [course.id, course]));
  return FALLBACK_COURSE_SEEDS.map((course) => cloneFallbackCourse(course, courseMap));
};

const shouldUseFallbackCourses = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (typeof code === 'string') {
    return ['permission-denied', 'unavailable', 'failed-precondition'].includes(code);
  }

  const message = (error as { message?: string }).message;
  return typeof message === 'string' && message.toLowerCase().includes('missing or insufficient permissions');
};

const coerceBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return fallback;
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const buildAuthor = (data: unknown): User => {
  if (!data || typeof data !== 'object') {
    return defaultAuthor;
  }

  const candidate = data as Partial<User> & { name?: string; avatar?: string; bio?: string };

  return {
    ...defaultAuthor,
    ...candidate,
    name: candidate.name ?? defaultAuthor.name,
    avatar: candidate.avatar ?? defaultAuthor.avatar,
    bio: candidate.bio ?? defaultAuthor.bio,
  };
};

const mapLecture = (lectureData: any, fallbackId: string): Lecture => ({
  id: lectureData?.id ?? fallbackId,
  title: lectureData?.title ?? 'Untitled Lecture',
  duration: lectureData?.duration ?? '5m',
  videoUrl: lectureData?.videoUrl ?? lectureData?.youtubeUrl ?? '',
  isCompleted: coerceBoolean(lectureData?.isCompleted),
  summary: lectureData?.summary ?? lectureData?.description ?? 'Summary coming soon.',
  isPreview: coerceBoolean(lectureData?.isPreview),
});

const fetchLecturesForCourse = async (
  courseRef: firebase.firestore.DocumentReference,
  fallbackLectures: unknown,
): Promise<Lecture[]> => {
  try {
    const snapshot = await courseRef.collection('lectures').get();
    if (!snapshot.empty) {
      return snapshot.docs.map((lectureDoc, index) =>
        mapLecture({ id: lectureDoc.id, ...lectureDoc.data() }, `${courseRef.id}-lecture-${index + 1}`),
      );
    }
  } catch (error) {
    console.warn(`Failed to load lectures for course "${courseRef.id}":`, error);
  }

  if (Array.isArray(fallbackLectures)) {
    return fallbackLectures.map((lecture, index) =>
      mapLecture(lecture, `${courseRef.id}-lecture-${index + 1}`),
    );
  }

  return [];
};

const buildSections = (lectures: Lecture[], sectionsData: unknown): CourseSection[] => {
  if (Array.isArray(sectionsData) && sectionsData.length > 0) {
    const validSections = sectionsData
      .map((section: any) => {
        if (!section || typeof section !== 'object') {
          return null;
        }

        const title = typeof section.title === 'string' ? section.title : 'Course Modules';
        const sectionLectures = Array.isArray(section.lectures)
          ? section.lectures.map((lecture: any, index: number) =>
              mapLecture(lecture, `${title}-lecture-${index + 1}`),
            )
          : lectures;

        return {
          title,
          lectures: sectionLectures,
          progress: typeof section.progress === 'number' ? section.progress : undefined,
        } satisfies CourseSection;
      })
      .filter((section): section is CourseSection => Boolean(section));

    if (validSections.length > 0) {
      return validSections;
    }
  }

  return [
    {
      title: 'Course Modules',
      lectures,
      progress: lectures.length === 0 ? 0 : Math.round((lectures.filter(l => l.isCompleted).length / lectures.length) * 100),
    },
  ];
};

const sanitizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cleaned = value.filter((item): item is string => typeof item === 'string');
  return cleaned.length > 0 ? cleaned : undefined;
};

const sanitizeSocialLinks = (value: unknown) => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { label?: unknown; url?: unknown; title?: unknown; href?: unknown };
      const label = typeof candidate.label === 'string' ? candidate.label : typeof candidate.title === 'string' ? candidate.title : undefined;
      const url = typeof candidate.url === 'string' ? candidate.url : typeof candidate.href === 'string' ? candidate.href : undefined;

      if (!label || !url) {
        return null;
      }

      return { label, url } satisfies CourseSocialLink;
    })
    .filter((link): link is CourseSocialLink => Boolean(link));

  return links.length > 0 ? links : undefined;
};

const sanitizeInstructors = (value: unknown): CourseInstructor[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const instructors = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<CourseInstructor> & {
        id?: unknown;
        name?: unknown;
        title?: unknown;
        avatar?: unknown;
        rating?: unknown;
        totalStudents?: unknown;
        totalReviews?: unknown;
        bio?: unknown;
        headline?: unknown;
        description?: unknown;
        socialLinks?: unknown;
      };

      const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : `instructor-${index + 1}`;
      const name = typeof candidate.name === 'string' ? candidate.name : undefined;

      if (!name) {
        return null;
      }

      const parsed: CourseInstructor = {
        id,
        name,
        title: typeof candidate.title === 'string' ? candidate.title : undefined,
        headline: typeof candidate.headline === 'string' ? candidate.headline : undefined,
        avatar: typeof candidate.avatar === 'string' ? candidate.avatar : undefined,
        rating: typeof candidate.rating === 'number' ? candidate.rating : undefined,
        totalStudents: typeof candidate.totalStudents === 'number' ? candidate.totalStudents : undefined,
        totalReviews: typeof candidate.totalReviews === 'number' ? candidate.totalReviews : undefined,
        bio: typeof candidate.bio === 'string' ? candidate.bio : undefined,
        description: typeof candidate.description === 'string' ? candidate.description : undefined,
        socialLinks: sanitizeSocialLinks(candidate.socialLinks),
      };

      return parsed;
    })
    .filter((instructor): instructor is CourseInstructor => Boolean(instructor));

  return instructors.length > 0 ? instructors : undefined;
};

const sanitizeDescriptionSections = (
  value: unknown,
): NonNullable<Course['descriptionSections']> | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sections = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { title?: unknown; heading?: unknown; content?: unknown; description?: unknown };
      const content = typeof candidate.content === 'string' ? candidate.content : typeof candidate.description === 'string' ? candidate.description : undefined;

      if (!content) {
        return null;
      }

      const title = typeof candidate.title === 'string' ? candidate.title : typeof candidate.heading === 'string' ? candidate.heading : undefined;

      return {
        title,
        content: content.trim(),
      };
    })
    .filter((section): section is { title?: string; content: string } => Boolean(section));

  return sections.length > 0 ? sections : undefined;
};

const formatMonthYear = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);

const resolveUpdatedAtLabel = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (value instanceof Date) {
    return formatMonthYear(value);
  }

  if (value instanceof firebase.firestore.Timestamp) {
    return formatMonthYear(value.toDate());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatMonthYear(new Date(value));
  }

  if (typeof value === 'object' && value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return formatMonthYear(date);
    } catch (error) {
      console.warn('Unable to parse Firestore timestamp-like object for updatedAt field.', error);
    }
  }

  return undefined;
};

const sanitizeDescription = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
};

const resolveCourseDescription = (
  courseId: string,
  rawData: Record<string, unknown>,
): string => {
  const candidateDescriptions: unknown[] = [
    rawData.description,
    rawData.shortDescription,
    rawData.summary,
  ];

  if (rawData.details && typeof rawData.details === 'object') {
    const details = rawData.details as Record<string, unknown>;
    candidateDescriptions.push(details.description, details.summary, details.overview);
  }

  if (rawData.meta && typeof rawData.meta === 'object') {
    const meta = rawData.meta as Record<string, unknown>;
    candidateDescriptions.push(meta.description);
  }

  for (const candidate of candidateDescriptions) {
    const sanitized = sanitizeDescription(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  console.warn(
    `Course "${courseId}" is missing a usable description field. Falling back to placeholder.`,
    {
      availableKeys: Object.keys(rawData),
    },
  );

  return 'Detailed course descriptions will appear once provided.';
};

const sanitizeSuggestedCourseIds = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { id?: unknown; courseId?: unknown };

      if (typeof candidate.id === 'string') {
        return candidate.id;
      }

      if (typeof candidate.courseId === 'string') {
        return candidate.courseId;
      }

      return null;
    })
    .filter((id): id is string => Boolean(id));

  return ids.length > 0 ? ids : undefined;
};

const sanitizeFaqs = (value: unknown): { question: string; answer: string }[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const faqs = value
    .map((item: any) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const question = typeof item.question === 'string' ? item.question : null;
      const answer = typeof item.answer === 'string' ? item.answer : null;

      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));

  return faqs.length > 0 ? faqs : undefined;
};

const sanitizeComments = (value: unknown): Course['comments'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const comments = value
    .map((comment: any) => {
      if (!comment || typeof comment !== 'object') {
        return null;
      }

      const id = typeof comment.id === 'string' ? comment.id : undefined;
      const text = typeof comment.text === 'string' ? comment.text : undefined;
      const timestamp = typeof comment.timestamp === 'string' ? comment.timestamp : undefined;
      const user = comment.user;

      if (!id || !text || !timestamp || !user || typeof user !== 'object') {
        return null;
      }

      const name = typeof user.name === 'string' ? user.name : undefined;
      const avatar = typeof user.avatar === 'string' ? user.avatar : undefined;

      if (!name || !avatar) {
        return null;
      }

      return {
        id,
        text,
        timestamp,
        user: { name, avatar },
      };
    })
    .filter((comment): comment is NonNullable<Course['comments']>[number] => Boolean(comment));

  return comments.length > 0 ? comments : undefined;
};

const sanitizeResources = (value: unknown): Course['resources'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const resources = value
    .map((resource: any) => {
      if (!resource || typeof resource !== 'object') {
        return null;
      }

      const id = typeof resource.id === 'string' ? resource.id : undefined;
      const name = typeof resource.name === 'string' ? resource.name : undefined;
      const type = resource.type;
      const size = typeof resource.size === 'string' ? resource.size : undefined;

      if (!id || !name || !size || (type !== 'PDF' && type !== 'ZIP' && type !== 'Blend File')) {
        return null;
      }

      return { id, name, type, size };
    })
    .filter((resource): resource is NonNullable<Course['resources']>[number] => Boolean(resource));

  return resources.length > 0 ? resources : undefined;
};

const allowedSkillLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;
type AllowedSkillLevel = (typeof allowedSkillLevels)[number];

const normalizeSkillLevel = (value: unknown): AllowedSkillLevel | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  const match = allowedSkillLevels.find(
    level => level.toLowerCase() === normalized.toLowerCase(),
  );

  return match;
};

const hydrateCourseFromDoc = async (
  courseDoc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>,
): Promise<Course | null> => {
  const rawData = courseDoc.data();

  if (!rawData || Object.keys(rawData).length === 0) {
    return null;
  }

  const isPublished = coerceBoolean(rawData.isPublished, true);
  if (!isPublished) {
    return null;
  }

  const lectures = await fetchLecturesForCourse(courseDoc.ref, rawData.lectures);
  const sections = buildSections(lectures, rawData.sections);
  const completedLectures = lectures.filter(lecture => lecture.isCompleted).length;
  const lessonsCount = lectures.length;
  const progress = lessonsCount > 0 ? Math.round((completedLectures / lessonsCount) * 100) : 0;

  const price = coerceNumber(rawData.price);
  const originalPrice = coerceNumber(rawData.originalPrice);
  const rating = typeof rawData.rating === 'number' ? rawData.rating : undefined;
  const reviewCount = typeof rawData.reviewCount === 'number' ? rawData.reviewCount : undefined;
  const studentCount = typeof rawData.studentCount === 'number' ? rawData.studentCount : undefined;
  const totalDuration = typeof rawData.totalDuration === 'string' ? rawData.totalDuration : undefined;
  const skillLevel = normalizeSkillLevel(rawData.skillLevel) ?? normalizeSkillLevel(rawData.level);
  const views = typeof rawData.views === 'number' ? rawData.views : undefined;
  const thumbnailUrl =
    typeof rawData.thumbnailUrl === 'string' && rawData.thumbnailUrl.trim().length > 0
      ? rawData.thumbnailUrl
      : typeof rawData.thumbnail === 'string'
        ? rawData.thumbnail
        : `https://picsum.photos/seed/${courseDoc.id}/640/360`;
  const tags = sanitizeStringArray(rawData.tags) ?? [];
  const includesFromRaw = sanitizeStringArray(rawData.includes);
  const courseIncludes =
    sanitizeStringArray(rawData.courseIncludes) ??
    sanitizeStringArray(rawData.features) ??
    includesFromRaw;
  const learningOutcomes =
    sanitizeStringArray(rawData.whatYouWillLearn) ??
    sanitizeStringArray(rawData.learningOutcomes) ??
    sanitizeStringArray(rawData.outcomes) ??
    sanitizeStringArray(rawData.objectives) ??
    (courseIncludes && courseIncludes !== includesFromRaw ? courseIncludes : undefined);
  const requirements =
    sanitizeStringArray(rawData.requirements) ??
    sanitizeStringArray(rawData.prerequisites);

  const details =
    rawData.details && typeof rawData.details === 'object'
      ? (rawData.details as Record<string, unknown>)
      : undefined;

  const pickHtmlString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? value : undefined;
  };

  const longDescription =
    sanitizeDescription(rawData.longDescription) ??
    sanitizeDescription(rawData.fullDescription) ??
    (details ? sanitizeDescription(details['longDescription']) ?? sanitizeDescription(details['descriptionLong']) : undefined);

  const descriptionHtml =
    pickHtmlString(rawData.descriptionHtml) ??
    pickHtmlString(rawData.htmlDescription) ??
    (details ? pickHtmlString(details['descriptionHtml']) : undefined);

  const descriptionSections =
    sanitizeDescriptionSections(rawData.descriptionSections) ??
    (details ? sanitizeDescriptionSections(details['sections']) : undefined);

  const subtitle = typeof rawData.subtitle === 'string' ? rawData.subtitle : undefined;
  const headline =
    typeof rawData.headline === 'string'
      ? rawData.headline
      : typeof rawData.tagline === 'string'
        ? rawData.tagline
        : subtitle;

  const updatedAtRaw = rawData.updatedAt ?? rawData.lastUpdated ?? rawData.updatedOn ?? rawData.modifiedAt;
  const updatedAt = resolveUpdatedAtLabel(updatedAtRaw);
  const language =
    typeof rawData.language === 'string' && rawData.language.trim().length > 0
      ? rawData.language.trim()
      : typeof rawData.locale === 'string' && rawData.locale.trim().length > 0
        ? rawData.locale.trim()
        : undefined;

  const previewVideoUrl =
    typeof rawData.previewVideoUrl === 'string'
      ? rawData.previewVideoUrl
      : typeof rawData.previewUrl === 'string'
        ? rawData.previewUrl
        : typeof rawData.previewURL === 'string'
          ? rawData.previewURL
          : typeof rawData.previewVideo === 'string'
            ? rawData.previewVideo
            : undefined;

  const previewImageUrl =
    typeof rawData.previewImageUrl === 'string'
      ? rawData.previewImageUrl
      : typeof rawData.previewImage === 'string'
        ? rawData.previewImage
        : typeof rawData.previewThumbnail === 'string'
          ? rawData.previewThumbnail
          : undefined;

  const instructors = sanitizeInstructors(rawData.instructors ?? rawData.authors);

  const hasExplicitIsPaid = typeof rawData.isPaid === 'boolean';
  const hasExplicitIsFree = typeof rawData.isFree === 'boolean';
  const inferredIsPaid = hasExplicitIsPaid
    ? (rawData.isPaid as boolean)
    : hasExplicitIsFree
      ? !(rawData.isFree as boolean)
      : price != null;
  const isPaid = coerceBoolean(inferredIsPaid, false);
  const isFree = hasExplicitIsFree ? (rawData.isFree as boolean) : !isPaid;
  const currency =
    typeof rawData.currency === 'string' && rawData.currency.trim().length > 0
      ? rawData.currency.trim().toUpperCase()
      : price != null
        ? 'USD'
        : undefined;
  const isFeaturedOnHome = coerceBoolean(rawData.isFeaturedOnHome);
  const featuredPriority = coerceNumber(rawData.featuredPriority);

  const suggestedCourseIds = sanitizeSuggestedCourseIds(rawData.suggestedCourses);

  return {
    id: typeof rawData.id === 'string' ? rawData.id : courseDoc.id,
    title: typeof rawData.title === 'string' ? rawData.title : 'Untitled Course',
    description: resolveCourseDescription(courseDoc.id, rawData as Record<string, unknown>),
    category: typeof rawData.category === 'string' ? rawData.category : 'General',
    thumbnail: thumbnailUrl,
    thumbnailUrl,
    isFree,
    isPaid,
    isPublished,
    isFeaturedOnHome,
    featuredPriority,
    lectures,
    sections,
    progress: typeof rawData.progress === 'number' ? rawData.progress : progress,
    author: buildAuthor(rawData.author),
    price,
    currency,
    originalPrice,
    rating,
    reviewCount,
    studentCount,
    lessonsCount,
    totalDuration,
    skillLevel,
    views,
    subtitle,
    headline,
    lastUpdated: updatedAt,
    updatedAt: updatedAt ?? (typeof rawData.updatedAt === 'string' ? rawData.updatedAt : undefined),
    language,
    previewVideoUrl,
    previewImageUrl: previewImageUrl ?? thumbnailUrl,
    learningOutcomes,
    requirements,
    longDescription,
    descriptionHtml,
    descriptionSections,
    instructors,
    includes: courseIncludes ?? includesFromRaw,
    faqs: sanitizeFaqs(rawData.faqs),
    suggestedCourses: suggestedCourseIds,
    lectureType: typeof rawData.lectureType === 'string' ? rawData.lectureType : undefined,
    critiqueSession: typeof rawData.critiqueSession === 'string' ? rawData.critiqueSession : undefined,
    tags,
    comments: sanitizeComments(rawData.comments),
    resources: sanitizeResources(rawData.resources),
  } satisfies Course;
};

const collectCourseDocuments = async (): Promise<
  firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[]
> => {
  const lecturesSnapshot = await db.collection('lectures').get();
  const documents: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[] = [...lecturesSnapshot.docs];

  const appendNestedCourses = async (
    parentDocs: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[],
  ) => {
    await Promise.all(
      parentDocs.map(async (courseDoc) => {
        try {
          const nestedSnapshot = await courseDoc.ref.collection('courses').get();
          if (!nestedSnapshot.empty) {
            documents.push(...nestedSnapshot.docs);
          }
        } catch (error) {
          console.warn(`Failed to load nested courses for document "${courseDoc.id}":`, error);
        }
      }),
    );
  };

  if (documents.length === 0) {
    const fallbackSnapshot = await db.collection('courses').get();
    documents.push(...fallbackSnapshot.docs);
    await appendNestedCourses(fallbackSnapshot.docs);
    return documents;
  }

  await appendNestedCourses(lecturesSnapshot.docs);

  return documents;
};

export const getOrCreateUser = async (
  uid: string,
  displayName: string | null,
  email: string | null,
  photoURL?: string | null,
): Promise<User> => {
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    const firestoreData = userSnap.data()!;
    const lastLogin = firestoreData.lastLogin as Timestamp | null;
    const themePreference: 'light' | 'dark' = firestoreData.themePreference === 'dark' ? 'dark' : 'light';
    let newStreak = firestoreData.streak || 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (lastLogin) {
      const lastLoginDate = lastLogin.toDate();
      const lastLoginDay = new Date(
        lastLoginDate.getFullYear(),
        lastLoginDate.getMonth(),
        lastLoginDate.getDate(),
      );

      const diffTime = today.getTime() - lastLoginDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak++;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updates: Record<string, unknown> = {
      lastLogin: firebase.firestore.Timestamp.now(),
      streak: newStreak,
    };

    if (!firestoreData.themePreference) {
      updates.themePreference = themePreference;
    }

    const isDefaultAvatar = firestoreData.avatar?.includes('pravatar.cc');
    if (photoURL && (!firestoreData.avatar || isDefaultAvatar)) {
      updates.avatar = photoURL;
    }

    await userRef.update(updates);

    return {
      uid,
      name: firestoreData.name || displayName || 'New Learner',
      email: firestoreData.email || email,
      avatar: (updates.avatar as string | undefined) || firestoreData.avatar || `https://i.pravatar.cc/150?u=${uid}`,
    level: firestoreData.level || 1,
    points: firestoreData.points || 0,
    completedChallenges: firestoreData.completedChallenges || 0,
    enrolledCourses: firestoreData.enrolledCourses || [],
    ongoingCourses: firestoreData.ongoingCourses || [],
    wishlist: firestoreData.wishlist || [],
    pendingTasks: firestoreData.pendingTasks || [],
      bio: firestoreData.bio,
      coursesAuthored: firestoreData.coursesAuthored,
      streak: newStreak,
      lastLogin: updates.lastLogin as Timestamp,
      themePreference,
    } satisfies User;
  }

  const newUser: User = {
    uid,
    name: displayName || 'New Learner',
    email,
    avatar: photoURL || `https://i.pravatar.cc/150?u=${uid}`,
    level: 1,
    points: 0,
    streak: 1,
    completedChallenges: 0,
    enrolledCourses: [],
    ongoingCourses: [],
    wishlist: [],
    pendingTasks: [],
    lastLogin: firebase.firestore.Timestamp.now(),
    themePreference: 'light',
  };

  await userRef.set(newUser);
  return newUser;
};

export const updateUserThemePreference = async (uid: string, theme: 'light' | 'dark'): Promise<void> => {
  const userRef = db.collection('users').doc(uid);
  await userRef.set({ themePreference: theme }, { merge: true });
};

export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  const userRef = db.collection('users').doc(uid);
  await userRef.update(updates);
};

export const getCourses = async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<Course[]> => {
  const now = Date.now();

  if (!forceRefresh && cachedCourses && now - coursesCacheTimestamp < COURSE_CACHE_TTL_MS) {
    return cachedCourses;
  }

  if (!forceRefresh && inflightCoursesPromise) {
    return inflightCoursesPromise;
  }

  if (forceRefresh) {
    cachedCourses = null;
    coursesCacheTimestamp = 0;
  }

  const loadCourses = async (): Promise<Course[]> => {
    try {
      const documents = await collectCourseDocuments();
      if (documents.length === 0) {
        cachedCourses = [];
        coursesCacheTimestamp = Date.now();
        return [];
      }

      const hydratedCourses = await Promise.all(documents.map(doc => hydrateCourseFromDoc(doc)));
      const courseMap = new Map<string, Course>();

      hydratedCourses.forEach((course) => {
        if (!course) {
          return;
        }

        courseMap.set(course.id, course);
      });

      const coursesArray = Array.from(courseMap.values());

      coursesArray.forEach((course) => {
        if (!course.suggestedCourses?.length) {
          return;
        }

        const details = course.suggestedCourses
          .map((id) => courseMap.get(id))
          .filter((suggested): suggested is Course => Boolean(suggested))
          .map((suggested): SuggestedCourseSummary => ({
            id: suggested.id,
            title: suggested.title,
            category: suggested.category,
            thumbnailUrl: suggested.thumbnailUrl ?? suggested.thumbnail,
            price: suggested.price,
            currency: suggested.currency,
            isPaid: suggested.isPaid,
            tags: suggested.tags,
          }));

        if (details.length > 0) {
          course.suggestedCourseDetails = details;
        }
      });

      cachedCourses = coursesArray;
      coursesCacheTimestamp = Date.now();
      return coursesArray;
    } catch (error) {
      console.error('Failed to load courses from Firestore.', error);

      if (shouldUseFallbackCourses(error)) {
        console.info('Falling back to bundled sample courses because Firestore access is restricted.');
        const fallbackCourses = buildFallbackCourses();
        cachedCourses = fallbackCourses;
        coursesCacheTimestamp = Date.now();
        return fallbackCourses;
      }

      throw error;
    }
  };

  const requestPromise = loadCourses().finally(() => {
    inflightCoursesPromise = null;
  });

  if (!forceRefresh) {
    inflightCoursesPromise = requestPromise;
  }

  return requestPromise;
};

export const clearCoursesCache = (): void => {
  cachedCourses = null;
  coursesCacheTimestamp = 0;
  inflightCoursesPromise = null;
};

