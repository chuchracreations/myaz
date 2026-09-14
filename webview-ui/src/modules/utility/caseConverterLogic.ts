export interface CaseResult {
  id: string;
  label: string;
  value: string;
}

function splitWords(input: string): string[] {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ABCDef -> ABC Def
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const CASE_DEFS: { id: string; label: string; build: (words: string[]) => string }[] = [
  {
    id: 'camel',
    label: 'camelCase',
    build: (w) => w.map((word, i) => (i === 0 ? word : capitalize(word))).join(''),
  },
  { id: 'pascal', label: 'PascalCase', build: (w) => w.map(capitalize).join('') },
  { id: 'snake', label: 'snake_case', build: (w) => w.join('_') },
  { id: 'kebab', label: 'kebab-case', build: (w) => w.join('-') },
  { id: 'constant', label: 'CONSTANT_CASE', build: (w) => w.join('_').toUpperCase() },
  { id: 'title', label: 'Title Case', build: (w) => w.map(capitalize).join(' ') },
  { id: 'sentence', label: 'Sentence case', build: (w) => capitalize(w.join(' ')) },
  { id: 'dot', label: 'dot.case', build: (w) => w.join('.') },
  { id: 'path', label: 'path/case', build: (w) => w.join('/') },
  { id: 'lower', label: 'lower case', build: (w) => w.join(' ') },
  { id: 'upper', label: 'UPPER CASE', build: (w) => w.join(' ').toUpperCase() },
];

export function convertCase(input: string): CaseResult[] {
  const words = splitWords(input);
  return CASE_DEFS.map((c) => ({ id: c.id, label: c.label, value: words.length ? c.build(words) : '' }));
}
