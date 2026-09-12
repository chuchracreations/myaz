interface LanguageAccent {
  accent: string;
  soft: string;
}

const LANGUAGE_ACCENTS: Record<string, LanguageAccent> = {
  javascript: { accent: '#f2b93d', soft: 'rgba(242, 185, 61, 0.14)' },
  javascriptreact: { accent: '#f2b93d', soft: 'rgba(242, 185, 61, 0.14)' },
  typescript: { accent: '#60a5fa', soft: 'rgba(96, 165, 250, 0.14)' },
  typescriptreact: { accent: '#60a5fa', soft: 'rgba(96, 165, 250, 0.14)' },
  python: { accent: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.14)' },
  html: { accent: '#fb923c', soft: 'rgba(251, 146, 60, 0.14)' },
  css: { accent: '#c084fc', soft: 'rgba(192, 132, 252, 0.14)' },
  json: { accent: '#fb7185', soft: 'rgba(251, 113, 133, 0.14)' },
  sql: { accent: '#38bdf8', soft: 'rgba(56, 189, 248, 0.14)' },
  markdown: { accent: '#94a3b8', soft: 'rgba(148, 163, 184, 0.14)' },
  shellscript: { accent: '#4ade80', soft: 'rgba(74, 222, 128, 0.14)' },
  go: { accent: '#22d3ee', soft: 'rgba(34, 211, 238, 0.14)' },
  rust: { accent: '#f97316', soft: 'rgba(249, 115, 22, 0.14)' },
  plaintext: { accent: '#9ca3af', soft: 'rgba(156, 163, 175, 0.14)' },
};

const DEFAULT_ACCENT: LanguageAccent = { accent: '#9ca3af', soft: 'rgba(156, 163, 175, 0.14)' };

export function getLanguageAccent(language: string): LanguageAccent {
  return LANGUAGE_ACCENTS[language?.toLowerCase()?.trim()] || DEFAULT_ACCENT;
}

const LANGUAGE_SHORT_LABELS: Record<string, string> = {
  javascript: 'js',
  javascriptreact: 'jsx',
  typescript: 'ts',
  typescriptreact: 'tsx',
  python: 'py',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  markdown: 'md',
  shellscript: 'sh',
  go: 'go',
  rust: 'rs',
  plaintext: 'txt',
};

export function getLanguageShortLabel(language: string): string {
  const key = language?.toLowerCase()?.trim();
  if (!key) return '?';
  return LANGUAGE_SHORT_LABELS[key] || key.slice(0, 4);
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y ago`;
}
