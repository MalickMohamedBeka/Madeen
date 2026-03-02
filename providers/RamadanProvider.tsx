import React, { useEffect, useState, useCallback, useMemo, useRef, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { translateToArabic, syncPendingTranslations } from '@/utils/translation';
import { fetchPrayerTimesFromAPI, PrayerTimeEntry } from '@/utils/prayerTimes';

const HABITS_KEY = 'app_habits';
const VERSES_KEY = 'app_verses';
const PROFILE_KEY = 'app_profile';
const DHIKR_KEY = 'app_dhikr';
const DUAS_KEY = 'app_duas';
const PROPHETS_KEY = 'app_prophets';
const SAHABAS_KEY = 'app_sahabas';
const QURAN_KEY = 'app_quran';
const STREAK_KEY = 'app_streak';
const LAST_RESET_KEY = 'app_last_reset';
const LOCATION_KEY = 'app_location';
const WEATHER_KEY = 'app_weather';
const PRAYER_TIMES_KEY = 'app_prayer_times';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  const queryClient = useQueryClient();
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
      const stored = await AsyncStorage.getItem(HABITS_KEY);
      let habits = stored ? JSON.parse(stored) as Habit[] : defaultHabits;
      
      // Migration: Fix "Doua" to "Dua" and merge Dhikr matin/soir
      let needsUpdate = false;
      
      // Remove both Dhikr matin and Dhikr soir
      const hadDhikrMatin = habits.some(h => h.title === 'Dhikr matin');
      const hadDhikrSoir = habits.some(h => h.title === 'Dhikr soir');
      
      habits = habits
        .map(h => {
          if (h.title === 'Doua') {
            needsUpdate = true;
            return { ...h, title: 'Dua' };
          }
          return h;
        })
        .filter(h => h.title !== 'Dhikr matin' && h.title !== 'Dhikr soir');
      
      // Add single Dhikr if we had either matin or soir
      if ((hadDhikrMatin || hadDhikrSoir) && !habits.find(h => h.title === 'Dhikr')) {
        needsUpdate = true;
        habits.push({ 
          id: Date.now().toString(), 
          title: 'Dhikr', 
          icon: 'Sparkles', 
          category: 'dhikr', 
          completed: false 
        });
      }
      
      // Add Science if not exists
      if (!habits.find(h => h.title === 'Science')) {
        needsUpdate = true;
        habits.push({ 
          id: (Date.now() + 1).toString(), 
          title: 'Science', 
          icon: 'GraduationCap', 
          category: 'science', 
          completed: false 
        });
      }
      
      if (needsUpdate) {
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
        console.log('[Habits] Migration completed:', habits.map(h => h.title).join(', '));
      }
      
      return habits;
    },
  });

  const versesQuery = useQuery({
    queryKey: ['verses'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(VERSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Verse[];
        return parsed.map(v => ({ ...v, isRead: v.isRead ?? false }));
      }
      return enrichedVerses;
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      return stored ? JSON.parse(stored) as { name: string; nameArabic: string } : { name: 'Malick', nameArabic: 'مالك' };
    },
  });

  const dhikrQuery = useQuery({
    queryKey: ['dhikr'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(DHIKR_KEY);
      return stored ? JSON.parse(stored) as DhikrItem[] : defaultDhikr;
    },
  });

  const duasQuery = useQuery({
    queryKey: ['duas'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(DUAS_KEY);
      return stored ? JSON.parse(stored) as Dua[] : defaultDuas;
    },
  });

  const prophetsQuery = useQuery({
    queryKey: ['prophets'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROPHETS_KEY);
      return stored ? JSON.parse(stored) as Prophet[] : defaultProphets;
    },
  });

  const sahabasQuery = useQuery({
    queryKey: ['sahabas'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SAHABAS_KEY);
      return stored ? JSON.parse(stored) as Sahaba[] : defaultSahabas;
    },
  });

  const weatherQuery = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(WEATHER_KEY);
      return stored ? JSON.parse(stored) as Weather : null;
    },
  });

  const quranQuery = useQuery({
    queryKey: ['quran'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(QURAN_KEY);
      return stored ? JSON.parse(stored) as QuranProgress : defaultQuranProgress;
    },
  });

  const streakQuery = useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STREAK_KEY);
      return stored ? JSON.parse(stored) as StreakData : { currentStreak: 0, lastStreakDate: '', bestStreak: 0 };
    },
  });

  const locationQuery = useQuery({
    queryKey: ['location'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(LOCATION_KEY);
      return stored ? JSON.parse(stored) as UserLocation : null;
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

  const syncHabits = useMutation({ mutationFn: async (updated: Habit[]) => { await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated)); return updated; } });
  const syncVerses = useMutation({ mutationFn: async (updated: Verse[]) => { await AsyncStorage.setItem(VERSES_KEY, JSON.stringify(updated)); return updated; } });
  const syncProfile = useMutation({ mutationFn: async (data: { name: string; nameArabic: string }) => { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data)); return data; } });
  const syncDhikr = useMutation({ mutationFn: async (updated: DhikrItem[]) => { await AsyncStorage.setItem(DHIKR_KEY, JSON.stringify(updated)); return updated; } });
  const syncDuas = useMutation({ mutationFn: async (updated: Dua[]) => { await AsyncStorage.setItem(DUAS_KEY, JSON.stringify(updated)); return updated; } });
  const syncProphets = useMutation({ mutationFn: async (updated: Prophet[]) => { await AsyncStorage.setItem(PROPHETS_KEY, JSON.stringify(updated)); return updated; } });
  const syncSahabas = useMutation({ mutationFn: async (updated: Sahaba[]) => { await AsyncStorage.setItem(SAHABAS_KEY, JSON.stringify(updated)); return updated; } });
  const syncQuran = useMutation({ mutationFn: async (updated: QuranProgress) => { await AsyncStorage.setItem(QURAN_KEY, JSON.stringify(updated)); return updated; } });
  const syncStreak = useMutation({ mutationFn: async (updated: StreakData) => { await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated)); return updated; } });
  const syncLocation = useMutation({ mutationFn: async (loc: UserLocation) => { await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc)); return loc; } });
  const syncWeather = useMutation({ mutationFn: async (w: Weather) => { await AsyncStorage.setItem(WEATHER_KEY, JSON.stringify(w)); return w; } });

  useEffect(() => {
    const checkAndResetDaily = async () => {
      const today = getTodayString();
      const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
      if (lastReset !== today) {
        console.log('[RamadanProvider] Midnight reset triggered for', today);
        await AsyncStorage.setItem(LAST_RESET_KEY, today);

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
            console.log('[Location] Requesting web geolocation...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const loc: UserLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  city: 'Ma position',
                };
                setUserLocation(loc);
                syncLocation.mutate(loc);
                console.log('[Location] Web location obtained:', loc);
              },
              (err) => {
                console.log('[Location] Web geolocation error:', err.message);
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
            try {
              const reverseGeo = await Location.reverseGeocodeAsync({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              if (reverseGeo.length > 0 && reverseGeo[0].city) {
                city = reverseGeo[0].city;
              }
            } catch (e) {
              console.log('[Location] Reverse geocode error:', e);
            }
            const loc: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city,
            };
            setUserLocation(loc);
            syncLocation.mutate(loc);
            console.log('[Location] Native location:', loc);
          } else {
            console.log('[Location] Permission denied');
          }
        }
      } catch (err) {
        console.log('[Location] Error:', err);
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
        const stored = await AsyncStorage.getItem(WEATHER_KEY);
        const cachedWeather: Weather | null = stored ? JSON.parse(stored) : null;
        
        // Check if cache is less than 30 minutes old
        if (cachedWeather && cachedWeather.lastUpdated) {
          const cacheAge = Date.now() - new Date(cachedWeather.lastUpdated).getTime();
          if (cacheAge < 1800000) { // 30 minutes
            console.log('[Weather] Using cached weather');
            setWeather(cachedWeather);
            return;
          }
        }

        // Fetch new weather data (using Open-Meteo free API)
        console.log(`[Weather] Fetching for ${userLocation.city} (${userLocation.latitude}, ${userLocation.longitude})`);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&current_weather=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          const weatherData: Weather = {
            temperature: Math.round(data.current_weather.temperature),
            condition: data.current_weather.weathercode < 3 ? 'clear' : 'cloudy',
            icon: data.current_weather.weathercode < 3 ? '☀️' : '☁️',
            lastUpdated: new Date().toISOString(),
          };
          setWeather(weatherData);
          syncWeather.mutate(weatherData);
          console.log('[Weather] Fetched new weather:', weatherData);
          
          // Also sync pending translations when we have connection
          syncPendingTranslations().then(count => {
            if (count > 0) {
              console.log('[Translation] Auto-synced', count, 'pending translations');
            }
          });
        }
      } catch (err) {
        console.log('[Weather] Fetch error:', err);
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
        const stored = await AsyncStorage.getItem(PRAYER_TIMES_KEY);
        const cached: { times: PrayerTimeEntry[]; date: string } | null = stored ? JSON.parse(stored) : null;
        
        const today = getTodayString();
        
        // Check if cache is for today
        if (cached && cached.date === today) {
          console.log('[PrayerTimes] Using cached times:', cached.times.length, 'prayers');
          setPrayerTimes(cached.times);
          return;
        }

        // Fetch new prayer times from API
        console.log(`[PrayerTimes] Fetching from API for ${userLocation.city}`);
        const times = await fetchPrayerTimesFromAPI(userLocation.latitude, userLocation.longitude);
        
        if (times) {
          setPrayerTimes(times);
          await AsyncStorage.setItem(PRAYER_TIMES_KEY, JSON.stringify({ times, date: today }));
          console.log('[PrayerTimes] Fetched from API:', times.map(t => `${t.name}: ${t.time}`).join(', '));
        } else {
          console.log('[PrayerTimes] API returned null');
        }
      } catch (err) {
        console.log('[PrayerTimes] Fetch error:', err);
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
        if (prev.lastStreakDate === today) return prev;
        const newStreak = prev.currentStreak + 1;
        const bestStreak = Math.max(prev.bestStreak, newStreak);
        const updated: StreakData = { currentStreak: newStreak, lastStreakDate: today, bestStreak };
        syncStreak.mutate(updated);
        console.log('[Streak] Updated:', updated);
        return updated;
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
    const newHabit: Habit = { ...habit, id: Date.now().toString(), completed: false, isCustom: true };
    setHabits(prev => { const updated = [...prev, newHabit]; syncHabits.mutate(updated); return updated; });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    triggerHaptic();
    setHabits(prev => { const updated = prev.filter(h => h.id !== id); syncHabits.mutate(updated); return updated; });
  }, []);

  const addVerse = useCallback((verse: Omit<Verse, 'id' | 'createdAt' | 'isFavorite' | 'isRead'>) => {
    const newVerse: Verse = { ...verse, id: Date.now().toString(), isFavorite: false, isRead: false, createdAt: new Date().toISOString().split('T')[0] };
    setVerses(prev => { const updated = [newVerse, ...prev]; syncVerses.mutate(updated); return updated; });
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
    setDhikrItems(prev => { const updated = prev.map(d => d.id === id ? { ...d, count: Math.min(d.count + 1, d.target) } : d); syncDhikr.mutate(updated); return updated; });
  }, []);

  const resetDhikr = useCallback((id: string) => {
    setDhikrItems(prev => { const updated = prev.map(d => d.id === id ? { ...d, count: 0 } : d); syncDhikr.mutate(updated); return updated; });
  }, []);

  const resetAllDhikr = useCallback(() => {
    setDhikrItems(prev => { const updated = prev.map(d => ({ ...d, count: 0 })); syncDhikr.mutate(updated); return updated; });
  }, []);

  const addDhikr = useCallback(async (dhikr: Omit<DhikrItem, 'id' | 'count' | 'isCustom'>) => {
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
        console.log('[AddDhikr] Auto-translated:', finalDhikr);
      } catch (err) {
        console.log('[AddDhikr] Translation failed:', err);
      }
    }
    
    const newDhikr: DhikrItem = { ...finalDhikr, id: Date.now().toString(), count: 0, isCustom: true };
    setDhikrItems(prev => { const updated = [...prev, newDhikr]; syncDhikr.mutate(updated); return updated; });
  }, []);

  const deleteDhikr = useCallback((id: string) => {
    triggerHaptic();
    setDhikrItems(prev => { const updated = prev.filter(d => d.id !== id); syncDhikr.mutate(updated); return updated; });
  }, []);

  const toggleDuaFavorite = useCallback((id: string) => {
    triggerHaptic();
    setDuas(prev => { const updated = prev.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d); syncDuas.mutate(updated); return updated; });
  }, []);

  const addDua = useCallback(async (dua: Omit<Dua, 'id' | 'isFavorite' | 'isCustom'>) => {
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
        console.log('[AddDua] Auto-translated:', finalDua);
      } catch (err) {
        console.log('[AddDua] Translation failed, using original:', err);
      }
    }
    
    const newDua: Dua = { ...finalDua, id: Date.now().toString(), isFavorite: false, isCustom: true };
    setDuas(prev => { const updated = [...prev, newDua]; syncDuas.mutate(updated); return updated; });
  }, []);

  const deleteDua = useCallback((id: string) => {
    triggerHaptic();
    setDuas(prev => { const updated = prev.filter(d => d.id !== id); syncDuas.mutate(updated); return updated; });
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
        console.log('[AddProphet] Auto-translated name:', finalProphet);
      } catch (err) {
        console.log('[AddProphet] Translation failed:', err);
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
        console.log('[AddSahaba] Auto-translated name:', finalSahaba);
      } catch (err) {
        console.log('[AddSahaba] Translation failed:', err);
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
    setUserName(name);
    
    // Auto-translate name to Arabic if not provided
    if (!nameAr && name) {
      try {
        console.log('[UpdateUserName] Translating:', name);
        const translation = await translateToArabic(name);
        nameAr = translation.arabic;
        console.log('[UpdateUserName] Auto-translated:', name, '→', nameAr);
        
        // If translation returned the same text (failed), try word by word
        if (nameAr === name) {
          console.log('[UpdateUserName] Translation returned same text, trying word by word');
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
          console.log('[UpdateUserName] Word by word result:', nameAr);
        }
      } catch (err) {
        console.log('[UpdateUserName] Translation failed, keeping old name:', err);
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
      const newPagesRead = prev.pagesReadToday + 1;
      const newTotalPages = prev.totalPagesRead + 1;
      const newCurrentPage = prev.currentPage < 604 ? prev.currentPage + 1 : prev.currentPage;
      const newCurrentJuz = Math.ceil(newCurrentPage / 20);
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
      if (prev.pagesReadToday <= 0) return prev;
      const updated: QuranProgress = {
        ...prev,
        pagesReadToday: prev.pagesReadToday - 1,
        totalPagesRead: Math.max(0, prev.totalPagesRead - 1),
        currentPage: Math.max(1, prev.currentPage - 1),
        currentJuz: Math.ceil(Math.max(1, prev.currentPage - 1) / 20),
      };
      syncQuran.mutate(updated);
      return updated;
    });
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      // Clear cached location and weather
      await AsyncStorage.removeItem(LOCATION_KEY);
      await AsyncStorage.removeItem(WEATHER_KEY);
      
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          console.log('[Location] Requesting fresh web geolocation...');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const loc: UserLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: 'Ma position',
              };
              setUserLocation(loc);
              syncLocation.mutate(loc);
              console.log('[Location] Fresh web location obtained:', loc);
            },
            (err) => {
              console.log('[Location] Web geolocation error:', err.message);
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
            const reverseGeo = await Location.reverseGeocodeAsync({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            if (reverseGeo.length > 0 && reverseGeo[0].city) {
              city = reverseGeo[0].city;
            }
          } catch (e) {
            console.log('[Location] Reverse geocode error:', e);
          }
          const loc: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city,
          };
          setUserLocation(loc);
          syncLocation.mutate(loc);
          console.log('[Location] Fresh native location:', loc);
        }
      }
    } catch (err) {
      console.log('[Location] Refresh error:', err);
    }
  }, []);

  const refreshWeather = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      // Clear cached weather and prayer times
      await AsyncStorage.removeItem(WEATHER_KEY);
      await AsyncStorage.removeItem(PRAYER_TIMES_KEY);
      
      console.log(`[Weather] Force fetching for ${userLocation.city} (${userLocation.latitude}, ${userLocation.longitude})`);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&current_weather=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        const weatherData: Weather = {
          temperature: Math.round(data.current_weather.temperature),
          condition: data.current_weather.weathercode < 3 ? 'clear' : 'cloudy',
          icon: data.current_weather.weathercode < 3 ? '☀️' : '☁️',
          lastUpdated: new Date().toISOString(),
        };
        setWeather(weatherData);
        syncWeather.mutate(weatherData);
        console.log('[Weather] Fresh weather fetched:', weatherData);
      }
      
      // Also refresh prayer times
      console.log(`[PrayerTimes] Force fetching from API for ${userLocation.city}`);
      const times = await fetchPrayerTimesFromAPI(userLocation.latitude, userLocation.longitude);
      
      if (times) {
        setPrayerTimes(times);
        const today = getTodayString();
        await AsyncStorage.setItem(PRAYER_TIMES_KEY, JSON.stringify({ times, date: today }));
        console.log('[PrayerTimes] Fresh times fetched:', times.map(t => `${t.name}: ${t.time}`).join(', '));
      }
    } catch (err) {
      console.log('[Weather] Refresh error:', err);
    }
  }, [userLocation]);

  const syncTranslations = useCallback(async () => {
    try {
      const synced = await syncPendingTranslations();
      console.log('[Translation] Synced', synced, 'pending translations');
      return synced;
    } catch (err) {
      console.log('[Translation] Sync error:', err);
      return 0;
    }
  }, []);

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
    toggleHabit, addHabit, deleteHabit,
    addVerse, toggleVerseFavorite, toggleVerseRead, deleteVerse,
    incrementDhikr, resetDhikr, resetAllDhikr, addDhikr, deleteDhikr,
    toggleDuaFavorite, addDua, deleteDua,
    addProphet, updateProphet, deleteProphet,
    addSahaba, updateSahaba, deleteSahaba,
    updateUserName, resetDailyHabits,
    updateQuranProgress, incrementQuranPages, decrementQuranPages,
    refreshLocation, refreshWeather, syncTranslations,
    completedCount, totalCount, progressPercentage,
    prayerHabits, otherHabits,
    totalDhikrCount, totalDhikrTarget, versesReadCount,
  };
}

export function RamadanProvider({ children }: { children: ReactNode }) {
  const value = useRamadanContext();
  return <RamadanContext.Provider value={value}>{children}</RamadanContext.Provider>;
}
