import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { FieldDef } from './generators';

interface Props {
  field: FieldDef;
}

export const SingleGeneratorTool: React.FC<Props> = ({ field }) => {
  const [value, setValue] = useState(() => field.generate());
  const [copied, setCopied] = useState(false);

  const handleRegenerate = () => {
    setValue(field.generate());
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-drawer-card">
      <div className="drawer-output-box">
        {field.id === 'color' && (
          <span className="color-swatch" style={{ backgroundColor: value }} />
        )}
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
