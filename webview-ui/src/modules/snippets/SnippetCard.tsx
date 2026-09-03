import React, { useState } from 'react';
import { Snippet } from '../../../../src/common/types';
import { Play, Copy, Check, Star, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface SnippetCardProps {
  snippet: Snippet;
  onInsert: (snippet: Snippet) => void;
  onCopy: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  onInsert,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    onCopy(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = snippet.body.split('\n').length;
  const isMultiLine = lineCount > 4;

  return (
    <div className="snippet-card">
      <div className="card-top">
        <div className="card-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className={`btn-icon ${snippet.isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(snippet.id)}
              title={snippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Favorite"
            >
              <Star size={13} fill={snippet.isFavorite ? '#f59e0b' : 'none'} />
            </button>
            <h3 className="card-title" title={snippet.title}>
              {snippet.title}
            </h3>
          </div>
          {snippet.description && <p className="card-desc">{snippet.description}</p>}
        </div>

        <div className="card-badges">
          <span className="lang-badge">{snippet.language}</span>
          {snippet.prefix && <span className="prefix-badge">{snippet.prefix}</span>}
        </div>
      </div>

      {snippet.tags && snippet.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {snippet.tags.map((tag: string, idx: number) => (
            <span key={idx} className="tag-badge">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Code preview block */}
      <div className="code-preview-container">
        <pre
          className="code-preview"
          style={{
            maxHeight: isExpanded ? '400px' : '100px',
          }}
        >
          <code>{snippet.body}</code>
        </pre>
        {isMultiLine && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '3px',
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Show all ({lineCount} lines)
              </>
            )}
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="card-actions">
        <div className="card-actions-left">
          <button
            className="btn btn-primary"
            onClick={() => onInsert(snippet)}
            title="Insert this snippet directly at current cursor position"
          >
            <Play size={11} fill="currentColor" /> Insert
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleCopy}
            title="Copy snippet code to clipboard"
          >
            {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="card-actions-right">
          <button
            className="btn-icon"
            onClick={() => onEdit(snippet)}
            title="Edit snippet"
            aria-label="Edit"
          >
            <Edit3 size={13} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(snippet.id)}
            title="Delete snippet"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
