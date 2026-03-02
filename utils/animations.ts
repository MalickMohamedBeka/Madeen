import { Animated, Easing } from 'react-native';

export const fadeIn = (animatedValue: Animated.Value, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

export const fadeOut = (animatedValue: Animated.Value, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

export const slideUp = (animatedValue: Animated.Value, duration = 400) => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    useNativeDriver: true,
    friction: 8,
    tension: 40,
  });
};

export const slideDown = (animatedValue: Animated.Value, toValue: number, duration = 400) => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    friction: 8,
    tension: 40,
  });
};

export const scaleIn = (animatedValue: Animated.Value, duration = 300) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    useNativeDriver: true,
    friction: 6,
  });
};

export const scaleOut = (animatedValue: Animated.Value, duration = 300) => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    useNativeDriver: true,
    friction: 6,
  });
};

export const pulse = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ])
  );
};

export const shake = (animatedValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

export const rotate360 = (animatedValue: Animated.Value, duration = 1000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: Easing.linear,
    })
  );
};
