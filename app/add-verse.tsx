import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { X, BookMarked } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';

export default function AddVerseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addVerse } = useRamadan();

  const [reference, setReference] = useState<string>('');
  const [arabic, setArabic] = useState<string>('');
  const [french, setFrench] = useState<string>('');
  const [transliteration, setTransliteration] = useState<string>('');

  const handleSave = useCallback(() => {
    if (!reference.trim() || !arabic.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir au moins la référence et le texte arabe.');
      return;
    }

    addVerse({
      reference: reference.trim(),
      arabic: arabic.trim(),
      french: french.trim(),
      transliteration: transliteration.trim(),
    });

    router.back();
  }, [reference, arabic, french, transliteration, addVerse, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} testID="close-add-verse">
            <X size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Nouveau Verset</Text>
          <Pressable onPress={handleSave} style={styles.saveBtn} testID="save-verse">
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <BookMarked size={28} color={Colors.accent} />
            </View>
            <Text style={styles.iconText}>Ajoutez un verset qui vous marque</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Référence *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Al-Baqarah 2:186"
              placeholderTextColor={Colors.textMuted}
              value={reference}
              onChangeText={setReference}
              testID="verse-reference-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Texte Arabe *</Text>
            <TextInput
              style={[styles.input, styles.arabicInput]}
              placeholder="اكتب الآية هنا"
              placeholderTextColor={Colors.textMuted}
              value={arabic}
              onChangeText={setArabic}
              multiline
              textAlign="right"
              testID="verse-arabic-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Translitération</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Ex: Wa idha sa-alaka ibadi..."
              placeholderTextColor={Colors.textMuted}
              value={transliteration}
              onChangeText={setTransliteration}
              multiline
              testID="verse-translit-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Traduction Française</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Entrez la traduction en français..."
              placeholderTextColor={Colors.textMuted}
              value={french}
              onChangeText={setFrench}
              multiline
              testID="verse-french-input"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arabicInput: {
    fontSize: 20,
    lineHeight: 36,
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
});
