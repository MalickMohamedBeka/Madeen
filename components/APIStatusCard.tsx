/**
 * API Status Card Component
 * Displays API health, metrics, and allows manual cache refresh
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { apiMonitoring } from '@/utils/apiMonitoring';
import { apiQueue } from '@/utils/apiQueue';
import { locationService } from '@/services/locationService';
import { prayerTimesService } from '@/services/prayerTimesService';
import { weatherService } from '@/services/weatherService';

export function APIStatusCard() {
  const [health, setHealth] = useState(apiMonitoring.getHealthStatus());
  const [queueStatus, setQueueStatus] = useState(apiQueue.getStatus());
  const [quotaStatus, setQuotaStatus] = useState(apiMonitoring.getQuotaStatus());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(apiMonitoring.getHealthStatus());
      setQueueStatus(apiQueue.getStatus());
      setQuotaStatus(apiMonitoring.getQuotaStatus());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      console.log('[API Status] Starting refresh...');
      
      // Clear all caches
      locationService.clearCache();
      prayerTimesService.clearCache();
      weatherService.clearCache();
      
      console.log('[API Status] Caches cleared');

      // Force reload location (which will trigger prayer times and weather reload)
      try {
        await locationService.getCurrentLocation(true); // forceRefresh = true
        console.log('[API Status] Location reloaded');
      } catch (error) {
        console.error('[API Status] Location reload failed:', error);
      }

      // Process queued requests
      await apiQueue.processQueue();
      console.log('[API Status] Queue processed');

      // Show success message
      Alert.alert('Succès', 'Toutes les données ont été rafraîchies');
      
      console.log('[API Status] Refresh complete');
    } catch (error) {
      console.error('[API Status] Refresh failed:', error);
      Alert.alert('Erreur', 'Impossible de rafraîchir les données');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'unhealthy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy':
        return 'Sain';
      case 'degraded':
        return 'Dégradé';
      case 'unhealthy':
        return 'Problème';
      default:
        return 'Inconnu';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>État des APIs</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Taux de succès</Text>
          <Text style={styles.metricValue}>{health.successRate}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Temps moyen</Text>
          <Text style={styles.metricValue}>{health.avgResponseTime}ms</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Erreurs récentes</Text>
          <Text style={styles.metricValue}>{health.recentErrors}</Text>
        </View>
      </View>

      {queueStatus.total > 0 && (
        <View style={styles.queueInfo}>
          <Text style={styles.queueText}>
            📋 {queueStatus.total} requête(s) en attente
          </Text>
        </View>
      )}

      <View style={styles.quotaSection}>
        <Text style={styles.quotaTitle}>Quotas API</Text>
        {Object.entries(quotaStatus).map(([service, status]) => (
          <View key={service} style={styles.quotaItem}>
            <Text style={styles.quotaService}>{service}</Text>
            <Text style={styles.quotaValue}>
              {status.used} / {status.used + status.remaining}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
        onPress={handleRefreshAll}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.refreshButtonText}>🔄 Rafraîchir tout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  queueInfo: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  queueText: {
    fontSize: 14,
    color: '#92400e',
  },
  quotaSection: {
    marginBottom: 16,
  },
  quotaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  quotaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  quotaService: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  quotaValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
