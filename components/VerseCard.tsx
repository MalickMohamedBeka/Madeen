import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Heart, Trash2, BookMarked, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Verse } from '@/types';

interface VerseCardProps {
  verse: Verse;
  onToggleFavorite: (id: string) => void;
  onToggleRead?: (id: string) => void;
  onDelete: (id: string) => void;
}

function VerseCardInner({ verse, onToggleFavorite, onToggleRead, onDelete }: VerseCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onToggleFavorite(verse.id);
  };

  return (
    <Animated.View style={[styles.card, verse.isRead && styles.cardRead, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.referenceContainer}>
          <BookMarked size={14} color={Colors.accent} />
          <Text style={styles.reference}>{verse.reference}</Text>
        </View>
        <View style={styles.actions}>
          {onToggleRead && (
            <Pressable
              onPress={() => onToggleRead(verse.id)}
              hitSlop={10}
              style={[styles.readBtn, verse.isRead && styles.readBtnActive]}
              testID={`verse-read-${verse.id}`}
            >
              <Check size={16} color={verse.isRead ? Colors.white : Colors.textMuted} />
            </Pressable>
          )}
          <Pressable onPress={handleFavorite} hitSlop={10} testID={`verse-fav-${verse.id}`}>
            <Heart
              size={20}
              color={verse.isFavorite ? Colors.error : Colors.textMuted}
              fill={verse.isFavorite ? Colors.error : 'transparent'}
            />
          </Pressable>
          <Pressable onPress={() => onDelete(verse.id)} hitSlop={10} style={styles.deleteBtn} testID={`verse-del-${verse.id}`}>
            <Trash2 size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.arabic}>{verse.arabic}</Text>

      <View style={styles.divider} />

      <Text style={styles.transliteration}>{verse.transliteration}</Text>

      <Text style={styles.french}>{verse.french}</Text>

      {verse.isRead && (
        <View style={styles.readBadge}>
          <Check size={12} color={Colors.success} />
          <Text style={styles.readBadgeText}>Lu</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default React.memo(VerseCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRead: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(13, 74, 58, 0.03)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readBtnActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  deleteBtn: {
    opacity: 0.6,
  },
  arabic: {
    fontSize: 22,
    lineHeight: 38,
    color: Colors.primary,
    textAlign: 'right' as const,
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  transliteration: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    lineHeight: 22,
    marginBottom: 8,
  },
  french: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  readBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
