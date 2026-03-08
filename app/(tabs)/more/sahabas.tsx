import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Edit2, Trash2, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { Sahaba } from '@/types';
import { useRouter } from 'expo-router';

type CategoryFilter = 'all' | 'sahaba' | 'imam' | 'scholar';

const categories: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'sahaba', label: 'Sahabas' },
  { key: 'imam', label: 'Imams' },
  { key: 'scholar', label: 'Savants' },
];

const categoryOptions: { key: Sahaba['category']; label: string }[] = [
  { key: 'sahaba', label: 'Sahaba' },
  { key: 'imam', label: 'Imam' },
  { key: 'scholar', label: 'Savant' },
];

export default function SahabasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sahabasList, addSahaba, updateSahaba, deleteSahaba } = useRamadan();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Sahaba | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nameArabic: '',
    nameFrench: '',
    nameTranslit: '',
    title: '',
    description: '',
    keyContribution: '',
    birthYear: '',
    deathYear: '',
    category: 'sahaba' as Sahaba['category'],
  });

  const filteredSahabas = filter === 'all' ? sahabasList : sahabasList.filter(s => s.category === filter);

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setFormData({
      nameArabic: '',
      nameFrench: '',
      nameTranslit: '',
      title: '',
      description: '',
      keyContribution: '',
      birthYear: '',
      deathYear: '',
      category: 'sahaba',
    });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Sahaba) => {
    setEditingItem(item);
    setFormData({
      nameArabic: item.nameArabic,
      nameFrench: item.nameFrench,
      nameTranslit: item.nameTranslit,
      title: item.title,
      description: item.description,
      keyContribution: item.keyContribution,
      birthYear: item.birthYear || '',
      deathYear: item.deathYear || '',
      category: item.category,
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.nameFrench.trim() || !formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom français et la description.');
      return;
    }

    const data = {
      nameArabic: formData.nameArabic.trim(),
      nameFrench: formData.nameFrench.trim(),
      nameTranslit: formData.nameTranslit.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      keyContribution: formData.keyContribution.trim(),
      birthYear: formData.birthYear.trim(),
      deathYear: formData.deathYear.trim(),
      category: formData.category,
    };

    if (editingItem) {
      updateSahaba(editingItem.id, data);
    } else {
      addSahaba(data);
    }
    setShowModal(false);
  }, [formData, editingItem, addSahaba, updateSahaba]);

  const handleDelete = useCallback((id: string) => {
    const item = sahabasList.find(s => s.id === id);
    if (!item) return;
    
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer ${item.nameFrench} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteSahaba(id) },
      ]
    );
  }, [sahabasList, deleteSahaba]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sahabas & Savants</Text>
            <Text style={styles.subtitle}>{sahabasList.length} personnalités</Text>
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
        {filteredSahabas.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Pressable 
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                style={styles.cardHeaderLeft}
              >
                <View style={styles.nameContainer}>
                  <Text style={styles.nameFrench}>{item.nameFrench}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.nameArabic}>{item.nameArabic}</Text>
                  {(item.birthYear || item.deathYear) && (
                    <Text style={styles.dates}>
                      {item.birthYear && `${item.birthYear}`}
                      {item.birthYear && item.deathYear && ' - '}
                      {item.deathYear && `${item.deathYear}`}
                    </Text>
                  )}
                </View>
              </Pressable>
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

            {expandedId === item.id && (
              <View style={styles.expandedContent}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📖 Biographie</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>

                {item.keyContribution && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⭐ Contribution majeure</Text>
                    <Text style={styles.keyContribution}>{item.keyContribution}</Text>
                  </View>
                )}
              </View>
            )}
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
              <Text style={styles.modalTitle}>{editingItem ? 'Modifier' : 'Nouveau'} Sahaba</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom français *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Abou Bakr As-Siddiq"
                  value={formData.nameFrench}
                  onChangeText={(text) => setFormData({ ...formData, nameFrench: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom arabe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أبو بكر الصديق"
                  value={formData.nameArabic}
                  onChangeText={(text) => setFormData({ ...formData, nameArabic: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translittération</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Abu Bakr As-Siddiq"
                  value={formData.nameTranslit}
                  onChangeText={(text) => setFormData({ ...formData, nameTranslit: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Le Véridique, 1er Calife"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description / Biographie *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Biographie et description"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contribution majeure</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contribution principale"
                  value={formData.keyContribution}
                  onChangeText={(text) => setFormData({ ...formData, keyContribution: text })}
                  multiline
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Année de naissance</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="573"
                    keyboardType="number-pad"
                    value={formData.birthYear}
                    onChangeText={(text) => setFormData({ ...formData, birthYear: text })}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Année de décès</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="634"
                    keyboardType="number-pad"
                    value={formData.deathYear}
                    onChangeText={(text) => setFormData({ ...formData, deathYear: text })}
                  />
                </View>
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
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
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  nameFrench: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  titleText: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
  },
  nameArabic: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dates: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
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
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  keyContribution: {
    fontSize: 14,
    color: Colors.primary,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
