import { create } from 'zustand';
import { Habit } from '@/types';
import { getAllHabits, saveAllHabits, saveHabit, deleteHabit as deleteHabitRepo } from '@/utils/repositories';
import { defaultHabits } from '@/mocks/habits';

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadHabits: () => Promise<void>;
  toggleHabit: (id: string) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'completed' | 'isCustom'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  resetDailyHabits: () => Promise<void>;
  
  // Computed
  getCompletedCount: () => number;
  getTotalCount: () => number;
  getProgressPercentage: () => number;
  getPrayerHabits: () => Habit[];
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  loadHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      let habits = await getAllHabits();
      
      // Si aucune habitude en DB, charger les habitudes par défaut
      if (habits.length === 0) {
        habits = defaultHabits;
        await saveAllHabits(habits);
      }
      
      set({ habits, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load habits',
        isLoading: false 
      });
    }
  },

  toggleHabit: async (id: string) => {
    const { habits } = get();
    const updatedHabits = habits.map(h =>
      h.id === id ? { ...h, completed: !h.completed } : h
    );
    
    set({ habits: updatedHabits });
    
    // Sauvegarder en DB
    const habit = updatedHabits.find(h => h.id === id);
    if (habit) {
      await saveHabit(habit);
    }
  },

  addHabit: async (habitData) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      ...habitData,
      completed: false,
      isCustom: true,
    };
    
    const { habits } = get();
    const updatedHabits = [...habits, newHabit];
    
    set({ habits: updatedHabits });
    await saveHabit(newHabit);
  },

  deleteHabit: async (id: string) => {
    const { habits } = get();
    const updatedHabits = habits.filter(h => h.id !== id);
    
    set({ habits: updatedHabits });
    await deleteHabitRepo(id);
  },

  resetDailyHabits: async () => {
    const { habits } = get();
    const resetHabits = habits.map(h => ({ ...h, completed: false }));
    
    set({ habits: resetHabits });
    await saveAllHabits(resetHabits);
  },

  // Computed values
  getCompletedCount: () => {
    return get().habits.filter(h => h.completed).length;
  },

  getTotalCount: () => {
    return get().habits.length;
  },

  getProgressPercentage: () => {
    const { habits } = get();
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => h.completed).length;
    return completed / habits.length;
  },

  getPrayerHabits: () => {
    return get().habits.filter(h => h.category === 'prayer');
  },
}));
