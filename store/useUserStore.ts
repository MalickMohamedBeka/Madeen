import { create } from 'zustand';
import { StreakData } from '@/types';
import { getUserProfile, saveUserProfile, getStreakData, saveStreakData } from '@/utils/repositories';

interface UserState {
  userName: string;
  userNameArabic: string;
  streak: StreakData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUserProfile: () => Promise<void>;
  updateUserProfile: (name: string, nameArabic: string) => Promise<void>;
  loadStreak: () => Promise<void>;
  updateStreak: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userName: 'Malick',
  userNameArabic: 'مالك',
  streak: {
    currentStreak: 0,
    lastStreakDate: '',
    bestStreak: 0,
  },
  isLoading: false,
  error: null,

  loadUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await getUserProfile();
      
      if (profile) {
        set({ 
          userName: profile.name,
          userNameArabic: profile.nameArabic,
          isLoading: false 
        });
      } else {
        // Sauvegarder le profil par défaut
        await saveUserProfile('Malick', 'مالك');
        set({ isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load user profile',
        isLoading: false 
      });
    }
  },

  updateUserProfile: async (name: string, nameArabic: string) => {
    set({ userName: name, userNameArabic: nameArabic });
    await saveUserProfile(name, nameArabic);
  },

  loadStreak: async () => {
    try {
      const streakData = await getStreakData();
      
      if (streakData) {
        set({ streak: streakData });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load streak'
      });
    }
  },

  updateStreak: async () => {
    const { streak } = get();
    const today = new Date().toISOString().split('T')[0];
    const lastDate = streak.lastStreakDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = streak.currentStreak;

    // Si dernier streak était hier, incrémenter
    if (lastDate === yesterday) {
      newStreak += 1;
    } 
    // Si dernier streak n'était pas aujourd'hui, reset à 1
    else if (lastDate !== today) {
      newStreak = 1;
    }
    // Si dernier streak était aujourd'hui, ne rien faire
    else {
      return;
    }

    const newStreakData: StreakData = {
      currentStreak: newStreak,
      lastStreakDate: today,
      bestStreak: Math.max(newStreak, streak.bestStreak),
    };

    set({ streak: newStreakData });
    await saveStreakData(newStreakData);
  },
}));
