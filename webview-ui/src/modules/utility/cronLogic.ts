export interface CronField {
  raw: string;
  values: number[];
  isWildcard: boolean;
}

export interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DOW_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Standard cron shorthand macros — expanded before the 5-field split.
const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export const PRESETS: { label: string; expr: string }[] = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every 15 minutes', expr: '*/15 * * * *' },
  { label: 'Every 30 minutes', expr: '*/30 * * * *' },
  { label: 'Hourly', expr: '0 * * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *' },
  { label: 'Daily at 9am', expr: '0 9 * * *' },
  { label: 'Weekdays at 9am', expr: '0 9 * * 1-5' },
  { label: 'Weekly (Sun midnight)', expr: '0 0 * * 0' },
  { label: 'Monthly (1st)', expr: '0 0 1 * *' },
  { label: 'Yearly (Jan 1)', expr: '0 0 1 1 *' },
];

function resolveToken(token: string, fieldName: string, names?: string[]): number {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) throw new Error(`Missing value in the ${fieldName} field`);

  if (names) {
    const idx = names.indexOf(trimmed.slice(0, 3));
    if (idx !== -1) return fieldName === 'month' ? idx + 1 : idx;
  }

  const n = Number(trimmed);
  if (!Number.isInteger(n)) {
    throw new Error(`"${token}" is not a valid value for the ${fieldName} field`);
  }
  return n;
}

function parseField(raw: string, min: number, max: number, fieldName: string, names?: string[]): CronField {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error(`The ${fieldName} field is empty`);

  const isWildcard = trimmed === '*';
  const values = new Set<number>();

  for (const part of trimmed.split(',')) {
    const [rangeAndBase, stepStr] = part.split('/');
    let step = 1;
    if (stepStr !== undefined) {
      step = Number(stepStr);
      if (!Number.isInteger(step) || step <= 0) {
        throw new Error(`Invalid step "${stepStr}" in the ${fieldName} field`);
      }
    }

    let rangeStart: number;
    let rangeEnd: number;

    if (rangeAndBase === '*') {
      rangeStart = min;
      rangeEnd = max;
    } else if (rangeAndBase.includes('-')) {
      const [a, b] = rangeAndBase.split('-');
      rangeStart = resolveToken(a, fieldName, names);
      rangeEnd = resolveToken(b, fieldName, names);
    } else {
      rangeStart = resolveToken(rangeAndBase, fieldName, names);
      rangeEnd = stepStr !== undefined ? max : rangeStart;
    }

    if (rangeStart < min || rangeStart > max || rangeEnd < min || rangeEnd > max) {
      throw new Error(`Value out of range in the ${fieldName} field (expected ${min}-${max})`);
    }
    if (rangeStart > rangeEnd) {
      throw new Error(`Invalid range "${rangeAndBase}" in the ${fieldName} field`);
    }

    for (let v = rangeStart; v <= rangeEnd; v += step) {
      values.add(fieldName === 'day-of-week' ? v % 7 : v);
    }
  }

  return { raw: trimmed, isWildcard, values: Array.from(values).sort((a, b) => a - b) };
}

export function parseCron(expr: string): ParsedCron {
  const trimmed = expr.trim();
  if (!trimmed) throw new Error('Enter a cron expression');

  const expanded = MACROS[trimmed.toLowerCase()] ?? trimmed;
  const fields = expanded.split(/\s+/).filter(Boolean);
  if (fields.length !== 5) {
    throw new Error(`Expected 5 fields (minute hour day month weekday), got ${fields.length}`);
  }

  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = fields;
  return {
    minute: parseField(minuteRaw, 0, 59, 'minute'),
    hour: parseField(hourRaw, 0, 23, 'hour'),
    dayOfMonth: parseField(domRaw, 1, 31, 'day-of-month'),
    month: parseField(monthRaw, 1, 12, 'month', MONTH_NAMES),
    dayOfWeek: parseField(dowRaw, 0, 7, 'day-of-week', DOW_NAMES),
  };
}

