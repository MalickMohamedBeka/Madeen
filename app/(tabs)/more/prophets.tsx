import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Edit2, Trash2, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { Prophet } from '@/types';
import { useRouter } from 'expo-router';

export default function ProphetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { prophetsList, addProphet, updateProphet, deleteProphet } = useRamadan();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Prophet | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nameArabic: '',
    nameFrench: '',
    nameTranslit: '',
    description: '',
    keyEvent: '',
    quranicMention: '',
  });

  const sortedProphets = [...prophetsList].sort((a, b) => a.order - b.order);

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setFormData({
      nameArabic: '',
      nameFrench: '',
      nameTranslit: '',
      description: '',
      keyEvent: '',
      quranicMention: '',
    });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: Prophet) => {
    setEditingItem(item);
    setFormData({
      nameArabic: item.nameArabic,
      nameFrench: item.nameFrench,
      nameTranslit: item.nameTranslit,
      description: item.description,
      keyEvent: item.keyEvent,
      quranicMention: item.quranicMention,
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
      description: formData.description.trim(),
      keyEvent: formData.keyEvent.trim(),
      quranicMention: formData.quranicMention.trim(),
    };

    if (editingItem) {
      updateProphet(editingItem.id, data);
    } else {
      addProphet({ ...data, order: 0 });
    }
    setShowModal(false);
  }, [formData, editingItem, addProphet, updateProphet]);

  const handleDelete = useCallback((id: string) => {
    const item = prophetsList.find(p => p.id === id);
    if (!item) return;
    
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer ${item.nameFrench} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteProphet(id) },
      ]
    );
  }, [prophetsList, deleteProphet]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Les Prophètes</Text>
            <Text style={styles.subtitle}>{prophetsList.length} prophètes</Text>
          </View>
          <Pressable onPress={openAddModal} style={styles.addBtn}>
            <Plus size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedProphets.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Pressable 
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                style={styles.cardHeaderLeft}
              >
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{item.order}</Text>
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.nameFrench}>{item.nameFrench}</Text>
                  <Text style={styles.nameArabic}>{item.nameArabic}</Text>
                  {item.nameTranslit && <Text style={styles.nameTranslit}>{item.nameTranslit}</Text>}
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
                  <Text style={styles.sectionTitle}>📖 Histoire</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>

                {item.keyEvent && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⭐ Événement clé</Text>
                    <Text style={styles.keyEvent}>{item.keyEvent}</Text>
                  </View>
                )}

                {item.quranicMention && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📚 Mention coranique</Text>
                    <Text style={styles.quranicMention}>{item.quranicMention}</Text>
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
              <Text style={styles.modalTitle}>{editingItem ? 'Modifier' : 'Nouveau'} Prophète</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom français *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Adam"
                  value={formData.nameFrench}
                  onChangeText={(text) => setFormData({ ...formData, nameFrench: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom arabe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="آدَم"
                  value={formData.nameArabic}
                  onChangeText={(text) => setFormData({ ...formData, nameArabic: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translittération</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adam"
                  value={formData.nameTranslit}
                  onChangeText={(text) => setFormData({ ...formData, nameTranslit: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description / Histoire *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Histoire et description du prophète"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Événement clé</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Événement marquant"
                  value={formData.keyEvent}
                  onChangeText={(text) => setFormData({ ...formData, keyEvent: text })}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mention coranique</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Al-Baqarah 2:30-37"
                  value={formData.quranicMention}
                  onChangeText={(text) => setFormData({ ...formData, quranicMention: text })}
                />
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  nameContainer: {
    flex: 1,
  },
  nameFrench: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  nameArabic: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nameTranslit: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textMuted,
    marginTop: 1,
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
  keyEvent: {
    fontSize: 14,
    color: Colors.primary,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  quranicMention: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
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
