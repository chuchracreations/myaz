import React, { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { parseCron, describeCron, getNextRuns, PRESETS } from '../cronLogic';

const FIELD_METAS = [
  { label: 'Minute' },
  { label: 'Hour' },
  { label: 'Day' },
  { label: 'Month' },
  { label: 'Weekday' },
] as const;

function splitExpression(expr: string): string[] {
  const parts = expr.trim().split(/\s+/).filter(Boolean);
  const padded = parts.slice(0, 5);
  while (padded.length < 5) padded.push('*');
  return padded;
}

const RUN_COUNT = 5;

export const CronTool: React.FC = () => {
  const [expression, setExpression] = useState('*/15 9-17 * * 1-5');
  const [copied, setCopied] = useState(false);

  const fieldParts = useMemo(() => splitExpression(expression), [expression]);

  const { parsed, error } = useMemo(() => {
    try {
      return { parsed: parseCron(expression), error: null as string | null };
    } catch (err) {
      return { parsed: null, error: err instanceof Error ? err.message : 'Invalid cron expression' };
    }
  }, [expression]);

  const description = useMemo(() => (parsed ? describeCron(parsed) : null), [parsed]);
  const nextRuns = useMemo(() => (parsed ? getNextRuns(parsed, RUN_COUNT) : []), [parsed]);

  const updateFieldPart = (index: number, value: string) => {
    const next = [...fieldParts];
    next[index] = value.trim() === '' ? '*' : value.trim();
    setExpression(next.join(' '));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cron-tool">
      <span className="field-label">Cron expression</span>
      <div className="cron-expr-row">
        <input
          className="cron-expr-input"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="* * * * *"
          spellCheck={false}
        />
        <button type="button" className="copy-chip" onClick={handleCopy}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="cron-fields-grid">
        {FIELD_METAS.map((meta, i) => (
          <div key={meta.label} className="cron-field-cell">
            <span className="cron-field-cell-label">{meta.label}</span>
            <input
              className="cron-field-cell-input"
              value={fieldParts[i]}
              onChange={(e) => updateFieldPart(i, e.target.value)}
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      {error ? (
        <div className="converter-error-banner">{error}</div>
      ) : (
        <>
          <div className="cron-explain-box">{description}</div>

          <span className="discover-label">Presets</span>
          <div className="cron-presets-row">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="cron-preset-chip"
                onClick={() => setExpression(p.expr)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <span className="discover-label">Next {RUN_COUNT} runs · your local time</span>
          <div className="cron-next-runs-list">
            {nextRuns.length > 0 ? (
              nextRuns.map((d, i) => (
                <div key={i} className="cron-next-run-row">
                  <span className="cron-next-run-index">#{i + 1}</span>
                  <span className="cron-next-run-time">
                    {d.toLocaleString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <span className="regex-example-note">No upcoming runs found in the next 4 years.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
