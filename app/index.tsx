import { useState, useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import CustomSplashScreen from '@/components/SplashScreen';
import storage from '@/utils/storage';

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await storage.get('ONBOARDING_COMPLETED');
      setShowOnboarding(!completed);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setShowOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await storage.set('ONBOARDING_COMPLETED', true);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving onboarding:', error);
      router.replace('/(tabs)/home');
    }
  };

  // Loading state
  if (showOnboarding === null) {
    return <CustomSplashScreen />;
  }

  // Show onboarding
  if (showOnboarding) {
    return <OnboardingTutorial onComplete={handleOnboardingComplete} />;
  }

  // Redirect to home
  return <Redirect href="/(tabs)/home" />;
}
