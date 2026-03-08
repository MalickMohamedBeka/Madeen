import { create } from 'zustand';
import { Verse } from '@/types';
import { getAllVerses, saveAllVerses, saveVerse, deleteVerse as deleteVerseRepo } from '@/utils/repositories';
import { sampleVerses } from '@/mocks/verses';

interface VersesState {
  verses: Verse[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadVerses: () => Promise<void>;
  addVerse: (verse: Omit<Verse, 'id' | 'isFavorite' | 'isRead' | 'createdAt'>) => Promise<void>;
  toggleVerseFavorite: (id: string) => Promise<void>;
  toggleVerseRead: (id: string) => Promise<void>;
  deleteVerse: (id: string) => Promise<void>;
  
  // Computed
  getVersesReadCount: () => number;
  getFavoriteVerses: () => Verse[];
}

export const useVersesStore = create<VersesState>((set, get) => ({
  verses: [],
  isLoading: false,
  error: null,

  loadVerses: async () => {
    set({ isLoading: true, error: null });
    try {
      let verses = await getAllVerses();
      
      // Si aucun verset en DB, charger les versets par défaut
      if (verses.length === 0) {
        verses = sampleVerses;
        await saveAllVerses(verses);
      }
      
      set({ verses, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load verses',
        isLoading: false 
      });
    }
  },

  addVerse: async (verseData) => {
    const newVerse: Verse = {
      id: `verse_${Date.now()}`,
      ...verseData,
      isFavorite: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    const { verses } = get();
    const updatedVerses = [...verses, newVerse];
    
    set({ verses: updatedVerses });
    await saveVerse(newVerse);
  },

  toggleVerseFavorite: async (id: string) => {
    const { verses } = get();
    const updatedVerses = verses.map(v =>
      v.id === id ? { ...v, isFavorite: !v.isFavorite } : v
    );
    
    set({ verses: updatedVerses });
    
    const verse = updatedVerses.find(v => v.id === id);
    if (verse) {
      await saveVerse(verse);
    }
  },

  toggleVerseRead: async (id: string) => {
    const { verses } = get();
    const updatedVerses = verses.map(v =>
      v.id === id ? { ...v, isRead: !v.isRead } : v
    );
    
    set({ verses: updatedVerses });
    
    const verse = updatedVerses.find(v => v.id === id);
    if (verse) {
      await saveVerse(verse);
    }
  },

  deleteVerse: async (id: string) => {
    const { verses } = get();
    const updatedVerses = verses.filter(v => v.id !== id);
    
    set({ verses: updatedVerses });
    await deleteVerseRepo(id);
  },

  // Computed values
  getVersesReadCount: () => {
    return get().verses.filter(v => v.isRead).length;
  },

  getFavoriteVerses: () => {
    return get().verses.filter(v => v.isFavorite);
  },
}));
