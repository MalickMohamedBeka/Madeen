import { create } from 'zustand';
import { QuranProgress } from '@/types';
import { getQuranProgress, saveQuranProgress } from '@/utils/repositories';
import { defaultQuranProgress } from '@/mocks/quran';

interface QuranState {
  quranProgress: QuranProgress;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadQuranProgress: () => Promise<void>;
  incrementQuranPages: () => Promise<void>;
  decrementQuranPages: () => Promise<void>;
  updateQuranProgress: (updates: Partial<QuranProgress>) => Promise<void>;
  
  // Computed
  getTodayProgress: () => number;
  getOverallProgress: () => number;
}

export const useQuranStore = create<QuranState>((set, get) => ({
  quranProgress: defaultQuranProgress,
  isLoading: false,
  error: null,

  loadQuranProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      let progress = await getQuranProgress();
      
      // Si aucune progression en DB, utiliser les valeurs par défaut
      if (!progress) {
        progress = defaultQuranProgress;
        await saveQuranProgress(progress);
      }
      
      set({ quranProgress: progress, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load Quran progress',
        isLoading: false 
      });
    }
  },

  incrementQuranPages: async () => {
    const { quranProgress } = get();
    
    // Validation: ne pas dépasser l'objectif quotidien
    if (quranProgress.pagesReadToday >= quranProgress.dailyGoal) {
      return;
    }
    
    // Validation: ne pas dépasser 604 pages totales
    if (quranProgress.currentPage >= 604) {
      return;
    }
    
    const newProgress: QuranProgress = {
      ...quranProgress,
      pagesReadToday: quranProgress.pagesReadToday + 1,
      currentPage: Math.min(quranProgress.currentPage + 1, 604),
      currentJuz: Math.ceil((quranProgress.currentPage + 1) / 20.13),
      totalPagesRead: quranProgress.totalPagesRead + 1,
    };
    
    set({ quranProgress: newProgress });
    await saveQuranProgress(newProgress);
  },

  decrementQuranPages: async () => {
    const { quranProgress } = get();
    
    // Validation: ne pas descendre en dessous de 0
    if (quranProgress.pagesReadToday <= 0) {
      return;
    }
    
    const newProgress: QuranProgress = {
      ...quranProgress,
      pagesReadToday: Math.max(quranProgress.pagesReadToday - 1, 0),
      currentPage: Math.max(quranProgress.currentPage - 1, 1),
      currentJuz: Math.ceil(Math.max(quranProgress.currentPage - 1, 1) / 20.13),
      totalPagesRead: Math.max(quranProgress.totalPagesRead - 1, 0),
    };
    
    set({ quranProgress: newProgress });
    await saveQuranProgress(newProgress);
  },

  updateQuranProgress: async (updates) => {
    const { quranProgress } = get();
    const newProgress = { ...quranProgress, ...updates };
    
    set({ quranProgress: newProgress });
    await saveQuranProgress(newProgress);
  },

  // Computed values
  getTodayProgress: () => {
    const { quranProgress } = get();
    if (quranProgress.dailyGoal === 0) return 0;
    return Math.min(quranProgress.pagesReadToday / quranProgress.dailyGoal, 1);
  },

  getOverallProgress: () => {
    const { quranProgress } = get();
    return Math.min(quranProgress.currentPage / 604, 1);
  },
}));
