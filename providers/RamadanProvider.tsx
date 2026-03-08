import React, { useEffect, useState, useCallback, useMemo, useRef, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Habit, Verse, DhikrItem, Dua, Prophet, QuranProgress, StreakData, UserLocation, Weather, Sahaba } from '@/types';
import { defaultHabits } from '@/mocks/habits';
import { enrichedVerses } from '@/mocks/verses-enriched';
import { sampleVerses } from '@/mocks/verses';
import { defaultDhikr } from '@/mocks/dhikr';
import { defaultDuas } from '@/mocks/duas';
import { prophets as defaultProphets } from '@/mocks/prophets';
import { sahabas as defaultSahabas } from '@/mocks/sahabas';
import { defaultQuranProgress } from '@/mocks/quran';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { PrayerTimeEntry } from '@/utils/prayerTimes';

// Import repositories
import {
  getAllHabits,
  saveAllHabits,
  getAllVerses,
  saveAllVerses,
  getAllDhikr,
  saveAllDhikr,
  getAllDuas,
  saveAllDuas,
  getAllProphets,
  saveAllProphets,
  getAllSahabas,
  saveAllSahabas,
  getQuranProgress,
  saveQuranProgress,
  getStreakData,
  saveStreakData,
  getUserProfile,
  saveUserProfile,
  getLocationCache,
  saveLocationCache,
  getWeatherCache,
  saveWeatherCache,
  getPrayerTimesCache,
  savePrayerTimesCache,
  getLastResetDate,
  saveLastResetDate,
} from '@/utils/repositories';

import { logger } from '@/utils/logger';

// Import APIs
import {
  fetchPrayerTimesAPI,
  fetchWeatherAPI,
  translateToArabicAPI,
  reverseGeocodeAPI,
} from '@/utils/api';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Helper function for translation with API
async function translateToArabic(text: string): Promise<{ arabic: string; transliteration: string }> {
  try {
    const result = await translateToArabicAPI(text);
    if (result) {
      return result;
    }
    // Fallback
    return { arabic: text, transliteration: text };
  } catch (err) {
    console.error('[Translation] Error:', err);
    return { arabic: text, transliteration: text };
  }
}

type RamadanContextType = ReturnType<typeof useRamadanContext>;

const RamadanContext = createContext<RamadanContextType | null>(null);

export function useRamadan() {
  const context = useContext(RamadanContext);
  if (!context) {
    throw new Error('useRamadan must be used within RamadanProvider');
  }
  return context;
}

