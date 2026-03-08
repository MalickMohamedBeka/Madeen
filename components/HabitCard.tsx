import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Check, Sparkles, Trash2 } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Habit } from '@/types';
import { playSuccessFeedback, playClickFeedback } from '@/utils/sounds';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

function HabitCardInner({ habit, onToggle, onDelete }: HabitCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    
    // Play feedback based on completion state
    if (!habit.completed) {
      await playSuccessFeedback();
    } else {
      await playClickFeedback();
    }
    
    onToggle(habit.id);
  };

  // Dynamically get icon component from lucide-react-native
  const IconComponent = (LucideIcons as any)[habit.icon] || Sparkles;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        style={[styles.card, habit.completed && styles.cardCompleted]}
        testID={`habit-card-${habit.id}`}
      >
        <View style={[styles.iconContainer, habit.completed && styles.iconCompleted]}>
          {habit.completed ? (
            <Check size={18} color={Colors.white} />
          ) : (
            <IconComponent size={18} color={Colors.primaryLight} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, habit.completed && styles.titleCompleted]} numberOfLines={1}>
            {habit.title}
          </Text>
          {habit.isCustom && (
            <Text style={styles.customBadge}>Personnalisé</Text>
          )}
        </View>
        {onDelete && habit.isCustom && (
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              onDelete(habit.id);
            }}
            style={styles.deleteBtn}
            hitSlop={8}
            testID={`habit-delete-${habit.id}`}
          >
            <Trash2 size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(HabitCardInner);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompleted: {
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    borderColor: Colors.primaryLight,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCompleted: {
    backgroundColor: Colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  titleCompleted: {
    color: Colors.primary,
    textDecorationLine: 'line-through' as const,
  },
  customBadge: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
