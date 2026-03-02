import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Palette, Database, Info, Download, Upload, Trash } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRamadan } from '@/providers/RamadanProvider';
import { useAppStore } from '@/store/useAppStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notificationSettings, updateNotificationSettings } = useRamadan();
  const { darkMode, setDarkMode, clearAllData } = useAppStore();

  const handleToggleNotifications = (value: boolean) => {
    updateNotificationSettings({ enabled: value });
  };

  const handleTogglePrayer = (prayer: keyof typeof notificationSettings.prayers, value: boolean) => {
    updateNotificationSettings({
      prayers: {
        ...notificationSettings.prayers,
        [prayer]: value,
      },
    });
  };

  const handleChangeMinutes = () => {
    Alert.alert(
      'Minutes avant la prière',
      'Choisissez combien de minutes avant',
      [
        { text: '5 min', onPress: () => updateNotificationSettings({ minutesBefore: 5 }) },
        { text: '10 min', onPress: () => updateNotificationSettings({ minutesBefore: 10 }) },
        { text: '15 min', onPress: () => updateNotificationSettings({ minutesBefore: 15 }) },
        { text: '20 min', onPress: () => updateNotificationSettings({ minutesBefore: 20 }) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      // Get all data from AsyncStorage
      const data = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        // Add all your app data here
      };

      const jsonData = JSON.stringify(data, null, 2);
      const fileName = `madeen-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonData);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('Succès', 'Données exportées avec succès');
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Effacer toutes les données',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Succès', 'Toutes les données ont été effacées');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres avancés</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Activer les notifications</Text>
              <Text style={styles.settingDesc}>Recevoir des rappels pour les prières</Text>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          {notificationSettings.enabled && (
            <>
              <Pressable style={styles.settingItem} onPress={handleChangeMinutes}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>Rappel avant</Text>
                  <Text style={styles.settingDesc}>{notificationSettings.minutesBefore} minutes avant</Text>
                </View>
                <Text style={styles.settingValue}>{notificationSettings.minutesBefore} min</Text>
              </Pressable>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>Son</Text>
                </View>
                <Switch
                  value={notificationSettings.sound}
                  onValueChange={(value) => updateNotificationSettings({ sound: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                </View>
                <Switch
                  value={notificationSettings.vibration}
                  onValueChange={(value) => updateNotificationSettings({ vibration: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <Text style={styles.subSectionTitle}>Prières à notifier</Text>

              {Object.entries(notificationSettings.prayers).map(([key, value]) => (
                <View key={key} style={styles.settingItem}>
                  <Text style={styles.settingLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Switch
                    value={value}
                    onValueChange={(val) => handleTogglePrayer(key as any, val)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>
              ))}
            </>
          )}
        </View>

        {/* Apparence */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Apparence</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Mode sombre</Text>
              <Text style={styles.settingDesc}>Thème sombre pour l'application</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Données */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Données</Text>
          </View>

          <Pressable style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingIcon}>
              <Download size={18} color={Colors.primary} />
            </View>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Exporter les données</Text>
              <Text style={styles.settingDesc}>Sauvegarder vos données en JSON</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={() => Alert.alert('Bientôt disponible', 'La fonctionnalité d\'import sera disponible prochainement')}>
            <View style={styles.settingIcon}>
              <Upload size={18} color={Colors.primary} />
            </View>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Importer les données</Text>
              <Text style={styles.settingDesc}>Restaurer une sauvegarde</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleClearData}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
              <Trash size={18} color={Colors.error} />
            </View>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingLabel, { color: Colors.error }]}>Effacer toutes les données</Text>
              <Text style={styles.settingDesc}>Réinitialiser l'application</Text>
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

          <Pressable style={styles.settingItem} onPress={() => Alert.alert('Bientôt disponible')}>
            <Text style={styles.settingLabel}>Politique de confidentialité</Text>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={() => Alert.alert('Bientôt disponible')}>
            <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
          </Pressable>
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
    width: 40,
    height: 40,
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
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
