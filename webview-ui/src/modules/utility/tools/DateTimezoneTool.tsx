import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, ArrowLeftRight } from 'lucide-react';

const TIMEZONES: { id: string; label: string }[] = [
  { id: 'UTC', label: 'UTC' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'America/Denver', label: 'Denver' },
  { id: 'America/Chicago', label: 'Chicago' },
  { id: 'America/New_York', label: 'New York' },
  { id: 'America/Sao_Paulo', label: 'São Paulo' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Paris', label: 'Paris' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Europe/Moscow', label: 'Moscow' },
  { id: 'Africa/Cairo', label: 'Cairo' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Kolkata', label: 'India' },
  { id: 'Asia/Shanghai', label: 'Shanghai' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'Pacific/Auckland', label: 'Auckland' },
];

const WORLD_CLOCK_ZONES = [
  { id: 'Europe/London', label: 'London' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Australia/Sydney', label: 'Sydney' },
];

// Matches YYYY-MM-DD, optionally followed by a time and/or offset — used only to
// decide whether to label a recognized date "ISO 8601" versus a generic parseable string.
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

interface ParsedDate {
  date: Date;
  detected: string;
}

function parseFlexibleDate(raw: string): ParsedDate | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // API responses and query params often hand back a percent-encoded date string
  // (":" as "%3A", etc.) — decode it first if it looks encoded.
  let candidate = trimmed;
  let wasEncoded = false;
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed) {
      candidate = decoded;
      wasEncoded = true;
    }
  } catch {
    // Not a valid percent-encoded string — fall through and try the raw value as-is.
  }

  // A pure number is a Unix timestamp; 11+ digits means milliseconds, otherwise seconds.
  if (/^-?\d+$/.test(candidate)) {
    const num = Number(candidate);
    const isMs = Math.abs(num) >= 1e11;
    const date = new Date(isMs ? num : num * 1000);
    if (isNaN(date.getTime())) return null;
    return { date, detected: `${wasEncoded ? 'URL-encoded ' : ''}Unix timestamp (${isMs ? 'ms' : 'seconds'})` };
  }

  const date = new Date(candidate);
  if (isNaN(date.getTime())) return null;

  const label = ISO_LIKE.test(candidate) ? 'ISO 8601' : 'Recognized date string';
  return { date, detected: `${wasEncoded ? 'URL-encoded ' : ''}${label}` };
}

function formatInZone(date: Date, timeZone: string) {
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone,
  }).format(date);

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date);

  let offset = '';
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(date);
    offset = (parts.find(p => p.type === 'timeZoneName')?.value || '').replace('GMT', 'UTC');
  } catch {
    offset = '';
  }

  return { time, dateStr, offset };
}

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const DateTimezoneTool: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [rawInput, setRawInput] = useState(() => new Date().toISOString());
  const [fromTz, setFromTz] = useState(LOCAL_TZ);
  const [toTz, setToTz] = useState('UTC');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Make sure the visitor's own timezone is always selectable, even if it isn't
  // one of the curated common ones below.
  const fromOptions = useMemo(() => {
    return TIMEZONES.some(tz => tz.id === fromTz)
      ? TIMEZONES
      : [{ id: fromTz, label: fromTz.split('/').pop()?.replace(/_/g, ' ') || fromTz }, ...TIMEZONES];
  }, [fromTz]);

  const local = useMemo(() => formatInZone(now, LOCAL_TZ), [now]);
  const utc = useMemo(() => formatInZone(now, 'UTC'), [now]);

  const parsed = useMemo(() => parseFlexibleDate(rawInput), [rawInput]);
  const result = useMemo(() => (parsed ? formatInZone(parsed.date, toTz) : null), [parsed, toTz]);

  const worldClocks = useMemo(
    () => WORLD_CLOCK_ZONES.map(zone => ({ ...zone, ...formatInZone(now, zone.id) })),
    [now]
  );

  const handleSwap = () => {
    setFromTz(toTz);
    setToTz(fromTz);
  };

  const handleNow = () => {
    setRawInput(new Date().toISOString());
  };

  const handleCopy = () => {
    if (!parsed || !result) return;
    navigator.clipboard.writeText(`${result.time}, ${result.dateStr} (${result.offset})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="datetime-tool">
      <div className="now-row">
        <div className="now-card">
          <span className="now-label">Local</span>
          <span className="now-time">{local.time}</span>
          <span className="now-date">{local.dateStr} · {local.offset}</span>
        </div>
        <div className="now-card">
          <span className="now-label">UTC</span>
          <span className="now-time">{utc.time}</span>
          <span className="now-date">{utc.dateStr}</span>
        </div>
      </div>

      <span className="section-label">Convert</span>
      <div className="convert-card">
        <div className="field-row">
          <div className="field-label-row">
            <span className="field-label">Paste any date string</span>
            <button type="button" className="now-btn-chip" onClick={handleNow}>
              Now
            </button>
          </div>
          <input
            className="field-input"
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder="ISO 8601, Unix timestamp, or URL-encoded..."
            spellCheck={false}
          />
          {parsed ? (
            <span className="detect-chip">
              <Check size={9} />
              Detected: {parsed.detected}
            </span>
          ) : (
            <span className="detect-chip is-error">Couldn't parse this value</span>
          )}
        </div>

        <div className="tz-pair">
          <select className="tz-select" value={fromTz} onChange={e => setFromTz(e.target.value)}>
            {fromOptions.map(tz => (
              <option key={tz.id} value={tz.id} title={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
          <button type="button" className="tz-swap" onClick={handleSwap} title="Swap timezones">
            <ArrowLeftRight size={13} />
          </button>
          <select className="tz-select" value={toTz} onChange={e => setToTz(e.target.value)}>
            {TIMEZONES.map(tz => (
              <option key={tz.id} value={tz.id} title={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {result && (
          <div className="result-box">
            <span className="result-time">{result.time}</span>
            <div className="result-meta-row">
              <span className="result-meta">{result.dateStr} · {result.offset}</span>
              <button type="button" className="copy-chip" onClick={handleCopy}>
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <span className="result-unix">Unix: {Math.floor(parsed!.date.getTime() / 1000)}</span>
          </div>
        )}
      </div>

      <span className="section-label">World Clock</span>
      <div className="world-clocks">
        {worldClocks.map(clock => (
          <div key={clock.id} className="clock-row">
            <div>
              <span className="clock-city">{clock.label}</span> <span className="clock-offset">{clock.offset}</span>
            </div>
            <span className="clock-time">{clock.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
