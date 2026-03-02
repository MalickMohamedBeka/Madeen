import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Award, Target, Flame, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';
import StatisticsCard from '@/components/StatisticsCard';
import WeeklyChart from '@/components/WeeklyChart';
import { useAppStore } from '@/store/useAppStore';
import { useRamadan } from '@/providers/RamadanProvider';

export default function StatisticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { 
    installDate, 
    dailyStats, 
    totalHabitsCompleted, 
    totalPrayersOnTime, 
    totalQuranPages,
    streakData 
  } = useAppStore();
  const { completedCount, totalCount } = useRamadan();

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

  // Get last 30 days data
  const monthlyData = useMemo(() => {
    const data: number[] = [];
    const labels: string[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.getDate().toString();
      
      labels.push(dayLabel);
      data.push(dailyStats[dateStr]?.habitsCompleted || 0);
    }
    
    return { data, labels };
  }, [dailyStats]);

  // Calculate success rate
  const successRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount]);

  // Calculate average per day
  const avgHabitsPerDay = useMemo(() => {
    return daysSinceInstall > 0 ? Math.round(totalHabitsCompleted / daysSinceInstall) : 0;
  }, [totalHabitsCompleted, daysSinceInstall]);

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

  const chartData = selectedPeriod === 'week' ? weeklyData : monthlyData;
  const maxValue = Math.max(...chartData.data, 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistiques</Text>
        <Text style={styles.subtitle}>Depuis {daysSinceInstall} jour{daysSinceInstall > 1 ? 's' : ''}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          {(['week', 'month', 'all'] as const).map((period) => (
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
                {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Total'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
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

          <View style={styles.statsRow}>
            <StatisticsCard
              title="Total habitudes"
              value={totalHabitsCompleted.toString()}
              subtitle="complétées"
              icon={<Award size={20} color={Colors.accent} />}
            />
            <StatisticsCard
              title="Moyenne/jour"
              value={avgHabitsPerDay.toString()}
              subtitle="habitudes"
              trend={avgHabitsPerDay >= 10 ? 'up' : undefined}
              icon={<TrendingUp size={20} color={Colors.accent} />}
            />
          </View>
        </View>

        {selectedPeriod !== 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedPeriod === 'week' ? 'Cette semaine' : 'Ce mois'}
            </Text>
            <WeeklyChart 
              data={chartData.data} 
              labels={chartData.labels} 
              maxValue={maxValue} 
            />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 28,
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
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
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
});
