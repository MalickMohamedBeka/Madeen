import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { RamadanProvider } from "@/providers/RamadanProvider";
import CustomSplashScreen from "@/components/SplashScreen";
import { useAppStore } from "@/store/useAppStore";
import storage from "@/utils/storage";
import { setSoundEnabled, setHapticsEnabled } from "@/utils/sounds";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Retour" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-verse" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Load data from storage
    const loadData = async () => {
      try {
        const settings = await storage.get<{
          soundEnabled?: boolean;
          hapticsEnabled?: boolean;
          notificationsEnabled?: boolean;
        }>('SETTINGS');
        if (settings) {
          useAppStore.getState().setSoundEnabled(settings.soundEnabled ?? true);
          useAppStore.getState().setHapticsEnabled(settings.hapticsEnabled ?? true);
          useAppStore.getState().setNotificationsEnabled(settings.notificationsEnabled ?? true);
          setSoundEnabled(settings.soundEnabled ?? true);
          setHapticsEnabled(settings.hapticsEnabled ?? true);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();

    // Show splash for 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      SplashScreen.hideAsync();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state) => {
        storage.set('SETTINGS', {
          soundEnabled: state.soundEnabled,
          hapticsEnabled: state.hapticsEnabled,
          notificationsEnabled: state.notificationsEnabled,
        });
      }
    );

    return unsubscribe;
  }, []);

  if (showSplash) {
    return <CustomSplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RamadanProvider>
          <StatusBar style="auto" />
          <RootLayoutNav />
        </RamadanProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
