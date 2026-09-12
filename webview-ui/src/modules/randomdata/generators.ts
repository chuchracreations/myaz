import React from 'react';
import { Mail, Phone, User, Lock, MapPin, AtSign, Building2, Calendar, Briefcase, Network, Cpu, Monitor, Palette, AlignLeft } from 'lucide-react';
import { PHONE_FORMATS } from './phoneFormats';

export type FieldId =
  | 'email'
  | 'phone'
  | 'name'
  | 'password'
  | 'address'
  | 'username'
  | 'company'
  | 'dob'
  | 'jobtitle'
  | 'ip'
  | 'mac'
  | 'useragent'
  | 'color'
  | 'lorem';

export interface FieldDef {
  id: FieldId;
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  accentSoft: string;
  generate: () => string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
];

const STREET_NAMES = [
  'Maple', 'Oak', 'Cedar', 'Elm', 'Pine', 'Washington', 'Lincoln', 'Sunset',
  'Highland', 'Park', 'Main', 'River', 'Lake', 'Hill', 'Willow',
];

const STREET_SUFFIXES = ['St', 'Ave', 'Blvd', 'Rd', 'Ln', 'Dr', 'Ct', 'Way'];

const CITIES_STATES: [string, string][] = [
  ['Austin', 'TX'], ['Denver', 'CO'], ['Seattle', 'WA'], ['Portland', 'OR'],
  ['Nashville', 'TN'], ['Phoenix', 'AZ'], ['Columbus', 'OH'], ['Charlotte', 'NC'],
  ['Raleigh', 'NC'], ['Sacramento', 'CA'], ['Orlando', 'FL'], ['Boise', 'ID'],
];

const COMPANY_PREFIX = ['Nova', 'Bright', 'Quantum', 'Summit', 'Bold', 'Clear', 'Silver', 'Apex', 'Vertex', 'Northwind'];
const COMPANY_CORE = ['Peak', 'Wave', 'Forge', 'Path', 'Grid', 'Labs', 'Works', 'Dynamics', 'Systems', 'Studio'];
const COMPANY_SUFFIX = ['Inc', 'LLC', 'Co', 'Group', 'Partners'];

const JOB_TITLES = [
  'Software Engineer', 'Product Manager', 'UX Designer', 'Data Analyst', 'DevOps Engineer',
  'Marketing Lead', 'Sales Executive', 'HR Coordinator', 'QA Engineer', 'Technical Writer',
  'Solutions Architect', 'Customer Success Manager', 'Finance Analyst', 'Operations Manager',
];

// Real, public example UA strings — not tied to any individual.
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
];

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
  'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
];

function generateName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function generateEmail(): string {
  const first = pick(FIRST_NAMES).toLowerCase();
  const last = pick(LAST_NAMES).toLowerCase();
  // example.com/.org/.net are reserved for documentation use (RFC 2606) — guaranteed never real.
  const domain = pick(['example.com', 'example.org', 'example.net']);
  const local = pick([`${first}.${last}`, `${first}${randInt(1, 99)}`, `${first[0]}${last}`]);
  return `${local}@${domain}`;
}

