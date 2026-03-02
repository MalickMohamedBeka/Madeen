import { Animated } from 'react-native';
import { fadeIn, fadeOut, scaleIn, scaleOut } from '../animations';

describe('Animation Utils', () => {
  let animatedValue: Animated.Value;

  beforeEach(() => {
    animatedValue = new Animated.Value(0);
  });

  describe('fadeIn', () => {
    it('should create fade in animation', () => {
      const animation = fadeIn(animatedValue, 300);
      expect(animation).toBeDefined();
    });
  });

  describe('fadeOut', () => {
    it('should create fade out animation', () => {
      const animation = fadeOut(animatedValue, 300);
      expect(animation).toBeDefined();
    });
  });

  describe('scaleIn', () => {
    it('should create scale in animation', () => {
      const animation = scaleIn(animatedValue, 300);
      expect(animation).toBeDefined();
    });
  });

  describe('scaleOut', () => {
    it('should create scale out animation', () => {
      const animation = scaleOut(animatedValue, 300);
      expect(animation).toBeDefined();
    });
  });
});
