import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Award, Target, Flame, BookOpen, Activity, Zap, CheckCircle, Download, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import StatisticsCard from '@/components/StatisticsCard';
import WeeklyChart from '@/components/WeeklyChart';
import { useAppStore } from '@/store/useAppStore';
import { useRamadan } from '@/providers/RamadanProvider';
import { exportStatisticsToPDF } from '@/utils/exportPDF';
import { useRouter } from 'expo-router';

export default function StatisticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { 
    installDate, 
    dailyStats, 
    totalHabitsCompleted, 
    totalPrayersOnTime, 
    totalQuranPages,
    streakData 
  } = useAppStore();
  const { completedCount, totalCount, userName } = useRamadan();

  // Calculate days since install
  const daysSinceInstall = useMemo(() => {
    const install = new Date(installDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - install.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [installDate]);

  // Get last 7 days data
  const weeklyData = useMemo(() => {
    const data: number[] = [];
    const labels: string[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()];
      
      labels.push(dayLabel);
      data.push(dailyStats[dateStr]?.habitsCompleted || 0);
    }
    
    return { data, labels };
  }, [dailyStats]);

  // Calculate stats for selected period
  const periodStats = useMemo(() => {
    const today = new Date();
    const daysToCheck = selectedPeriod === 'week' ? 7 : daysSinceInstall;
    
    let totalHabits = 0;
    let totalPrayers = 0;
    let totalPages = 0;
    let daysWithActivity = 0;
    let perfectDays = 0;
    
    for (let i = 0; i < daysToCheck; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats[dateStr];
      
      if (stats) {
        totalHabits += stats.habitsCompleted || 0;
        totalPrayers += stats.prayersOnTime || 0;
        totalPages += stats.quranPages || 0;
        if (stats.habitsCompleted > 0) daysWithActivity++;
        if (stats.habitsCompleted >= 10) perfectDays++;
      }
    }
    
    return {
      totalHabits,
      totalPrayers,
      totalPages,
      daysWithActivity,
      perfectDays,
      avgHabits: daysToCheck > 0 ? Math.round(totalHabits / daysToCheck) : 0,
      avgPrayers: daysToCheck > 0 ? Math.round(totalPrayers / daysToCheck) : 0,
      avgPages: daysToCheck > 0 ? Math.round(totalPages / daysToCheck) : 0,
      activityRate: daysToCheck > 0 ? Math.round((daysWithActivity / daysToCheck) * 100) : 0,
    };
  }, [selectedPeriod, dailyStats, daysSinceInstall]);

  // Calculate success rate
  const successRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount]);

  // Get best days
  const bestDays = useMemo(() => {
    const dayTotals: Record<string, { count: number; name: string }> = {
      '0': { count: 0, name: 'Dimanche' },
      '1': { count: 0, name: 'Lundi' },
      '2': { count: 0, name: 'Mardi' },
      '3': { count: 0, name: 'Mercredi' },
      '4': { count: 0, name: 'Jeudi' },
      '5': { count: 0, name: 'Vendredi' },
      '6': { count: 0, name: 'Samedi' },
    };

    Object.keys(dailyStats).forEach(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay().toString();
      dayTotals[dayOfWeek].count += dailyStats[dateStr].habitsCompleted;
    });

    return Object.values(dayTotals)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(day => ({
        day: day.name,
        count: day.count,
        percentage: Math.min(100, Math.round((day.count / (totalHabitsCompleted || 1)) * 100)),
      }));
  }, [dailyStats, totalHabitsCompleted]);

  const chartData = weeklyData;
  const maxValue = Math.max(...chartData.data, 10);

  const handleExportPDF = async () => {
    try {
      await exportStatisticsToPDF({
        userName,
        daysSinceInstall,
        installDate,
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        totalHabitsCompleted,
        totalPrayersOnTime,
        totalQuranPages,
        successRate,
        completedCount,
        totalCount,
        avgHabitsPerDay: Math.round(totalHabitsCompleted / daysSinceInstall),
        periodStats: selectedPeriod === 'week' ? periodStats : undefined,
        selectedPeriod: selectedPeriod === 'month' ? 'week' : selectedPeriod,
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={20} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Statistiques</Text>
          <Text style={styles.subtitle}>Depuis {daysSinceInstall} jour{daysSinceInstall > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
          <Download size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          {(['week', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 'week' ? 'Semaine' : 'Total'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          {selectedPeriod === 'all' ? (
            // Stats globales
            <>
              <View style={styles.statsRow}>
                <StatisticsCard
                  title="Série actuelle"
                  value={streakData.currentStreak.toString()}
                  subtitle="jours"
                  trend={streakData.currentStreak > 0 ? 'up' : undefined}
                  trendValue={`Record: ${streakData.bestStreak}j`}
                  icon={<Flame size={20} color={Colors.accent} />}
                />
                <StatisticsCard
                  title="Taux du jour"
                  value={`${successRate}%`}
                  subtitle="habitudes"
                  trend={successRate >= 80 ? 'up' : successRate < 50 ? 'down' : undefined}
                  trendValue={`${completedCount}/${totalCount}`}
                  icon={<Target size={20} color={Colors.accent} />}
                />
              </View>

              <View style={styles.statsRow}>
                <StatisticsCard
                  title="Total habitudes"
                  value={totalHabitsCompleted.toString()}
                  subtitle="complétées"
                  icon={<Award size={20} color={Colors.accent} />}
                />
                <StatisticsCard
                  title="Moyenne/jour"
                  value={Math.round(totalHabitsCompleted / daysSinceInstall).toString()}
                  subtitle="habitudes"
                  trend={Math.round(totalHabitsCompleted / daysSinceInstall) >= 10 ? 'up' : undefined}
                  icon={<TrendingUp size={20} color={Colors.accent} />}
                />
              </View>

              <View style={styles.statsRow}>
                <StatisticsCard
                  title="Prières"
                  value={totalPrayersOnTime.toString()}
                  subtitle="accomplies"
                  icon={<Calendar size={20} color={Colors.accent} />}
                />
                <StatisticsCard
                  title="Pages Coran"
                  value={totalQuranPages.toString()}
                  subtitle="lues"
                  trend={totalQuranPages > 0 ? 'up' : undefined}
                  trendValue={`Moy: ${Math.round(totalQuranPages / daysSinceInstall)}/j`}
                  icon={<BookOpen size={20} color={Colors.accent} />}
                />
              </View>
            </>
          ) : (
            // Stats pour semaine/mois
            <>
              <View style={styles.statsRow}>
                <StatisticsCard
                  title="Habitudes"
                  value={periodStats.totalHabits.toString()}
                  subtitle="cette semaine"
                  trend={periodStats.avgHabits >= 10 ? 'up' : undefined}
                  trendValue={`Moy: ${periodStats.avgHabits}/j`}
                  icon={<CheckCircle size={20} color={Colors.accent} />}
                />
                <StatisticsCard
                  title="Jours actifs"
                  value={periodStats.daysWithActivity.toString()}
                  subtitle="sur 7 jours"
                  trend={periodStats.activityRate >= 80 ? 'up' : undefined}
                  trendValue={`${periodStats.activityRate}%`}
                  icon={<Activity size={20} color={Colors.accent} />}
                />
              </View>

              <View style={styles.statsRow}>
                <StatisticsCard
                  title="Prières"
                  value={periodStats.totalPrayers.toString()}
                  subtitle="accomplies"
                  trendValue={`Moy: ${periodStats.avgPrayers}/j`}
                  icon={<Calendar size={20} color={Colors.accent} />}
                />
                <StatisticsCard
                  title="Pages Coran"
                  value={periodStats.totalPages.toString()}
                  subtitle="lues"
                  trend={periodStats.totalPages > 0 ? 'up' : undefined}
                  trendValue={`Moy: ${periodStats.avgPages}/j`}
                  icon={<BookOpen size={20} color={Colors.accent} />}
                />
              </View>

              <View style={styles.statsRow}>
                <StatisticsCard
                  title="Jours parfaits"
                  value={periodStats.perfectDays.toString()}
                  subtitle="10+ habitudes"
                  trend={periodStats.perfectDays > 0 ? 'up' : undefined}
                  trendValue={`${Math.round((periodStats.perfectDays / 7) * 100)}%`}
                  icon={<Zap size={20} color={Colors.accent} />}
                />
                <StatisticsCard
                  title="Taux du jour"
                  value={`${successRate}%`}
                  subtitle="aujourd'hui"
                  trend={successRate >= 80 ? 'up' : successRate < 50 ? 'down' : undefined}
                  trendValue={`${completedCount}/${totalCount}`}
                  icon={<Target size={20} color={Colors.accent} />}
                />
              </View>
            </>
          )}
        </View>

        {selectedPeriod !== 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>
            <WeeklyChart 
              data={chartData.data} 
              labels={chartData.labels} 
              maxValue={maxValue} 
            />
          </View>
        )}

        {selectedPeriod === 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Séries</Text>
            <View style={styles.streakCard}>
              <View style={styles.streakItem}>
                <View style={styles.streakIconContainer}>
                  <Flame size={32} color={Colors.accent} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>{streakData.currentStreak}</Text>
                  <Text style={styles.streakLabel}>Série actuelle</Text>
                </View>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <View style={styles.streakIconContainer}>
                  <Award size={32} color={Colors.primary} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>{streakData.bestStreak}</Text>
                  <Text style={styles.streakLabel}>Meilleure série</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {bestDays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meilleurs jours</Text>
            <View style={styles.bestDaysCard}>
              {bestDays.map((item, index) => (
                <View key={index} style={styles.bestDayItem}>
                  <View style={styles.bestDayInfo}>
                    <Text style={styles.bestDayName}>{item.day}</Text>
                    <Text style={styles.bestDayCount}>{item.count} habitudes</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'installation</Text>
              <Text style={styles.infoValue}>
                {new Date(installDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jours d'utilisation</Text>
              <Text style={styles.infoValue}>{daysSinceInstall} jour{daysSinceInstall > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Meilleure série</Text>
              <Text style={styles.infoValue}>{streakData.bestStreak} jour{streakData.bestStreak > 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  exportBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.white,
  },
  statsGrid: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  bestDaysCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bestDayItem: {
    gap: 8,
  },
  bestDayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestDayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  bestDayCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  streakCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  streakIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 168, 75, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  streakLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    height: 80,
    backgroundColor: Colors.border,
  },
});
