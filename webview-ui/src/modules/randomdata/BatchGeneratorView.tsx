import React, { useState } from 'react';
import { Copy, Check, Shuffle } from 'lucide-react';
import { FIELDS, FieldId } from './generators';
import { PHONE_FORMATS } from './phoneFormats';

const DEFAULT_SELECTED: FieldId[] = ['name', 'email', 'phone'];
const MAX_RECORDS = 50;

export const BatchGeneratorView: React.FC = () => {
  const [selected, setSelected] = useState<Set<FieldId>>(new Set(DEFAULT_SELECTED));
  const [phoneCountry, setPhoneCountry] = useState(PHONE_FORMATS[0].code);
  const [count, setCount] = useState(5);
  const [records, setRecords] = useState<Record<string, string>[] | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleField = (id: FieldId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setRecords(null);
  };

  const selectedFields = FIELDS.filter((f) => selected.has(f.id));

  const handleCountChange = (raw: string) => {
    const parsed = Number(raw);
    const clamped = Number.isFinite(parsed)
      ? Math.max(1, Math.min(MAX_RECORDS, Math.round(parsed)))
      : 1;
    setCount(clamped);
  };

  const handleGenerate = () => {
    if (selectedFields.length === 0) return;
    const phoneFormat = PHONE_FORMATS.find((p) => p.code === phoneCountry) || PHONE_FORMATS[0];
    const rows = Array.from({ length: count }, () => {
      const row: Record<string, string> = {};
      selectedFields.forEach((f) => {
        row[f.id] = f.id === 'phone' ? phoneFormat.generate() : f.generate();
      });
      return row;
    });
    setRecords(rows);
  };

  const handleCopyAll = () => {
    if (!records) return;
    navigator.clipboard.writeText(JSON.stringify(records, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyRow = (row: Record<string, string>, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="batch-gen-tool">
      <span className="field-label">Choose fields</span>
      <div className="batch-field-grid">
        {FIELDS.map((f) => (
          <label key={f.id} className={`batch-field-chip ${selected.has(f.id) ? 'is-active' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(f.id)}
              onChange={() => toggleField(f.id)}
            />
            {f.title}
          </label>
        ))}
      </div>

      {selected.has('phone') && (
        <div className="field-row">
          <span className="field-label">Phone country</span>
          <select
            className="tz-select"
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
          >
            {PHONE_FORMATS.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label} ({f.dial})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="batch-count-row">
        <span className="field-label">Records</span>
        <input
          type="number"
          className="batch-count-input"
          min={1}
          max={MAX_RECORDS}
          value={count}
          onChange={(e) => handleCountChange(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="batch-generate-btn"
        onClick={handleGenerate}
        disabled={selectedFields.length === 0}
      >
        <Shuffle size={13} />
        Generate {count} Record{count === 1 ? '' : 's'}
      </button>

      {records && (
        <>
          <div className="batch-results-header">
            <span className="field-label">{records.length} generated</span>
            <button type="button" className="copy-chip" onClick={handleCopyAll}>
              {copiedAll ? <Check size={10} /> : <Copy size={10} />}
              {copiedAll ? 'Copied' : 'Copy All as JSON'}
            </button>
          </div>

          <div className="batch-records-list">
            {records.map((row, i) => (
              <div key={i} className="batch-record-card">
                <div className="batch-record-header">
                  <span className="batch-record-index">#{i + 1}</span>
                  <button type="button" className="btn-mini" onClick={() => handleCopyRow(row, i)}>
                    {copiedIndex === i ? <Check size={11} /> : <Copy size={11} />}
                    {copiedIndex === i ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {selectedFields.map((f) => (
                  <div key={f.id} className="batch-record-field">
                    <span className="batch-record-label">{f.title}</span>
                    {f.id === 'color' && (
                      <span
                        className="color-swatch color-swatch--inline"
                        style={{ backgroundColor: row[f.id] }}
                      />
                    )}
                    <span className="batch-record-value">{row[f.id]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
