import { create } from 'zustand';
import { DhikrItem } from '@/types';
import { getAllDhikr, saveAllDhikr, saveDhikr, deleteDhikr as deleteDhikrRepo } from '@/utils/repositories';
import { defaultDhikr } from '@/mocks/dhikr';

interface DhikrState {
  dhikrItems: DhikrItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDhikr: () => Promise<void>;
  incrementDhikr: (id: string) => Promise<void>;
  resetDhikr: (id: string) => Promise<void>;
  resetAllDhikr: () => Promise<void>;
  addDhikr: (dhikr: Omit<DhikrItem, 'id' | 'count' | 'isCustom'>) => Promise<void>;
  deleteDhikr: (id: string) => Promise<void>;
  
  // Computed
  getTotalDhikrCount: () => number;
  getTotalDhikrTarget: () => number;
  getCompletedDhikrCount: () => number;
}

export const useDhikrStore = create<DhikrState>((set, get) => ({
  dhikrItems: [],
  isLoading: false,
  error: null,

  loadDhikr: async () => {
    set({ isLoading: true, error: null });
    try {
      let dhikrItems = await getAllDhikr();
      
      // Si aucun dhikr en DB, charger les dhikr par défaut
      if (dhikrItems.length === 0) {
        dhikrItems = defaultDhikr;
        await saveAllDhikr(dhikrItems);
      }
      
      set({ dhikrItems, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load dhikr',
        isLoading: false 
      });
    }
  },

  incrementDhikr: async (id: string) => {
    const { dhikrItems } = get();
    const updatedItems = dhikrItems.map(item =>
      item.id === id
        ? { ...item, count: Math.min(item.count + 1, item.target) }
        : item
    );
    
    set({ dhikrItems: updatedItems });
    
    const item = updatedItems.find(d => d.id === id);
    if (item) {
      await saveDhikr(item);
    }
  },

  resetDhikr: async (id: string) => {
    const { dhikrItems } = get();
    const updatedItems = dhikrItems.map(item =>
      item.id === id ? { ...item, count: 0 } : item
    );
    
    set({ dhikrItems: updatedItems });
    
    const item = updatedItems.find(d => d.id === id);
    if (item) {
      await saveDhikr(item);
    }
  },

  resetAllDhikr: async () => {
    const { dhikrItems } = get();
    const resetItems = dhikrItems.map(item => ({ ...item, count: 0 }));
    
    set({ dhikrItems: resetItems });
    await saveAllDhikr(resetItems);
  },

  addDhikr: async (dhikrData) => {
    const newDhikr: DhikrItem = {
      id: `dhikr_${Date.now()}`,
      ...dhikrData,
      count: 0,
      isCustom: true,
    };
    
    const { dhikrItems } = get();
    const updatedItems = [...dhikrItems, newDhikr];
    
    set({ dhikrItems: updatedItems });
    await saveDhikr(newDhikr);
  },

  deleteDhikr: async (id: string) => {
    const { dhikrItems } = get();
    const updatedItems = dhikrItems.filter(d => d.id !== id);
    
    set({ dhikrItems: updatedItems });
    await deleteDhikrRepo(id);
  },

  // Computed values
  getTotalDhikrCount: () => {
    return get().dhikrItems.reduce((sum, item) => sum + item.count, 0);
  },

  getTotalDhikrTarget: () => {
    return get().dhikrItems.reduce((sum, item) => sum + item.target, 0);
  },

  getCompletedDhikrCount: () => {
    return get().dhikrItems.filter(item => item.count >= item.target).length;
  },
}));
