import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCcw, Plus, X, Sun, Moon, Star, BookOpen, Heart, Sparkles, Sunset, HandHeart, GraduationCap, Flame, Zap, Coffee, Home, Users, MessageCircle, Gift, Target, Award, TrendingUp, Activity, Clock, Calendar, Sunrise, CloudSun, Droplet } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import HabitCard from '@/components/HabitCard';
import { Habit } from '@/types';

type CategoryFilter = 'all' | 'prayer' | 'quran' | 'dhikr' | 'charity' | 'fasting' | 'science' | 'other';

const categories: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'prayer', label: 'Prières' },
  { key: 'quran', label: 'Coran' },
  { key: 'dhikr', label: 'Dhikr' },
  { key: 'charity', label: 'Sadaqa' },
  { key: 'fasting', label: 'Jeûne' },
  { key: 'science', label: 'Science' },
  { key: 'other', label: 'Autre' },
];

const iconOptions: { name: string; component: React.ComponentType<{ size: number; color: string }> }[] = [
  { name: 'Sunrise', component: Sunrise },
  { name: 'Sun', component: Sun },
  { name: 'CloudSun', component: CloudSun },
  { name: 'Sunset', component: Sunset },
  { name: 'Moon', component: Moon },
  { name: 'Star', component: Star },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Heart', component: Heart },
  { name: 'Droplet', component: Droplet },
  { name: 'Sparkles', component: Sparkles },
  { name: 'HandHeart', component: HandHeart },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'Flame', component: Flame },
  { name: 'Zap', component: Zap },
  { name: 'Coffee', component: Coffee },
  { name: 'Home', component: Home },
  { name: 'Users', component: Users },
  { name: 'MessageCircle', component: MessageCircle },
  { name: 'Gift', component: Gift },
  { name: 'Target', component: Target },
  { name: 'Award', component: Award },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Activity', component: Activity },
  { name: 'Clock', component: Clock },
  { name: 'Calendar', component: Calendar },
];

const categoryOptions: { key: Habit['category']; label: string }[] = [
  { key: 'prayer', label: 'Prière' },
  { key: 'quran', label: 'Coran' },
  { key: 'dhikr', label: 'Dhikr' },
  { key: 'charity', label: 'Sadaqa' },
  { key: 'fasting', label: 'Jeûne' },
  { key: 'science', label: 'Science' },
  { key: 'other', label: 'Autre' },
];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { habits, toggleHabit, resetDailyHabits, addHabit, deleteHabit, completedCount, totalCount } = useRamadan();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newIcon, setNewIcon] = useState<string>('Sparkles');
  const [newCategory, setNewCategory] = useState<Habit['category']>('other');
  const progressAnim = useRef(new Animated.Value(0)).current;

  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const filteredHabits = useMemo(() => {
    if (filter === 'all') return habits;
    return habits.filter(h => h.category === filter);
  }, [habits, filter]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous réinitialiser toutes les habitudes du jour ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: resetDailyHabits },
      ]
    );
  }, [resetDailyHabits]);

  const handleAddHabit = useCallback(() => {
    if (!newTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'habitude.');
      return;
    }
    addHabit({ title: newTitle.trim(), icon: newIcon, category: newCategory });
    setNewTitle('');
    setNewIcon('Sparkles');
    setNewCategory('other');
    setShowAddModal(false);
  }, [newTitle, newIcon, newCategory, addHabit]);

  const handleDeleteHabit = useCallback((id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit?.isCustom) {
      Alert.alert('Info', 'Vous ne pouvez supprimer que les habitudes personnalisées.');
      return;
    }
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer "${habit.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteHabit(id) },
      ]
    );
  }, [habits, deleteHabit]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Mes Habitudes</Text>
            <Text style={styles.subtitle}>{completedCount} sur {totalCount} accomplis</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn} testID="add-habit">
              <Plus size={18} color={Colors.white} />
            </Pressable>
            <Pressable onPress={handleReset} style={styles.resetBtn} testID="reset-habits">
              <RotateCcw size={18} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map(cat => (
            <Pressable
              key={cat.key}
              onPress={() => setFilter(cat.key)}
              style={[styles.filterChip, filter === cat.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === cat.key && styles.filterTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredHabits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={toggleHabit}
            onDelete={habit.isCustom ? handleDeleteHabit : undefined}
          />
        ))}
        {filteredHabits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune habitude</Text>
            <Text style={styles.emptyText}>Ajoutez une habitude avec le bouton +</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle habitude</Text>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Lire 10 pages..."
                placeholderTextColor={Colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                testID="habit-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icône</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map(opt => {
                  const Icon = opt.component;
                  return (
                    <Pressable
                      key={opt.name}
                      onPress={() => setNewIcon(opt.name)}
                      style={[styles.iconOption, newIcon === opt.name && styles.iconOptionActive]}
                    >
                      <Icon size={20} color={newIcon === opt.name ? Colors.white : Colors.primary} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <View style={styles.categoryGrid}>
                {categoryOptions.map(cat => (
                  <Pressable
                    key={cat.key}
                    onPress={() => setNewCategory(cat.key)}
                    style={[styles.categoryChip, newCategory === cat.key && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryChipText, newCategory === cat.key && styles.categoryChipTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable onPress={handleAddHabit} style={styles.saveButton} testID="save-habit">
              <Text style={styles.saveButtonText}>Ajouter</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(13, 74, 58, 0.1)',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterContent: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: {
    backgroundColor: Colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
