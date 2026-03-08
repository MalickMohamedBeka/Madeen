import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface WeeklyChartProps {
  data: number[];
  labels: string[];
  maxValue?: number;
}

export default function WeeklyChart({ data, labels, maxValue = 100 }: WeeklyChartProps) {
  const max = maxValue || Math.max(...data);

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((value, index) => {
          const height = (value / max) * 100;
          const isToday = index === data.length - 1;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      backgroundColor: isToday ? Colors.accent : Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, isToday && styles.labelToday]}>
                {labels[index]}
              </Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  labelToday: {
    color: Colors.accent,
  },
  value: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
