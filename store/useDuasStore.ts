import { create } from 'zustand';
import { Dua } from '@/types';
import { getAllDuas, saveAllDuas, saveDua, deleteDua as deleteDuaRepo } from '@/utils/repositories';
import { defaultDuas } from '@/mocks/duas';

interface DuasState {
  duas: Dua[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDuas: () => Promise<void>;
  addDua: (dua: Omit<Dua, 'id' | 'isFavorite' | 'isCustom'>) => Promise<void>;
  toggleDuaFavorite: (id: string) => Promise<void>;
  deleteDua: (id: string) => Promise<void>;
  
  // Computed
  getFavoriteDuas: () => Dua[];
  getFavoriteDuasCount: () => number;
}

export const useDuasStore = create<DuasState>((set, get) => ({
  duas: [],
  isLoading: false,
  error: null,

  loadDuas: async () => {
    set({ isLoading: true, error: null });
    try {
      let duas = await getAllDuas();
      
      // Si aucune dua en DB, charger les duas par défaut
      if (duas.length === 0) {
        duas = defaultDuas;
        await saveAllDuas(duas);
      }
      
      set({ duas, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load duas',
        isLoading: false 
      });
    }
  },

  addDua: async (duaData) => {
    const newDua: Dua = {
      id: `dua_${Date.now()}`,
      ...duaData,
      isFavorite: false,
      isCustom: true,
    };
    
    const { duas } = get();
    const updatedDuas = [...duas, newDua];
    
    set({ duas: updatedDuas });
    await saveDua(newDua);
  },

  toggleDuaFavorite: async (id: string) => {
    const { duas } = get();
    const updatedDuas = duas.map(d =>
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
    );
    
    set({ duas: updatedDuas });
    
    const dua = updatedDuas.find(d => d.id === id);
    if (dua) {
      await saveDua(dua);
    }
  },

  deleteDua: async (id: string) => {
    const { duas } = get();
    const updatedDuas = duas.filter(d => d.id !== id);
    
    set({ duas: updatedDuas });
    await deleteDuaRepo(id);
  },

  // Computed values
  getFavoriteDuas: () => {
    return get().duas.filter(d => d.isFavorite);
  },

  getFavoriteDuasCount: () => {
    return get().duas.filter(d => d.isFavorite).length;
  },
}));
