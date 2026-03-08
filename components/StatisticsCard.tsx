import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: React.ReactNode;
}

export default function StatisticsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
}: StatisticsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      
      <Text style={styles.value}>{value}</Text>
      
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          {trend === 'up' ? (
            <TrendingUp size={16} color={Colors.success} />
          ) : (
            <TrendingDown size={16} color={Colors.error} />
          )}
          <Text style={[styles.trendText, trend === 'up' ? styles.trendUp : styles.trendDown]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendUp: {
    color: Colors.success,
  },
  trendDown: {
    color: Colors.error,
  },
});
