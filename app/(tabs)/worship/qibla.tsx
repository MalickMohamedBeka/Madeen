import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import QiblaCompass from '@/components/QiblaCompass';

export default function QiblaScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Direction de la Qibla</Text>
        <Text style={styles.subtitle}>Orientez-vous vers la Mecque 🕋</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.compassContainer}>
          <QiblaCompass size={280} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MapPin size={20} color={Colors.primary} />
            <Text style={styles.infoTitle}>Comment utiliser la boussole</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1.</Text>
              <Text style={styles.infoText}>
                Tenez votre téléphone à plat devant vous (comme une boussole)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2.</Text>
              <Text style={styles.infoText}>
                Tournez-vous jusqu'à ce que la flèche pointe vers le haut (Nord)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>3.</Text>
              <Text style={styles.infoText}>
                Quand vous voyez "✓ Aligné avec la Qibla", vous êtes face à la Mecque
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Conseils importants</Text>
            <Text style={styles.tipText}>
              • La flèche devient DORÉE quand vous êtes bien orienté{'\n'}
              • Éloignez-vous des objets métalliques{'\n'}
              • Calibrez en faisant un 8 avec votre téléphone{'\n'}
              • La flèche pointe TOUJOURS vers la Qibla
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  compassContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBullet: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
    width: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accentSoft,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
