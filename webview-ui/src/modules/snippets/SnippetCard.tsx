import React, { useState, useMemo } from 'react';
import { Snippet } from '../../../../src/common/types';
import { highlightSnippetCode } from '../../utils/syntaxHighlight';
import { getLanguageAccent, getLanguageShortLabel, formatRelativeTime } from '../../utils/snippetDisplay';
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

  const lines = useMemo(() => snippet.body.split('\n'), [snippet.body]);
  const lineCount = lines.length;
  const isMultiLine = lineCount > 4;

  const highlightedCode = useMemo(() => {
    return highlightSnippetCode(snippet.body, snippet.language);
  }, [snippet.body, snippet.language]);

  const { accent, soft } = getLanguageAccent(snippet.language);
  const shortLabel = getLanguageShortLabel(snippet.language);

  return (
    <div
      className="snippet-card"
      style={{ '--lang-accent': accent, '--lang-accent-soft': soft } as React.CSSProperties}
    >
      <div className="card-top">
        <div className="card-title-group">
          <div className="card-heading-row">
            <button
              className={`fav-btn ${snippet.isFavorite ? 'is-fav' : ''}`}
              onClick={() => onToggleFavorite(snippet.id)}
              title={snippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Favorite"
            >
              <Star size={14} fill={snippet.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <h3 className="card-title" title={snippet.title}>
              {snippet.title}
            </h3>
          </div>
          {snippet.description && <p className="card-desc">{snippet.description}</p>}
        </div>

        <span className="lang-tag" title={snippet.language}>
          <span className="lang-dot" />
          {shortLabel}
        </span>
      </div>

      {(snippet.prefix || (snippet.tags && snippet.tags.length > 0)) && (
        <div className="card-badges">
          {snippet.prefix && <span className="prefix-badge">{snippet.prefix}</span>}
          {snippet.tags?.map((tag: string, idx: number) => (
            <span key={idx} className="tag-badge">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Code preview block: line-numbered gutter + syntax-highlighted code */}
      <div className="code-preview-container">
        <div className="code-flex" style={{ maxHeight: isExpanded ? '400px' : '100px' }}>
          <div className="code-lines" aria-hidden="true">
            {lines.map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>
          <pre className="code-preview">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        </div>
        {isMultiLine && (
          <button className="show-more-btn" onClick={() => setIsExpanded(!isExpanded)}>
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
            className="btn btn-insert"
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
          <span className="card-meta">Updated {formatRelativeTime(snippet.updatedAt)}</span>
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
