import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { DATE_FORMATS } from './dateFormats';

export const DateGeneratorTool: React.FC = () => {
  const [formatCode, setFormatCode] = useState(DATE_FORMATS[0].code);
  const format = DATE_FORMATS.find((f) => f.code === formatCode) || DATE_FORMATS[0];
  const [value, setValue] = useState(() => format.generate());
  const [copied, setCopied] = useState(false);

  const handleFormatChange = (code: string) => {
    setFormatCode(code);
    const next = DATE_FORMATS.find((f) => f.code === code) || DATE_FORMATS[0];
    setValue(next.generate());
    setCopied(false);
  };

  const handleRegenerate = () => {
    setValue(format.generate());
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-drawer-card">
      <div className="field-row">
        <span className="field-label">Format</span>
        <select
          className="tz-select"
          value={formatCode}
          onChange={(e) => handleFormatChange(e.target.value)}
        >
          {DATE_FORMATS.map((f) => (
            <option key={f.code} value={f.code}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="drawer-output-box">
        <pre className="drawer-output-text">{value}</pre>
      </div>
      <div className="drawer-actions">
        <button type="button" className="btn-action-secondary" onClick={handleRegenerate}>
          <RefreshCw size={12} />
          Regenerate
        </button>
        <button type="button" className="btn-action-primary" onClick={handleCopy}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};
