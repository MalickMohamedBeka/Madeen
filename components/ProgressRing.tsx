import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Colors from '@/constants/colors';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  completedCount: number;
  totalCount: number;
}

export default function ProgressRing({ progress, size = 160, strokeWidth = 12, completedCount, totalCount }: ProgressRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: progress,
      useNativeDriver: false,
      tension: 20,
      friction: 7,
    }).start();
  }, [progress]);

  // const radius = (size - strokeWidth) / 2;
  // const circumference = 2 * Math.PI * radius;

  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.backgroundRing, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]} />
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        <View style={styles.textContainer}>
          <Text style={styles.percentageText}>{percentage}%</Text>
          <Text style={styles.countText}>{completedCount}/{totalCount}</Text>
          <Text style={styles.labelText}>accomplis</Text>
        </View>
      </View>
      <View style={[styles.accentRing, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'transparent',
        borderTopColor: Colors.accent,
        borderRightColor: progress > 0.25 ? Colors.accent : 'transparent',
        borderBottomColor: progress > 0.5 ? Colors.accent : 'transparent',
        borderLeftColor: progress > 0.75 ? Colors.accent : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundRing: {
    position: 'absolute' as const,
    borderColor: 'rgba(212, 168, 75, 0.15)',
  },
  accentRing: {
    position: 'absolute' as const,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -1,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginTop: 2,
  },
  labelText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
});
