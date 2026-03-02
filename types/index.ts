export interface Habit {
  id: string;
  title: string;
  icon: string;
  category: 'prayer' | 'quran' | 'dhikr' | 'charity' | 'fasting' | 'science' | 'other';
  completed: boolean;
  isCustom?: boolean;
}

export interface Verse {
  id: string;
  reference: string;
  arabic: string;
  french: string;
  transliteration: string;
  isFavorite: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  french: string;
  target: number;
  count: number;
  category: 'dhikr' | 'after_prayer' | 'anytime' | 'morning' | 'evening';
  reward?: string;
  isCustom?: boolean;
}

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  french: string;
  category: 'ramadan' | 'iftar' | 'suhoor' | 'prayer' | 'protection' | 'forgiveness' | 'general' | 'entry_exit';
  isFavorite: boolean;
  isCustom?: boolean;
}

export interface Prophet {
  id: string;
  nameArabic: string;
  nameFrench: string;
  nameTranslit: string;
  description: string;
  keyEvent: string;
  quranicMention: string;
  order: number;
  isCustom?: boolean;
}

export interface Sahaba {
  id: string;
  nameArabic: string;
  nameFrench: string;
  nameTranslit: string;
  title: string;
  description: string;
  keyContribution: string;
  birthYear?: string;
  deathYear?: string;
  category: 'sahaba' | 'imam' | 'scholar';
  isCustom?: boolean;
}

export interface QuranProgress {
  currentJuz: number;
  currentPage: number;
  pagesReadToday: number;
  dailyGoal: number;
  totalPagesRead: number;
}

export interface StreakData {
  currentStreak: number;
  lastStreakDate: string;
  bestStreak: number;
}

export interface PrayerTime {
  name: string;
  nameArabic: string;
  time: string;
  icon: string;
}

export interface DailyProgress {
  date: string;
  habitsCompleted: number;
  totalHabits: number;
  prayersCompleted: number;
  quranPages: number;
}

export interface UserProfile {
  name: string;
  nameArabic: string;
  city: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
}

export interface Weather {
  temperature: number;
  condition: string;
  icon: string;
  lastUpdated: string;
}
