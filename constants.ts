import { LeaderboardEntry, Task } from './types.ts';
import logoUrl from '/newlogo.svg';

export const pendingTasks: Task[] = [
    { id: 'task-1', text: 'Complete quiz for "Limits and Continuity"', dueDate: '3 days left', courseId: 'iit-1', courseTitle: 'Advanced Calculus for JEE' },
    { id: 'task-2', text: 'Submit assignment for "Rotational Motion"', dueDate: '5 days left', courseId: 'iit-2', courseTitle: 'Mechanics Masterclass' },
    { id: 'task-3', text: 'Watch lecture "Fundamental Rights"', dueDate: 'Tomorrow', courseId: 'upsc-1', courseTitle: 'Indian Polity for UPSC' },
];

export const dailyLeaderboard: LeaderboardEntry[] = [
  { rank: 1, user: { name: 'Sophia Chen', avatar: 'https://i.pravatar.cc/150?u=sophia' }, points: 1250 },
  { rank: 2, user: { name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alexjohnson' }, points: 1100 },
  { rank: 3, user: { name: 'Ben Carter', avatar: 'https://i.pravatar.cc/150?u=ben' }, points: 980 },
  { rank: 4, user: { name: 'Olivia Rodriguez', avatar: 'https://i.pravatar.cc/150?u=olivia' }, points: 950 },
  { rank: 5, user: { name: 'Liam Goldberg', avatar: 'https://i.pravatar.cc/150?u=liam' }, points: 820 },
];

export const allTimeLeaderboard: LeaderboardEntry[] = [
  { rank: 1, user: { name: 'Ethan Williams', avatar: 'https://i.pravatar.cc/150?u=ethan' }, points: 95200 },
  { rank: 2, user: { name: 'Chloe Kim', avatar: 'https://i.pravatar.cc/150?u=chloe' }, points: 89750 },
  { rank: 3, user: { name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alexjohnson' }, points: 84500 },
  { rank: 4, user: { name: 'Noah Patel', avatar: 'https://i.pravatar.cc/150?u=noah' }, points: 78300 },
  { rank: 5, user: { name: 'Isabella Garcia', avatar: 'https://i.pravatar.cc/150?u=isabella' }, points: 75100 },
];

export const LOGO_URL = logoUrl;