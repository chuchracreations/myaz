import React, { useMemo, useState } from 'react';
import {
  Dices,
  Layers,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import { FIELDS, FieldId } from './generators';
import { SingleGeneratorTool } from './SingleGeneratorTool';
import { PhoneGeneratorTool } from './PhoneGeneratorTool';
import { DateGeneratorTool } from './DateGeneratorTool';
import { BatchGeneratorView } from './BatchGeneratorView';

const BATCH_ACCENT_STYLE = {
  '--card-accent': '#2dd4bf',
  '--card-accent-soft': 'rgba(45, 212, 191, 0.14)',
} as React.CSSProperties;

export const RandomDataView: React.FC = () => {
  const [batchOpen, setBatchOpen] = useState(false);
  const [expandedField, setExpandedField] = useState<FieldId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFields = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FIELDS;
    return FIELDS.filter(
      (f) => f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (batchOpen) {
    return (
      <div className="utility-tool-view">
        <div className="tool-back-header">
          <button
            type="button"
            className="tool-back-btn"
            onClick={() => setBatchOpen(false)}
            aria-label="Back to Random Data"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="tool-icon-tile" style={BATCH_ACCENT_STYLE}>
            <Layers size={14} />
          </div>
          <span className="tool-title">Batch Generator</span>
        </div>
        <BatchGeneratorView />
      </div>
    );
  }

  return (
    <div className="utility-landing">
      <div className="utility-header">
        <div className="utility-icon-tile">
          <Dices size={16} />
        </div>
        <div>
          <div className="utility-title">Random Data</div>
          <div className="utility-subtitle">Fake test data, generated locally</div>
        </div>
      </div>

      <div className="search-container">
        <Search size={13} className="search-icon" />
        <input
          className="search-input"
          type="text"
          placeholder="Search generators..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '2px' }}
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <button
        type="button"
        className="launch-card"
        style={BATCH_ACCENT_STYLE}
        onClick={() => setBatchOpen(true)}
      >
        <div className="launch-icon-tile">
          <Layers size={16} />
        </div>
        <div className="launch-info">
          <span className="launch-title">Batch Generator</span>
          <span className="launch-desc">Pick fields, generate many records at once</span>
        </div>
        <ChevronRight className="launch-chevron" size={14} />
      </button>

      <span className="discover-label">Individual Generators</span>
      {filteredFields.length === 0 && (
        <div className="empty-state">
          <Search size={22} className="empty-icon" />
          <span className="empty-title">No generators found</span>
          <span className="empty-desc">Try a different search term.</span>
        </div>
      )}
      <div className="launch-list">
        {filteredFields.map((f) => {
          const isOpen = expandedField === f.id;
          const accentStyle = {
            '--card-accent': f.accent,
            '--card-accent-soft': f.accentSoft,
          } as React.CSSProperties;
          return (
            <div key={f.id} className="accordion-item" style={accentStyle}>
              <button
                type="button"
                className={`launch-card accordion-trigger ${isOpen ? 'is-open' : ''}`}
                onClick={() => setExpandedField(isOpen ? null : f.id)}
                aria-expanded={isOpen}
              >
                <div className="launch-icon-tile">{f.icon}</div>
                <div className="launch-info">
                  <span className="launch-title">{f.title}</span>
                  <span className="launch-desc">{f.desc}</span>
                </div>
                <ChevronDown className={`accordion-chevron ${isOpen ? 'is-open' : ''}`} size={14} />
              </button>
              {isOpen && (
                <div className="accordion-body">
                  {f.id === 'phone' ? (
                    <PhoneGeneratorTool />
                  ) : f.id === 'dob' ? (
                    <DateGeneratorTool />
                  ) : (
                    <SingleGeneratorTool key={f.id} field={f} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="utility-privacy-line">
        <ShieldCheck size={11} />
        <span>
          Every value is fake, generated locally — except Image, which loads from picsum.photos
        </span>
      </div>
    </div>
  );
};
