import { Habit } from '@/types';

export const defaultHabits: Habit[] = [
  // Prières
  { id: '6', title: 'Tarawih', icon: 'Moon', category: 'prayer', completed: false },
  { id: '13', title: 'Tahajjud', icon: 'CloudMoon', category: 'prayer', completed: false },
  
  // Coran et Dhikr
  { id: '7', title: 'Lecture Coran', icon: 'BookOpen', category: 'quran', completed: false },
  { id: '14', title: 'Mémorisation Coran', icon: 'BookText', category: 'quran', completed: false },
  { id: '8', title: 'Dhikr', icon: 'Sparkles', category: 'dhikr', completed: false },
  
  // Charité et Jeûne
  { id: '9', title: 'Sadaqa', icon: 'HeartHandshake', category: 'charity', completed: false },
  { id: '10', title: 'Jeûne', icon: 'Droplets', category: 'fasting', completed: false },
  
  // Science et Développement
  { id: '11', title: 'Science religieuse', icon: 'GraduationCap', category: 'science', completed: false },
  { id: '15', title: 'Lecture islamique', icon: 'BookOpenText', category: 'science', completed: false },
  
  // Bonnes actions
  { id: '16', title: 'Bon comportement', icon: 'SmilePlus', category: 'other', completed: false },
];
