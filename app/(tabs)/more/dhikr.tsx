import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Edit2, Trash2, RotateCcw, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { DhikrItem } from '@/types';
import { useRouter } from 'expo-router';

type CategoryFilter = 'all' | 'after_prayer' | 'morning' | 'evening' | 'anytime';

const categories: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'after_prayer', label: 'Après prière' },
  { key: 'morning', label: 'Matin' },
  { key: 'evening', label: 'Soir' },
  { key: 'anytime', label: 'Tout moment' },
];

const categoryOptions: { key: DhikrItem['category']; label: string }[] = [
  { key: 'after_prayer', label: 'Après prière' },
  { key: 'morning', label: 'Matin' },
  { key: 'evening', label: 'Soir' },
  { key: 'anytime', label: 'Tout moment' },
];

export default function DhikrScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dhikrItems, incrementDhikr, resetDhikr, addDhikr, updateDhikr, deleteDhikr } = useRamadan();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DhikrItem | null>(null);
  
  const [formData, setFormData] = useState({
    arabic: '',
    transliteration: '',
    french: '',
    target: '33',
    category: 'anytime' as DhikrItem['category'],
    reward: '',
  });

  const filteredDhikr = filter === 'all' ? dhikrItems : dhikrItems.filter(d => d.category === filter);

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setFormData({
      arabic: '',
      transliteration: '',
      french: '',
      target: '33',
      category: 'anytime',
      reward: '',
    });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: DhikrItem) => {
    setEditingItem(item);
    setFormData({
      arabic: item.arabic,
      transliteration: item.transliteration,
      french: item.french,
      target: item.target.toString(),
      category: item.category,
      reward: item.reward || '',
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.arabic.trim() || !formData.french.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir au moins l\'arabe et la traduction française.');
      return;
    }

    const data = {
      arabic: formData.arabic.trim(),
      transliteration: formData.transliteration.trim(),
      french: formData.french.trim(),
      target: parseInt(formData.target) || 1,
      category: formData.category,
      reward: formData.reward.trim(),
    };

    if (editingItem) {
      updateDhikr(editingItem.id, data);
    } else {
      addDhikr(data);
    }
    setShowModal(false);
  }, [formData, editingItem, addDhikr, updateDhikr]);

  const handleDelete = useCallback((id: string) => {
    const item = dhikrItems.find(d => d.id === id);
    if (!item) return;
    
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer ce dhikr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteDhikr(id) },
      ]
    );
  }, [dhikrItems, deleteDhikr]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={20} color={Colors.white} />
          </Pressable>
          <Text style={styles.title}>Dhikr</Text>
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
        {filteredDhikr.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.arabic}>{item.arabic}</Text>
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
            <Text style={styles.transliteration}>{item.transliteration}</Text>
            <Text style={styles.french}>{item.french}</Text>
            {item.reward && <Text style={styles.reward}>🎁 {item.reward}</Text>}
            
            <View style={styles.counter}>
              <Pressable onPress={() => resetDhikr(item.id)} style={styles.resetSmall}>
                <RotateCcw size={14} color={Colors.textMuted} />
              </Pressable>
              <Text style={styles.count}>{item.count} / {item.target}</Text>
              <Pressable onPress={() => incrementDhikr(item.id)} style={styles.incrementBtn}>
                <Text style={styles.incrementText}>+1</Text>
              </Pressable>
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
              <Text style={styles.modalTitle}>{editingItem ? 'Modifier' : 'Nouveau'} Dhikr</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Arabe *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="النص العربي"
                  value={formData.arabic}
                  onChangeText={(text) => setFormData({ ...formData, arabic: text })}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translittération</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Transliteration"
                  value={formData.transliteration}
                  onChangeText={(text) => setFormData({ ...formData, transliteration: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Traduction française *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Traduction en français"
                  value={formData.french}
                  onChangeText={(text) => setFormData({ ...formData, french: text })}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Objectif</Text>
                <TextInput
                  style={styles.input}
                  placeholder="33"
                  keyboardType="number-pad"
                  value={formData.target}
                  onChangeText={(text) => setFormData({ ...formData, target: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Récompense</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Description de la récompense"
                  value={formData.reward}
                  onChangeText={(text) => setFormData({ ...formData, reward: text })}
                  multiline
                />
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  arabic: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
    lineHeight: 32,
  },
  transliteration: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  french: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 8,
  },
  reward: {
    fontSize: 13,
    color: Colors.primary,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  incrementBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  incrementText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
