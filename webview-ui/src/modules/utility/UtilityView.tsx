import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Wrench,
  Copy,
  Check,
  Hash,
  Binary,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { JwtInspector } from './JwtInspector';

type UtilitySubTab = 'jwt' | 'tools';

export const UtilityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UtilitySubTab>('jwt');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Micro-tools interactive state
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [hashOutput, setHashOutput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');
  const [activeToolDrawer, setActiveToolDrawer] = useState<'base64' | 'hash' | 'url' | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const generateUuid = () => {
    try {
      const uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      navigator.clipboard.writeText(uuid);
      showToast(`Copied UUID: ${uuid.slice(0, 8)}...`);
    } catch {
      showToast('Generated UUID copied');
    }
  };

  const handleBase64Encode = () => {
    try {
      const enc = btoa(unescape(encodeURIComponent(base64Input)));
      setBase64Output(enc);
    } catch {
      setBase64Output('Error encoding string');
    }
  };

  const handleBase64Decode = () => {
    try {
      const dec = decodeURIComponent(escape(atob(base64Input)));
      setBase64Output(dec);
    } catch {
      setBase64Output('Invalid Base64 string');
    }
  };

  const handleComputeHash = async () => {
    if (!hashInput) return;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashOutput(hashHex);
    } catch {
      setHashOutput('Error generating SHA-256 hash');
    }
  };

  const handleUrlEncode = () => {
    try {
      setUrlOutput(encodeURIComponent(urlInput));
    } catch {
      setUrlOutput('Error encoding URL');
    }
  };

  const handleUrlDecode = () => {
    try {
      setUrlOutput(decodeURIComponent(urlInput));
    } catch {
      setUrlOutput('Invalid URL encoding');
    }
  };

  const copyResult = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
  };

  return (
    <div className="tab-content-panel active" id="tab-utility">
      {/* Sentinel / Header Row */}
      <div className="sentinel-card-header">
        <span className="section-title">
          <Wrench size={13} style={{ color: 'var(--accent-primary)' }} />
          Developer Utilities
        </span>
        <div className="utility-privacy-badge" title="No network requests. Zero telemetry. 100% in-memory.">
          <ShieldCheck size={11} />
          <span>100% Offline</span>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="utility-subnav-row">
        <button
          type="button"
          className={`utility-subnav-btn ${activeTab === 'jwt' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('jwt');
            setActiveToolDrawer(null);
          }}
        >
          <KeyRound size={12} />
          <span>JWT Inspector</span>
          <span className="utility-subnav-tag">Live</span>
        </button>

        <button
          type="button"
          className={`utility-subnav-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <Sparkles size={12} />
          <span>Micro Tools</span>
        </button>
      </div>

      {/* Toast Bar inside Utility if triggered */}
      {toastMsg && (
        <div className="ports-alert ports-alert-info" style={{ animation: 'fadeIn 150ms ease' }}>
          <Check size={12} style={{ color: 'var(--emerald)' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tab 1: JWT Inspector View */}
      {activeTab === 'jwt' && <JwtInspector />}

      {/* Tab 2: One-Click Micro Developer Tools View */}
      {activeTab === 'tools' && (
        <div className="micro-tools-view">
          <span className="section-title">One-Click Micro Tools</span>
          
          <div className="mini-tools-grid">
            <button
              type="button"
              className="mini-tool-btn"
              onClick={generateUuid}
              title="Generate fresh UUID v4 and copy to clipboard"
            >
              <div className="mini-tool-icon-circle uuid-icon">
                <Hash size={13} />
              </div>
              <div className="mini-tool-info">
                <span className="mini-tool-name">UUID v4 Gen</span>
                <span className="mini-tool-desc">Click to generate & copy</span>
              </div>
            </button>

            <button
              type="button"
              className={`mini-tool-btn ${activeToolDrawer === 'base64' ? 'active' : ''}`}
              onClick={() => setActiveToolDrawer(activeToolDrawer === 'base64' ? null : 'base64')}
              title="Encode or decode Base64 string"
            >
              <div className="mini-tool-icon-circle b64-icon">
                <Binary size={13} />
              </div>
              <div className="mini-tool-info">
                <span className="mini-tool-name">Base64 Converter</span>
                <span className="mini-tool-desc">Encode / Decode text</span>
              </div>
            </button>

            <button
              type="button"
              className={`mini-tool-btn ${activeToolDrawer === 'hash' ? 'active' : ''}`}
              onClick={() => setActiveToolDrawer(activeToolDrawer === 'hash' ? null : 'hash')}
              title="Compute SHA-256 hash checksum"
            >
              <div className="mini-tool-icon-circle hash-icon">
                <ShieldCheck size={13} />
              </div>
              <div className="mini-tool-info">
                <span className="mini-tool-name">SHA-256 Hasher</span>
                <span className="mini-tool-desc">Cryptographic checksum</span>
              </div>
            </button>

            <button
              type="button"
              className={`mini-tool-btn ${activeToolDrawer === 'url' ? 'active' : ''}`}
              onClick={() => setActiveToolDrawer(activeToolDrawer === 'url' ? null : 'url')}
              title="Encode or decode URL components"
            >
              <div className="mini-tool-icon-circle url-icon">
                <Globe size={13} />
              </div>
              <div className="mini-tool-info">
                <span className="mini-tool-name">URL Encoder</span>
                <span className="mini-tool-desc">Encode / Decode URI</span>
              </div>
            </button>
          </div>

          {/* Active Tool Drawer Panels */}
          {activeToolDrawer === 'base64' && (
            <div className="tool-drawer-card">
              <div className="drawer-header">
                <span className="drawer-title">Base64 String Converter</span>
                <button className="btn-mini" onClick={() => setActiveToolDrawer(null)}>Done</button>
              </div>
              <textarea
                className="drawer-input"
                rows={3}
                placeholder="Type or paste plain text or Base64 here..."
                value={base64Input}
                onChange={e => setBase64Input(e.target.value)}
              />
              <div className="drawer-actions">
                <button type="button" className="btn-action-primary" onClick={handleBase64Encode}>
                  Encode Base64
                </button>
                <button type="button" className="btn-action-secondary" onClick={handleBase64Decode}>
                  Decode Base64
                </button>
              </div>
              {base64Output && (
                <div className="drawer-output-box">
                  <pre className="drawer-output-text">{base64Output}</pre>
                  <button
                    type="button"
                    className="btn-mini"
                    onClick={() => copyResult(base64Output, 'Base64 Result')}
                  >
                    <Copy size={11} /> Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {activeToolDrawer === 'hash' && (
            <div className="tool-drawer-card">
              <div className="drawer-header">
                <span className="drawer-title">SHA-256 Cryptographic Hasher</span>
                <button className="btn-mini" onClick={() => setActiveToolDrawer(null)}>Done</button>
              </div>
              <textarea
                className="drawer-input"
                rows={3}
                placeholder="Enter string to compute SHA-256 hash..."
                value={hashInput}
                onChange={e => setHashInput(e.target.value)}
              />
              <div className="drawer-actions">
                <button type="button" className="btn-action-primary" onClick={handleComputeHash}>
                  Calculate SHA-256
                </button>
              </div>
              {hashOutput && (
                <div className="drawer-output-box">
                  <pre className="drawer-output-text">{hashOutput}</pre>
                  <button
                    type="button"
                    className="btn-mini"
                    onClick={() => copyResult(hashOutput, 'Hash Checksum')}
                  >
                    <Copy size={11} /> Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {activeToolDrawer === 'url' && (
            <div className="tool-drawer-card">
              <div className="drawer-header">
                <span className="drawer-title">URL Component Encoder / Decoder</span>
                <button className="btn-mini" onClick={() => setActiveToolDrawer(null)}>Done</button>
              </div>
              <textarea
                className="drawer-input"
                rows={3}
                placeholder="Paste URL or parameters..."
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
              <div className="drawer-actions">
                <button type="button" className="btn-action-primary" onClick={handleUrlEncode}>
                  URL Encode
                </button>
                <button type="button" className="btn-action-secondary" onClick={handleUrlDecode}>
                  URL Decode
                </button>
              </div>
              {urlOutput && (
                <div className="drawer-output-box">
                  <pre className="drawer-output-text">{urlOutput}</pre>
                  <button
                    type="button"
                    className="btn-mini"
                    onClick={() => copyResult(urlOutput, 'URL Result')}
                  >
                    <Copy size={11} /> Copy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
