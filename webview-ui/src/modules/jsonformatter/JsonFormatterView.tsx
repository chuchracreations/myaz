import React, { useMemo, useState } from 'react';
import {
  FileJson,
  Copy,
  Check,
  Braces,
  Minimize2,
  Sparkles,
  Eraser,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { parseJsonSafe, computeJsonStats, formatBytes, SAMPLE_JSON } from './jsonUtils';
import { JsonNode } from './JsonNode';

export const JsonFormatterView: React.FC = () => {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [copied, setCopied] = useState(false);
  const [treeVersion, setTreeVersion] = useState(0);
  const [defaultExpanded, setDefaultExpanded] = useState(true);

  const { parsed, error } = useMemo(() => parseJsonSafe(input), [input]);
  const stats = useMemo(
    () => (error || parsed === undefined ? null : computeJsonStats(parsed)),
    [parsed, error]
  );

  const handleFormat = () => {
    if (error || parsed === undefined) return;
    setInput(JSON.stringify(parsed, null, 2));
  };

  const handleMinify = () => {
    if (error || parsed === undefined) return;
    setInput(JSON.stringify(parsed));
  };

  const handleClear = () => setInput('');
  const handleExample = () => setInput(SAMPLE_JSON);

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExpandAll = () => {
    setDefaultExpanded(true);
    setTreeVersion((v) => v + 1);
  };

  const handleCollapseAll = () => {
    setDefaultExpanded(false);
    setTreeVersion((v) => v + 1);
  };

  return (
    <div className="utility-landing">
      <div className="utility-header">
        <div className="utility-icon-tile">
          <FileJson size={16} />
        </div>
        <div>
          <div className="utility-title">JSON Formatter</div>
          <div className="utility-subtitle">Format, validate & explore JSON — 100% local</div>
        </div>
      </div>

      <div className="field-row">
        <div className="field-label-row">
          <span className="field-label">JSON input</span>
          <span className="json-char-count">{input.length.toLocaleString()} chars</span>
        </div>
        <textarea
          className="drawer-input json-input-area"
          rows={9}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste JSON here..."
          spellCheck={false}
        />
      </div>

      <div className="json-actions-row">
        <button
          type="button"
          className="btn-action-secondary"
          onClick={handleFormat}
          disabled={!!error || parsed === undefined}
        >
          <Braces size={12} />
          Format
        </button>
        <button
          type="button"
          className="btn-action-secondary"
          onClick={handleMinify}
          disabled={!!error || parsed === undefined}
        >
          <Minimize2 size={12} />
          Minify
        </button>
        <button type="button" className="btn-action-secondary" onClick={handleExample}>
          <Sparkles size={12} />
          Example
        </button>
        <button type="button" className="btn-action-secondary" onClick={handleClear} disabled={!input}>
          <Eraser size={12} />
          Clear
        </button>
        <button type="button" className="btn-action-primary" onClick={handleCopy} disabled={!input}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {error && <div className="converter-error-banner">{error}</div>}

      {!error && stats && (
        <>
          <div className="json-stats-row">
            <span>
              {stats.keyCount} key{stats.keyCount === 1 ? '' : 's'}
            </span>
            <span className="json-stats-dot">·</span>
            <span>max depth {stats.maxDepth}</span>
            <span className="json-stats-dot">·</span>
            <span>{formatBytes(input)}</span>
          </div>

          <div className="field-label-row">
            <span className="discover-label">Tree view</span>
            <div className="json-tree-actions">
              <button type="button" className="btn-mini" onClick={handleExpandAll}>
                <ChevronsUpDown size={11} />
                Expand all
              </button>
              <button type="button" className="btn-mini" onClick={handleCollapseAll}>
                <ChevronsDownUp size={11} />
                Collapse all
              </button>
            </div>
          </div>
          <div className="json-tree-box">
            <JsonNode key={treeVersion} value={parsed} initialExpanded={defaultExpanded} />
          </div>
        </>
      )}

      {!error && !stats && (
        <div className="empty-state">
          <FileJson size={22} className="empty-icon" />
          <span className="empty-title">Nothing to show yet</span>
          <span className="empty-desc">Paste some JSON above to format and explore it.</span>
        </div>
      )}
    </div>
  );
};
