import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

function generateUuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const UuidTool: React.FC = () => {
  const [uuid, setUuid] = useState(() => generateUuid());
  const [copied, setCopied] = useState(false);

  const handleRegenerate = () => {
    setUuid(generateUuid());
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-drawer-card">
      <div className="drawer-output-box">
        <pre className="drawer-output-text">{uuid}</pre>
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
