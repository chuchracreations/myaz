import React, { useState, useEffect } from 'react';
import { Snippet } from '../../../../src/common/types';
import { X, Code, Tag, Info } from 'lucide-react';

interface SnippetModalProps {
  isOpen: boolean;
  initialData?: Partial<Snippet> | null;
  onClose: () => void;
  onSave: (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
}

const COMMON_LANGUAGES = [
  'typescript',
  'typescriptreact',
  'javascript',
  'javascriptreact',
  'python',
  'html',
  'css',
  'json',
  'sql',
  'markdown',
  'shellscript',
  'go',
  'rust',
  'plaintext',
];

export const SnippetModal: React.FC<SnippetModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [prefix, setPrefix] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setPrefix(initialData.prefix || '');
      setLanguage(initialData.language || 'typescript');
      setDescription(initialData.description || '');
      setTagsInput(initialData.tags ? initialData.tags.join(', ') : '');
      setBody(initialData.body || '');
      setError('');
    } else {
      setTitle('');
      setPrefix('');
      setLanguage('typescript');
      setDescription('');
      setTagsInput('');
      setBody('');
      setError('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!body.trim()) {
      setError('Snippet body cannot be empty.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      id: initialData?.id,
      title: title.trim(),
      prefix: prefix.trim(),
      language: language.trim(),
      description: description.trim(),
      tags,
      body,
      isFavorite: initialData?.isFavorite || false,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData?.id ? 'Edit Snippet' : 'New Snippet'}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11.5px',
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Snippet Title *</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. React Hook with Cleanup"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label className="form-label">Prefix / Trigger</label>
                <input
                  className="form-input font-mono"
                  type="text"
                  placeholder="e.g. use-clean"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  className="form-select"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  {COMMON_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Brief summary of what this code does"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                className="form-input"
                type="text"
                placeholder="react, hooks, async"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label">Code Body *</label>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Tip: Supports $1, $2 and $0 tab-stops
                </span>
              </div>
              <textarea
                className="form-textarea"
                rows={7}
                placeholder={`function \${1:myFunction}(\${2:arg}) {\n  \${0}\n}`}
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData?.id ? 'Save Changes' : 'Create Snippet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
