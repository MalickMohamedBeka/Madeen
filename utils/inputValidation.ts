import { z } from 'zod';

// ==================== VALIDATION SCHEMAS ====================

// User input schemas
export const UserProfileSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long')
    .trim()
    .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Le nom contient des caractères invalides'),
  nameArabic: z.string()
    .max(100, 'Le nom arabe est trop long')
    .trim()
    .optional(),
});

export const HabitSchema = z.object({
  id: z.string().uuid(),
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long')
    .trim(),
  icon: z.string()
    .min(1, 'L\'icône est requise')
    .max(50, 'L\'icône est invalide'),
  category: z.enum(['prayer', 'quran', 'dhikr', 'charity', 'knowledge', 'other']),
  completed: z.boolean(),
  isCustom: z.boolean(),
});

export const VerseSchema = z.object({
  id: z.string().uuid(),
  arabic: z.string()
    .min(1, 'Le texte arabe est requis')
    .max(5000, 'Le texte est trop long')
    .trim(),
  french: z.string()
    .max(5000, 'La traduction est trop longue')
    .trim()
    .optional(),
  transliteration: z.string()
    .max(5000, 'La translitération est trop longue')
    .trim()
    .optional(),
  reference: z.string()
    .min(1, 'La référence est requise')
    .max(100, 'La référence est trop longue')
    .trim()
    .regex(/^[\p{L}\p{N}\s:.-]+$/u, 'La référence contient des caractères invalides'),
  isFavorite: z.boolean(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});

export const DhikrSchema = z.object({
  id: z.string().uuid(),
  arabic: z.string()
    .min(1, 'Le texte arabe est requis')
    .max(1000, 'Le texte est trop long')
    .trim(),
  transliteration: z.string()
    .max(1000, 'La translitération est trop longue')
    .trim()
    .optional(),
  french: z.string()
    .min(1, 'La traduction française est requise')
    .max(1000, 'La traduction est trop longue')
    .trim(),
  target: z.number()
    .int('Le nombre cible doit être un entier')
    .min(1, 'Le nombre cible doit être au moins 1')
    .max(10000, 'Le nombre cible est trop élevé'),
  count: z.number()
    .int('Le compteur doit être un entier')
    .min(0, 'Le compteur ne peut pas être négatif')
    .max(10000, 'Le compteur est trop élevé'),
  category: z.literal('dhikr'),
  isCustom: z.boolean(),
});

export const DuaSchema = z.object({
  id: z.string().uuid(),
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long')
    .trim(),
  arabic: z.string()
    .min(1, 'Le texte arabe est requis')
    .max(2000, 'Le texte est trop long')
    .trim(),
  transliteration: z.string()
    .max(2000, 'La translitération est trop longue')
    .trim()
    .optional(),
  french: z.string()
    .min(1, 'La traduction française est requise')
    .max(2000, 'La traduction est trop longue')
    .trim(),
  category: z.enum(['morning', 'evening', 'prayer', 'food', 'travel', 'general']).optional(),
  isFavorite: z.boolean(),
  isCustom: z.boolean(),
});

export const ProphetSchema = z.object({
  id: z.string().uuid(),
  nameArabic: z.string()
    .max(100, 'Le nom arabe est trop long')
    .trim()
    .optional(),
  nameFrench: z.string()
    .min(1, 'Le nom français est requis')
    .max(100, 'Le nom français est trop long')
    .trim(),
  nameTranslit: z.string()
    .max(100, 'La translitération est trop longue')
    .trim()
    .optional(),
  description: z.string()
    .max(5000, 'La description est trop longue')
    .trim()
    .optional(),
  keyEvent: z.string()
    .max(1000, 'L\'événement clé est trop long')
    .trim()
    .optional(),
  quranicMention: z.string()
    .max(500, 'La mention coranique est trop longue')
    .trim()
    .optional(),
  order: z.number()
    .int('L\'ordre doit être un entier')
    .min(0, 'L\'ordre ne peut pas être négatif')
    .max(1000, 'L\'ordre est trop élevé'),
  isCustom: z.boolean(),
});

export const SahabaSchema = z.object({
  id: z.string().uuid(),
  nameArabic: z.string()
    .max(100, 'Le nom arabe est trop long')
    .trim()
    .optional(),
  nameFrench: z.string()
    .min(1, 'Le nom français est requis')
    .max(100, 'Le nom français est trop long')
    .trim(),
  nameTranslit: z.string()
    .max(100, 'La translitération est trop longue')
    .trim()
    .optional(),
  title: z.string()
    .max(200, 'Le titre est trop long')
    .trim()
    .optional(),
  description: z.string()
    .max(5000, 'La description est trop longue')
    .trim()
    .optional(),
  keyContribution: z.string()
    .max(1000, 'La contribution clé est trop longue')
    .trim()
    .optional(),
  birthYear: z.string()
    .max(20, 'L\'année de naissance est invalide')
    .trim()
    .optional(),
  deathYear: z.string()
    .max(20, 'L\'année de décès est invalide')
    .trim()
    .optional(),
  category: z.enum(['sahaba', 'sahabi', 'companion']),
  isCustom: z.boolean(),
});

// Coordinates validation
export const CoordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, 'Latitude invalide')
    .max(90, 'Latitude invalide'),
  longitude: z.number()
    .min(-180, 'Longitude invalide')
    .max(180, 'Longitude invalide'),
});

