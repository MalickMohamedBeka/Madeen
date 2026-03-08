import { create } from 'zustand';
import { getSettings, saveSettings } from '@/utils/repositories';
import { setSoundEnabled as setSoundGlobal, setHapticsEnabled as setHapticsGlobal } from '@/utils/sounds';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: true,
  hapticsEnabled: true,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await getSettings();
      
      if (settings) {
        set({ 
          soundEnabled: settings.soundEnabled,
          hapticsEnabled: settings.hapticsEnabled,
          isLoading: false 
        });
        
        // Appliquer les paramètres globalement
        setSoundGlobal(settings.soundEnabled);
        setHapticsGlobal(settings.hapticsEnabled);
      } else {
        // Sauvegarder les paramètres par défaut
        await saveSettings({ soundEnabled: true, hapticsEnabled: true });
        set({ isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false 
      });
    }
  },

  setSoundEnabled: async (enabled: boolean) => {
    set({ soundEnabled: enabled });
    setSoundGlobal(enabled);
    
    const { hapticsEnabled } = get();
    await saveSettings({ soundEnabled: enabled, hapticsEnabled });
  },

  setHapticsEnabled: async (enabled: boolean) => {
    set({ hapticsEnabled: enabled });
    setHapticsGlobal(enabled);
    
    const { soundEnabled } = get();
    await saveSettings({ soundEnabled, hapticsEnabled: enabled });
  },
}));
