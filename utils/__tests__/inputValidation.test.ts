import {
  validateUserProfile,
  validateHabit,
  validateVerse,
  validateDhikr,
  // validateDua,
  validateCoordinates,
  sanitizeString,
  sanitizeHTML,
  sanitizeUUID,
  sanitizeNumber,
} from '../inputValidation';

describe('Input Validation Utils', () => {
  describe('validateUserProfile', () => {
    it('should validate valid user profile', () => {
      const validProfile = {
        name: 'Ahmed Ben Ali',
        nameArabic: 'أحمد بن علي',
      };

      const result = validateUserProfile(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidProfile = {
        name: '',
      };

      const result = validateUserProfile(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject name with invalid characters', () => {
      const invalidProfile = {
        name: 'Test<script>alert(1)</script>',
      };

      const result = validateUserProfile(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const profile = {
        name: '  Ahmed  ',
      };

      const result = validateUserProfile(profile);
      expect(result.success).toBe(true);
    });
  });

  describe('validateHabit', () => {
    it('should validate valid habit', () => {
      const validHabit = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Prière du Fajr',
        icon: 'sunrise',
        category: 'prayer',
        completed: false,
        isCustom: false,
      };

      const result = validateHabit(validHabit);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const invalidHabit = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        icon: 'test',
        category: 'invalid',
        completed: false,
        isCustom: false,
      };

      const result = validateHabit(invalidHabit);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalidHabit = {
        id: 'not-a-uuid',
        title: 'Test',
        icon: 'test',
        category: 'prayer',
        completed: false,
        isCustom: false,
      };

      const result = validateHabit(invalidHabit);
      expect(result.success).toBe(false);
    });
  });

  describe('validateVerse', () => {
    it('should validate valid verse', () => {
      const validVerse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        french: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux',
        transliteration: 'Bismillah ar-Rahman ar-Rahim',
        reference: 'Sourate 1:1',
        isFavorite: false,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const result = validateVerse(validVerse);
      expect(result.success).toBe(true);
    });

    it('should reject verse without arabic text', () => {
      const invalidVerse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        arabic: '',
        reference: 'Test',
        isFavorite: false,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const result = validateVerse(invalidVerse);
      expect(result.success).toBe(false);
    });
  });

  describe('validateDhikr', () => {
    it('should validate valid dhikr', () => {
      const validDhikr = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhan Allah',
        french: 'Gloire à Allah',
        target: 33,
        count: 0,
        category: 'dhikr',
        isCustom: false,
      };

      const result = validateDhikr(validDhikr);
      expect(result.success).toBe(true);
    });

    it('should reject negative count', () => {
      const invalidDhikr = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        arabic: 'Test',
        french: 'Test',
        target: 33,
        count: -1,
        category: 'dhikr',
        isCustom: false,
      };

      const result = validateDhikr(invalidDhikr);
      expect(result.success).toBe(false);
    });

    it('should reject target exceeding maximum', () => {
      const invalidDhikr = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        arabic: 'Test',
        french: 'Test',
        target: 20000,
        count: 0,
        category: 'dhikr',
        isCustom: false,
      };

      const result = validateDhikr(invalidDhikr);
      expect(result.success).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should validate valid coordinates', () => {
      const validCoords = {
        latitude: 33.5731,
        longitude: -7.5898,
      };

      const result = validateCoordinates(validCoords);
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const invalidCoords = {
        latitude: 100,
        longitude: 0,
      };

      const result = validateCoordinates(invalidCoords);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const invalidCoords = {
        latitude: 0,
        longitude: 200,
      };

      const result = validateCoordinates(invalidCoords);
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      const input = 'Test\x00\x1F\x7FString';
      const result = sanitizeString(input);
      expect(result).toBe('TestString');
    });

    it('should remove HTML tags', () => {
      const input = 'Test<script>alert(1)</script>String';
      const result = sanitizeString(input);
      expect(result).toBe('Testscriptalert(1)/scriptString');
    });

    it('should trim whitespace', () => {
      const input = '  Test String  ';
      const result = sanitizeString(input);
      expect(result).toBe('Test String');
    });

    it('should handle empty input', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });

    it('should limit length', () => {
      const input = 'a'.repeat(20000);
      const result = sanitizeString(input);
      expect(result.length).toBe(10000);
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeHTML(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const result = sanitizeHTML(input);
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null as any)).toBe('');
    });
  });

  describe('sanitizeUUID', () => {
    it('should validate and normalize valid UUID', () => {
      const input = '123E4567-E89B-12D3-A456-426614174000';
      const result = sanitizeUUID(input);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid UUID', () => {
      expect(sanitizeUUID('not-a-uuid')).toBeNull();
      expect(sanitizeUUID('123')).toBeNull();
      expect(sanitizeUUID('')).toBeNull();
    });

    it('should handle null/undefined', () => {
      expect(sanitizeUUID(null as any)).toBeNull();
      expect(sanitizeUUID(undefined as any)).toBeNull();
    });
  });

  describe('sanitizeNumber', () => {
    it('should validate valid numbers', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber(3.14)).toBe(3.14);
    });

    it('should reject invalid numbers', () => {
      expect(sanitizeNumber('not a number')).toBeNull();
      expect(sanitizeNumber(NaN)).toBeNull();
      expect(sanitizeNumber(Infinity)).toBeNull();
    });

    it('should enforce min/max bounds', () => {
      expect(sanitizeNumber(5, 10, 20)).toBeNull();
      expect(sanitizeNumber(25, 10, 20)).toBeNull();
      expect(sanitizeNumber(15, 10, 20)).toBe(15);
    });

    it('should handle edge cases', () => {
      expect(sanitizeNumber(0)).toBe(0);
      expect(sanitizeNumber(-5)).toBe(-5);
      expect(sanitizeNumber(null)).toBeNull();
    });
  });
});
