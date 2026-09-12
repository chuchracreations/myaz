import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const UrlEncoderTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleEncode = () => {
    try {
      setOutput(encodeURIComponent(input));
    } catch {
      setOutput('Error encoding URL');
    }
  };

  const handleDecode = () => {
    try {
      setOutput(decodeURIComponent(input));
    } catch {
      setOutput('Invalid URL encoding');
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
        placeholder="Paste URL or parameters..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="drawer-actions">
        <button type="button" className="btn-action-primary" onClick={handleEncode}>
          URL Encode
        </button>
        <button type="button" className="btn-action-secondary" onClick={handleDecode}>
          URL Decode
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
