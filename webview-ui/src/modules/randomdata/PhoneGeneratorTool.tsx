import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { PHONE_FORMATS, generatePhoneNumber } from './phoneFormats';

export const PhoneGeneratorTool: React.FC = () => {
  const [countryCode, setCountryCode] = useState(PHONE_FORMATS[0].code);
  const [includeCountryCode, setIncludeCountryCode] = useState(true);
  const format = PHONE_FORMATS.find((f) => f.code === countryCode) || PHONE_FORMATS[0];
  const [value, setValue] = useState(() => generatePhoneNumber(format, includeCountryCode));
  const [copied, setCopied] = useState(false);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const next = PHONE_FORMATS.find((f) => f.code === code) || PHONE_FORMATS[0];
    setValue(generatePhoneNumber(next, includeCountryCode));
    setCopied(false);
  };

  const handleIncludeCountryCodeChange = (checked: boolean) => {
    setIncludeCountryCode(checked);
    setValue(generatePhoneNumber(format, checked));
    setCopied(false);
  };

  const handleRegenerate = () => {
    setValue(generatePhoneNumber(format, includeCountryCode));
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
        <span className="field-label">Country</span>
        <select
          className="tz-select"
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          {PHONE_FORMATS.map((f) => (
            <option key={f.code} value={f.code}>
              {f.label} ({f.dial})
            </option>
          ))}
        </select>
      </div>

      <label className="checkbox-field-row">
        <input
          type="checkbox"
          checked={includeCountryCode}
          onChange={(e) => handleIncludeCountryCodeChange(e.target.checked)}
        />
        Include country code
      </label>

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
