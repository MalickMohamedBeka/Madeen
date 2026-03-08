import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable, ImageBackground, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Flame, Moon, ChevronRight, Repeat, Sun, Calendar, MapPin, Zap, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import HabitCard from '@/components/HabitCard';
import { getHijriDate, getGregorianFormatted } from '@/utils/hijri';


const MOSQUE_BG = require('@/assets/images/mosque-bg.jpg');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    prayerHabits, toggleHabit, completedCount, totalCount,
    progressPercentage, userName, userNameArabic, verses, dhikrItems, totalDhikrCount,
    streak, userLocation, weather, quranProgress, prayerTimes, refreshLocation, refreshWeather,
  } = useRamadan();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [now, setNow] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Force update of current time and trigger re-renders
    setNow(new Date());
    // Refresh location and weather
    await Promise.all([
      refreshLocation(),
      refreshWeather(),
    ]);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [refreshLocation, refreshWeather]);

  // Update clock every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    
    // ✅ FIX: Cleanup animations on unmount
    return () => {
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();
      progressAnim.stopAnimation();
    };
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  // ✅ FIX: Calculate Hijri date only when day changes, not every second
  const hijri = useMemo(() => {
    return getHijriDate(now);
  }, [now.getFullYear(), now.getMonth(), now.getDate()]);
  
  // ✅ FIX: Calculate Gregorian date only when day changes
  const gregorian = useMemo(() => {
    return getGregorianFormatted(now);
  }, [now.getFullYear(), now.getMonth(), now.getDate()]);
  
  const dailyVerse = useMemo(() => {
    if (verses.length === 0) return null;
    // Use date as seed for consistent daily random selection
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % verses.length;
    return verses[index];
  }, [verses, now]);

  const greeting = userName ? `Salam, ${userName}` : 'Assalamu Alaikum';
  // const dhikrDone = useMemo(() => dhikrItems.filter(d => d.count >= d.target).length, [dhikrItems]);
  
  // Format current time as HH:MM:SS
  const currentTime = useMemo(() => {
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [now]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Sun tracker calculation with real sunrise/sunset times
  const sunProgress = useMemo(() => {
    if (!prayerTimes) return 0.5; // Default to midday if no location
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Get real sunrise (Chourouk) and sunset (Maghrib) times
    const sunriseTime = prayerTimes.find(p => p.name === 'Chourouk');
    const sunsetTime = prayerTimes.find(p => p.name === 'Maghrib');
    
    if (!sunriseTime || !sunsetTime) return 0.5;
    
    const [sunriseH, sunriseM] = sunriseTime.time.split(':').map(Number);
    const [sunsetH, sunsetM] = sunsetTime.time.split(':').map(Number);
    
    const sunrise = sunriseH * 60 + sunriseM;
    const sunset = sunsetH * 60 + sunsetM;
    
    if (totalMinutes < sunrise) return 0;
    if (totalMinutes > sunset) return 1;
    
    return (totalMinutes - sunrise) / (sunset - sunrise);
  }, [now, prayerTimes]);

  // Calculate sun position on arc (x, y coordinates)
  const sunPosition = useMemo(() => {
    // const arcWidth = 280;
    // const arcHeight = 70;
    
    // Quadratic Bezier curve: P(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    // P0 = (0, 70), P1 = (140, 0), P2 = (280, 70)
    const t = sunProgress; // Progress from 0 to 1
    
    const P0 = { x: 0, y: 70 };
    const P1 = { x: 140, y: 0 };
    const P2 = { x: 280, y: 70 };
    
    const x = Math.pow(1 - t, 2) * P0.x + 2 * (1 - t) * t * P1.x + Math.pow(t, 2) * P2.x;
    const y = Math.pow(1 - t, 2) * P0.y + 2 * (1 - t) * t * P1.y + Math.pow(t, 2) * P2.y;
    
    return { x, y };
  }, [sunProgress]);

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        <ImageBackground
          source={MOSQUE_BG}
          style={[styles.headerBg, { paddingTop: insets.top + 12 }]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(6,42,32,0.92)', 'rgba(13,74,58,0.88)', 'rgba(26,107,82,0.85)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.headerPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
          </View>

          <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingLeft}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.greetingArabic}>{userNameArabic}</Text>
                <Text style={styles.dateHijri}>{hijri.formattedAr}</Text>
              </View>
              <View style={styles.rightBadges}>
                {hijri.isRamadan && hijri.ramadanDay && (
                  <View style={styles.dayBadge}>
                    <Moon size={14} color={Colors.accent} />
                    <Text style={styles.dayBadgeText}>J{hijri.ramadanDay}/30</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateRowTop}>
                <Calendar size={13} color="rgba(255,255,255,0.5)" />
                <Text style={styles.dateGregorian}>{gregorian}</Text>
                <Text style={styles.dateSeparator}>•</Text>
                <Text style={styles.dateTime}>{currentTime}</Text>
              </View>
              <View style={styles.dateRowBottom}>
                {userLocation && (
                  <>
                    <MapPin size={13} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.dateGregorian}>{userLocation.city}</Text>
                  </>
                )}
                {weather && (
                  <>
                    <Text style={styles.dateSeparator}>•</Text>
                    <Text style={styles.dateGregorian}>{weather.icon} {weather.temperature}°C</Text>
                  </>
                )}
                <Pressable 
                  onPress={async () => {
                    await refreshLocation();
                    await refreshWeather();
                  }} 
                  style={styles.refreshBtn}
                >
                  <RefreshCw size={13} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>
            </View>

            {/* Sun Tracker */}
            <View style={styles.sunTrackerContainer}>
              <View style={styles.sunTrack}>
                {/* Arc SVG */}
                <Svg width="280" height="70" style={styles.sunArc}>
                  <Path
                    d="M 0 70 Q 140 0, 280 70"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
                {/* Sun indicator */}
                <View style={[styles.sunIndicator, { left: sunPosition.x - 10, top: sunPosition.y - 10 }]}>
                  <Sun size={20} color="#F59E0B" />
                </View>
              </View>
              <View style={styles.sunLabels}>
                <Text style={styles.sunLabel}>
                  🌅 {prayerTimes?.find(p => p.name === 'Chourouk')?.time || '06:00'}
                </Text>
                <Text style={styles.sunLabel}>
                  🌇 {prayerTimes?.find(p => p.name === 'Maghrib')?.time || '18:00'}
                </Text>
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Progression du jour</Text>
                  <Text style={styles.progressSubtext}>{completedCount} sur {totalCount} habitudes</Text>
                </View>
                <View style={styles.progressRight}>
                  <Text style={styles.progressPercent}>{Math.round(progressPercentage * 100)}%</Text>
                  {streak.currentStreak > 0 && (
                    <Text style={styles.streakSmallLabel}>🔥 {streak.currentStreak}j</Text>
                  )}
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
            </View>

            <View style={styles.statsRow}>
              <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/habits' as never)}>
                <View style={styles.statIconWrap}>
                  <Flame size={16} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{prayerHabits.filter(p => p.completed).length}/6</Text>
                <Text style={styles.statLabel}>Prières</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/worship' as never)}>
                <View style={styles.statIconWrap}>
                  <Repeat size={16} color="#34D399" />
                </View>
                <Text style={styles.statValue}>{totalDhikrCount}</Text>
                <Text style={styles.statLabel}>Dhikr</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/worship' as never)}>
                <View style={styles.statIconWrap}>
                  <BookOpen size={16} color="#60A5FA" />
                </View>
                <Text style={styles.statValue}>{quranProgress.pagesReadToday}</Text>
                <Text style={styles.statLabel}>Coran</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Zap size={16} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{streak.currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </Animated.View>
        </ImageBackground>

        <View style={styles.content}>
          {/* Prayer Times Card */}
          {prayerTimes && prayerTimes.length > 0 ? (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.prayerTimesCard}>
                <Text style={styles.prayerTimesTitle}>Horaires de prière</Text>
                <View style={styles.prayerTimesGrid}>
                  {prayerTimes.map((prayer) => (
                    <View key={prayer.name} style={styles.prayerTimeItem}>
                      <Text style={styles.prayerNameAr}>{prayer.nameAr}</Text>
                      <Text style={styles.prayerName}>{prayer.name}</Text>
                      <Text style={styles.prayerTime}>{prayer.time}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}

          {dailyVerse && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <BookOpen size={18} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Verset du jour</Text>
                </View>
                <Pressable onPress={() => router.push('/(tabs)/worship' as never)} style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>Tous</Text>
                  <ChevronRight size={14} color={Colors.primary} />
                </Pressable>
              </View>
              <View style={styles.verseCard}>
                <View style={styles.verseAccent} />
                <View style={styles.verseContent}>
                  <Text style={styles.verseArabic}>{dailyVerse.arabic}</Text>
                  <View style={styles.verseDivider} />
                  <Text style={styles.verseFrench}>{dailyVerse.french}</Text>
                  <View style={styles.verseFooter}>
                    <Text style={styles.verseRef}>{dailyVerse.reference}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Flame size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Prières du jour</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/habits' as never)} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>Toutes</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </Pressable>
            </View>
            {prayerHabits.map(habit => (
              <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} />
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Repeat size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Dhikr rapide</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/worship' as never)} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </Pressable>
            </View>
            <View style={styles.dhikrQuickGrid}>
              {dhikrItems.slice(0, 4).map(item => (
                <View key={item.id} style={styles.dhikrQuickCard}>
                  <Text style={styles.dhikrQuickArabic} numberOfLines={1}>{item.arabic}</Text>
                  <Text style={styles.dhikrQuickTranslit} numberOfLines={1}>{item.transliteration}</Text>
                  <View style={styles.dhikrQuickProgress}>
                    <View style={[styles.dhikrQuickBar, { width: `${Math.round((item.count / item.target) * 100)}%` as `${number}%` }]} />
                  </View>
                  <Text style={styles.dhikrQuickCount}>{item.count}/{item.target}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBg: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden' as const,
  },
  headerPattern: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute' as const,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: -70,
    right: -50,
  },
  patternCircle2: {
    position: 'absolute' as const,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 168, 75, 0.05)',
    bottom: -40,
    left: -40,
  },
  headerContent: {},
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  greetingLeft: {},
  greeting: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  greetingArabic: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    textAlign: 'left' as const,
  },
  dateHijri: {
    fontSize: 14,
    color: Colors.accent,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  rightBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dateRow: {
    marginBottom: 18,
    marginTop: 2,
    gap: 4,
  },
  dateRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateGregorian: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  dateTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  dateSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  refreshBtn: {
    marginLeft: 4,
    padding: 4,
    opacity: 0.7,
  },
  sunTrackerContainer: {
    marginBottom: 18,
    marginTop: 8,
    alignItems: 'center',
  },
  sunTrack: {
    width: 280,
    height: 70,
    position: 'relative' as const,
    marginBottom: 4,
  },
  sunArc: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
  sunIndicator: {
    position: 'absolute' as const,
    width: 20,
    height: 20,
  },
  sunLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    width: 280,
  },
  sunLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  prayerTimesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prayerTimesTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
    textAlign: 'center' as const,
  },
  prayerTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  prayerTimeItem: {
    width: '31%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prayerNameAr: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  prayerName: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 75, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  progressRight: {
    alignItems: 'flex-end',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.accent,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  streakSmallLabel: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },

  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },

  verseCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verseAccent: {
    width: 4,
    backgroundColor: Colors.accent,
  },
  verseContent: {
    flex: 1,
    padding: 16,
  },
  verseArabic: {
    fontSize: 20,
    lineHeight: 36,
    color: Colors.primary,
    textAlign: 'right' as const,
    fontWeight: '500' as const,
    marginBottom: 10,
  },
  verseDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  verseFrench: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  verseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  verseRef: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  dhikrQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dhikrQuickCard: {
    width: '48%' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dhikrQuickArabic: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'right' as const,
    marginBottom: 4,
  },
  dhikrQuickTranslit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  dhikrQuickProgress: {
    height: 4,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 4,
  },
  dhikrQuickBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  dhikrQuickCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'right' as const,
  },
});
