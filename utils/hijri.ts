const HIJRI_EPOCH = 1948439.5;

const MOROCCO_RAMADAN_1446_START = new Date(2026, 1, 19);

function gregorianToJulian(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function julianToHijri(jd: number): { year: number; month: number; day: number } {
  const l = Math.floor(jd - HIJRI_EPOCH) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lPrime = l - 10631 * n + 354;
  const j = Math.floor((10985 - lPrime) / 5316) * Math.floor((50 * lPrime) / 17719) +
    Math.floor(lPrime / 5670) * Math.floor((43 * lPrime) / 15238);
  const lDoublePrime = lPrime - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * lDoublePrime) / 709);
  const day = lDoublePrime - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
  'Jumada al-Ula', 'Jumada al-Thania', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah',
];

const HIJRI_MONTHS_AR = [
  'مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي',
  'جُمَادَى الأُولَى', 'جُمَادَى الثَّانِيَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة',
];

const GREGORIAN_MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAYS_FR = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
];

function getMoroccoRamadanDay(date: Date): number | null {
  const startTime = MOROCCO_RAMADAN_1446_START.getTime();
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = currentDate.getTime() - startTime;
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  if (daysDiff >= 1 && daysDiff <= 30) {
    return daysDiff;
  }
  return null;
}

export function getHijriDate(date: Date = new Date()) {
  const jd = gregorianToJulian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const hijri = julianToHijri(jd);

  const moroccoRamadanDay = getMoroccoRamadanDay(date);
  const isRamadan = moroccoRamadanDay !== null;
  const ramadanDay = moroccoRamadanDay;

  const displayMonth = isRamadan ? 9 : hijri.month;
  const displayDay = isRamadan ? moroccoRamadanDay : hijri.day;

  return {
    day: displayDay,
    month: displayMonth,
    year: hijri.year,
    monthName: HIJRI_MONTHS[displayMonth - 1] || '',
    monthNameAr: HIJRI_MONTHS_AR[displayMonth - 1] || '',
    formatted: `${displayDay} ${HIJRI_MONTHS[displayMonth - 1]} ${hijri.year}`,
    formattedAr: `${displayDay} ${HIJRI_MONTHS_AR[displayMonth - 1]} ${hijri.year}`,
    isRamadan,
    ramadanDay,
  };
}

export function getGregorianFormatted(date: Date = new Date()) {
  const dayName = DAYS_FR[date.getDay()];
  const day = date.getDate();
  const month = GREGORIAN_MONTHS_FR[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName} ${day} ${month} ${year}`;
}

export function getRamadanProgress(): { day: number; total: number; percentage: number } {
  const today = new Date();
  const moroccoDay = getMoroccoRamadanDay(today);
  if (moroccoDay !== null) {
    return { day: moroccoDay, total: 30, percentage: moroccoDay / 30 };
  }
  return { day: 0, total: 30, percentage: 0 };
}
