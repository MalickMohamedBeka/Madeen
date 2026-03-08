import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, X, Edit2, Trash2, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { Habit } from '@/types';
import * as LucideIcons from 'lucide-react-native';

type CategoryFilter = 'all' | 'prayer' | 'quran' | 'dhikr' | 'charity' | 'fasting' | 'science' | 'other';

const categories: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'prayer', label: 'Prière' },
  { key: 'quran', label: 'Coran' },
  { key: 'dhikr', label: 'Dhikr' },
  { key: 'charity', label: 'Charité' },
  { key: 'fasting', label: 'Jeûne' },
  { key: 'science', label: 'Science' },
  { key: 'other', label: 'Autre' },
];

const categoryOptions: { key: Habit['category']; label: string }[] = [
  { key: 'prayer', label: 'Prière' },
  { key: 'quran', label: 'Coran' },
  { key: 'dhikr', label: 'Dhikr' },
  { key: 'charity', label: 'Charité' },
  { key: 'fasting', label: 'Jeûne' },
  { key: 'science', label: 'Science' },
  { key: 'other', label: 'Autre' },
];

// Liste d'icônes populaires pour les habitudes
const iconOptions = [
  'Moon', 'CloudMoon', 'BookOpen', 'BookText', 'Sparkles', 'Hands',
  'HeartHandshake', 'Droplets', 'GraduationCap', 'BookOpenText',
  'SmilePlus', 'UsersRound', 'Heart', 'Star', 'Zap', 'Coffee',
  'Sun', 'Sunrise', 'Sunset', 'Check', 'Target', 'Award',
  'Flame', 'Lightbulb', 'MessageCircle', 'Phone', 'Mail', 'Home',
  'Calendar', 'Clock', 'Bell', 'Gift', 'Music', 'Camera',
  'Leaf', 'TreePine', 'Flower', 'Mountain', 'Waves', 'Wind',
  'Compass', 'Map', 'Flag', 'Shield', 'Crown', 'Gem',
  'Feather', 'Palette', 'Brush', 'Pen', 'Bookmark', 'Archive',
];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { habits, addHabit, updateHabit, deleteHabit } = useRamadan();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Habit | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    icon: 'Star',
    category: 'other' as Habit['category'],
  });

  const filteredHabits = filter === 'all' ? habits : habits.filter(h => h.category === filter);

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setFormData({
      title: '',
      icon: 'Star',
      category: 'other',
    });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Habit) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      icon: item.icon,
      category: item.category,
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'habitude.');
      return;
    }

    const data = {
      title: formData.title.trim(),
      icon: formData.icon,
      category: formData.category,
    };

    if (editingItem) {
      updateHabit(editingItem.id, data);
    } else {
      addHabit(data);
    }
    setShowModal(false);
  }, [formData, editingItem, addHabit, updateHabit]);

  const handleDelete = useCallback((id: string) => {
    const item = habits.find(h => h.id === id);
    if (!item) return;
    
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteHabit(id) },
      ]
    );
  }, [habits, deleteHabit]);

  const renderIcon = (iconName: string, size: number = 20, color: string = Colors.primary) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.white} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Habitudes</Text>
            <Text style={styles.subtitle}>{habits.length} habitudes</Text>
          </View>
          <Pressable onPress={openAddModal} style={styles.addBtn}>
            <Plus size={18} color={Colors.white} />
          </Pressable>
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

      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredHabits.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  {renderIcon(item.icon, 24, Colors.white)}
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  <Text style={styles.habitCategory}>
                    {categoryOptions.find(c => c.key === item.category)?.label || item.category}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => openEditModal(item)} style={styles.iconBtn}>
                  <Edit2 size={16} color={Colors.primary} />
                </Pressable>
                {item.isCustom && (
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Trash2 size={16} color={Colors.error} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Modifier' : 'Nouvelle'} Habitude</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Lecture du Coran"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icône</Text>
                <ScrollView 
                  style={styles.iconGridContainer}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.iconGrid}>
                    {iconOptions.map(iconName => (
                      <Pressable
                        key={iconName}
                        onPress={() => setFormData({ ...formData, icon: iconName })}
                        style={[
                          styles.iconOption,
                          formData.icon === iconName && styles.iconOptionActive
                        ]}
                      >
                        {renderIcon(iconName, 24, formData.icon === iconName ? Colors.white : Colors.primary)}
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Catégorie</Text>
                <View style={styles.categoryGrid}>
                  {categoryOptions.map(cat => (
                    <Pressable
                      key={cat.key}
                      onPress={() => setFormData({ ...formData, category: cat.key })}
                      style={[styles.categoryChip, formData.category === cat.key && styles.categoryChipActive]}
                    >
                      <Text style={[styles.categoryChipText, formData.category === cat.key && styles.categoryChipTextActive]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{editingItem ? 'Modifier' : 'Ajouter'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  habitCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
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
  iconGridContainer: {
    maxHeight: 200,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: Colors.white,
  },
});
