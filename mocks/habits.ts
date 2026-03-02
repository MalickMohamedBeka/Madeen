import { Habit } from '@/types';

export const defaultHabits: Habit[] = [
  { id: '1', title: 'Fajr', icon: 'Sunrise', category: 'prayer', completed: false },
  { id: '2', title: 'Dhuhr', icon: 'Sun', category: 'prayer', completed: false },
  { id: '3', title: 'Asr', icon: 'CloudSun', category: 'prayer', completed: false },
  { id: '4', title: 'Maghrib', icon: 'Sunset', category: 'prayer', completed: false },
  { id: '5', title: 'Isha', icon: 'Moon', category: 'prayer', completed: false },
  { id: '6', title: 'Tarawih', icon: 'Star', category: 'prayer', completed: false },
  { id: '7', title: 'Lecture Coran', icon: 'BookOpen', category: 'quran', completed: false },
  { id: '8', title: 'Dhikr', icon: 'Sparkles', category: 'dhikr', completed: false },
  { id: '9', title: 'Sadaqa', icon: 'Heart', category: 'charity', completed: false },
  { id: '10', title: 'Jeûne', icon: 'Droplet', category: 'fasting', completed: false },
  { id: '11', title: 'Science', icon: 'GraduationCap', category: 'science', completed: false },
  { id: '12', title: 'Dua', icon: 'HandHeart', category: 'other', completed: false },
];
