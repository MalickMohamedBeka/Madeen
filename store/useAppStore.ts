import { create } from 'zustand';
import { Habit, Verse, DhikrItem, Dua, UserProfile, StreakData } from '@/types';

interface AppState {
  // User
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;

  // Habits
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  toggleHabit: (id: string) => void;
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;

  // Verses
  verses: Verse[];
  setVerses: (verses: Verse[]) => void;
  toggleVerseFavorite: (id: string) => void;
  markVerseAsRead: (id: string) => void;

  // Dhikr
  dhikrItems: DhikrItem[];
  setDhikrItems: (items: DhikrItem[]) => void;
  incrementDhikr: (id: string) => void;
  resetDhikr: (id: string) => void;

  // Duas
  duas: Dua[];
  setDuas: (duas: Dua[]) => void;
  toggleDuaFavorite: (id: string) => void;

  // Streak
  streakData: StreakData;
  updateStreak: () => void;

  // Settings
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;

  // Statistics
  installDate: string;
  dailyStats: Record<string, { habitsCompleted: number; prayersOnTime: number; quranPages: number }>;
  totalHabitsCompleted: number;
  totalPrayersOnTime: number;
  totalQuranPages: number;
  recordDailyStats: (date: string, stats: { habitsCompleted?: number; prayersOnTime?: number; quranPages?: number }) => void;
  incrementHabitsCompleted: () => void;
  incrementPrayersOnTime: () => void;
  addQuranPages: (pages: number) => void;
  clearAllData: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  // Onboarding
  hasCompletedOnboarding: false,
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

  // Habits
  habits: [],
  setHabits: (habits) => set({ habits }),
  toggleHabit: (id) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, completed: !h.completed } : h
      ),
    })),
  addHabit: (habit) =>
    set((state) => ({ habits: [...state.habits, habit] })),
  removeHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),

  // Verses
  verses: [],
  setVerses: (verses) => set({ verses }),
  toggleVerseFavorite: (id) =>
    set((state) => ({
      verses: state.verses.map((v) =>
        v.id === id ? { ...v, isFavorite: !v.isFavorite } : v
      ),
    })),
  markVerseAsRead: (id) =>
    set((state) => ({
      verses: state.verses.map((v) =>
        v.id === id ? { ...v, isRead: true } : v
      ),
    })),

  // Dhikr
  dhikrItems: [],
  setDhikrItems: (items) => set({ dhikrItems: items }),
  incrementDhikr: (id) =>
    set((state) => ({
      dhikrItems: state.dhikrItems.map((item) =>
        item.id === id
          ? { ...item, count: Math.min(item.count + 1, item.target) }
          : item
      ),
    })),
  resetDhikr: (id) =>
    set((state) => ({
      dhikrItems: state.dhikrItems.map((item) =>
        item.id === id ? { ...item, count: 0 } : item
      ),
    })),

  // Duas
  duas: [],
  setDuas: (duas) => set({ duas }),
  toggleDuaFavorite: (id) =>
    set((state) => ({
      duas: state.duas.map((d) =>
        d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
      ),
    })),

  // Streak
  streakData: {
    currentStreak: 0,
    lastStreakDate: '',
    bestStreak: 0,
  },
  updateStreak: () =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = state.streakData.lastStreakDate;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = state.streakData.currentStreak;

      if (lastDate === yesterday) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }

      return {
        streakData: {
          currentStreak: newStreak,
          lastStreakDate: today,
          bestStreak: Math.max(newStreak, state.streakData.bestStreak),
        },
      };
    }),

  // Settings
  soundEnabled: true,
  hapticsEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

  // Statistics
  installDate: new Date().toISOString().split('T')[0],
  dailyStats: {},
  totalHabitsCompleted: 0,
  totalPrayersOnTime: 0,
  totalQuranPages: 0,
  recordDailyStats: (date, stats) =>
    set((state) => ({
      dailyStats: {
        ...state.dailyStats,
        [date]: {
          habitsCompleted: stats.habitsCompleted ?? state.dailyStats[date]?.habitsCompleted ?? 0,
          prayersOnTime: stats.prayersOnTime ?? state.dailyStats[date]?.prayersOnTime ?? 0,
          quranPages: stats.quranPages ?? state.dailyStats[date]?.quranPages ?? 0,
        },
      },
    })),
  incrementHabitsCompleted: () =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const todayStats = state.dailyStats[today] || { habitsCompleted: 0, prayersOnTime: 0, quranPages: 0 };
      return {
        totalHabitsCompleted: state.totalHabitsCompleted + 1,
        dailyStats: {
          ...state.dailyStats,
          [today]: { ...todayStats, habitsCompleted: todayStats.habitsCompleted + 1 },
        },
      };
    }),
  incrementPrayersOnTime: () =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const todayStats = state.dailyStats[today] || { habitsCompleted: 0, prayersOnTime: 0, quranPages: 0 };
      return {
        totalPrayersOnTime: state.totalPrayersOnTime + 1,
        dailyStats: {
          ...state.dailyStats,
          [today]: { ...todayStats, prayersOnTime: todayStats.prayersOnTime + 1 },
        },
      };
    }),
  addQuranPages: (pages) =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const todayStats = state.dailyStats[today] || { habitsCompleted: 0, prayersOnTime: 0, quranPages: 0 };
      return {
        totalQuranPages: state.totalQuranPages + pages,
        dailyStats: {
          ...state.dailyStats,
          [today]: { ...todayStats, quranPages: todayStats.quranPages + pages },
        },
      };
    }),
  clearAllData: () =>
    set({
      userProfile: null,
      hasCompletedOnboarding: false,
      habits: [],
      verses: [],
      dhikrItems: [],
      duas: [],
      streakData: { currentStreak: 0, lastStreakDate: '', bestStreak: 0 },
      dailyStats: {},
      totalHabitsCompleted: 0,
      totalPrayersOnTime: 0,
      totalQuranPages: 0,
      installDate: new Date().toISOString().split('T')[0],
    }),
}));
