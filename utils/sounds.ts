import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let soundEnabled = true;
let hapticsEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const playSound = async (soundType: 'success' | 'error' | 'notification' | 'click') => {
  if (!soundEnabled) return;

  try {
    const { sound } = await Audio.Sound.createAsync(
      getSoundFile(soundType),
      { shouldPlay: true }
    );
    
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

const getSoundFile = (soundType: string) => {
  // Placeholder - you would add actual sound files to assets
  switch (soundType) {
    case 'success':
      return require('@/assets/sounds/success.mp3');
    case 'error':
      return require('@/assets/sounds/error.mp3');
    case 'notification':
      return require('@/assets/sounds/notification.mp3');
    case 'click':
      return require('@/assets/sounds/click.mp3');
    default:
      return require('@/assets/sounds/click.mp3');
  }
};

export const playHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
  if (!hapticsEnabled) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.error('Error playing haptic:', error);
  }
};

export const playSuccessFeedback = async () => {
  await playHaptic('success');
  await playSound('success');
};

export const playErrorFeedback = async () => {
  await playHaptic('error');
  await playSound('error');
};

export const playClickFeedback = async () => {
  await playHaptic('light');
};
