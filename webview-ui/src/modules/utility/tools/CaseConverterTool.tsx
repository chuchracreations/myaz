import React, { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { convertCase } from '../caseConverterLogic';

export const CaseConverterTool: React.FC = () => {
  const [input, setInput] = useState('hello world example');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const results = useMemo(() => convertCase(input), [input]);

  const handleCopy = (id: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  };

  return (
    <div className="tool-drawer-card">
      <textarea
        className="drawer-input"
        rows={2}
        placeholder="Enter text, e.g. hello_world or HelloWorld..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
      />

      <div className="case-results-list">
        {results.map((r) => (
          <button
            key={r.id}
            type="button"
            className="case-result-row"
            onClick={() => handleCopy(r.id, r.value)}
            disabled={!r.value}
            title="Click to copy"
          >
            <span className="case-result-label">{r.label}</span>
            <span className="case-result-value">{r.value || '—'}</span>
            {copiedId === r.id ? (
              <Check size={11} className="case-result-copy-icon is-copied" />
            ) : (
              <Copy size={11} className="case-result-copy-icon" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
