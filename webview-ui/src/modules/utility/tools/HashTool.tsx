import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const HashTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleComputeHash = async () => {
    if (!input) return;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      setOutput(hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''));
    } catch {
      setOutput('Error generating SHA-256 hash');
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
        placeholder="Enter string to compute SHA-256 hash..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="drawer-actions">
        <button type="button" className="btn-action-primary" onClick={handleComputeHash}>
          Calculate SHA-256
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
