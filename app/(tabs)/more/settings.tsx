import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Database, Info, Trash, RefreshCw, LogOut, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';
import { getDatabase } from '@/utils/database';
import { APIStatusCard } from '@/components/APIStatusCard';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // ✅ FIX: Use hooks to access store state and actions
  const { 
    habits,
    setHabits,
    clearAllData, 
    soundEnabled, setSoundEnabled, 
    hapticsEnabled, setHapticsEnabled
  } = useAppStore();

  const handleQuitApp = () => {
    Alert.alert(
      'Quitter l\'application',
      'Voulez-vous vraiment quitter l\'application ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            BackHandler.exitApp();
          },
        },
      ]
    );
  };

  const handleResetDay = async () => {
    Alert.alert(
      'Réinitialiser le jour',
      'Cela va réinitialiser toutes les habitudes complétées aujourd\'hui.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.execAsync('UPDATE habits SET completed = 0 WHERE completed = 1;');
              
              // ✅ FIX: Use hook setter instead of direct store access
              setHabits(habits.map(h => ({ ...h, completed: false })));
              
              Alert.alert('Succès', 'Le jour a été réinitialisé');
            } catch (error) {
              console.error('Error resetting day:', error);
              Alert.alert('Erreur', 'Impossible de réinitialiser le jour');
            }
          },
        },
      ]
    );
  };

  const handleResetHabits = async () => {
    Alert.alert(
      'Réinitialiser les habitudes',
      'Cela va supprimer toutes vos habitudes actuelles et charger les nouvelles habitudes par défaut.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              
              // Drop and recreate habits table
              await db.execAsync('DROP TABLE IF EXISTS habits;');
              await db.execAsync(`
                CREATE TABLE habits (
                  id TEXT PRIMARY KEY,
                  title TEXT NOT NULL,
                  icon TEXT NOT NULL,
                  category TEXT NOT NULL,
                  completed INTEGER DEFAULT 0,
                  is_custom INTEGER DEFAULT 0,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
              `);
              
              // Clear habits from store to force reload
              useAppStore.getState().setHabits([]);
              
              Alert.alert(
                'Succès', 
                'Les habitudes ont été réinitialisées. Redémarrez l\'application pour voir les changements.',
                [
                  {
                    text: 'Redémarrer maintenant',
                    onPress: () => BackHandler.exitApp(),
                  },
                  { text: 'Plus tard', style: 'cancel' },
                ]
              );
            } catch (error) {
              console.error('Error resetting habits:', error);
              Alert.alert('Erreur', 'Impossible de réinitialiser les habitudes');
            }
          },
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Effacer toutes les données',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              
              // Drop all tables
              await db.execAsync(`
                DROP TABLE IF EXISTS habits;
                DROP TABLE IF EXISTS verses;
                DROP TABLE IF EXISTS dhikr;
                DROP TABLE IF EXISTS duas;
                DROP TABLE IF EXISTS prophets;
                DROP TABLE IF EXISTS sahabas;
                DROP TABLE IF EXISTS user_profile;
                DROP TABLE IF EXISTS daily_stats;
              `);
              
              // ✅ FIX: Clear store using hook action
              clearAllData();
              
              Alert.alert(
                'Succès', 
                'Toutes les données ont été effacées. Redémarrez l\'application.',
                [
                  {
                    text: 'Redémarrer maintenant',
                    onPress: () => BackHandler.exitApp(),
                  },
                  { text: 'Plus tard', style: 'cancel' },
                ]
              );
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Erreur', 'Impossible d\'effacer les données');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* API Status */}
        <View style={styles.section}>
          <APIStatusCard />
        </View>

        {/* Préférences */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Son</Text>
              <Text style={styles.settingDesc}>Activer les sons dans l'app</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDesc}>Retour haptique</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Pressable style={styles.settingItem} onPress={handleResetDay}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
              <RotateCcw size={18} color="#007AFF" />
            </View>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingLabel, { color: '#007AFF' }]}>Réinitialiser le jour</Text>
              <Text style={styles.settingDesc}>Réinitialiser les habitudes d'aujourd'hui</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleQuitApp}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(142,142,147,0.1)' }]}>
              <LogOut size={18} color="#8E8E93" />
            </View>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingLabel, { color: '#8E8E93' }]}>Quitter l'application</Text>
              <Text style={styles.settingDesc}>Fermer complètement l'app</Text>
            </View>
          </Pressable>
        </View>

        {/* Données avancées */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Paramètres avancés</Text>
          </View>

          <Pressable style={styles.settingItem} onPress={handleResetHabits}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,149,0,0.1)' }]}>
              <RefreshCw size={18} color="#FF9500" />
            </View>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingLabel, { color: '#FF9500' }]}>Réinitialiser les habitudes</Text>
              <Text style={styles.settingDesc}>Charger les nouvelles habitudes par défaut</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleClearData}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
              <Trash size={18} color={Colors.error} />
            </View>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingLabel, { color: Colors.error }]}>Effacer toutes les données</Text>
              <Text style={styles.settingDesc}>Réinitialiser complètement l'application</Text>
            </View>
          </Pressable>
        </View>

        {/* À propos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>À propos</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
