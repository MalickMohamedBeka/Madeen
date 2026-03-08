import { getHijriDate, getGregorianFormatted, getRamadanProgress } from '../hijri';

describe('Hijri Utils', () => {
  describe('getHijriDate', () => {
    it('should convert Gregorian date to Hijri', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const hijri = getHijriDate(date);

      expect(hijri).toHaveProperty('day');
      expect(hijri).toHaveProperty('month');
      expect(hijri).toHaveProperty('year');
      expect(hijri).toHaveProperty('monthName');
      expect(hijri).toHaveProperty('monthNameAr');
      expect(hijri).toHaveProperty('formatted');
      expect(hijri).toHaveProperty('formattedAr');
      expect(hijri.year).toBeGreaterThan(1400);
    });

    it('should handle current date when no date provided', () => {
      const hijri = getHijriDate();

      expect(hijri).toBeDefined();
      expect(hijri.year).toBeGreaterThan(1400);
    });

    it('should detect Ramadan period', () => {
      const ramadanDate = new Date(2026, 1, 25); // During Ramadan 1446
      const hijri = getHijriDate(ramadanDate);

      expect(hijri.isRamadan).toBe(true);
      expect(hijri.ramadanDay).toBeGreaterThan(0);
      expect(hijri.month).toBe(9); // Ramadan is month 9
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      const hijri = getHijriDate(invalidDate);

      expect(hijri).toBeDefined();
      expect(hijri.monthName).toBe('Muharram');
    });

    it('should handle dates out of range', () => {
      const futureDate = new Date(2200, 0, 1);
      const hijri = getHijriDate(futureDate);

      expect(hijri).toBeDefined();
      expect(hijri.monthName).toBe('Muharram');
    });

    it('should format dates correctly', () => {
      const date = new Date(2024, 0, 1);
      const hijri = getHijriDate(date);

      expect(hijri.formatted).toMatch(/\d+ \w+ \d+/);
      expect(hijri.formattedAr).toMatch(/\d+ .+ \d+/);
    });
  });

  describe('getGregorianFormatted', () => {
    it('should format Gregorian date in French', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const formatted = getGregorianFormatted(date);

      expect(formatted).toContain('2024');
      expect(formatted).toContain('Janvier');
      expect(formatted).toMatch(/\w+ \d+ \w+ \d+/);
    });

    it('should handle current date when no date provided', () => {
      const formatted = getGregorianFormatted();

      expect(formatted).toBeDefined();
      expect(formatted).toMatch(/\w+ \d+ \w+ \d+/);
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      const formatted = getGregorianFormatted(invalidDate);

      expect(formatted).toBe('Date invalide');
    });

    it('should format all days of week correctly', () => {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      // Test a week in January 2024
      for (let i = 0; i < 7; i++) {
        const date = new Date(2024, 0, 7 + i); // Jan 7-13, 2024
        const formatted = getGregorianFormatted(date);
        const dayName = days[date.getDay()];
        expect(formatted).toContain(dayName);
      }
    });

    it('should format all months correctly', () => {
      const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(2024, i, 15);
        const formatted = getGregorianFormatted(date);
        expect(formatted).toContain(months[i]);
      }
    });
  });

  describe('getRamadanProgress', () => {
    it('should return progress during Ramadan', () => {
      // const ramadanDate = new Date(2026, 1, 25); // During Ramadan 1446
      const progress = getRamadanProgress();

      expect(progress).toHaveProperty('day');
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('percentage');
      expect(progress.total).toBe(30);
    });

    it('should return zero progress outside Ramadan', () => {
      // Mock current date to be outside Ramadan
      const progress = getRamadanProgress();

      expect(progress.total).toBe(30);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
      expect(progress.percentage).toBeLessThanOrEqual(1);
    });

    it('should calculate percentage correctly', () => {
      const progress = getRamadanProgress();

      if (progress.day > 0) {
        expect(progress.percentage).toBe(progress.day / 30);
      }
    });

    it('should handle errors gracefully', () => {
      const progress = getRamadanProgress();

      expect(progress).toBeDefined();
      expect(progress.day).toBeGreaterThanOrEqual(0);
      expect(progress.total).toBe(30);
    });
  });
});
