import React, { useState, useMemo } from 'react';
import RandExp from 'randexp';
import { Shuffle } from 'lucide-react';

interface MatchInfo {
  index: number;
  match: string;
  groups: (string | undefined)[];
}

const FLAG_OPTIONS: { flag: string; label: string }[] = [
  { flag: 'g', label: 'Global — find every match, not just the first' },
  { flag: 'i', label: 'Ignore case' },
  { flag: 'm', label: 'Multiline — ^ and $ match line boundaries' },
  { flag: 's', label: 'Dot all — . also matches newlines' },
];

function computeMatches(
  pattern: string,
  flags: string,
  testString: string
): { matches: MatchInfo[]; error: string | null } {
  if (!pattern || !testString) return { matches: [], error: null };

  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (err) {
    return {
      matches: [],
      error: err instanceof Error ? err.message : 'Invalid regular expression',
    };
  }

  const matches: MatchInfo[] = [];

  if (flags.includes('g')) {
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(testString)) !== null && guard < 1000) {
      matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
      if (m[0] === '') re.lastIndex += 1; // avoid an infinite loop on zero-length matches
      guard += 1;
    }
  } else {
    const m = re.exec(testString);
    if (m) matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
  }

  return { matches, error: null };
}

/**
 * Generate example strings that this pattern would actually match, so users can sanity-check
 * a regex without having to think one up themselves. Patterns using lookaheads, lookbehinds or
 * backreferences aren't supported by the underlying generator — we surface that plainly rather
 * than showing a wrong or misleading example.
 */
function generateExamples(
  pattern: string,
  flags: string,
  count: number
): { examples: string[]; error: string | null } {
  if (!pattern) return { examples: [], error: null };

  try {
    const generator = new RandExp(pattern, flags.replace('g', ''));
    generator.max = 8; // cap unbounded quantifiers (*, +, {n,}) so examples stay short and readable

    const examples = new Set<string>();
    for (let attempt = 0; examples.size < count && attempt < count * 5; attempt++) {
      examples.add(generator.gen());
    }

    return { examples: Array.from(examples), error: null };
  } catch {
    return {
      examples: [],
      error:
        "Couldn't generate examples for this pattern — it may use a feature like lookaheads or backreferences that isn't supported.",
    };
  }
}

function buildHighlightSegments(
  testString: string,
  matches: MatchInfo[]
): { text: string; isMatch: boolean }[] {
  if (matches.length === 0) return [{ text: testString, isMatch: false }];

  const segments: { text: string; isMatch: boolean }[] = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.index < cursor) continue; // overlapping zero-length match guard
    if (m.index > cursor)
      segments.push({ text: testString.slice(cursor, m.index), isMatch: false });
    segments.push({ text: m.match, isMatch: true });
    cursor = m.index + m.match.length;
  }

  if (cursor < testString.length) segments.push({ text: testString.slice(cursor), isMatch: false });
  return segments;
}

export const RegexTool: React.FC = () => {
  const [pattern, setPattern] = useState('\\d+');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState(
    'Order #1234 shipped on 2026-09-12, tracking id AB1234CD.'
  );
  const [exampleSeed, setExampleSeed] = useState(0);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => (prev.includes(flag) ? prev.replace(flag, '') : prev + flag));
  };

  const { matches, error } = useMemo(
    () => computeMatches(pattern, flags, testString),
    [pattern, flags, testString]
  );

  const segments = useMemo(
    () => buildHighlightSegments(testString, matches),
    [testString, matches]
  );

  // exampleSeed isn't read inside generateExamples — it's only in the dependency
  // array so the Shuffle button can force a fresh set of random examples.
  const { examples, error: exampleError } = useMemo(
    () => generateExamples(pattern, flags, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pattern, flags, exampleSeed]
  );

  return (
    <div className="regex-tool">
      <div className="regex-pattern-row">
        <span className="regex-slash">/</span>
        <input
          className="regex-pattern-input"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="pattern"
          spellCheck={false}
        />
        <span className="regex-slash">/</span>
        <div className="regex-flags-row">
          {FLAG_OPTIONS.map((opt) => (
            <button
              key={opt.flag}
              type="button"
              className={`regex-flag-chip ${flags.includes(opt.flag) ? 'is-active' : ''}`}
              onClick={() => toggleFlag(opt.flag)}
              title={opt.label}
            >
              {opt.flag}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="converter-error-banner">{error}</div>}

      {!error && pattern && (
        <div className="regex-examples-block">
          <div className="regex-result-header">
            <span className="field-label">Example matches</span>
            <button
              type="button"
              className="regex-shuffle-btn"
              onClick={() => setExampleSeed((s) => s + 1)}
              title="Generate new examples"
            >
              <Shuffle size={11} />
            </button>
          </div>
          {exampleError ? (
            <span className="regex-example-note">{exampleError}</span>
          ) : examples.length > 0 ? (
            <div className="regex-examples-row">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="regex-example-chip"
                  onClick={() => setTestString(ex)}
                  title="Use as test string"
                >
                  {ex || '(empty string)'}
                </button>
              ))}
            </div>
          ) : (
            <span className="regex-example-note">No examples to show yet.</span>
          )}
        </div>
      )}

      <span className="field-label">Test string</span>
      <textarea
        className="drawer-input"
        rows={5}
        value={testString}
        onChange={(e) => setTestString(e.target.value)}
        placeholder="Paste text to test your pattern against..."
        spellCheck={false}
      />

      <div className="regex-result-header">
        <span className="field-label">Highlighted matches</span>
        <span className="regex-match-count">
          {matches.length} match{matches.length === 1 ? '' : 'es'}
        </span>
      </div>
      <div className="regex-highlight-box">
        {segments.map((seg, i) =>
          seg.isMatch ? (
            <mark key={i} className="regex-match-mark">
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>

      {matches.length > 0 && (
        <div className="regex-matches-list">
          {matches.map((m, i) => (
            <div key={i} className="regex-match-row">
              <span className="regex-match-index">#{i + 1}</span>
              <span className="regex-match-text">{m.match || '(empty match)'}</span>
              {m.groups.length > 0 && (
                <span className="regex-match-groups">
                  {m.groups.map((g, gi) => `$${gi + 1}: ${g ?? '—'}`).join('  ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
