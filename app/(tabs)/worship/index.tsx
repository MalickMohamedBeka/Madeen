import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCcw, Check, ChevronDown, Heart, Plus, X, Search, Trash2, BookOpen, Minus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { DhikrItem, Dua } from '@/types';
import VerseCard from '@/components/VerseCard';

type TabKey = 'dhikr' | 'duas' | 'verses' | 'quran';
type DhikrFilter = 'all' | 'morning' | 'evening' | 'after_prayer' | 'anytime';
type DuaFilter = 'all' | 'favorites' | 'ramadan' | 'iftar' | 'suhoor' | 'prayer' | 'protection' | 'forgiveness' | 'general';

const dhikrFilters: { key: DhikrFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'morning', label: 'Matin' },
  { key: 'evening', label: 'Soir' },
  { key: 'after_prayer', label: 'Après prière' },
  { key: 'anytime', label: 'À tout moment' },
];

const duaFilters: { key: DuaFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'favorites', label: 'Favoris' },
  { key: 'ramadan', label: 'Ramadan' },
  { key: 'iftar', label: 'Iftar' },
  { key: 'suhoor', label: 'Suhoor' },
  { key: 'prayer', label: 'Prière' },
  { key: 'protection', label: 'Protection' },
  { key: 'forgiveness', label: 'Pardon' },
  { key: 'general', label: 'Général' },
];

const dhikrCategoryOptions: { key: DhikrItem['category']; label: string }[] = [
  { key: 'morning', label: 'Matin' },
  { key: 'evening', label: 'Soir' },
  { key: 'after_prayer', label: 'Après prière' },
  { key: 'anytime', label: 'À tout moment' },
];

const duaCategoryOptions: { key: Dua['category']; label: string }[] = [
  { key: 'general', label: 'Général' },
  { key: 'ramadan', label: 'Ramadan' },
  { key: 'iftar', label: 'Iftar' },
  { key: 'suhoor', label: 'Suhoor' },
  { key: 'prayer', label: 'Prière' },
  { key: 'protection', label: 'Protection' },
  { key: 'forgiveness', label: 'Pardon' },
];

