import React, { useState, useMemo, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Clipboard,
  Trash2,
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCode,
  User,
  Globe,
  Tag,
  Hash,
} from 'lucide-react';
import { highlightSnippetCode } from '../../utils/syntaxHighlight';

// Helper to decode Base64URL safely supporting UTF-8 characters
function decodeBase64Url(base64Url: string): { text: string; json: any; error?: string } {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decodedStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const json = JSON.parse(decodedStr);
    return { text: JSON.stringify(json, null, 2), json };
  } catch {
    try {
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const plain = atob(base64);
      const json = JSON.parse(plain);
      return { text: JSON.stringify(json, null, 2), json };
    } catch (err: any) {
      return { text: '', json: null, error: err.message || 'Invalid Base64Url string' };
    }
  }
}

function formatRelativeTime(secondsDiff: number): string {
  const abs = Math.abs(secondsDiff);
  if (abs < 60) return `${abs}s`;
  const mins = Math.floor(abs / 60);
  if (mins < 60) return `${mins}m ${abs % 60}s`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatEpochDate(
  epochSec?: number
): { full: string; relative: string; isPast: boolean } | null {
  if (typeof epochSec !== 'number' || isNaN(epochSec)) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  const diff = epochSec - nowSec;
  const d = new Date(epochSec * 1000);

  return {
    full: d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
    relative: formatRelativeTime(diff),
    isPast: diff < 0,
  };
}

type ParsedJwtResult =
  | {
      valid: true;
      parts: {
        headerRaw: string;
        payloadRaw: string;
        signatureRaw: string;
      };
      header: any;
      headerText: string;
      payload: any;
      payloadText: string;
    }
  | {
      valid: false;
      error: string;
      parts?: undefined;
      header?: undefined;
      headerText?: undefined;
      payload?: undefined;
      payloadText?: undefined;
    };

export const JwtInspector: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [copiedSection, setCopiedSection] = useState<'token' | 'header' | 'payload' | null>(null);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  // Ticker for live remaining / elapsed time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clean and sanitize input (strips 'Bearer ' or quotes)
  const cleanToken = useMemo(() => {
    let t = tokenInput.trim();
    if (t.toLowerCase().startsWith('bearer ')) {
      t = t.substring(7).trim();
    }
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      t = t.substring(1, t.length - 1).trim();
    }
    return t;
  }, [tokenInput]);

  // Decode JWT segments
  const parsedJwt = useMemo<ParsedJwtResult | null>(() => {
    if (!cleanToken) return null;

    const parts = cleanToken.split('.');
    if (parts.length < 2 || parts.length > 3) {
      return {
        valid: false,
        error: `Invalid JWT format: Found ${parts.length} parts. A valid JWT consists of 3 dot-separated segments (header.payload.signature).`,
      };
    }

    const [headerPart, payloadPart, sigPart = ''] = parts;
    const headerRes = decodeBase64Url(headerPart);
    const payloadRes = decodeBase64Url(payloadPart);

    if (headerRes.error) {
      return {
        valid: false,
        error: `Failed to decode Header: ${headerRes.error}`,
      };
    }

    if (payloadRes.error) {
      return {
        valid: false,
        error: `Failed to decode Payload: ${payloadRes.error}`,
      };
    }

    return {
      valid: true,
      parts: {
        headerRaw: headerPart,
        payloadRaw: payloadPart,
        signatureRaw: sigPart,
      },
      header: headerRes.json,
      headerText: headerRes.text,
      payload: payloadRes.json,
      payloadText: payloadRes.text,
    };
  }, [cleanToken]);

  // Expiration analysis
  const expInfo = useMemo(() => {
    if (!parsedJwt || !parsedJwt.valid || !parsedJwt.payload) return null;
    const exp = parsedJwt.payload.exp;
    const iat = parsedJwt.payload.iat;
    const nbf = parsedJwt.payload.nbf;

    return {
      exp: formatEpochDate(exp),
      iat: formatEpochDate(iat),
      nbf: formatEpochDate(nbf),
      rawExp: exp,
      isExpired: typeof exp === 'number' ? exp < nowSec : null,
      secondsRemaining: typeof exp === 'number' ? exp - nowSec : null,
    };
  }, [parsedJwt, nowSec]);

  // Highlighted JSON preview with Prism
  const highlightedHeader = useMemo(() => {
    return parsedJwt?.headerText ? highlightSnippetCode(parsedJwt.headerText, 'json') : '';
  }, [parsedJwt]);

  const highlightedPayload = useMemo(() => {
    return parsedJwt?.payloadText ? highlightSnippetCode(parsedJwt.payloadText, 'json') : '';
  }, [parsedJwt]);

  const handleCopy = (text: string, section: 'token' | 'header' | 'payload') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setTokenInput(text.trim());
    } catch {
      // Ignore if clipboard permissions are restricted
    }
  };

  const handleLoadSample = () => {
    // Generate a fresh sample token valid for 4 hours into the future
    const curTime = Math.floor(Date.now() / 1000);
    const expTime = curTime + 4 * 3600; // +4 hours

    const sampleHeader = { alg: 'HS256', typ: 'JWT' };
    const samplePayload = {
      sub: 'usr_849204a9f',
      name: 'Alex Mercer',
      email: 'alex.mercer@dev.io',
      roles: ['staff_engineer', 'devops_admin'],
      permissions: ['repo:read', 'repo:write', 'deploy:staging', 'ports:manage'],
      iss: 'https://auth.myaz.io',
      aud: 'https://api.myaz.io/v1',
      iat: curTime,
      exp: expTime,
    };

    const b64Url = (obj: any) =>
      btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const h = b64Url(sampleHeader);
    const p = b64Url(samplePayload);
    const s = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

    setTokenInput(`${h}.${p}.${s}`);
  };

  return (
    <div className="jwt-inspector-container">
      {/* Top Controls & Input Bar */}
      <div className="jwt-card jwt-input-card">
        <div className="jwt-card-header">
          <div className="jwt-header-title">
            <KeyRound size={15} className="text-violet" />
            <h3>Encoded Token</h3>
          </div>
          <div className="jwt-input-actions">
            <button
              type="button"
              className="btn-text-action"
              onClick={handlePaste}
              title="Paste token from clipboard"
            >
              <Clipboard size={12} />
              <span>Paste</span>
            </button>
            <button
              type="button"
              className="btn-text-action sample-btn"
              onClick={handleLoadSample}
              title="Load realistic sample JWT token"
            >
              <Sparkles size={12} />
              <span>Load Sample</span>
            </button>
            {tokenInput && (
              <button
                type="button"
                className="btn-text-action danger-btn"
                onClick={() => setTokenInput('')}
                title="Clear input"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <textarea
          className="jwt-textarea"
          rows={4}
          placeholder="Paste JWT here (e.g. eyJhbGciOi... or Bearer eyJhbGciOi...)"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          spellCheck={false}
        />

        {/* Color Coded Segment Preview */}
        {parsedJwt && parsedJwt.valid && parsedJwt.parts && (
          <div className="jwt-token-preview-wrap" title="Color-coded token segments">
            <div className="jwt-token-preview">
              <span className="jwt-part-header" title="Header (Algorithm & Type)">
                {parsedJwt.parts.headerRaw}
              </span>
              <span className="jwt-part-dot">.</span>
              <span className="jwt-part-payload" title="Payload (Claims & Data)">
                {parsedJwt.parts.payloadRaw}
              </span>
              <span className="jwt-part-dot">.</span>
              <span className="jwt-part-sig" title="Signature">
                {parsedJwt.parts.signatureRaw || 'unsigned'}
              </span>
            </div>
            <div className="jwt-legend-row">
              <span className="jwt-legend-item legend-header">
                <span className="legend-dot" /> Header
              </span>
              <span className="jwt-legend-item legend-payload">
                <span className="legend-dot" /> Payload
              </span>
              <span className="jwt-legend-item legend-sig">
                <span className="legend-dot" /> Signature
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {parsedJwt && !parsedJwt.valid && (
          <div className="jwt-alert jwt-alert-error">
            <AlertTriangle size={15} />
            <span>{parsedJwt.error}</span>
          </div>
        )}
      </div>

      {/* Expiration Status Banner */}
      {parsedJwt && parsedJwt.valid && expInfo && (
        <div
          className={`jwt-status-banner ${
            expInfo.isExpired === true
              ? 'is-expired'
              : expInfo.isExpired === false
                ? 'is-active'
                : 'is-neutral'
          }`}
        >
          <div className="jwt-status-left">
            {expInfo.isExpired === true && (
              <>
                <XCircle size={16} className="text-rose" />
                <div>
                  <strong>Token Expired</strong>
                  <span className="jwt-status-sub">
                    Expired {expInfo.exp?.relative} ago ({expInfo.exp?.full})
                  </span>
                </div>
              </>
            )}
            {expInfo.isExpired === false && (
              <>
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>Token Active</strong>
                  <span className="jwt-status-sub">
                    Expires in {expInfo.exp?.relative} ({expInfo.exp?.full})
                  </span>
                </div>
              </>
            )}
            {expInfo.isExpired === null && (
              <>
                <Clock size={16} className="text-muted" />
                <div>
                  <strong>No Expiration Claim</strong>
                  <span className="jwt-status-sub">
                    No <code>exp</code> claim present in payload.
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="jwt-status-right">
            {parsedJwt.header?.alg && (
              <span className="jwt-badge alg-badge">
                Algorithm: <strong>{parsedJwt.header.alg}</strong>
              </span>
            )}
            {parsedJwt.header?.typ && (
              <span className="jwt-badge typ-badge">Type: {parsedJwt.header.typ}</span>
            )}
          </div>
        </div>
      )}

      {/* Decoded Sections Grid */}
      {parsedJwt && parsedJwt.valid && (
        <div className="jwt-decoded-grid">
          {/* Key Standard Claims Quick Breakdown */}
          {parsedJwt.payload && (
            <div className="jwt-card jwt-claims-card">
              <div className="jwt-card-header">
                <div className="jwt-header-title">
                  <Tag size={14} className="text-amber" />
                  <h4>Standard Claims Breakdown</h4>
                </div>
              </div>

              <div className="jwt-claims-pills">
                {parsedJwt.payload.sub && (
                  <div className="jwt-claim-pill" title="Subject identifier">
                    <User size={12} className="claim-icon" />
                    <span className="claim-key">sub:</span>
                    <span className="claim-val">{String(parsedJwt.payload.sub)}</span>
                  </div>
                )}
                {parsedJwt.payload.iss && (
                  <div className="jwt-claim-pill" title="Issuer">
                    <Globe size={12} className="claim-icon" />
                    <span className="claim-key">iss:</span>
                    <span className="claim-val">{String(parsedJwt.payload.iss)}</span>
                  </div>
                )}
                {parsedJwt.payload.aud && (
                  <div className="jwt-claim-pill" title="Audience">
                    <Hash size={12} className="claim-icon" />
                    <span className="claim-key">aud:</span>
                    <span className="claim-val">
                      {Array.isArray(parsedJwt.payload.aud)
                        ? parsedJwt.payload.aud.join(', ')
                        : String(parsedJwt.payload.aud)}
                    </span>
                  </div>
                )}
                {expInfo?.iat && (
                  <div className="jwt-claim-pill" title={`Issued: ${expInfo.iat.full}`}>
                    <Clock size={12} className="claim-icon" />
                    <span className="claim-key">iat:</span>
                    <span className="claim-val">{expInfo.iat.full}</span>
                  </div>
                )}
                {expInfo?.exp && (
                  <div
                    className={`jwt-claim-pill ${expInfo.isExpired ? 'pill-danger' : 'pill-success'}`}
                    title={`Expires: ${expInfo.exp.full}`}
                  >
                    <Clock size={12} className="claim-icon" />
                    <span className="claim-key">exp:</span>
                    <span className="claim-val">{expInfo.exp.full}</span>
                  </div>
                )}
                {parsedJwt.payload.email && (
                  <div className="jwt-claim-pill" title="Email address">
                    <span className="claim-key">email:</span>
                    <span className="claim-val">{String(parsedJwt.payload.email)}</span>
                  </div>
                )}
                {(parsedJwt.payload.roles || parsedJwt.payload.role) && (
                  <div className="jwt-claim-pill" title="User Roles">
                    <span className="claim-key">roles:</span>
                    <span className="claim-val">
                      {Array.isArray(parsedJwt.payload.roles)
                        ? parsedJwt.payload.roles.join(', ')
                        : String(parsedJwt.payload.roles || parsedJwt.payload.role)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Header */}
          <div className="jwt-card jwt-json-card header-card">
            <div className="jwt-card-header">
              <div className="jwt-header-title">
                <FileCode size={14} className="text-rose" />
                <h4>Header (Algorithm & Token Type)</h4>
              </div>
              <button
                type="button"
                className="btn-copy-sm"
                onClick={() => handleCopy(parsedJwt.headerText || '', 'header')}
                title="Copy formatted Header JSON"
              >
                {copiedSection === 'header' ? (
                  <Check size={12} className="text-emerald" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedSection === 'header' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="jwt-code-pre">
              <code dangerouslySetInnerHTML={{ __html: highlightedHeader }} />
            </pre>
          </div>

          {/* Section 2: Payload */}
          <div className="jwt-card jwt-json-card payload-card">
            <div className="jwt-card-header">
              <div className="jwt-header-title">
                <FileCode size={14} className="text-purple" />
                <h4>Payload (Claims & Data)</h4>
              </div>
              <button
                type="button"
                className="btn-copy-sm"
                onClick={() => handleCopy(parsedJwt.payloadText || '', 'payload')}
                title="Copy formatted Payload JSON"
              >
                {copiedSection === 'payload' ? (
                  <Check size={12} className="text-emerald" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedSection === 'payload' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="jwt-code-pre">
              <code dangerouslySetInnerHTML={{ __html: highlightedPayload }} />
            </pre>
          </div>

          {/* Section 3: Signature */}
          <div className="jwt-card jwt-sig-card">
            <div className="jwt-card-header">
              <div className="jwt-header-title">
                <ShieldCheck size={14} className="text-cyan" />
                <h4>Signature Structure</h4>
              </div>
              <span className="jwt-badge sig-status-badge">
                {parsedJwt.parts?.signatureRaw ? 'Signature Present' : 'Unsigned Token'}
              </span>
            </div>
            <div className="jwt-sig-content">
              <code className="jwt-sig-raw">{parsedJwt.parts?.signatureRaw || '(None)'}</code>
              <p className="jwt-sig-note">
                Encrypted with <strong>{parsedJwt.header?.alg || 'unknown'}</strong>. 100% of header
                and payload decoding was performed locally in your IDE memory without sending any
                secrets over the network.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
