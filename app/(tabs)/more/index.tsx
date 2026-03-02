import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ChevronDown, Check, RotateCcw, BookOpen, Info, ScrollText, Plus, X, Trash2, Edit3, Settings, BarChart3, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { Prophet, Sahaba } from '@/types';
import { useRouter } from 'expo-router';

type SectionKey = 'prophets' | 'sahabas' | 'settings';

function SahabaCard({ sahaba, onEdit, onDelete }: { sahaba: Sahaba; onEdit: (s: Sahaba) => void; onDelete?: (id: string) => void }) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      sahaba: 'Compagnon',
      imam: 'Imam',
      scholar: 'Savant',
    };
    return map[sahaba.category] || sahaba.category;
  }, [sahaba.category]);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} style={[styles.prophetCard, expanded && styles.prophetCardExpanded]}>
      <View style={styles.prophetHeader}>
        <View style={[styles.prophetOrderBadge, { backgroundColor: sahaba.category === 'imam' ? '#F59E0B' : sahaba.category === 'scholar' ? '#60A5FA' : Colors.primary }]}>
          <Text style={styles.prophetOrderText}>{categoryLabel.charAt(0)}</Text>
        </View>
        <View style={styles.prophetNames}>
          <Text style={styles.prophetArabic}>{sahaba.nameArabic}</Text>
          <Text style={styles.prophetFrench}>{sahaba.nameFrench}</Text>
          <Text style={styles.sahabaTitle}>{sahaba.title}</Text>
        </View>
        <View style={styles.prophetActions}>
          {onDelete && sahaba.isCustom && (
            <Pressable onPress={(e) => { e.stopPropagation?.(); onDelete(sahaba.id); }} hitSlop={8}>
              <Trash2 size={14} color={Colors.error} />
            </Pressable>
          )}
          <ChevronDown
            size={18}
            color={Colors.textMuted}
            style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.prophetDetails}>
          <Text style={styles.prophetDesc}>{sahaba.description}</Text>
          <View style={styles.prophetEventBox}>
            <Text style={styles.prophetEventLabel}>Contribution clé</Text>
            <Text style={styles.prophetEventText}>{sahaba.keyContribution}</Text>
          </View>
          {(sahaba.birthYear || sahaba.deathYear) && (
            <View style={styles.prophetQuranBox}>
              <ScrollText size={14} color={Colors.accent} />
              <Text style={styles.prophetQuranText}>
                {sahaba.birthYear && `Né: ${sahaba.birthYear}`}
                {sahaba.birthYear && sahaba.deathYear && ' · '}
                {sahaba.deathYear && `Décédé: ${sahaba.deathYear}`}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function ProphetCard({ prophet, onEdit, onDelete }: { prophet: Prophet; onEdit: (p: Prophet) => void; onDelete?: (id: string) => void }) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} style={[styles.prophetCard, expanded && styles.prophetCardExpanded]}>
      <View style={styles.prophetHeader}>
        <View style={styles.prophetOrderBadge}>
          <Text style={styles.prophetOrderText}>{prophet.order}</Text>
        </View>
        <View style={styles.prophetNames}>
          <Text style={styles.prophetArabic}>{prophet.nameArabic}</Text>
          <Text style={styles.prophetFrench}>{prophet.nameFrench}</Text>
        </View>
        <View style={styles.prophetActions}>
          {onDelete && (
            <Pressable onPress={(e) => { e.stopPropagation?.(); onDelete(prophet.id); }} hitSlop={8}>
              <Trash2 size={14} color={Colors.error} />
            </Pressable>
          )}
          <ChevronDown
            size={18}
            color={Colors.textMuted}
            style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.prophetDetails}>
          <Text style={styles.prophetDesc}>{prophet.description}</Text>
          <View style={styles.prophetEventBox}>
            <Text style={styles.prophetEventLabel}>Événement clé</Text>
            <Text style={styles.prophetEventText}>{prophet.keyEvent}</Text>
          </View>
          <View style={styles.prophetQuranBox}>
            <ScrollText size={14} color={Colors.accent} />
            <Text style={styles.prophetQuranText}>{prophet.quranicMention}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { 
    userName, userNameArabic, updateUserName, resetDailyHabits, 
    prophetsList, addProphet, updateProphet, deleteProphet,
    sahabasList, addSahaba, updateSahaba, deleteSahaba 
  } = useRamadan();
  const [activeSection, setActiveSection] = useState<SectionKey>('prophets');
  const [editingName, setEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(userName);
  const [nameArabicInput, setNameArabicInput] = useState<string>(userNameArabic);

  const [showProphetModal, setShowProphetModal] = useState<boolean>(false);
  const [editingProphet, setEditingProphet] = useState<Prophet | null>(null);
  const [prophetNameAr, setProphetNameAr] = useState<string>('');
  const [prophetNameFr, setProphetNameFr] = useState<string>('');
  const [prophetNameTranslit, setProphetNameTranslit] = useState<string>('');
  const [prophetDesc, setProphetDesc] = useState<string>('');
  const [prophetEvent, setProphetEvent] = useState<string>('');
  const [prophetQuran, setProphetQuran] = useState<string>('');
  const [prophetOrder, setProphetOrder] = useState<string>('');

  const [showSahabaModal, setShowSahabaModal] = useState<boolean>(false);
  const [editingSahaba, setEditingSahaba] = useState<Sahaba | null>(null);
  const [sahabaNameAr, setSahabaNameAr] = useState<string>('');
  const [sahabaNameFr, setSahabaNameFr] = useState<string>('');
  const [sahabaNameTranslit, setSahabaNameTranslit] = useState<string>('');
  const [sahabaTitle, setSahabaTitle] = useState<string>('');
  const [sahabaDesc, setSahabaDesc] = useState<string>('');
  const [sahabaContribution, setSahabaContribution] = useState<string>('');
  const [sahabaBirthYear, setSahabaBirthYear] = useState<string>('');
  const [sahabaDeathYear, setSahabaDeathYear] = useState<string>('');
  const [sahabaCategory, setSahabaCategory] = useState<Sahaba['category']>('sahaba');

  const sortedProphets = useMemo(() => [...prophetsList].sort((a, b) => a.order - b.order), [prophetsList]);

  const handleSaveName = useCallback(() => {
    const arabicName = nameArabicInput.trim();
    updateUserName(nameInput.trim(), arabicName || undefined);
    setEditingName(false);
  }, [nameInput, nameArabicInput, updateUserName]);

  const handleResetAll = useCallback(() => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous réinitialiser toutes les habitudes du jour ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: resetDailyHabits },
      ]
    );
  }, [resetDailyHabits]);

  const handleQuitApp = useCallback(() => {
    Alert.alert(
      'Quitter l\'application',
      'Voulez-vous vraiment quitter Madeen ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: () => BackHandler.exitApp()
        },
      ]
    );
  }, []);

  const handleEditProphet = useCallback((prophet: Prophet) => {
    setEditingProphet(prophet);
    setProphetNameAr(prophet.nameArabic);
    setProphetNameFr(prophet.nameFrench);
    setProphetNameTranslit(prophet.nameTranslit);
    setProphetDesc(prophet.description);
    setProphetEvent(prophet.keyEvent);
    setProphetQuran(prophet.quranicMention);
    setProphetOrder(String(prophet.order));
    setShowProphetModal(true);
  }, []);

  const handleAddNewProphet = useCallback(() => {
    setEditingProphet(null);
    setProphetNameAr('');
    setProphetNameFr('');
    setProphetNameTranslit('');
    setProphetDesc('');
    setProphetEvent('');
    setProphetQuran('');
    setProphetOrder(String(sortedProphets.length + 1));
    setShowProphetModal(true);
  }, [sortedProphets.length]);

  const handleSaveProphet = useCallback(() => {
    if (!prophetNameAr.trim() || !prophetNameFr.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom en arabe et en français.');
      return;
    }

    const data = {
      nameArabic: prophetNameAr.trim(),
      nameFrench: prophetNameFr.trim(),
      nameTranslit: prophetNameTranslit.trim(),
      description: prophetDesc.trim(),
      keyEvent: prophetEvent.trim(),
      quranicMention: prophetQuran.trim(),
      order: parseInt(prophetOrder, 10) || sortedProphets.length + 1,
    };

    if (editingProphet) {
      updateProphet(editingProphet.id, data);
    } else {
      addProphet(data);
    }

    setShowProphetModal(false);
  }, [editingProphet, prophetNameAr, prophetNameFr, prophetNameTranslit, prophetDesc, prophetEvent, prophetQuran, prophetOrder, sortedProphets.length, updateProphet, addProphet]);

  const handleDeleteProphet = useCallback((id: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer ce prophète de la liste ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteProphet(id) },
      ]
    );
  }, [deleteProphet]);

  const handleEditSahaba = useCallback((sahaba: Sahaba) => {
    setEditingSahaba(sahaba);
    setSahabaNameAr(sahaba.nameArabic);
    setSahabaNameFr(sahaba.nameFrench);
    setSahabaNameTranslit(sahaba.nameTranslit);
    setSahabaTitle(sahaba.title);
    setSahabaDesc(sahaba.description);
    setSahabaContribution(sahaba.keyContribution);
    setSahabaBirthYear(sahaba.birthYear || '');
    setSahabaDeathYear(sahaba.deathYear || '');
    setSahabaCategory(sahaba.category);
    setShowSahabaModal(true);
  }, []);

  const handleAddNewSahaba = useCallback(() => {
    setEditingSahaba(null);
    setSahabaNameAr('');
    setSahabaNameFr('');
    setSahabaNameTranslit('');
    setSahabaTitle('');
    setSahabaDesc('');
    setSahabaContribution('');
    setSahabaBirthYear('');
    setSahabaDeathYear('');
    setSahabaCategory('sahaba');
    setShowSahabaModal(true);
  }, []);

  const handleSaveSahaba = useCallback(() => {
    if (!sahabaNameAr.trim() || !sahabaNameFr.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom en arabe et en français.');
      return;
    }

    const data = {
      nameArabic: sahabaNameAr.trim(),
      nameFrench: sahabaNameFr.trim(),
      nameTranslit: sahabaNameTranslit.trim(),
      title: sahabaTitle.trim(),
      description: sahabaDesc.trim(),
      keyContribution: sahabaContribution.trim(),
      birthYear: sahabaBirthYear.trim() || undefined,
      deathYear: sahabaDeathYear.trim() || undefined,
      category: sahabaCategory,
    };

    if (editingSahaba) {
      updateSahaba(editingSahaba.id, data);
    } else {
      addSahaba(data);
    }

    setShowSahabaModal(false);
  }, [editingSahaba, sahabaNameAr, sahabaNameFr, sahabaNameTranslit, sahabaTitle, sahabaDesc, sahabaContribution, sahabaBirthYear, sahabaDeathYear, sahabaCategory, updateSahaba, addSahaba]);

  const handleDeleteSahaba = useCallback((id: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer ce sahaba de la liste ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteSahaba(id) },
      ]
    );
  }, [deleteSahaba]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Plus</Text>
          {activeSection === 'prophets' && (
            <Pressable onPress={handleAddNewProphet} style={styles.addBtn} testID="add-prophet">
              <Plus size={18} color={Colors.white} />
            </Pressable>
          )}
          {activeSection === 'sahabas' && (
            <Pressable onPress={handleAddNewSahaba} style={styles.addBtn} testID="add-sahaba">
              <Plus size={18} color={Colors.white} />
            </Pressable>
          )}
        </View>

        <View style={styles.segmentControl}>
          <Pressable
            onPress={() => setActiveSection('prophets')}
            style={[styles.segmentItem, activeSection === 'prophets' && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, activeSection === 'prophets' && styles.segmentTextActive]}>
              Prophètes
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveSection('sahabas')}
            style={[styles.segmentItem, activeSection === 'sahabas' && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, activeSection === 'sahabas' && styles.segmentTextActive]}>
              Sahabas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveSection('settings')}
            style={[styles.segmentItem, activeSection === 'settings' && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, activeSection === 'settings' && styles.segmentTextActive]}>
              Paramètres
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeSection === 'prophets' && (
          <>
            <View style={styles.prophetIntro}>
              <BookOpen size={20} color={Colors.primary} />
              <Text style={styles.prophetIntroText}>
                {sortedProphets.length} prophètes · Appuyez pour lire, ✏️ pour éditer
              </Text>
            </View>
            {sortedProphets.map(prophet => (
              <ProphetCard key={prophet.id} prophet={prophet} onEdit={handleEditProphet} onDelete={handleDeleteProphet} />
            ))}
          </>
        )}

        {activeSection === 'sahabas' && (
          <>
            <View style={styles.prophetIntro}>
              <BookOpen size={20} color={Colors.primary} />
              <Text style={styles.prophetIntroText}>
                {sahabasList.length} compagnons, imams et savants · Appuyez pour lire
              </Text>
            </View>
            {sahabasList.map(sahaba => (
              <SahabaCard key={sahaba.id} sahaba={sahaba} onEdit={handleEditSahaba} onDelete={handleDeleteSahaba} />
            ))}
          </>
        )}

        {activeSection === 'settings' && (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userName ? userName.charAt(0).toUpperCase() : '🌙'}
                  </Text>
                </View>
              </View>
              {editingName ? (
                <View style={styles.nameEditContainer}>
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={styles.nameInput}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Votre nom"
                      placeholderTextColor={Colors.textMuted}
                      autoFocus
                      testID="name-input"
                    />
                  </View>
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={[styles.nameInput, { textAlign: 'right' as const }]}
                      value={nameArabicInput}
                      onChangeText={setNameArabicInput}
                      placeholder="اسمك بالعربية"
                      placeholderTextColor={Colors.textMuted}
                      testID="name-arabic-input"
                    />
                  </View>
                  <Pressable onPress={handleSaveName} style={styles.saveNameBtn}>
                    <Check size={18} color={Colors.white} />
                    <Text style={styles.saveNameText}>Enregistrer</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => { setNameInput(userName); setNameArabicInput(userNameArabic); setEditingName(true); }}>
                  <Text style={styles.profileName}>{userName || 'Appuyez pour ajouter votre nom'}</Text>
                  <Text style={styles.profileNameArabic}>{userNameArabic}</Text>
                  <Text style={styles.profileHint}>Appuyez pour modifier</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionLabel}>Paramètres</Text>
            <View style={styles.settingsGroup}>
              <Pressable onPress={() => router.push('/(tabs)/more/statistics' as any)} style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <BarChart3 size={20} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Statistiques</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/more/settings' as any)} style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Settings size={20} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Paramètres avancés</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Actions</Text>
            <View style={styles.settingsGroup}>
              <Pressable onPress={handleResetAll} style={styles.settingRow} testID="reset-all">
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                  <RotateCcw size={20} color={Colors.error} />
                </View>
                <Text style={[styles.settingLabel, { color: Colors.error }]}>Réinitialiser le jour</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
              <Pressable onPress={handleQuitApp} style={styles.settingRow} testID="quit-app">
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                  <LogOut size={20} color={Colors.error} />
                </View>
                <Text style={[styles.settingLabel, { color: Colors.error }]}>Quitter l'application</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>À propos</Text>
            <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Info size={20} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Version 1.0.0</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Productivité Religieuse</Text>
              <Text style={styles.footerSubtext}>Votre compagnon spirituel au quotidien</Text>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showProphetModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProphet ? 'Modifier' : 'Ajouter'} un prophète</Text>
              <Pressable onPress={() => setShowProphetModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Nom arabe *</Text>
                  <TextInput style={[styles.input, { textAlign: 'right' as const }]} value={prophetNameAr} onChangeText={setProphetNameAr} placeholder="آدَم" placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={[styles.inputGroup, { width: 70 }]}>
                  <Text style={styles.inputLabel}>Ordre</Text>
                  <TextInput style={[styles.input, { textAlign: 'center' as const }]} value={prophetOrder} onChangeText={setProphetOrder} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom français *</Text>
                <TextInput style={styles.input} value={prophetNameFr} onChangeText={setProphetNameFr} placeholder="Ex: Adam" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translitération</Text>
                <TextInput style={styles.input} value={prophetNameTranslit} onChangeText={setProphetNameTranslit} placeholder="Ex: Adam" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput style={[styles.input, { minHeight: 100 }]} value={prophetDesc} onChangeText={setProphetDesc} placeholder="Histoire et description..." placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Événement clé</Text>
                <TextInput style={[styles.input, { minHeight: 60 }]} value={prophetEvent} onChangeText={setProphetEvent} placeholder="Ex: Construction de l'Arche..." placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mention coranique</Text>
                <TextInput style={styles.input} value={prophetQuran} onChangeText={setProphetQuran} placeholder="Ex: Al-Baqarah 2:30-37" placeholderTextColor={Colors.textMuted} />
              </View>
              <Pressable onPress={handleSaveProphet} style={styles.saveButton} testID="save-prophet">
                <Text style={styles.saveButtonText}>{editingProphet ? 'Enregistrer' : 'Ajouter'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSahabaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSahaba ? 'Modifier' : 'Ajouter'} un sahaba</Text>
              <Pressable onPress={() => setShowSahabaModal(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom arabe *</Text>
                <TextInput style={[styles.input, { textAlign: 'right' as const }]} value={sahabaNameAr} onChangeText={setSahabaNameAr} placeholder="أبو بكر الصديق" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom français *</Text>
                <TextInput style={styles.input} value={sahabaNameFr} onChangeText={setSahabaNameFr} placeholder="Ex: Abu Bakr As-Siddiq" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translitération</Text>
                <TextInput style={styles.input} value={sahabaNameTranslit} onChangeText={setSahabaNameTranslit} placeholder="Ex: Abu Bakr As-Siddiq" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titre</Text>
                <TextInput style={styles.input} value={sahabaTitle} onChangeText={setSahabaTitle} placeholder="Ex: Le Véridique" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Catégorie</Text>
                <View style={styles.categoryGrid}>
                  <Pressable onPress={() => setSahabaCategory('sahaba')} style={[styles.categoryChip, sahabaCategory === 'sahaba' && styles.categoryChipActive]}>
                    <Text style={[styles.categoryChipText, sahabaCategory === 'sahaba' && styles.categoryChipTextActive]}>Compagnon</Text>
                  </Pressable>
                  <Pressable onPress={() => setSahabaCategory('imam')} style={[styles.categoryChip, sahabaCategory === 'imam' && styles.categoryChipActive]}>
                    <Text style={[styles.categoryChipText, sahabaCategory === 'imam' && styles.categoryChipTextActive]}>Imam</Text>
                  </Pressable>
                  <Pressable onPress={() => setSahabaCategory('scholar')} style={[styles.categoryChip, sahabaCategory === 'scholar' && styles.categoryChipActive]}>
                    <Text style={[styles.categoryChipText, sahabaCategory === 'scholar' && styles.categoryChipTextActive]}>Savant</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput style={[styles.input, { minHeight: 100 }]} value={sahabaDesc} onChangeText={setSahabaDesc} placeholder="Histoire et description..." placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contribution clé</Text>
                <TextInput style={[styles.input, { minHeight: 60 }]} value={sahabaContribution} onChangeText={setSahabaContribution} placeholder="Ex: Premier calife..." placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Année de naissance</Text>
                  <TextInput style={styles.input} value={sahabaBirthYear} onChangeText={setSahabaBirthYear} placeholder="Ex: 573" placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Année de décès</Text>
                  <TextInput style={styles.input} value={sahabaDeathYear} onChangeText={setSahabaDeathYear} placeholder="Ex: 634" placeholderTextColor={Colors.textMuted} />
                </View>
              </View>
              <Pressable onPress={handleSaveSahaba} style={styles.saveButton} testID="save-sahaba">
                <Text style={styles.saveButtonText}>{editingSahaba ? 'Enregistrer' : 'Ajouter'}</Text>
              </Pressable>
            </ScrollView>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    borderRadius: 12,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  prophetIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    borderRadius: 12,
    padding: 14,
  },
  prophetIntroText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  prophetCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prophetCardExpanded: {
    borderColor: Colors.primaryLight,
  },
  prophetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prophetOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prophetOrderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  prophetNames: {
    flex: 1,
  },
  prophetArabic: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'right' as const,
  },
  prophetFrench: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  sahabaTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  prophetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prophetEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prophetDetails: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  prophetDesc: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  prophetEventBox: {
    backgroundColor: 'rgba(13, 74, 58, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  prophetEventLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  prophetEventText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  prophetQuranBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentSoft,
    borderRadius: 10,
    padding: 10,
  },
  prophetQuranText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
    flex: 1,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  nameEditContainer: {
    width: '100%',
    gap: 10,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveNameText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  profileNameArabic: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  profileHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
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
    marginBottom: 20,
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
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 16,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
});