function DhikrCounter({ item, onIncrement, onReset, onDelete }: {
  item: DhikrItem;
  onIncrement: (id: string) => void;
  onReset: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isComplete = item.count >= item.target;
  const progress = item.target > 0 ? item.count / item.target : 0;
  const [expanded, setExpanded] = useState<boolean>(false);

  const handlePress = useCallback(() => {
    if (isComplete) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 400, friction: 10 }),
    ]).start();
    onIncrement(item.id);
  }, [isComplete, item.id, onIncrement]);

  return (
    <Animated.View style={[styles.dhikrCard, isComplete && styles.dhikrCardComplete, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.dhikrHeader}>
        <View style={styles.dhikrInfo}>
          <Text style={[styles.dhikrArabic, isComplete && styles.dhikrArabicComplete]}>{item.arabic}</Text>
          <Text style={styles.dhikrTranslit}>{item.transliteration}</Text>
        </View>
        <View style={styles.dhikrRight}>
          {isComplete ? (
            <View style={styles.completeBadge}>
              <Check size={16} color={Colors.white} />
            </View>
          ) : (
            <Text style={styles.dhikrCountText}>{item.count}/{item.target}</Text>
          )}
          <ChevronDown size={16} color={Colors.textMuted} style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.dhikrDetails}>
          <Text style={styles.dhikrFrench}>{item.french}</Text>
          {item.reward && (
            <View style={styles.rewardBox}>
              <Text style={styles.rewardText}>{item.reward}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.dhikrProgressBg}>
        <View style={[styles.dhikrProgressFill, isComplete && styles.dhikrProgressComplete, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
      </View>

      <View style={styles.dhikrActions}>
        <Pressable
          onPress={handlePress}
          style={[styles.countButton, isComplete && styles.countButtonComplete]}
          testID={`dhikr-count-${item.id}`}
        >
          <Text style={styles.countButtonText}>{isComplete ? '✓ Terminé' : 'Tape pour compter'}</Text>
        </Pressable>
        <Pressable onPress={() => onReset(item.id)} style={styles.resetItemBtn} testID={`dhikr-reset-${item.id}`}>
          <RotateCcw size={16} color={Colors.textMuted} />
        </Pressable>
        {onDelete && item.isCustom && (
          <Pressable onPress={() => onDelete(item.id)} style={styles.resetItemBtn}>
            <Trash2 size={16} color={Colors.error} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function DuaCard({ dua, onToggleFavorite, onDelete }: {
  dua: Dua;
  onToggleFavorite: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFav = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onToggleFavorite(dua.id);
  }, [dua.id, onToggleFavorite]);

  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      ramadan: 'Ramadan', iftar: 'Iftar', suhoor: 'Suhoor',
      prayer: 'Prière', protection: 'Protection', forgiveness: 'Pardon', general: 'Général',
    };
    return map[dua.category] || dua.category;
  }, [dua.category]);

  return (
    <Animated.View style={[styles.duaCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.duaHeader}>
          <View style={styles.duaTitleRow}>
            <View style={styles.duaCategoryBadge}>
              <Text style={styles.duaCategoryText}>{categoryLabel}</Text>
            </View>
            <Text style={styles.duaTitle} numberOfLines={expanded ? undefined : 1}>{dua.title}</Text>
          </View>
          <View style={styles.duaActions}>
            <Pressable onPress={handleFav} hitSlop={10} testID={`dua-fav-${dua.id}`}>
              <Heart size={20} color={dua.isFavorite ? '#EF4444' : Colors.textMuted} fill={dua.isFavorite ? '#EF4444' : 'transparent'} />
            </Pressable>
            {onDelete && dua.isCustom && (
              <Pressable onPress={() => onDelete(dua.id)} hitSlop={10}>
                <Trash2 size={18} color={Colors.error} />
              </Pressable>
            )}
            <ChevronDown size={16} color={Colors.textMuted} style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined} />
          </View>
        </View>

        <Text style={styles.duaArabic}>{dua.arabic}</Text>

        {expanded && (
          <View style={styles.duaExpanded}>
            <View style={styles.duaDivider} />
            <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
            <Text style={styles.duaFrench}>{dua.french}</Text>
          </View>
        )}

        {!expanded && (
          <Text style={styles.duaFrenchPreview} numberOfLines={1}>{dua.french}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function QuranTab() {
  // const router = useRouter();
  const { quranProgress, incrementQuranPages, decrementQuranPages, updateQuranProgress, resetQuranProgress } = useRamadan();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [editingGoal, setEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>(String(quranProgress.dailyGoal));

  const todayProgress = quranProgress.dailyGoal > 0 ? Math.min(quranProgress.pagesReadToday / quranProgress.dailyGoal, 1) : 0;
  const overallProgress = Math.min(quranProgress.currentPage / 604, 1);

  const handleIncrement = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 400, friction: 10 }),
    ]).start();
    incrementQuranPages();
  }, [incrementQuranPages]);

  const handleSaveGoal = useCallback(() => {
    const goal = parseInt(goalInput, 10) || 20;
    updateQuranProgress({ dailyGoal: Math.max(1, goal) });
    setEditingGoal(false);
  }, [goalInput, updateQuranProgress]);

  const handleResetProgress = useCallback(() => {
    Alert.alert(
      'Réinitialiser la progression',
      'Êtes-vous sûr de vouloir réinitialiser votre progression du Coran à 0/604 ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            resetQuranProgress();
            Alert.alert('Succès', 'Votre progression a été réinitialisée à 0/604');
          },
        },
      ]
    );
  }, [resetQuranProgress]);

  return (
    <View style={styles.quranContainer}>
      <View style={styles.quranMainCard}>
        <View style={styles.quranHeader}>
          <BookOpen size={24} color={Colors.primary} />
          <Text style={styles.quranTitle}>Lecture du Coran</Text>
        </View>

        <View style={styles.quranStatsGrid}>
          <View style={styles.quranStatBox}>
            <Text style={styles.quranStatValue}>{quranProgress.pagesReadToday}</Text>
            <Text style={styles.quranStatLabel}>Pages aujourd'hui</Text>
          </View>
          <View style={styles.quranStatBox}>
            <Text style={styles.quranStatValue}>{quranProgress.currentJuz}</Text>
            <Text style={styles.quranStatLabel}>Juz actuel</Text>
          </View>
          <View style={styles.quranStatBox}>
            <Text style={styles.quranStatValue}>{quranProgress.currentPage}</Text>
            <Text style={styles.quranStatLabel}>Page</Text>
          </View>
        </View>

        <View style={styles.quranProgressSection}>
          <View style={styles.quranProgressHeader}>
            <Text style={styles.quranProgressLabel}>Objectif du jour</Text>
            <Pressable onPress={() => { setGoalInput(String(quranProgress.dailyGoal)); setEditingGoal(true); }}>
              <Text style={styles.quranGoalText}>{quranProgress.pagesReadToday}/{quranProgress.dailyGoal} pages</Text>
            </Pressable>
          </View>
          <View style={styles.quranProgressBg}>
            <View style={[styles.quranProgressFill, { width: `${Math.round(todayProgress * 100)}%` as `${number}%` }]} />
          </View>
        </View>

        <View style={styles.quranProgressSection}>
          <View style={styles.quranProgressHeader}>
            <Text style={styles.quranProgressLabel}>Progression totale</Text>
            <Text style={styles.quranGoalText}>{quranProgress.currentPage}/604</Text>
          </View>
          <View style={styles.quranProgressBg}>
            <View style={[styles.quranProgressFillGold, { width: `${Math.round(overallProgress * 100)}%` as `${number}%` }]} />
          </View>
          {quranProgress.currentPage >= 604 && (
            <Pressable onPress={handleResetProgress} style={styles.quranResetBtn}>
              <RotateCcw size={16} color={Colors.primary} />
              <Text style={styles.quranResetText}>Recommencer de 0</Text>
            </Pressable>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.quranCounterRow}>
            <Pressable onPress={decrementQuranPages} style={styles.quranDecrementBtn}>
              <Minus size={20} color={Colors.primary} />
            </Pressable>
            <Pressable onPress={handleIncrement} style={styles.quranIncrementBtn} testID="quran-increment">
              <Plus size={22} color={Colors.white} />
              <Text style={styles.quranIncrementText}>Page lue</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <View style={styles.quranInfoCard}>
        <Text style={styles.quranInfoTitle}>📖 Astuce</Text>
        <Text style={styles.quranInfoText}>
          Lire 20 pages par jour pendant le Ramadan permet de compléter le Coran entier (604 pages) en 30 jours.
        </Text>
      </View>

      {editingGoal && (
        <Modal visible={editingGoal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.goalModal}>
              <Text style={styles.goalModalTitle}>Objectif quotidien</Text>
              <TextInput
                style={styles.goalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <View style={styles.goalModalActions}>
                <Pressable onPress={() => setEditingGoal(false)} style={styles.goalCancelBtn}>
                  <Text style={styles.goalCancelText}>Annuler</Text>
                </Pressable>
                <Pressable onPress={handleSaveGoal} style={styles.goalSaveBtn}>
                  <Text style={styles.goalSaveText}>Enregistrer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default function WorshipScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    dhikrItems, incrementDhikr, resetDhikr, resetAllDhikr, addDhikr, deleteDhikr,
    totalDhikrCount, totalDhikrTarget,
    duas, toggleDuaFavorite, addDua, deleteDua,
    verses, toggleVerseFavorite, toggleVerseRead, deleteVerse, versesReadCount,
  } = useRamadan();

  const [activeTab, setActiveTab] = useState<TabKey>('dhikr');
  const [dhikrFilter, setDhikrFilter] = useState<DhikrFilter>('all');
  const [duaFilter, setDuaFilter] = useState<DuaFilter>('all');
  const [verseSearch, setVerseSearch] = useState<string>('');
  const [showFavVerses, setShowFavVerses] = useState<boolean>(false);

  const [showAddDhikr, setShowAddDhikr] = useState<boolean>(false);
  const [newDhikrArabic, setNewDhikrArabic] = useState<string>('');
  const [newDhikrTranslit, setNewDhikrTranslit] = useState<string>('');
  const [newDhikrFrench, setNewDhikrFrench] = useState<string>('');
  const [newDhikrTarget, setNewDhikrTarget] = useState<string>('33');
  const [newDhikrCategory, setNewDhikrCategory] = useState<DhikrItem['category']>('anytime');

  const [showAddDua, setShowAddDua] = useState<boolean>(false);
  const [newDuaTitle, setNewDuaTitle] = useState<string>('');
  const [newDuaArabic, setNewDuaArabic] = useState<string>('');
  const [newDuaTranslit, setNewDuaTranslit] = useState<string>('');
  const [newDuaFrench, setNewDuaFrench] = useState<string>('');
  const [newDuaCategory, setNewDuaCategory] = useState<Dua['category']>('general');

  const filteredDhikr = useMemo(() => {
    if (dhikrFilter === 'all') return dhikrItems;
    return dhikrItems.filter(d => d.category === dhikrFilter);
  }, [dhikrItems, dhikrFilter]);

  const filteredDuas = useMemo(() => {
    if (duaFilter === 'all') return duas;
    if (duaFilter === 'favorites') return duas.filter(d => d.isFavorite);
    return duas.filter(d => d.category === duaFilter);
  }, [duas, duaFilter]);

  const filteredVerses = useMemo(() => {
    let result = verses;
    if (showFavVerses) result = result.filter(v => v.isFavorite);
    if (verseSearch.trim()) {
      const q = verseSearch.toLowerCase();
      result = result.filter(v =>
        v.reference.toLowerCase().includes(q) ||
        v.french.toLowerCase().includes(q) ||
        v.transliteration.toLowerCase().includes(q)
      );
    }
    return result;
  }, [verses, verseSearch, showFavVerses]);

  const completedDhikr = useMemo(() => dhikrItems.filter(d => d.count >= d.target).length, [dhikrItems]);
  const overallProgress = totalDhikrTarget > 0 ? totalDhikrCount / totalDhikrTarget : 0;
  const favDuasCount = useMemo(() => duas.filter(d => d.isFavorite).length, [duas]);

  const handleResetAllDhikr = useCallback(() => {
    Alert.alert('Réinitialiser', 'Remettre tous les compteurs à zéro ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: resetAllDhikr },
    ]);
  }, [resetAllDhikr]);

  const handleDeleteDhikr = useCallback((id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce dhikr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteDhikr(id) },
    ]);
  }, [deleteDhikr]);

  const handleDeleteDua = useCallback((id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette dua ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteDua(id) },
    ]);
  }, [deleteDua]);

  const handleDeleteVerse = useCallback((id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce verset ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteVerse(id) },
    ]);
  }, [deleteVerse]);

  const handleAddDhikr = useCallback(() => {
    if (!newDhikrArabic.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le texte arabe.');
      return;
    }
    addDhikr({
      arabic: newDhikrArabic.trim(),
      transliteration: newDhikrTranslit.trim(),
      french: newDhikrFrench.trim(),
      target: parseInt(newDhikrTarget, 10) || 33,
      category: newDhikrCategory,
    });
    setNewDhikrArabic('');
    setNewDhikrTranslit('');
    setNewDhikrFrench('');
    setNewDhikrTarget('33');
    setNewDhikrCategory('anytime');
    setShowAddDhikr(false);
  }, [newDhikrArabic, newDhikrTranslit, newDhikrFrench, newDhikrTarget, newDhikrCategory, addDhikr]);

  const handleAddDua = useCallback(() => {
    if (!newDuaTitle.trim() || !newDuaArabic.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le titre et le texte arabe.');
      return;
    }
    addDua({
      title: newDuaTitle.trim(),
      arabic: newDuaArabic.trim(),
      transliteration: newDuaTranslit.trim(),
      french: newDuaFrench.trim(),
      category: newDuaCategory,
    });
    setNewDuaTitle('');
    setNewDuaArabic('');
    setNewDuaTranslit('');
    setNewDuaFrench('');
    setNewDuaCategory('general');
    setShowAddDua(false);
  }, [newDuaTitle, newDuaArabic, newDuaTranslit, newDuaFrench, newDuaCategory, addDua]);

  const renderAddButton = () => {
    if (activeTab === 'dhikr') {
      return (
        <Pressable onPress={() => setShowAddDhikr(true)} style={styles.addBtn} testID="add-dhikr">
          <Plus size={18} color={Colors.white} />
        </Pressable>
      );
    }
    if (activeTab === 'duas') {
      return (
        <Pressable onPress={() => setShowAddDua(true)} style={styles.addBtn} testID="add-dua">
          <Plus size={18} color={Colors.white} />
        </Pressable>
      );
    }
    if (activeTab === 'verses') {
      return (
        <Pressable onPress={() => router.push('/add-verse' as never)} style={styles.addBtn} testID="add-verse-btn">
          <Plus size={18} color={Colors.white} />
        </Pressable>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Adoration</Text>
            <Text style={styles.subtitle}>
              {activeTab === 'dhikr' && `${completedDhikr}/${dhikrItems.length} complétés`}
              {activeTab === 'duas' && `${duas.length} duas · ${favDuasCount} favoris`}
              {activeTab === 'verses' && `${versesReadCount}/${verses.length} lus`}
              {activeTab === 'quran' && 'Suivi de lecture'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {renderAddButton()}
            {activeTab === 'dhikr' && (
              <Pressable onPress={handleResetAllDhikr} style={styles.resetBtn} testID="reset-all-dhikr">
                <RotateCcw size={18} color={Colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.segmentControl}>
          {([
            { key: 'dhikr' as TabKey, label: 'Dhikr' },
            { key: 'duas' as TabKey, label: 'Duas' },
            { key: 'verses' as TabKey, label: 'Versets' },
            { key: 'quran' as TabKey, label: 'Coran' },
          ]).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.segmentItem, activeTab === tab.key && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, activeTab === tab.key && styles.segmentTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'dhikr' && (
          <>
            <View style={styles.overallProgress}>
              <View style={styles.overallProgressBg}>
                <View style={[styles.overallProgressFill, { width: `${Math.round(overallProgress * 100)}%` as `${number}%` }]} />
              </View>
              <Text style={styles.overallProgressText}>{Math.round(overallProgress * 100)}%</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
              {dhikrFilters.map(f => (
                <Pressable key={f.key} onPress={() => setDhikrFilter(f.key)} style={[styles.filterChip, dhikrFilter === f.key && styles.filterChipActive]}>
                  <Text style={[styles.filterText, dhikrFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {activeTab === 'duas' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
            {duaFilters.map(f => (
              <Pressable key={f.key} onPress={() => setDuaFilter(f.key)} style={[styles.filterChip, duaFilter === f.key && styles.filterChipActive]}>
                <Text style={[styles.filterText, duaFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {activeTab === 'verses' && (
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Search size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un verset..."
                placeholderTextColor={Colors.textMuted}
                value={verseSearch}
                onChangeText={setVerseSearch}
                testID="verse-search"
              />
            </View>
            <Pressable
              onPress={() => setShowFavVerses(!showFavVerses)}
              style={[styles.favFilter, showFavVerses && styles.favFilterActive]}
            >
              <Heart size={18} color={showFavVerses ? Colors.white : Colors.error} fill={showFavVerses ? Colors.white : 'transparent'} />
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'dhikr' && filteredDhikr.map(item => (
          <DhikrCounter key={item.id} item={item} onIncrement={incrementDhikr} onReset={resetDhikr} onDelete={handleDeleteDhikr} />
        ))}
        {activeTab === 'dhikr' && filteredDhikr.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📿</Text>
            <Text style={styles.emptyTitle}>Aucun dhikr</Text>
            <Text style={styles.emptyText}>Ajoutez un dhikr avec le bouton +</Text>
          </View>
        )}

        {activeTab === 'duas' && filteredDuas.map(dua => (
          <DuaCard key={dua.id} dua={dua} onToggleFavorite={toggleDuaFavorite} onDelete={handleDeleteDua} />
        ))}
        {activeTab === 'duas' && filteredDuas.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤲</Text>
            <Text style={styles.emptyTitle}>{duaFilter === 'favorites' ? 'Aucun favori' : 'Aucune dua'}</Text>
            <Text style={styles.emptyText}>{duaFilter === 'favorites' ? 'Appuyez sur le coeur pour ajouter' : 'Ajoutez une dua avec le bouton +'}</Text>
          </View>
        )}

        {activeTab === 'verses' && filteredVerses.map(verse => (
          <VerseCard key={verse.id} verse={verse} onToggleFavorite={toggleVerseFavorite} onToggleRead={toggleVerseRead} onDelete={handleDeleteVerse} />
        ))}
        {activeTab === 'verses' && filteredVerses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>{showFavVerses ? 'Aucun favori' : 'Aucun verset'}</Text>
            <Text style={styles.emptyText}>Ajoutez un verset avec le bouton +</Text>
          </View>
        )}

        {activeTab === 'quran' && <QuranTab />}
      </ScrollView>

      <Modal visible={showAddDhikr} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Dhikr</Text>
              <Pressable onPress={() => setShowAddDhikr(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Texte arabe *</Text>
                <TextInput style={[styles.input, { textAlign: 'right' as const }]} value={newDhikrArabic} onChangeText={setNewDhikrArabic} placeholder="اكتب الذكر هنا" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translitération</Text>
                <TextInput style={styles.input} value={newDhikrTranslit} onChangeText={setNewDhikrTranslit} placeholder="Ex: SubhanAllah" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Traduction</Text>
                <TextInput style={styles.input} value={newDhikrFrench} onChangeText={setNewDhikrFrench} placeholder="Ex: Gloire à Allah" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Objectif</Text>
                <TextInput style={styles.input} value={newDhikrTarget} onChangeText={setNewDhikrTarget} placeholder="33" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Catégorie</Text>
                <View style={styles.categoryGrid}>
                  {dhikrCategoryOptions.map(cat => (
                    <Pressable key={cat.key} onPress={() => setNewDhikrCategory(cat.key)} style={[styles.categoryChip, newDhikrCategory === cat.key && styles.categoryChipActive]}>
                      <Text style={[styles.categoryChipText, newDhikrCategory === cat.key && styles.categoryChipTextActive]}>{cat.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable onPress={handleAddDhikr} style={styles.saveButton} testID="save-dhikr">
                <Text style={styles.saveButtonText}>Ajouter</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddDua} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle Dua</Text>
              <Pressable onPress={() => setShowAddDua(false)} style={styles.modalClose}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput style={styles.input} value={newDuaTitle} onChangeText={setNewDuaTitle} placeholder="Ex: Dua du matin" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Texte arabe *</Text>
                <TextInput style={[styles.input, { textAlign: 'right' as const, minHeight: 80 }]} value={newDuaArabic} onChangeText={setNewDuaArabic} placeholder="اكتب الدعاء هنا" placeholderTextColor={Colors.textMuted} multiline />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translitération</Text>
                <TextInput style={styles.input} value={newDuaTranslit} onChangeText={setNewDuaTranslit} placeholder="Ex: Allahumma..." placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Traduction</Text>
                <TextInput style={[styles.input, { minHeight: 60 }]} value={newDuaFrench} onChangeText={setNewDuaFrench} placeholder="Traduction en français..." placeholderTextColor={Colors.textMuted} multiline />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Catégorie</Text>
                <View style={styles.categoryGrid}>
                  {duaCategoryOptions.map(cat => (
                    <Pressable key={cat.key} onPress={() => setNewDuaCategory(cat.key)} style={[styles.categoryChip, newDuaCategory === cat.key && styles.categoryChipActive]}>
                      <Text style={[styles.categoryChipText, newDuaCategory === cat.key && styles.categoryChipTextActive]}>{cat.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable onPress={handleAddDua} style={styles.saveButton} testID="save-dua">
                <Text style={styles.saveButtonText}>Ajouter</Text>
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
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  overallProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  overallProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(13, 74, 58, 0.1)',
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  overallProgressText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'right' as const,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterContent: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  favFilter: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favFilterActive: {
    backgroundColor: Colors.error,
  },
  listContent: {
    padding: 16,
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
  dhikrCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
  },
  dhikrCardComplete: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(13, 74, 58, 0.03)',
  },
  dhikrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
  },
  dhikrInfo: {
    flex: 1,
    marginRight: 12,
  },
  dhikrArabic: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'right' as const,
    marginBottom: 4,
  },
  dhikrArabicComplete: {
    opacity: 0.6,
  },
  dhikrTranslit: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  dhikrRight: {
    alignItems: 'center',
    gap: 6,
  },
  dhikrCountText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  completeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrDetails: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dhikrFrench: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  rewardBox: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 10,
    padding: 10,
  },
  rewardText: {
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  dhikrProgressBg: {
    height: 3,
    backgroundColor: 'rgba(13, 74, 58, 0.06)',
    marginHorizontal: 16,
  },
  dhikrProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  dhikrProgressComplete: {
    backgroundColor: Colors.success,
  },
  dhikrActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 10,
    gap: 10,
  },
  countButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  countButtonComplete: {
    backgroundColor: Colors.success,
    opacity: 0.8,
  },
  countButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  resetItemBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duaCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  duaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  duaTitleRow: {
    flex: 1,
    marginRight: 10,
  },
  duaCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  duaCategoryText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  duaTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  duaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  duaArabic: {
    fontSize: 20,
    lineHeight: 36,
    color: Colors.primary,
    textAlign: 'right' as const,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  duaExpanded: {},
  duaDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  duaTranslit: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    lineHeight: 22,
    marginBottom: 8,
  },
  duaFrench: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  duaFrenchPreview: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  quranContainer: {
    gap: 16,
  },
  quranReaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  quranReaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quranReaderInfo: {
    flex: 1,
  },
  quranReaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  quranReaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quranReaderArrow: {
    fontSize: 24,
    color: Colors.white,
  },
  quranMainCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quranHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  quranTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  quranStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quranStatBox: {
    flex: 1,
    backgroundColor: 'rgba(13, 74, 58, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  quranStatValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  quranStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
    textAlign: 'center' as const,
  },
  quranProgressSection: {
    marginBottom: 16,
  },
  quranProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quranProgressLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  quranGoalText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  quranProgressBg: {
    height: 8,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  quranProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  quranProgressFillGold: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  quranCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quranDecrementBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quranIncrementBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  quranIncrementText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  quranResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(13, 74, 58, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 74, 58, 0.15)',
  },
  quranResetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  quranTotalBadge: {
    alignItems: 'center',
    minWidth: 48,
  },
  quranTotalText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.accent,
  },
  quranTotalLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  quranInfoCard: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 14,
    padding: 16,
  },
  quranInfoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 6,
  },
  quranInfoText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  goalModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignSelf: 'center',
  },
  goalModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  goalInput: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  goalModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  goalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  goalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  goalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  goalSaveText: {
    fontSize: 15,
    fontWeight: '700' as const,
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
    maxHeight: '85%',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