function useRamadanContext() {
  // ⚠️ TODO: REFACTORING NEEDED - Too many states in one provider
  // This provider should be split into smaller, focused providers or use Zustand stores
  // See docs/CODE_SMELLS_FIXES.md for detailed refactoring plan
  // Current stores available: useHabitsStore, useVersesStore, useDhikrStore, etc.
  
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [verses, setVerses] = useState<Verse[]>(sampleVerses);
  const [dhikrItems, setDhikrItems] = useState<DhikrItem[]>(defaultDhikr);
  const [duas, setDuas] = useState<Dua[]>(defaultDuas);
  const [prophetsList, setProphetsList] = useState<Prophet[]>(defaultProphets);
  const [sahabasList, setSahabasList] = useState<Sahaba[]>(defaultSahabas);
  const [userName, setUserName] = useState<string>('Malick');
  const [userNameArabic, setUserNameArabic] = useState<string>('مالك');
  const [quranProgress, setQuranProgress] = useState<QuranProgress>(defaultQuranProgress);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastStreakDate: '', bestStreak: 0 });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeEntry[] | null>(null);
  const midnightCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const habits = await getAllHabits();
      
      // If no habits in DB, use defaults
      if (habits.length === 0) {
        await saveAllHabits(defaultHabits);
        return defaultHabits;
      }
      
      // Migration: Fix "Doua" to "Dua" and merge Dhikr matin/soir
      let needsUpdate = false;
      
      const hadDhikrMatin = habits.some(h => h.title === 'Dhikr matin');
      const hadDhikrSoir = habits.some(h => h.title === 'Dhikr soir');
      
      let updatedHabits = habits
        .map(h => {
          if (h.title === 'Doua') {
            needsUpdate = true;
            return { ...h, title: 'Dua' };
          }
          return h;
        })
        .filter(h => h.title !== 'Dhikr matin' && h.title !== 'Dhikr soir');
      
      if ((hadDhikrMatin || hadDhikrSoir) && !updatedHabits.find(h => h.title === 'Dhikr')) {
        needsUpdate = true;
        updatedHabits.push({ 
          id: Date.now().toString(), 
          title: 'Dhikr', 
          icon: 'Sparkles', 
          category: 'dhikr', 
          completed: false 
        });
      }
      
      if (!updatedHabits.find(h => h.title === 'Science')) {
        needsUpdate = true;
        updatedHabits.push({ 
          id: (Date.now() + 1).toString(), 
          title: 'Science', 
          icon: 'GraduationCap', 
          category: 'science', 
          completed: false 
        });
      }
      
      if (needsUpdate) {
        await saveAllHabits(updatedHabits);
        logger.debug('[Habits] Migration completed:', updatedHabits.map(h => h.title).join(', '));
      }
      
      return updatedHabits;
    },
  });

  const versesQuery = useQuery({
    queryKey: ['verses'],
    queryFn: async () => {
      const verses = await getAllVerses();
      if (verses.length > 0) {
        return verses.map(v => ({ ...v, isRead: v.isRead ?? false }));
      }
      // Use enriched verses as default
      await saveAllVerses(enrichedVerses);
      return enrichedVerses;
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const profile = await getUserProfile();
      return profile || { name: 'Malick', nameArabic: 'مالك' };
    },
  });

  const dhikrQuery = useQuery({
    queryKey: ['dhikr'],
    queryFn: async () => {
      const dhikr = await getAllDhikr();
      if (dhikr.length > 0) return dhikr;
      await saveAllDhikr(defaultDhikr);
      return defaultDhikr;
    },
  });

  const duasQuery = useQuery({
    queryKey: ['duas'],
    queryFn: async () => {
      const duas = await getAllDuas();
      if (duas.length > 0) return duas;
      await saveAllDuas(defaultDuas);
      return defaultDuas;
    },
  });

  const prophetsQuery = useQuery({
    queryKey: ['prophets'],
    queryFn: async () => {
      const prophets = await getAllProphets();
      if (prophets.length > 0) return prophets;
      await saveAllProphets(defaultProphets);
      return defaultProphets;
    },
  });

  const sahabasQuery = useQuery({
    queryKey: ['sahabas'],
    queryFn: async () => {
      const sahabas = await getAllSahabas();
      if (sahabas.length > 0) return sahabas;
      await saveAllSahabas(defaultSahabas);
      return defaultSahabas;
    },
  });

  const weatherQuery = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      return await getWeatherCache();
    },
  });

  const quranQuery = useQuery({
    queryKey: ['quran'],
    queryFn: async () => {
      const progress = await getQuranProgress();
      if (progress) return progress;
      await saveQuranProgress(defaultQuranProgress);
      return defaultQuranProgress;
    },
  });

  const streakQuery = useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const streak = await getStreakData();
      if (streak) return streak;
      const defaultStreak = { currentStreak: 0, lastStreakDate: '', bestStreak: 0 };
      await saveStreakData(defaultStreak);
      return defaultStreak;
    },
  });

  const locationQuery = useQuery({
    queryKey: ['location'],
    queryFn: async () => {
      return await getLocationCache();
    },
  });

  useEffect(() => { if (habitsQuery.data) setHabits(habitsQuery.data); }, [habitsQuery.data]);
  useEffect(() => { if (versesQuery.data) setVerses(versesQuery.data); }, [versesQuery.data]);
  useEffect(() => {
    if (profileQuery.data) {
      setUserName(profileQuery.data.name);
      setUserNameArabic(profileQuery.data.nameArabic || 'مالك');
    }
  }, [profileQuery.data]);
  useEffect(() => { if (dhikrQuery.data) setDhikrItems(dhikrQuery.data); }, [dhikrQuery.data]);
  useEffect(() => { if (duasQuery.data) setDuas(duasQuery.data); }, [duasQuery.data]);
  useEffect(() => { if (prophetsQuery.data) setProphetsList(prophetsQuery.data); }, [prophetsQuery.data]);
  useEffect(() => { if (sahabasQuery.data) setSahabasList(sahabasQuery.data); }, [sahabasQuery.data]);
  useEffect(() => { if (weatherQuery.data) setWeather(weatherQuery.data); }, [weatherQuery.data]);
  useEffect(() => { if (quranQuery.data) setQuranProgress(quranQuery.data); }, [quranQuery.data]);
  useEffect(() => { if (streakQuery.data) setStreak(streakQuery.data); }, [streakQuery.data]);
  useEffect(() => { if (locationQuery.data) setUserLocation(locationQuery.data); }, [locationQuery.data]);

  const syncHabits = useMutation({ mutationFn: async (updated: Habit[]) => { await saveAllHabits(updated); return updated; } });
  const syncVerses = useMutation({ mutationFn: async (updated: Verse[]) => { await saveAllVerses(updated); return updated; } });
  const syncProfile = useMutation({ mutationFn: async (data: { name: string; nameArabic: string }) => { await saveUserProfile(data.name, data.nameArabic); return data; } });
  const syncDhikr = useMutation({ mutationFn: async (updated: DhikrItem[]) => { await saveAllDhikr(updated); return updated; } });
  const syncDuas = useMutation({ mutationFn: async (updated: Dua[]) => { await saveAllDuas(updated); return updated; } });
  const syncProphets = useMutation({ mutationFn: async (updated: Prophet[]) => { await saveAllProphets(updated); return updated; } });
  const syncSahabas = useMutation({ mutationFn: async (updated: Sahaba[]) => { await saveAllSahabas(updated); return updated; } });
  const syncQuran = useMutation({ mutationFn: async (updated: QuranProgress) => { await saveQuranProgress(updated); return updated; } });
  const syncStreak = useMutation({ mutationFn: async (updated: StreakData) => { await saveStreakData(updated); return updated; } });
  const syncLocation = useMutation({ mutationFn: async (loc: UserLocation) => { await saveLocationCache(loc); return loc; } });
  const syncWeather = useMutation({ mutationFn: async (w: Weather) => { await saveWeatherCache(w); return w; } });

  useEffect(() => {
    const checkAndResetDaily = async () => {
      const today = getTodayString();
      const lastReset = await getLastResetDate();
      if (lastReset !== today) {
        logger.debug('[RamadanProvider] Midnight reset triggered for', today);
        await saveLastResetDate(today);

        setHabits(prev => {
          const updated = prev.map(h => ({ ...h, completed: false }));
          syncHabits.mutate(updated);
          return updated;
        });

        setDhikrItems(prev => {
          const updated = prev.map(d => ({ ...d, count: 0 }));
          syncDhikr.mutate(updated);
          return updated;
        });

        setVerses(prev => {
          const updated = prev.map(v => ({ ...v, isRead: false }));
          syncVerses.mutate(updated);
          return updated;
        });

        setQuranProgress(prev => {
          const updated = { ...prev, pagesReadToday: 0 };
          syncQuran.mutate(updated);
          return updated;
        });
      }
    };

    checkAndResetDaily();

    midnightCheckRef.current = setInterval(() => {
      checkAndResetDaily();
    }, 60000);

    return () => {
      if (midnightCheckRef.current) clearInterval(midnightCheckRef.current);
    };
  }, []);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            logger.debug('[Location] Requesting web geolocation...');
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                // Try to get city name from API
                let city = 'Ma position';
                try {
                  const geocode = await reverseGeocodeAPI(position.coords.latitude, position.coords.longitude);
                  if (geocode) {
                    city = geocode.city;
                  }
                } catch (err) {
                  logger.debug('[Location] Geocoding error', 'Location', err);
                }
                
                const loc: UserLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  city,
                };
                setUserLocation(loc);
                syncLocation.mutate(loc);
                logger.debug('[Location] Web location obtained', 'Location', loc);
              },
              (err) => {
                logger.debug('[Location] Web geolocation error:', err.message);
                // Fallback to Rabat, Morocco coordinates
                const fallbackLoc: UserLocation = {
                  latitude: 34.0209,
                  longitude: -6.8416,
                  city: 'Rabat',
                };
                setUserLocation(fallbackLoc);
                syncLocation.mutate(fallbackLoc);
              },
              {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 0
              }
            );
          } else {
            // Fallback to Rabat, Morocco coordinates
            const fallbackLoc: UserLocation = {
              latitude: 34.0209,
              longitude: -6.8416,
              city: 'Rabat',
            };
            setUserLocation(fallbackLoc);
            syncLocation.mutate(fallbackLoc);
          }
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            let city = 'Ma position';
            
            // Try API first, then fallback to Expo Location
            try {
              const geocode = await reverseGeocodeAPI(position.coords.latitude, position.coords.longitude);
              if (geocode) {
                city = geocode.city;
              }
            } catch (apiErr) {
              logger.debug('[Location] API geocode error, trying Expo', 'Location', apiErr);
              try {
                const reverseGeo = await Location.reverseGeocodeAsync({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
                if (reverseGeo.length > 0 && reverseGeo[0].city) {
                  city = reverseGeo[0].city;
                }
              } catch (expoErr) {
                logger.debug('[Location] Expo reverse geocode error', 'Location', expoErr);
              }
            }
            
            const loc: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city,
            };
            setUserLocation(loc);
            syncLocation.mutate(loc);
            logger.debug('[Location] Native location', 'Location', loc);
          } else {
            logger.debug('[Location] Permission denied');
          }
        }
      } catch (err) {
        logger.debug('[Location] Error', 'Location', err);
        // Fallback to Rabat, Morocco coordinates
        const fallbackLoc: UserLocation = {
          latitude: 34.0209,
          longitude: -6.8416,
          city: 'Rabat',
        };
        setUserLocation(fallbackLoc);
        syncLocation.mutate(fallbackLoc);
      }
    };

    requestLocation();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!userLocation) return;
      
      try {
        // Check cache first
        const cached = await getWeatherCache();
        if (cached) {
          logger.debug('[Weather] Using cached weather');
          setWeather(cached);
          return;
        }

        // Fetch from API
        logger.debug(`[Weather] Fetching from API for ${userLocation.city}`);
        const weatherData = await fetchWeatherAPI(userLocation.latitude, userLocation.longitude);
        
        if (weatherData) {
          const weather: Weather = {
            temperature: weatherData.temperature,
            condition: weatherData.condition,
            icon: weatherData.icon,
            lastUpdated: new Date().toISOString(),
          };
          setWeather(weather);
          syncWeather.mutate(weather);
          logger.debug('[Weather] Fetched from API', 'Weather', weather);
        }
      } catch (err) {
        console.error('[Weather] Fetch error:', err);
        // Keep cached weather if available
        if (weather) {
          logger.debug('[Weather] Using stale cache due to error');
        }
      }
    };

    if (userLocation) {
      fetchWeather();
    }
  }, [userLocation]);

  // Fetch prayer times from API
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      if (!userLocation) return;
      
      try {
        // Check cache first
        const cached = await getPrayerTimesCache();
        const today = getTodayString();
        
        if (cached && cached.date === today && cached.times && cached.times.length > 0) {
          logger.debug(`[PrayerTimes] Using cached times: ${cached.times.length} prayers`);
          setPrayerTimes(cached.times);
          return;
        }

        // Fetch from API
        logger.debug(`[PrayerTimes] Fetching from API for ${userLocation.city}`);
        const result = await fetchPrayerTimesAPI(
          userLocation.latitude,
          userLocation.longitude
        );
        
        if (result && result.times && result.times.length > 0) {
          setPrayerTimes(result.times);
          await savePrayerTimesCache(result.times, result.date);
          logger.debug('[PrayerTimes] Fetched from API:', result.times.map(t => `${t.name}: ${t.time}`).join(', '));
        } else {
          console.error('[PrayerTimes] API returned empty or null times');
          // Keep cached times if available
          if (cached && cached.times) {
            logger.debug('[PrayerTimes] Using stale cache due to API error');
            setPrayerTimes(cached.times);
          }
        }
      } catch (err) {
        console.error('[PrayerTimes] Fetch error:', err);
        // Try to use cached times even if expired
        try {
          const cached = await getPrayerTimesCache();
          if (cached && cached.times) {
            logger.debug('[PrayerTimes] Using stale cache due to error');
            setPrayerTimes(cached.times);
          }
        } catch (cacheErr) {
          console.error('[PrayerTimes] Cache read error:', cacheErr);
        }
      }
    };

    if (userLocation) {
      fetchPrayerTimes();
    }
  }, [userLocation]);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const checkAndUpdateStreak = useCallback((currentHabits: Habit[]) => {
    const total = currentHabits.length;
    const completed = currentHabits.filter(h => h.completed).length;
    const progress = total > 0 ? completed / total : 0;
    const today = getTodayString();

    if (progress >= 0.8) {
      setStreak(prev => {
        // Si déjà mis à jour aujourd'hui, ne rien faire
        if (prev.lastStreakDate === today) {
          return prev;
        }
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Si le dernier streak était hier, on continue
        if (prev.lastStreakDate === yesterday) {
          const newStreak = prev.currentStreak + 1;
          const bestStreak = Math.max(prev.bestStreak, newStreak);
          const updated: StreakData = { 
            currentStreak: newStreak, 
            lastStreakDate: today, 
            bestStreak 
          };
          syncStreak.mutate(updated);
          logger.debug('[Streak] Continued', 'Streak', updated);
          return updated;
        } 
        // Sinon, on recommence à 1
        else {
          const updated: StreakData = { 
            currentStreak: 1, 
            lastStreakDate: today, 
            bestStreak: prev.bestStreak 
          };
          syncStreak.mutate(updated);
          logger.debug('[Streak] Restarted', 'Streak', updated);
          return updated;
        }
      });
    }
  }, []);

  const toggleHabit = useCallback((id: string) => {
    triggerHaptic();
    setHabits(prev => {
      const updated = prev.map(h =>
        h.id === id ? { ...h, completed: !h.completed } : h
      );
      syncHabits.mutate(updated);
      setTimeout(() => checkAndUpdateStreak(updated), 100);
      return updated;
    });
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'completed' | 'isCustom'>) => {
    // Validation: vérifier que le titre n'est pas vide
    if (!habit.title || habit.title.trim() === '') {
      console.error('[Habit] Cannot add habit with empty title');
      return;
    }
    
    // Validation: vérifier que l'habitude n'existe pas déjà
    const exists = habits.some(h => h.title.toLowerCase() === habit.title.toLowerCase());
    if (exists) {
      console.error('[Habit] Habit already exists:', habit.title);
      return;
    }
    
    const newHabit: Habit = { 
      ...habit, 
      id: Date.now().toString(), 
      completed: false, 
      isCustom: true 
    };
    setHabits(prev => { 
      const updated = [...prev, newHabit]; 
      syncHabits.mutate(updated); 
      return updated; 
    });
  }, [habits]);

  const deleteHabit = useCallback((id: string) => {
    triggerHaptic();
    setHabits(prev => { const updated = prev.filter(h => h.id !== id); syncHabits.mutate(updated); return updated; });
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Omit<Habit, 'id' | 'completed'>>) => {
    setHabits(prev => {
      const updated = prev.map(h => 
        h.id === id ? { ...h, ...updates } : h
      );
      syncHabits.mutate(updated);
      return updated;
    });
  }, []);

  const addVerse = useCallback((verse: Omit<Verse, 'id' | 'createdAt' | 'isFavorite' | 'isRead'>) => {
    // Validation: vérifier que le texte arabe n'est pas vide
    if (!verse.arabic || verse.arabic.trim() === '') {
      console.error('[Verse] Cannot add verse with empty arabic text');
      return;
    }
    
    // Validation: vérifier la référence
    if (!verse.reference || verse.reference.trim() === '') {
      console.error('[Verse] Cannot add verse without reference');
      return;
    }
    
    const newVerse: Verse = { 
      ...verse, 
      id: Date.now().toString(), 
      isFavorite: false, 
      isRead: false, 
      createdAt: new Date().toISOString().split('T')[0] 
    };
    setVerses(prev => { 
      const updated = [newVerse, ...prev]; 
      syncVerses.mutate(updated); 
      return updated; 
    });
  }, []);

  const toggleVerseFavorite = useCallback((id: string) => {
    triggerHaptic();
    setVerses(prev => { const updated = prev.map(v => v.id === id ? { ...v, isFavorite: !v.isFavorite } : v); syncVerses.mutate(updated); return updated; });
  }, []);

  const toggleVerseRead = useCallback((id: string) => {
    triggerHaptic();
    setVerses(prev => { const updated = prev.map(v => v.id === id ? { ...v, isRead: !v.isRead } : v); syncVerses.mutate(updated); return updated; });
  }, []);

  const deleteVerse = useCallback((id: string) => {
    setVerses(prev => { const updated = prev.filter(v => v.id !== id); syncVerses.mutate(updated); return updated; });
  }, []);

  const incrementDhikr = useCallback((id: string) => {
    triggerHaptic();
    setDhikrItems(prev => { 
      const updated = prev.map(d => {
        if (d.id === id) {
          // Validation: ne pas dépasser la cible
          const newCount = Math.min(d.count + 1, d.target);
          if (newCount === d.count) {
            logger.debug('[Dhikr] Target already reached for', d.french);
          }
          return { ...d, count: newCount };
        }
        return d;
      }); 
      syncDhikr.mutate(updated); 
      return updated; 
    });
  }, []);

  const resetDhikr = useCallback((id: string) => {
    setDhikrItems(prev => { const updated = prev.map(d => d.id === id ? { ...d, count: 0 } : d); syncDhikr.mutate(updated); return updated; });
  }, []);

  const resetAllDhikr = useCallback(() => {
    setDhikrItems(prev => { const updated = prev.map(d => ({ ...d, count: 0 })); syncDhikr.mutate(updated); return updated; });
  }, []);

  const addDhikr = useCallback(async (dhikr: Omit<DhikrItem, 'id' | 'count' | 'isCustom'>) => {
    // Validation: vérifier que le texte français n'est pas vide
    if (!dhikr.french || dhikr.french.trim() === '') {
      console.error('[Dhikr] Cannot add dhikr with empty french text');
      return;
    }
    
    // Validation: vérifier que la cible est valide
    if (!dhikr.target || dhikr.target <= 0) {
      console.error('[Dhikr] Invalid target:', dhikr.target);
      return;
    }
    
    // Auto-translate if arabic or transliteration is missing
    let finalDhikr = { ...dhikr };
    
    if (dhikr.french && (!dhikr.arabic || !dhikr.transliteration)) {
      try {
        const translation = await translateToArabic(dhikr.french);
        finalDhikr = {
          ...dhikr,
          arabic: dhikr.arabic || translation.arabic,
          transliteration: dhikr.transliteration || translation.transliteration,
        };
        logger.debug('[AddDhikr] Auto-translated', 'AddDhikr', finalDhikr);
      } catch (err) {
        logger.debug('[AddDhikr] Translation failed', 'AddDhikr', err);
      }
    }
    
    const newDhikr: DhikrItem = { 
      ...finalDhikr, 
      id: Date.now().toString(), 
      count: 0, 
      isCustom: true 
    };
    setDhikrItems(prev => { 
      const updated = [...prev, newDhikr]; 
      syncDhikr.mutate(updated); 
      return updated; 
    });
  }, []);

  const deleteDhikr = useCallback((id: string) => {
    triggerHaptic();
    setDhikrItems(prev => { const updated = prev.filter(d => d.id !== id); syncDhikr.mutate(updated); return updated; });
  }, []);

  const updateDhikr = useCallback((id: string, updates: Partial<Omit<DhikrItem, 'id' | 'count'>>) => {
    setDhikrItems(prev => {
      const updated = prev.map(d => 
        d.id === id ? { ...d, ...updates } : d
      );
      syncDhikr.mutate(updated);
      return updated;
    });
  }, []);

  const toggleDuaFavorite = useCallback((id: string) => {
    triggerHaptic();
    setDuas(prev => { const updated = prev.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d); syncDuas.mutate(updated); return updated; });
  }, []);

  const addDua = useCallback(async (dua: Omit<Dua, 'id' | 'isFavorite' | 'isCustom'>) => {
    // Validation: vérifier que le texte français n'est pas vide
    if (!dua.french || dua.french.trim() === '') {
      console.error('[Dua] Cannot add dua with empty french text');
      return;
    }
    
    // Auto-translate if arabic or transliteration is missing
    let finalDua = { ...dua };
    
    if (dua.french && (!dua.arabic || !dua.transliteration)) {
      try {
        const translation = await translateToArabic(dua.french);
        finalDua = {
          ...dua,
          arabic: dua.arabic || translation.arabic,
          transliteration: dua.transliteration || translation.transliteration,
        };
        logger.debug('[AddDua] Auto-translated', 'AddDua', finalDua);
      } catch (err) {
        logger.debug('[AddDua] Translation failed, using original', 'AddDua', err);
      }
    }
    
    const newDua: Dua = { 
      ...finalDua, 
      id: Date.now().toString(), 
      isFavorite: false, 
      isCustom: true 
    };
    setDuas(prev => { 
      const updated = [...prev, newDua]; 
      syncDuas.mutate(updated); 
      return updated; 
    });
  }, []);

  const deleteDua = useCallback((id: string) => {
    triggerHaptic();
    setDuas(prev => { const updated = prev.filter(d => d.id !== id); syncDuas.mutate(updated); return updated; });
  }, []);

  const updateDua = useCallback((id: string, updates: Partial<Omit<Dua, 'id' | 'isFavorite'>>) => {
    setDuas(prev => {
      const updated = prev.map(d => 
        d.id === id ? { ...d, ...updates } : d
      );
      syncDuas.mutate(updated);
      return updated;
    });
  }, []);

  const addProphet = useCallback(async (prophet: Omit<Prophet, 'id' | 'isCustom'>) => {
    // Auto-translate name if arabic or transliteration is missing
    let finalProphet = { ...prophet };
    
    if (prophet.nameFrench && (!prophet.nameArabic || !prophet.nameTranslit)) {
      try {
        const translation = await translateToArabic(prophet.nameFrench);
        finalProphet = {
          ...prophet,
          nameArabic: prophet.nameArabic || translation.arabic,
          nameTranslit: prophet.nameTranslit || translation.transliteration,
        };
        logger.debug('[AddProphet] Auto-translated name', 'AddProphet', finalProphet);
      } catch (err) {
        logger.debug('[AddProphet] Translation failed', 'AddProphet', err);
      }
    }
    
    const newProphet: Prophet = { ...finalProphet, id: Date.now().toString(), isCustom: true };
    setProphetsList(prev => { const updated = [...prev, newProphet]; syncProphets.mutate(updated); return updated; });
  }, []);

  const updateProphet = useCallback((id: string, data: Partial<Prophet>) => {
    setProphetsList(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      syncProphets.mutate(updated);
      return updated;
    });
  }, []);

  const deleteProphet = useCallback((id: string) => {
    triggerHaptic();
    setProphetsList(prev => { const updated = prev.filter(p => p.id !== id); syncProphets.mutate(updated); return updated; });
  }, []);

  const addSahaba = useCallback(async (sahaba: Omit<Sahaba, 'id' | 'isCustom'>) => {
    // Auto-translate name if arabic or transliteration is missing
    let finalSahaba = { ...sahaba };
    
    if (sahaba.nameFrench && (!sahaba.nameArabic || !sahaba.nameTranslit)) {
      try {
        const translation = await translateToArabic(sahaba.nameFrench);
        finalSahaba = {
          ...sahaba,
          nameArabic: sahaba.nameArabic || translation.arabic,
          nameTranslit: sahaba.nameTranslit || translation.transliteration,
        };
        logger.debug('[AddSahaba] Auto-translated name', 'AddSahaba', finalSahaba);
      } catch (err) {
        logger.debug('[AddSahaba] Translation failed', 'AddSahaba', err);
      }
    }
    
    const newSahaba: Sahaba = { ...finalSahaba, id: Date.now().toString(), isCustom: true };
    setSahabasList(prev => { const updated = [...prev, newSahaba]; syncSahabas.mutate(updated); return updated; });
  }, []);

  const updateSahaba = useCallback((id: string, data: Partial<Sahaba>) => {
    setSahabasList(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...data } : s);
      syncSahabas.mutate(updated);
      return updated;
    });
  }, []);

  const deleteSahaba = useCallback((id: string) => {
    triggerHaptic();
    setSahabasList(prev => { const updated = prev.filter(s => s.id !== id); syncSahabas.mutate(updated); return updated; });
  }, []);

  const updateUserName = useCallback(async (name: string, nameAr?: string) => {
    // Validation: vérifier que le nom n'est pas vide
    if (!name || name.trim() === '') {
      console.error('[UserName] Cannot set empty name');
      return;
    }
    
    // Validation: limiter la longueur
    if (name.length > 50) {
      console.error('[UserName] Name too long (max 50 characters)');
      return;
    }
    
    setUserName(name);
    
    // Auto-translate name to Arabic if not provided
    if (!nameAr && name) {
      try {
        logger.debug('[UpdateUserName] Translating:', name);
        const translation = await translateToArabic(name);
        nameAr = translation.arabic;
        logger.debug(`[UpdateUserName] Auto-translated: ${name} → ${nameAr}`);
        
        // If translation returned the same text (failed), try word by word
        if (nameAr === name) {
          logger.debug('[UpdateUserName] Translation returned same text, trying word by word');
          const words = name.split(' ');
          const translatedWords = await Promise.all(
            words.map(async (word) => {
              try {
                const result = await translateToArabic(word);
                return result.arabic;
              } catch {
                return word;
              }
            })
          );
          nameAr = translatedWords.join(' ');
          logger.debug('[UpdateUserName] Word by word result:', nameAr);
        }
      } catch (err) {
        logger.debug('[UpdateUserName] Translation failed, keeping old name', 'UpdateUserName', err);
        nameAr = userNameArabic; // Keep existing Arabic name if translation fails
      }
    }
    
    setUserNameArabic(nameAr || userNameArabic);
    syncProfile.mutate({ name, nameArabic: nameAr || userNameArabic });
  }, [userNameArabic]);

  const resetDailyHabits = useCallback(() => {
    setHabits(prev => { const updated = prev.map(h => ({ ...h, completed: false })); syncHabits.mutate(updated); return updated; });
  }, []);

  const updateQuranProgress = useCallback((update: Partial<QuranProgress>) => {
    setQuranProgress(prev => { const updated = { ...prev, ...update }; syncQuran.mutate(updated); return updated; });
  }, []);

  const incrementQuranPages = useCallback(() => {
    triggerHaptic();
    setQuranProgress(prev => {
      // Validation: ne pas dépasser l'objectif quotidien
      if (prev.pagesReadToday >= prev.dailyGoal) {
        logger.debug('[QuranProgress] Daily goal already reached');
        return prev;
      }
      
      // Validation: ne pas dépasser 604 pages totales
      if (prev.currentPage >= 604) {
        logger.debug('[QuranProgress] Already at last page of Quran');
        return prev;
      }
      
      const newPagesRead = prev.pagesReadToday + 1;
      const newTotalPages = prev.totalPagesRead + 1;
      const newCurrentPage = Math.min(prev.currentPage + 1, 604);
      
      // Calcul correct du Juz: 604 pages / 30 juz = ~20.13 pages par juz
      const newCurrentJuz = Math.min(Math.ceil(newCurrentPage / 20.13), 30);
      
      const updated: QuranProgress = {
        ...prev,
        pagesReadToday: newPagesRead,
        totalPagesRead: newTotalPages,
        currentPage: newCurrentPage,
        currentJuz: newCurrentJuz,
      };
      syncQuran.mutate(updated);
      return updated;
    });
  }, []);

  const decrementQuranPages = useCallback(() => {
    setQuranProgress(prev => {
      // Validation: ne pas descendre en dessous de 0 page
      if (prev.currentPage <= 0) {
        logger.debug('[QuranProgress] Cannot go below page 0');
        return prev;
      }
      
      // Validation: ne pas descendre en dessous de 0 pages aujourd'hui
      if (prev.pagesReadToday <= 0) {
        logger.debug('[QuranProgress] Already at 0 pages today');
        return prev;
      }
      
      const newPagesRead = prev.pagesReadToday - 1;
      const newTotalPages = Math.max(0, prev.totalPagesRead - 1);
      const newCurrentPage = Math.max(0, prev.currentPage - 1);
      
      // Calcul correct du Juz: 604 pages / 30 juz = ~20.13 pages par juz
      const newCurrentJuz = newCurrentPage === 0 ? 1 : Math.min(Math.ceil(newCurrentPage / 20.13), 30);
      
      const updated: QuranProgress = {
        ...prev,
        pagesReadToday: newPagesRead,
        totalPagesRead: newTotalPages,
        currentPage: newCurrentPage,
        currentJuz: newCurrentJuz,
      };
      syncQuran.mutate(updated);
      return updated;
    });
  }, []);

  const resetQuranProgress = useCallback(() => {
    const resetProgress: QuranProgress = {
      currentPage: 0,
      currentJuz: 1,
      totalPagesRead: 0,
      pagesReadToday: 0,
      dailyGoal: quranProgress.dailyGoal, // Keep the daily goal
    };
    setQuranProgress(resetProgress);
    syncQuran.mutate(resetProgress);
    logger.debug('[QuranProgress] Progress reset to 0/604');
  }, [quranProgress.dailyGoal]);

  const refreshLocation = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          logger.debug('[Location] Requesting fresh web geolocation...');
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              let city = 'Ma position';
              try {
                const geocode = await reverseGeocodeAPI(position.coords.latitude, position.coords.longitude);
                if (geocode) {
                  city = geocode.city;
                }
              } catch (err) {
                logger.debug('[Location] Geocoding error', 'Location', err);
              }
              
              const loc: UserLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city,
              };
              setUserLocation(loc);
              syncLocation.mutate(loc);
              logger.debug('[Location] Fresh web location obtained', 'Location', loc);
            },
            (err) => {
              logger.debug('[Location] Web geolocation error:', err.message);
              const fallbackLoc: UserLocation = {
                latitude: 34.0209,
                longitude: -6.8416,
                city: 'Rabat',
              };
              setUserLocation(fallbackLoc);
              syncLocation.mutate(fallbackLoc);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.High 
          });
          let city = 'Ma position';
          
          try {
            const geocode = await reverseGeocodeAPI(position.coords.latitude, position.coords.longitude);
            if (geocode) {
              city = geocode.city;
            }
          } catch (apiErr) {
            logger.debug('[Location] API geocode error', 'Location', apiErr);
            try {
              const reverseGeo = await Location.reverseGeocodeAsync({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              if (reverseGeo.length > 0 && reverseGeo[0].city) {
                city = reverseGeo[0].city;
              }
            } catch (expoErr) {
              logger.debug('[Location] Expo reverse geocode error', 'Location', expoErr);
            }
          }
          
          const loc: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city,
          };
          setUserLocation(loc);
          syncLocation.mutate(loc);
          logger.debug('[Location] Fresh native location', 'Location', loc);
        }
      }
    } catch (err) {
      logger.debug('[Location] Refresh error', 'Location', err);
    }
  }, []);

  const refreshWeather = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      logger.debug(`[Weather] Force fetching for ${userLocation.city}`);
      const weatherData = await fetchWeatherAPI(userLocation.latitude, userLocation.longitude);
      
      if (weatherData) {
        const weather: Weather = {
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          icon: weatherData.icon,
          lastUpdated: new Date().toISOString(),
        };
        setWeather(weather);
        syncWeather.mutate(weather);
        logger.debug('[Weather] Fresh weather fetched', 'Weather', weather);
      }
      
      // Also refresh prayer times
      logger.debug(`[PrayerTimes] Force fetching from API for ${userLocation.city}`);
      const result = await fetchPrayerTimesAPI(
        userLocation.latitude,
        userLocation.longitude
      );
      
      if (result && result.times) {
        setPrayerTimes(result.times);
        await savePrayerTimesCache(result.times, result.date);
        logger.debug('[PrayerTimes] Fresh times fetched');
      }
    } catch (err) {
      logger.debug('[Weather] Refresh error', 'Weather', err);
    }
  }, [userLocation]);

  const completedCount = useMemo(() => habits.filter(h => h.completed).length, [habits]);
  const totalCount = habits.length;
  const progressPercentage = useMemo(() => totalCount > 0 ? completedCount / totalCount : 0, [completedCount, totalCount]);

  const prayerHabits = useMemo(() => habits.filter(h => h.category === 'prayer'), [habits]);
  const otherHabits = useMemo(() => habits.filter(h => h.category !== 'prayer'), [habits]);

  const totalDhikrCount = useMemo(() => dhikrItems.reduce((sum, d) => sum + d.count, 0), [dhikrItems]);
  const totalDhikrTarget = useMemo(() => dhikrItems.reduce((sum, d) => sum + d.target, 0), [dhikrItems]);

  const versesReadCount = useMemo(() => verses.filter(v => v.isRead).length, [verses]);

  const isLoading = habitsQuery.isLoading || versesQuery.isLoading || dhikrQuery.isLoading;

  return {
    habits, verses, dhikrItems, duas, prophetsList, sahabasList, userName, userNameArabic,
    quranProgress, streak, userLocation, weather, prayerTimes, isLoading,
    toggleHabit, addHabit, updateHabit, deleteHabit,
    addVerse, toggleVerseFavorite, toggleVerseRead, deleteVerse,
    incrementDhikr, resetDhikr, resetAllDhikr, addDhikr, updateDhikr, deleteDhikr,
    toggleDuaFavorite, addDua, updateDua, deleteDua,
    addProphet, updateProphet, deleteProphet,
    addSahaba, updateSahaba, deleteSahaba,
    updateUserName, resetDailyHabits,
    updateQuranProgress, incrementQuranPages, decrementQuranPages, resetQuranProgress,
    refreshLocation, refreshWeather,
    completedCount, totalCount, progressPercentage,
    prayerHabits, otherHabits,
    totalDhikrCount, totalDhikrTarget, versesReadCount,
  };
}

export function RamadanProvider({ children }: { children: ReactNode }) {
  const value = useRamadanContext();
  return <RamadanContext.Provider value={value}>{children}</RamadanContext.Provider>;
}
