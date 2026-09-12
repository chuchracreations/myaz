import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const Base64Tool: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleEncode = () => {
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))));
    } catch {
      setOutput('Error encoding string');
    }
  };

  const handleDecode = () => {
    try {
      setOutput(decodeURIComponent(escape(atob(input))));
    } catch {
      setOutput('Invalid Base64 string');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-drawer-card">
      <textarea
        className="drawer-input"
        rows={4}
        placeholder="Type or paste plain text or Base64 here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="drawer-actions">
        <button type="button" className="btn-action-primary" onClick={handleEncode}>
          Encode Base64
        </button>
        <button type="button" className="btn-action-secondary" onClick={handleDecode}>
          Decode Base64
        </button>
      </div>
      {output && (
        <div className="drawer-output-box">
          <pre className="drawer-output-text">{output}</pre>
          <button type="button" className="btn-mini" onClick={handleCopy}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
};
