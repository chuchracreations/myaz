export interface DateFormatDef {
  code: string;
  label: string;
  generate: () => string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MONTH_NAMES = [
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

function randomBirthDate(): { year: number; month: number; day: number } {
  const year = new Date().getFullYear() - randInt(18, 65);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return { year, month, day };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export const DATE_FORMATS: DateFormatDef[] = [
  {
    code: 'ISO',
    label: 'YYYY-MM-DD',
    generate: () => {
      const { year, month, day } = randomBirthDate();
      return `${year}-${pad(month)}-${pad(day)}`;
    },
  },
  {
    code: 'US',
    label: 'MM/DD/YYYY',
    generate: () => {
      const { year, month, day } = randomBirthDate();
      return `${pad(month)}/${pad(day)}/${year}`;
    },
  },
  {
    code: 'EU',
    label: 'DD/MM/YYYY',
    generate: () => {
      const { year, month, day } = randomBirthDate();
      return `${pad(day)}/${pad(month)}/${year}`;
    },
  },
  {
    code: 'DASH_EU',
    label: 'DD-MM-YYYY',
    generate: () => {
      const { year, month, day } = randomBirthDate();
      return `${pad(day)}-${pad(month)}-${year}`;
    },
  },
  {
    code: 'LONG',
    label: 'Month D, YYYY',
    generate: () => {
      const { year, month, day } = randomBirthDate();
      return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
    },
  },
  {
    code: 'SHORT_MON',
    label: 'DD Mon YYYY',
    generate: () => {
      const { year, month, day } = randomBirthDate();
      return `${pad(day)} ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`;
    },
  },
];
