export interface PhoneFormatDef {
  code: string;
  label: string;
  dial: string;
  generate: () => string;
}

// Every PhoneFormatDef.generate() output starts with "<dial> " — strip that prefix
// to produce a number without the country code.
export function generatePhoneNumber(format: PhoneFormatDef, includeCountryCode: boolean): string {
  const full = format.generate();
  if (includeCountryCode) return full;
  const prefix = `${format.dial} `;
  return full.startsWith(prefix) ? full.slice(prefix.length) : full;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digits(count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) out += randInt(0, 9);
  return out;
}

const US_AREA_CODES = [212, 415, 312, 646, 305, 702, 512, 206, 720, 404];
const CA_AREA_CODES = [416, 604, 403, 514, 613, 902];

export const PHONE_FORMATS: PhoneFormatDef[] = [
  {
    code: 'US',
    label: 'United States',
    dial: '+1',
    // 555-0100 through 555-0199 is reserved by NANPA specifically for fictional use.
    generate: () =>
      `+1 (${US_AREA_CODES[randInt(0, US_AREA_CODES.length - 1)]}) 555-01${String(randInt(0, 99)).padStart(2, '0')}`,
  },
  {
    code: 'CA',
    label: 'Canada',
    dial: '+1',
    // Canada shares the NANP fictional-use block with the US.
    generate: () =>
      `+1 (${CA_AREA_CODES[randInt(0, CA_AREA_CODES.length - 1)]}) 555-01${String(randInt(0, 99)).padStart(2, '0')}`,
  },
  {
    code: 'UK',
    label: 'United Kingdom',
    dial: '+44',
    // Ofcom reserves 07700 900000-07700 900999 specifically for dramas and fiction.
    generate: () => `+44 7700 900${String(randInt(0, 999)).padStart(3, '0')}`,
  },
  {
    code: 'IE',
    label: 'Ireland',
    dial: '+353',
    generate: () => `+353 8${randInt(1, 9)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'IN',
    label: 'India',
    dial: '+91',
    generate: () => `+91 ${randInt(6, 9)}${digits(4)} ${digits(5)}`,
  },
  {
    code: 'PK',
    label: 'Pakistan',
    dial: '+92',
    generate: () => `+92 3${randInt(0, 9)}${digits(1)} ${digits(7)}`,
  },
  {
    code: 'DE',
    label: 'Germany',
    dial: '+49',
    generate: () => `+49 15${randInt(1, 7)} ${digits(7)}`,
  },
  {
    code: 'FR',
    label: 'France',
    dial: '+33',
    generate: () => `+33 ${randInt(6, 7)} ${digits(2)} ${digits(2)} ${digits(2)} ${digits(2)}`,
  },
  {
    code: 'ES',
    label: 'Spain',
    dial: '+34',
    generate: () => `+34 6${digits(2)} ${digits(3)} ${digits(3)}`,
  },
  {
    code: 'IT',
    label: 'Italy',
    dial: '+39',
    generate: () => `+39 3${digits(2)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'NL',
    label: 'Netherlands',
    dial: '+31',
    generate: () => `+31 6 ${digits(4)} ${digits(4)}`,
  },
  {
    code: 'PT',
    label: 'Portugal',
    dial: '+351',
    generate: () => `+351 9${randInt(1, 6)}${digits(1)} ${digits(3)} ${digits(3)}`,
  },
  {
    code: 'SE',
    label: 'Sweden',
    dial: '+46',
    generate: () => `+46 7${digits(1)} ${digits(3)} ${digits(2)} ${digits(2)}`,
  },
  {
    code: 'PL',
    label: 'Poland',
    dial: '+48',
    generate: () => `+48 ${digits(3)} ${digits(3)} ${digits(3)}`,
  },
  {
    code: 'RU',
    label: 'Russia',
    dial: '+7',
    generate: () => `+7 9${digits(2)} ${digits(3)}-${digits(2)}-${digits(2)}`,
  },
  {
    code: 'TR',
    label: 'Turkey',
    dial: '+90',
    generate: () => `+90 5${digits(2)} ${digits(3)} ${digits(2)} ${digits(2)}`,
  },
  {
    code: 'AE',
    label: 'United Arab Emirates',
    dial: '+971',
    generate: () => `+971 5${randInt(0, 9)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'SA',
    label: 'Saudi Arabia',
    dial: '+966',
    generate: () => `+966 5${digits(1)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'IL',
    label: 'Israel',
    dial: '+972',
    generate: () => `+972 5${randInt(0, 9)}-${digits(3)}-${digits(4)}`,
  },
  {
    code: 'ZA',
    label: 'South Africa',
    dial: '+27',
    generate: () => `+27 7${digits(1)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'NG',
    label: 'Nigeria',
    dial: '+234',
    generate: () => `+234 8${digits(2)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'EG',
    label: 'Egypt',
    dial: '+20',
    generate: () => `+20 1${randInt(0, 2)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'CN',
    label: 'China',
    dial: '+86',
    generate: () => `+86 1${digits(2)} ${digits(4)} ${digits(4)}`,
  },
  { code: 'JP', label: 'Japan', dial: '+81', generate: () => `+81 90-${digits(4)}-${digits(4)}` },
  {
    code: 'KR',
    label: 'South Korea',
    dial: '+82',
    generate: () => `+82 10-${digits(4)}-${digits(4)}`,
  },
  {
    code: 'SG',
    label: 'Singapore',
    dial: '+65',
    generate: () => `+65 ${randInt(8, 9)}${digits(3)} ${digits(4)}`,
  },
  {
    code: 'ID',
    label: 'Indonesia',
    dial: '+62',
    generate: () => `+62 8${digits(2)}-${digits(4)}-${digits(4)}`,
  },
  {
    code: 'PH',
    label: 'Philippines',
    dial: '+63',
    generate: () => `+63 9${digits(2)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'VN',
    label: 'Vietnam',
    dial: '+84',
    generate: () => `+84 9${digits(1)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'TH',
    label: 'Thailand',
    dial: '+66',
    generate: () => `+66 8${digits(1)}-${digits(3)}-${digits(4)}`,
  },
  {
    code: 'AU',
    label: 'Australia',
    dial: '+61',
    generate: () => `+61 4${digits(2)} ${digits(3)} ${digits(3)}`,
  },
  {
    code: 'NZ',
    label: 'New Zealand',
    dial: '+64',
    generate: () => `+64 2${randInt(1, 9)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'BR',
    label: 'Brazil',
    dial: '+55',
    generate: () => `+55 ${randInt(11, 21)} 9${digits(4)}-${digits(4)}`,
  },
  {
    code: 'MX',
    label: 'Mexico',
    dial: '+52',
    generate: () => `+52 1 ${digits(3)} ${digits(3)} ${digits(4)}`,
  },
  {
    code: 'AR',
    label: 'Argentina',
    dial: '+54',
    generate: () => `+54 9 11 ${digits(4)}-${digits(4)}`,
  },
  {
    code: 'CO',
    label: 'Colombia',
    dial: '+57',
    generate: () => `+57 3${digits(2)} ${digits(3)} ${digits(4)}`,
  },
];
