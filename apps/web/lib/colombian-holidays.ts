const FIXED_HOLIDAYS: [number, number][] = [
  [1, 1],
  [5, 1],
  [7, 20],
  [8, 7],
  [12, 8],
  [12, 25]
];

const MOVABLE_TO_MONDAY: [number, number][] = [
  [1, 6],
  [3, 19],
  [6, 29],
  [8, 15],
  [10, 12],
  [11, 1],
  [11, 11]
];

const EASTER_OFFSETS_IN_PLACE = [-3, -2];
const EASTER_OFFSETS_MOVED_TO_MONDAY = [43, 64, 71];
const DAY_MS = 24 * 60 * 60_000;

const holidaysByYear = new Map<number, Set<string>>();

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

function nextMonday(date: Date): Date {
  const weekday = date.getUTCDay();
  const offset = weekday === 1 ? 0 : (8 - weekday) % 7;
  return new Date(date.getTime() + offset * DAY_MS);
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

function holidaysOf(year: number): Set<string> {
  const cached = holidaysByYear.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const dates = [
    ...FIXED_HOLIDAYS.map(([month, day]) => utcDate(year, month, day)),
    ...MOVABLE_TO_MONDAY.map(([month, day]) => nextMonday(utcDate(year, month, day))),
    ...EASTER_OFFSETS_IN_PLACE.map((offset) => new Date(easter.getTime() + offset * DAY_MS)),
    ...EASTER_OFFSETS_MOVED_TO_MONDAY.map((offset) => new Date(easter.getTime() + offset * DAY_MS))
  ];
  const holidays = new Set(dates.map(dateKey));
  holidaysByYear.set(year, holidays);
  return holidays;
}

export function isColombianHoliday(year: number, month: number, day: number): boolean {
  return holidaysOf(year).has(dateKey(utcDate(year, month, day)));
}

export function isBusinessDay(year: number, month: number, day: number): boolean {
  const weekday = utcDate(year, month, day).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  return !isColombianHoliday(year, month, day);
}
