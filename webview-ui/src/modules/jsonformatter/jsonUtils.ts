export interface JsonParseResult {
  parsed: unknown;
  error: string | null;
}

export interface JsonStats {
  keyCount: number;
  maxDepth: number;
}

export const SAMPLE_JSON = JSON.stringify(
  {
    id: 'usr_1029',
    name: 'Ada Lovelace',
    active: true,
    roles: ['admin', 'editor'],
    address: {
      city: 'London',
      country: 'UK',
    },
    lastLogin: null,
    loginCount: 42,
  },
  null,
  2
);

function computeLineCol(text: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

export function parseJsonSafe(raw: string): JsonParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { parsed: undefined, error: null };

  try {
    return { parsed: JSON.parse(trimmed), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    const posMatch = message.match(/position (\d+)/);
    if (posMatch && !/\bline\b/i.test(message)) {
      const { line, column } = computeLineCol(trimmed, Number(posMatch[1]));
      return { parsed: undefined, error: `${message} — line ${line}, column ${column}` };
    }
    return { parsed: undefined, error: message };
  }
}

export function computeJsonStats(value: unknown): JsonStats {
  let keyCount = 0;
  let maxDepth = 0;

  const walk = (v: unknown, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    if (Array.isArray(v)) {
      v.forEach((item) => walk(item, depth + 1));
    } else if (v !== null && typeof v === 'object') {
      const entries = Object.entries(v as Record<string, unknown>);
      keyCount += entries.length;
      entries.forEach(([, val]) => walk(val, depth + 1));
    }
  };

  walk(value, 0);
  return { keyCount, maxDepth };
}

export function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
