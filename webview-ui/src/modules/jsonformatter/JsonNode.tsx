import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  initialExpanded: boolean;
}

function formatPrimitive(value: unknown): { text: string; typeClass: string } {
  if (value === null) return { text: 'null', typeClass: 'json-value--null' };
  switch (typeof value) {
    case 'string':
      return { text: `"${value}"`, typeClass: 'json-value--string' };
    case 'number':
      return { text: String(value), typeClass: 'json-value--number' };
    case 'boolean':
      return { text: String(value), typeClass: 'json-value--boolean' };
    default:
      return { text: String(value), typeClass: '' };
  }
}

export const JsonNode: React.FC<JsonNodeProps> = ({ keyName, value, initialExpanded }) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === 'object';

  const keyLabel = keyName !== undefined && (
    <>
      <span className="json-key">&quot;{keyName}&quot;</span>
      <span className="json-colon">:</span>
    </>
  );

  if (isArray || isObject) {
    const entries: [string, unknown][] = isArray
      ? (value as unknown[]).map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    if (entries.length === 0) {
      return (
        <div className="json-node-row json-leaf">
          {keyLabel}
          <span className="json-bracket">
            {openBracket}
            {closeBracket}
          </span>
        </div>
      );
    }

    return (
      <div className="json-node">
        <button
          type="button"
          className="json-node-row json-toggle-row"
          onClick={() => setExpanded((e) => !e)}
        >
          <ChevronRight size={11} className={`json-toggle-icon ${expanded ? 'is-open' : ''}`} />
          {keyLabel}
          <span className="json-bracket">{openBracket}</span>
          {!expanded && (
            <span className="json-collapsed-summary">
              {entries.length} {isArray ? (entries.length === 1 ? 'item' : 'items') : entries.length === 1 ? 'key' : 'keys'}
              {closeBracket}
            </span>
          )}
        </button>
        {expanded && (
          <div className="json-node-children">
            {entries.map(([k, v]) => (
              <JsonNode key={k} keyName={k} value={v} initialExpanded={initialExpanded} />
            ))}
          </div>
        )}
        {expanded && <div className="json-node-row json-bracket-close">{closeBracket}</div>}
      </div>
    );
  }

  const { text, typeClass } = formatPrimitive(value);
  return (
    <div className="json-node-row json-leaf">
      {keyLabel}
      <span className={`json-value ${typeClass}`}>{text}</span>
    </div>
  );
};
