import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import Icon from '@/components/common/Icon.tsx';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';
import { CourseSection, Lecture } from '@/types.ts';

const SectionSummary: React.FC<{ section: CourseSection; currentLectureId: string; onSelect: (lecture: Lecture) => void }> = ({
  section,
  currentLectureId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const completedLectures = section.lectures.filter((lecture) => lecture.isCompleted).length;
  const progress = section.lectures.length ? Math.round((completedLectures / section.lectures.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
            <Icon name={progress === 100 ? 'check-circle' : 'layers'} className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">{section.title}</p>
            <p className="text-xs text-white/60">
              {section.lectures.length} lessons · {progress}% complete
            </p>
          </div>
        </div>
        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className="h-5 w-5 text-white/60" />
      </button>
      {isOpen && (
        <ul className="space-y-2 px-4 pb-4">
          {section.lectures.map((lecture) => (
            <li key={lecture.id}>
              <button
                onClick={() => onSelect(lecture)}
                className={`flex w-full items-center gap-3 rounded-xl border border-white/5 px-3 py-2 text-left transition hover:border-brand-primary/40 hover:bg-brand-primary/5 ${
                  currentLectureId === lecture.id ? 'border-brand-primary/60 bg-brand-primary/10' : ''
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70">
                  <Icon
                    name={lecture.isCompleted ? 'check-circle' : 'play'}
                    className={`h-4 w-4 ${lecture.isCompleted ? 'text-emerald-400' : 'text-white/70'}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90">{lecture.title}</p>
                  <p className="text-xs text-white/60">{lecture.duration}</p>
                </div>
                <Icon name="arrowRight" className="h-4 w-4 text-white/50" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Badge: React.FC<{ icon: string; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
    <Icon name={icon} className="h-4 w-4 text-brand-primary" />
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  </div>
);

const GlassCard: React.FC<React.PropsWithChildren<{ title: string; action?: React.ReactNode }>> = ({ title, action, children }) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
    <header className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {action}
    </header>
    <div className="space-y-4 text-white/80 text-sm leading-relaxed">{children}</div>
  </section>
);

const CourseLearnPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, user, coursesLoading, onProfileUpdate } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const primaryLecture = useMemo(
    () => course?.lectures.find((lecture) => lecture.isPreview) ?? course?.lectures[0],
    [course],
  );

  const [currentLecture, setCurrentLecture] = useState<Lecture | undefined>(primaryLecture);

  useEffect(() => {
    setCurrentLecture(primaryLecture);
  }, [primaryLecture]);

  useEffect(() => {
    if (!user || !course) return;

    const isEnrolled = user.enrolledCourses.includes(course.id);
    const isOngoing = user.ongoingCourses.includes(course.id);

    if (isEnrolled && isOngoing) return;

    const updatedEnrolledCourses = isEnrolled ? user.enrolledCourses : [...user.enrolledCourses, course.id];
    const updatedOngoingCourses = isOngoing ? user.ongoingCourses : [...user.ongoingCourses, course.id];

    onProfileUpdate({
      enrolledCourses: updatedEnrolledCourses,
      ongoingCourses: updatedOngoingCourses,
    });

    void updateUserProfile(user.uid, {
      enrolledCourses: updatedEnrolledCourses,
      ongoingCourses: updatedOngoingCourses,
    });
  }, [course, onProfileUpdate, user]);

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-dashed border-brand-primary" />
      </div>
    );
  }

  if (!course || !primaryLecture || !currentLecture) {
    return <Navigate to={course ? `/courses/${course.id}` : '/dashboard'} replace />;
  }

  const totalLessons = course.sections?.reduce((total, section) => total + section.lectures.length, 0) ?? course.lectures.length;
  const resourcesCount = course.resources?.length ?? 0;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary/15 via-slate-900/90 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_25%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-brand-primary/40 hover:text-white"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="hidden sm:inline">Enrolled</span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">Active</span>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Current course</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{course.title}</h1>
              {course.headline && <p className="mt-2 text-sm text-white/70">{course.headline}</p>}
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Badge icon="star" label="Rating" value={`${course.rating ?? 4.8}★`} />
              <Badge icon="clock" label="Duration" value={course.totalDuration ?? 'Self paced'} />
              <Badge icon="book" label="Lessons" value={totalLessons} />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-inner">
            <div className="relative aspect-video w-full">
              <iframe
                src={currentLecture.videoUrl}
                title={currentLecture.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">Now playing</p>
                <p className="text-lg font-semibold text-white">{currentLecture.title}</p>
                <p className="text-sm text-white/60">{currentLecture.duration}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-primary/40 hover:bg-brand-primary/10"
                >
                  <Icon name="info" className="h-4 w-4" />
                  Course details
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-brand-primary/40 transition hover:-translate-y-0.5"
                >
                  <Icon name="home" className="h-4 w-4" />
                  Exit to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <GlassCard
              title="Course content"
              action={
                <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary">
                  {course.progress}% complete
                </span>
              }
            >
              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                <span className="rounded-full bg-white/5 px-3 py-1">{totalLessons} lessons</span>
                <span className="rounded-full bg-white/5 px-3 py-1">{resourcesCount} resources</span>
                <span className="rounded-full bg-white/5 px-3 py-1">{course.sections?.length ?? 1} sections</span>
              </div>
              <div className="space-y-3">
                {(course.sections ?? [{ title: 'All lectures', lectures: course.lectures }]).map((section) => (
                  <SectionSummary
                    key={section.title}
                    section={section}
                    currentLectureId={currentLecture.id}
                    onSelect={setCurrentLecture}
                  />
                ))}
              </div>
            </GlassCard>

            <GlassCard title="Overview">
              <p>{course.longDescription || course.description}</p>
              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {course.learningOutcomes.map((item) => (
                    <li key={item} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm">
                      <Icon name="check" className="mt-1 h-4 w-4 text-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard title="Simulations">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">Code sandbox</p>
                      <p className="text-xs text-white/60">Run quick experiments without leaving the course.</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">Live</span>
                  </div>
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-white/70">
                    Try the guided challenge to reinforce this lecture.
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                title="Add task"
                action={<button className="text-sm font-semibold text-brand-primary hover:underline">Add</button>}
              >
                <p>Break down what you learned into actionable next steps.</p>
                <div className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                    <Icon name="target" className="h-4 w-4 text-brand-primary" />
                    <span>Draft a short recap of the video.</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                    <Icon name="activity" className="h-4 w-4 text-brand-primary" />
                    <span>Complete the practice exercise attached to this lecture.</span>
                  </div>
                </div>
                <button className="mt-2 w-full rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-brand-primary/40 transition hover:-translate-y-0.5">
                  Save task
                </button>
              </GlassCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard
                title="Q&A"
                action={<button className="text-sm font-semibold text-brand-primary hover:underline">Ask a question</button>}
              >
                <div className="space-y-3">
                  {(course.comments ?? []).slice(0, 3).map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{comment.user.name}</p>
                      <p className="text-xs text-white/50">{comment.timestamp}</p>
                      <p className="mt-1 text-sm text-white/80">{comment.text}</p>
                    </div>
                  ))}
                  {(!course.comments || course.comments.length === 0) && (
                    <p className="text-sm text-white/70">No questions yet. Start the conversation!</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard title="My doubts">
                <div className="space-y-3 text-sm text-white/80">
                  <p>Capture anything that felt unclear while watching this lecture.</p>
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-brand-primary/50 focus:outline-none"
                    placeholder="Note your doubt here..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Synced to your notebook</span>
                    <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary/20">
                      Save
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard title="Certificate">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white/70">Finish the modules to unlock your certificate.</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-brand-primary"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/60">{course.progress}% completed</p>
                </div>
                <button className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/20">
                  View certificate preview
                </button>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white">Quick tools</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[
                  { icon: 'edit', label: 'Notes', description: 'Capture highlights for this lecture.' },
                  { icon: 'download', label: 'Downloads', description: `${resourcesCount} resources available.` },
                  { icon: 'award', label: 'Achievements', description: 'Earn badges as you progress.' },
                  { icon: 'message-circle', label: 'Mentor', description: 'Chat with your mentor.' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                        <Icon name={item.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-xs text-white/60">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <GlassCard title="Resources">
              <div className="space-y-3">
                {(course.resources ?? []).map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Icon name={resource.type === 'PDF' ? 'file-text' : 'folder'} className="h-5 w-5 text-brand-primary" />
                      <div>
                        <p className="font-semibold text-white">{resource.name}</p>
                        <p className="text-xs text-white/60">{resource.type} · {resource.size}</p>
                      </div>
                    </div>
                    <button className="rounded-full bg-white/10 p-2 text-white transition hover:bg-brand-primary/20">
                      <Icon name="download" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {resourcesCount === 0 && <p className="text-sm text-white/70">No downloadable resources yet.</p>}
              </div>
            </GlassCard>

            <GlassCard title="Other important elements">
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2"><Icon name="shield" className="h-4 w-4 text-brand-primary" /> Secure progress sync across devices.</li>
                <li className="flex items-center gap-2"><Icon name="tv" className="h-4 w-4 text-brand-primary" /> Optimized for desktop, tablets, and mobile screens.</li>
                <li className="flex items-center gap-2"><Icon name="zap" className="h-4 w-4 text-brand-primary" /> Quick-access actions to keep you in flow.</li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearnPage;
