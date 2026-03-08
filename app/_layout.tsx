import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, Suspense } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { RamadanProvider } from "@/providers/RamadanProvider";
import CustomSplashScreen from "@/components/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/store/useAppStore";
import { setSoundEnabled, setHapticsEnabled } from "@/utils/sounds";
import { initDatabase } from "@/utils/database";
import { initQuranCache } from "@/utils/quranCache";
import { needsMigration, migrateToSQLite, cleanupOldData } from "@/utils/migration";
import { getSettings } from "@/utils/repositories";
import { forceMigration } from "@/utils/force-migration";
import * as Sentry from '@sentry/react-native';

// Initialize Sentry (only in production)
if (!__DEV__) {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN', // TODO: Replace with your actual DSN
    environment: 'production',
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    beforeSend(event) {
      // Filter out development errors
      return event;
    },
  });
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Stack screenOptions={{ headerBackTitle: "Retour" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-verse" options={{ presentation: "modal", headerShown: false }} />
      </Stack>
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.migrationText}>Chargement...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[App] Initializing database...');
        
        // 1. Initialize SQLite database
        await initDatabase();
        console.log('[App] Database initialized');
        
        // 1.5. Force migration of prophets and sahabas tables
        console.log('[App] Checking for schema updates...');
        await forceMigration();
        console.log('[App] Schema migration completed');
        
        // 2. Initialize Quran cache tables
        await initQuranCache();
        console.log('[App] Quran cache initialized');
        
        // 3. Check if migration is needed
        const shouldMigrate = await needsMigration();
        
        if (shouldMigrate) {
          console.log('[App] Migration needed, starting...');
          setMigrating(true);
          
          // 4. Migrate data from AsyncStorage to SQLite
          const success = await migrateToSQLite();
          
          if (success) {
            console.log('[App] Migration successful');
            // 5. Clean up old AsyncStorage data
            await cleanupOldData();
            console.log('[App] Old data cleaned up');
          } else {
            throw new Error('Migration failed');
          }
          
          setMigrating(false);
        }
        
        // 6. Load settings from SQLite
        const settings = await getSettings();
        if (settings) {
          useAppStore.getState().setSoundEnabled(settings.soundEnabled);
          useAppStore.getState().setHapticsEnabled(settings.hapticsEnabled);
          setSoundEnabled(settings.soundEnabled);
          setHapticsEnabled(settings.hapticsEnabled);
        }
        
        // 7. Start API health monitoring (production only)
        const { startHealthMonitoring } = await import('@/utils/apiMonitoring');
        startHealthMonitoring();
        console.log('[App] API health monitoring started');
        
        setInitialized(true);
        console.log('[App] Initialization complete');
        
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setMigrationError(error instanceof Error ? error.message : 'Unknown error');
        
        // Report to Sentry in production
        if (!__DEV__) {
          Sentry.captureException(error);
        }
      }
    };

    initialize();

    // Show splash for 5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      SplashScreen.hideAsync();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    if (!initialized) return;
    
    const unsubscribe = useAppStore.subscribe(
      async (state) => {
        const { saveSettings } = await import('@/utils/repositories');
        await saveSettings({
          soundEnabled: state.soundEnabled,
          hapticsEnabled: state.hapticsEnabled,
        });
      }
    );

    return unsubscribe;
  }, [initialized]);

  // Migration screen
  if (migrating) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.migrationText}>Migration des données en cours...</Text>
        <Text style={styles.migrationSubtext}>Veuillez patienter</Text>
      </View>
    );
  }

  // Error screen
  if (migrationError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Erreur d'initialisation</Text>
        <Text style={styles.errorText}>{migrationError}</Text>
        <Text style={styles.errorSubtext}>Veuillez redémarrer l'application</Text>
      </View>
    );
  }

  if (showSplash || !initialized) {
    return <CustomSplashScreen />;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Report to Sentry in production
        if (!__DEV__) {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RamadanProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </RamadanProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  migrationText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  migrationSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