// API response validation
export const PrayerTimesAPISchema = z.object({
  data: z.object({
    timings: z.object({
      Fajr: z.string().regex(/^\d{2}:\d{2}/, 'Format d\'heure invalide'),
      Sunrise: z.string().regex(/^\d{2}:\d{2}/, 'Format d\'heure invalide'),
      Dhuhr: z.string().regex(/^\d{2}:\d{2}/, 'Format d\'heure invalide'),
      Asr: z.string().regex(/^\d{2}:\d{2}/, 'Format d\'heure invalide'),
      Maghrib: z.string().regex(/^\d{2}:\d{2}/, 'Format d\'heure invalide'),
      Isha: z.string().regex(/^\d{2}:\d{2}/, 'Format d\'heure invalide'),
    }),
  }),
});

export const WeatherAPISchema = z.object({
  current_weather: z.object({
    temperature: z.number(),
    weathercode: z.number().int().min(0).max(99),
    windspeed: z.number().optional(),
  }),
});

// ==================== VALIDATION FUNCTIONS ====================

export function validateUserProfile(data: unknown) {
  return UserProfileSchema.safeParse(data);
}

export function validateHabit(data: unknown) {
  return HabitSchema.safeParse(data);
}

export function validateVerse(data: unknown) {
  return VerseSchema.safeParse(data);
}

export function validateDhikr(data: unknown) {
  return DhikrSchema.safeParse(data);
}

export function validateDua(data: unknown) {
  return DuaSchema.safeParse(data);
}

export function validateProphet(data: unknown) {
  return ProphetSchema.safeParse(data);
}

export function validateSahaba(data: unknown) {
  return SahabaSchema.safeParse(data);
}

export function validateCoordinates(data: unknown) {
  return CoordinatesSchema.safeParse(data);
}

export function validatePrayerTimesAPI(data: unknown) {
  return PrayerTimesAPISchema.safeParse(data);
}

export function validateWeatherAPI(data: unknown) {
  return WeatherAPISchema.safeParse(data);
}

// ==================== SANITIZATION ====================

/**
 * Sanitize user input to prevent SQL injection and XSS
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove HTML tags
    .slice(0, 10000); // Limit length
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUUID(input: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!input || typeof input !== 'string' || !uuidRegex.test(input)) {
    return null;
  }
  
  return input.toLowerCase();
}

/**
 * Validate and sanitize number
 */
export function sanitizeNumber(input: unknown, min?: number, max?: number): number | null {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return null;
  }
  
  if (max !== undefined && num > max) {
    return null;
  }
  
  return num;
}