function compressRanges(values: number[]): [number, number][] {
  if (values.length === 0) return [];
  const ranges: [number, number][] = [];
  let start = values[0];
  let prev = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] === prev + 1) {
      prev = values[i];
    } else {
      ranges.push([start, prev]);
      start = values[i];
      prev = values[i];
    }
  }
  ranges.push([start, prev]);
  return ranges;
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function listToText(values: number[], labelFn?: (n: number) => string): string {
  const parts = compressRanges(values).map(([a, b]) => {
    const labelA = labelFn ? labelFn(a) : String(a);
    if (a === b) return labelA;
    return `${labelA}-${labelFn ? labelFn(b) : String(b)}`;
  });
  return joinWithAnd(parts);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function stepOf(raw: string): number | null {
  const m = raw.match(/\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

export function describeCron(parsed: ParsedCron): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed;

  let timePart: string;
  const minuteStep = stepOf(minute.raw);
  const hourStep = stepOf(hour.raw);

  if (minute.raw.startsWith('*/') && minuteStep) {
    timePart = `Every ${minuteStep} minute${minuteStep === 1 ? '' : 's'}`;
    if (!hour.isWildcard) timePart += `, during hour ${listToText(hour.values)}`;
  } else if (hour.raw.startsWith('*/') && hourStep && minute.values.length === 1) {
    timePart = `At minute ${minute.values[0]} past every ${hourStep} hour${hourStep === 1 ? '' : 's'}`;
  } else if (minute.isWildcard && hour.isWildcard) {
    timePart = 'Every minute';
  } else if (
    minute.values.length === 1 &&
    hour.values.length === 1 &&
    !minute.raw.includes(',') &&
    !hour.raw.includes(',')
  ) {
    timePart = `At ${pad2(hour.values[0])}:${pad2(minute.values[0])}`;
  } else {
    const minuteText = minute.isWildcard ? 'every minute' : `minute ${listToText(minute.values)}`;
    const hourText = hour.isWildcard ? 'every hour' : `hour ${listToText(hour.values)}`;
    timePart = `At ${minuteText} past ${hourText}`;
  }

  const domText = dayOfMonth.isWildcard ? null : `on day-of-month ${listToText(dayOfMonth.values)}`;
  const monthText = month.isWildcard ? null : `in ${listToText(month.values, (n) => MONTH_LABELS[n - 1])}`;
  const dowText = dayOfWeek.isWildcard ? null : `on ${listToText(dayOfWeek.values, (n) => DOW_LABELS[n])}`;

  const dayPart = domText && dowText ? `${domText} or ${dowText}` : domText || dowText;

  return [timePart, dayPart, monthText].filter(Boolean).join(', ') + '.';
}

const MAX_SEARCH_DAYS = 4 * 366;

export function getNextRuns(parsed: ParsedCron, count: number, from: Date = new Date()): Date[] {
  const results: Date[] = [];
  if (parsed.minute.values.length === 0 || parsed.hour.values.length === 0) return results;

  const timesOfDay: { hour: number; minute: number }[] = [];
  for (const h of parsed.hour.values) {
    for (const m of parsed.minute.values) {
      timesOfDay.push({ hour: h, minute: m });
    }
  }
  timesOfDay.sort((a, b) => a.hour - b.hour || a.minute - b.minute);

  const domSet = new Set(parsed.dayOfMonth.values);
  const monthSet = new Set(parsed.month.values);
  const dowSet = new Set(parsed.dayOfWeek.values);
  const domWildcard = parsed.dayOfMonth.isWildcard;
  const dowWildcard = parsed.dayOfWeek.isWildcard;

  const dayMatches = (date: Date): boolean => {
    if (!monthSet.has(date.getMonth() + 1)) return false;
    const domMatch = domSet.has(date.getDate());
    const dowMatch = dowSet.has(date.getDay());
    if (domWildcard && dowWildcard) return true;
    if (domWildcard) return dowMatch;
    if (dowWildcard) return domMatch;
    return domMatch || dowMatch;
  };

  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  for (let dayOffset = 0; dayOffset <= MAX_SEARCH_DAYS && results.length < count; dayOffset++) {
    const day = new Date(startOfToday);
    day.setDate(startOfToday.getDate() + dayOffset);
    if (!dayMatches(day)) continue;

    for (const t of timesOfDay) {
      const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.hour, t.minute, 0, 0);
      if (candidate <= from) continue;
      results.push(candidate);
      if (results.length >= count) break;
    }
  }

  return results;
}