// Used as the default (US) format wherever a single phone value is needed without a
// country picker — e.g. Batch Generator, which doesn't have room for per-field options.
// The dedicated Phone screen lets you choose a country via PHONE_FORMATS directly.
function generatePhone(): string {
  return PHONE_FORMATS[0].generate();
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_+=';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

function generateAddress(): string {
  const number = randInt(100, 9999);
  const street = `${pick(STREET_NAMES)} ${pick(STREET_SUFFIXES)}`;
  const [city, state] = pick(CITIES_STATES);
  const zip = randInt(10000, 99999);
  return `${number} ${street}, ${city}, ${state} ${zip}`;
}

function generateUsername(): string {
  const first = pick(FIRST_NAMES).toLowerCase();
  const last = pick(LAST_NAMES).toLowerCase();
  return pick([`${first}${last}${randInt(1, 99)}`, `${first}_${last}`, `${first[0]}${last}${randInt(10, 99)}`]);
}

function generateCompany(): string {
  return `${pick(COMPANY_PREFIX)} ${pick(COMPANY_CORE)} ${pick(COMPANY_SUFFIX)}`;
}

function generateDob(): string {
  const year = new Date().getFullYear() - randInt(18, 65);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateIp(): string {
  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 are reserved by RFC 5737 for documentation —
  // guaranteed to never be a real routable/assigned address.
  const block = pick(['192.0.2', '198.51.100', '203.0.113']);
  return `${block}.${randInt(1, 254)}`;
}

function generateMac(): string {
  // Setting the locally-administered bit (and clearing multicast) guarantees this can never
  // collide with a real vendor-assigned OUI — the correct way to generate a "fake" MAC.
  const firstByte = (randInt(0, 255) & 0xfe) | 0x02;
  const bytes = [firstByte, randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)];
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(':');
}

function generateColor(): string {
  return `#${randHex(6)}`;
}

function generateLorem(): string {
  const wordCount = randInt(28, 46);
  const words = Array.from({ length: wordCount }, () => pick(LOREM_WORDS));
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

const ACCENTS = [
  { accent: '#60a5fa', accentSoft: 'rgba(96, 165, 250, 0.14)' },
  { accent: '#34d399', accentSoft: 'rgba(52, 211, 153, 0.14)' },
  { accent: '#a78bfa', accentSoft: 'rgba(167, 139, 250, 0.14)' },
  { accent: '#f87171', accentSoft: 'rgba(248, 113, 113, 0.14)' },
  { accent: '#fbbf24', accentSoft: 'rgba(251, 191, 36, 0.14)' },
  { accent: '#38bdf8', accentSoft: 'rgba(56, 189, 248, 0.14)' },
  { accent: '#818cf8', accentSoft: 'rgba(129, 140, 248, 0.14)' },
];

export const FIELDS: FieldDef[] = [
  { id: 'email', title: 'Email Address', desc: 'A realistic sample email', icon: React.createElement(Mail, { size: 16 }), generate: generateEmail, ...ACCENTS[0] },
  { id: 'phone', title: 'Phone Number', desc: 'Pick a country for local formatting', icon: React.createElement(Phone, { size: 16 }), generate: generatePhone, ...ACCENTS[1] },
  { id: 'name', title: 'Full Name', desc: 'A random first + last name', icon: React.createElement(User, { size: 16 }), generate: generateName, ...ACCENTS[2] },
  { id: 'password', title: 'Password', desc: '16-character secure random password', icon: React.createElement(Lock, { size: 16 }), generate: generatePassword, ...ACCENTS[3] },
  { id: 'address', title: 'Street Address', desc: 'A fictional US-style address', icon: React.createElement(MapPin, { size: 16 }), generate: generateAddress, ...ACCENTS[4] },
  { id: 'username', title: 'Username', desc: 'A handle built from a random name', icon: React.createElement(AtSign, { size: 16 }), generate: generateUsername, ...ACCENTS[5] },
  { id: 'company', title: 'Company Name', desc: 'An invented company name', icon: React.createElement(Building2, { size: 16 }), generate: generateCompany, ...ACCENTS[6] },
  { id: 'dob', title: 'Date of Birth', desc: 'A random adult birth date', icon: React.createElement(Calendar, { size: 16 }), generate: generateDob, ...ACCENTS[0] },
  { id: 'jobtitle', title: 'Job Title', desc: 'A common professional title', icon: React.createElement(Briefcase, { size: 16 }), generate: () => pick(JOB_TITLES), ...ACCENTS[1] },
  { id: 'ip', title: 'IP Address', desc: 'Safe RFC 5737 documentation range', icon: React.createElement(Network, { size: 16 }), generate: generateIp, ...ACCENTS[2] },
  { id: 'mac', title: 'MAC Address', desc: 'Locally administered, never a real OUI', icon: React.createElement(Cpu, { size: 16 }), generate: generateMac, ...ACCENTS[3] },
  { id: 'useragent', title: 'User Agent', desc: 'A realistic browser UA string', icon: React.createElement(Monitor, { size: 16 }), generate: () => pick(USER_AGENTS), ...ACCENTS[4] },
  { id: 'color', title: 'Hex Color', desc: 'A random 6-digit hex color', icon: React.createElement(Palette, { size: 16 }), generate: generateColor, ...ACCENTS[5] },
  { id: 'lorem', title: 'Lorem Ipsum', desc: 'A placeholder paragraph', icon: React.createElement(AlignLeft, { size: 16 }), generate: generateLorem, ...ACCENTS[6] },
];
