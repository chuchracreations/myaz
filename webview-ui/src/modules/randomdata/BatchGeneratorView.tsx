import React, { useState } from 'react';
import { Copy, Check, Shuffle, Plus, X } from 'lucide-react';
import { FIELDS, FieldId } from './generators';
import { PHONE_FORMATS, generatePhoneNumber } from './phoneFormats';
import { DATE_FORMATS } from './dateFormats';

interface CustomField {
  id: string;
  name: string;
  typeId: FieldId;
}

const DEFAULT_SELECTED: FieldId[] = ['name', 'email', 'phone'];
const MAX_RECORDS = 50;

export const BatchGeneratorView: React.FC = () => {
  const [selected, setSelected] = useState<Set<FieldId>>(new Set(DEFAULT_SELECTED));
  const [phoneCountry, setPhoneCountry] = useState(PHONE_FORMATS[0].code);
  const [phoneIncludeCountryCode, setPhoneIncludeCountryCode] = useState(true);
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0].code);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
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

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', typeId: FIELDS[0].id },
    ]);
    setRecords(null);
  };

  const updateCustomFieldName = (id: string, name: string) => {
    setCustomFields((prev) => prev.map((cf) => (cf.id === id ? { ...cf, name } : cf)));
    setRecords(null);
  };

  const updateCustomFieldType = (id: string, typeId: FieldId) => {
    setCustomFields((prev) => prev.map((cf) => (cf.id === id ? { ...cf, typeId } : cf)));
    setRecords(null);
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((cf) => cf.id !== id));
    setRecords(null);
  };

  const selectedFields = FIELDS.filter((f) => selected.has(f.id));
  const activeCustomFields = customFields.filter((cf) => cf.name.trim().length > 0);

  const handleCountChange = (raw: string) => {
    const parsed = Number(raw);
    const clamped = Number.isFinite(parsed)
      ? Math.max(1, Math.min(MAX_RECORDS, Math.round(parsed)))
      : 1;
    setCount(clamped);
  };

  const handleGenerate = () => {
    if (selectedFields.length === 0 && activeCustomFields.length === 0) return;
    const phoneFormat = PHONE_FORMATS.find((p) => p.code === phoneCountry) || PHONE_FORMATS[0];
    const dobFormat = DATE_FORMATS.find((d) => d.code === dateFormat) || DATE_FORMATS[0];
    const generateByType = (typeId: FieldId): string => {
      if (typeId === 'phone') return generatePhoneNumber(phoneFormat, phoneIncludeCountryCode);
      if (typeId === 'dob') return dobFormat.generate();
      return (FIELDS.find((f) => f.id === typeId) || FIELDS[0]).generate();
    };
    const rows = Array.from({ length: count }, () => {
      const row: Record<string, string> = {};
      selectedFields.forEach((f) => {
        row[f.id] = generateByType(f.id);
      });
      activeCustomFields.forEach((cf) => {
        row[cf.name.trim()] = generateByType(cf.typeId);
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
          <label className="checkbox-field-row">
            <input
              type="checkbox"
              checked={phoneIncludeCountryCode}
              onChange={(e) => {
                setPhoneIncludeCountryCode(e.target.checked);
                setRecords(null);
              }}
            />
            Include country code
          </label>
        </div>
      )}

      {selected.has('dob') && (
        <div className="field-row">
          <span className="field-label">Date format</span>
          <select
            className="tz-select"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
          >
            {DATE_FORMATS.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="batch-custom-fields">
        <div className="batch-custom-header">
          <span className="field-label">Custom fields</span>
          <button type="button" className="btn-mini" onClick={addCustomField}>
            <Plus size={11} />
            Add Field
          </button>
        </div>
        {customFields.map((cf) => (
          <div key={cf.id} className="batch-custom-row">
            <input
              type="text"
              className="field-input batch-custom-key-input"
              placeholder="Key name"
              value={cf.name}
              onChange={(e) => updateCustomFieldName(cf.id, e.target.value)}
            />
            <select
              className="tz-select batch-custom-type-select"
              value={cf.typeId}
              onChange={(e) => updateCustomFieldType(cf.id, e.target.value as FieldId)}
            >
              {FIELDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-mini batch-custom-remove"
              onClick={() => removeCustomField(cf.id)}
              aria-label="Remove custom field"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

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
        disabled={selectedFields.length === 0 && activeCustomFields.length === 0}
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
                    {f.id === 'image' && (
                      <img src={row[f.id]} alt="" className="image-swatch image-swatch--inline" />
                    )}
                    <span className="batch-record-value">{row[f.id]}</span>
                  </div>
                ))}
                {activeCustomFields.map((cf) => {
                  const key = cf.name.trim();
                  return (
                    <div key={cf.id} className="batch-record-field">
                      <span className="batch-record-label">{key}</span>
                      {cf.typeId === 'color' && (
                        <span
                          className="color-swatch color-swatch--inline"
                          style={{ backgroundColor: row[key] }}
                        />
                      )}
                      {cf.typeId === 'image' && (
                        <img src={row[key]} alt="" className="image-swatch image-swatch--inline" />
                      )}
                      <span className="batch-record-value">{row[key]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
