import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Snippet } from '../../../../src/common/types';
import { SnippetCard } from './SnippetCard';
import { Search, X, Star, FileCode, PlusCircle, Sparkles } from 'lucide-react';

interface SnippetListProps {
  snippets: Snippet[];
  activeEditorLanguage?: string;
  onInsert: (snippet: Snippet) => void;
  onCopy: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const SnippetList: React.FC<SnippetListProps> = ({
  snippets,
  activeEditorLanguage,
  onInsert,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere in the list to jump into search, like a command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract all unique languages available in snippets
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    snippets.forEach(s => {
      if (s.language) langs.add(s.language);
    });
    return Array.from(langs);
  }, [snippets]);

  // Filtered snippets calculation
  const filteredSnippets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return snippets.filter(snippet => {
      // 1. Filter by category pill
      if (selectedFilter === 'favorites' && !snippet.isFavorite) {
        return false;
      }
      if (
        selectedFilter !== 'all' &&
        selectedFilter !== 'favorites' &&
        snippet.language.toLowerCase() !== selectedFilter.toLowerCase()
      ) {
        return false;
      }

      // 2. Filter by search query
      if (!query) return true;

      const inTitle = snippet.title.toLowerCase().includes(query);
      const inPrefix = snippet.prefix.toLowerCase().includes(query);
      const inDesc = (snippet.description || '').toLowerCase().includes(query);
      const inLang = snippet.language.toLowerCase().includes(query);
      const inTags = snippet.tags.some((tag: string) => tag.toLowerCase().includes(query));
      const inBody = snippet.body.toLowerCase().includes(query);

      return inTitle || inPrefix || inDesc || inLang || inTags || inBody;
    });
  }, [snippets, searchQuery, selectedFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Search Input */}
      <div className="search-container">
        <Search size={13} className="search-icon" />
        <input
          ref={searchInputRef}
          className="search-input"
          type="text"
          placeholder="Search snippets by name, tag, code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery ? (
          <button
            className="btn-icon"
            style={{ padding: '2px' }}
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={12} />
          </button>
        ) : (
          <span className="search-kbd">/</span>
        )}
      </div>

      {/* Filter Pills */}
      <div className="filter-pills-row">
        <button
          className={`filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          All <span className="count">{snippets.length}</span>
        </button>

        <button
          className={`filter-pill ${selectedFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('favorites')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Star size={10} fill={selectedFilter === 'favorites' ? '#f59e0b' : 'none'} />
            Favorites
          </span>
        </button>

        {activeEditorLanguage && availableLanguages.includes(activeEditorLanguage) && (
          <button
            className={`filter-pill ${selectedFilter === activeEditorLanguage ? 'active' : ''}`}
            onClick={() => setSelectedFilter(activeEditorLanguage)}
            title="Snippets matching current editor file"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={10} color="#60a5fa" />
              {activeEditorLanguage}
            </span>
          </button>
        )}

        {availableLanguages.map(lang => {
          if (lang === activeEditorLanguage) return null; // already shown as auto
          return (
            <button
              key={lang}
              className={`filter-pill ${selectedFilter === lang ? 'active' : ''}`}
              onClick={() => setSelectedFilter(lang)}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {/* Snippet Cards List */}
      {filteredSnippets.length > 0 ? (
        <div className="snippets-grid">
          {filteredSnippets.map(snippet => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onInsert={onInsert}
              onCopy={onCopy}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FileCode size={32} className="empty-icon" />
          <h4 className="empty-title">
            {searchQuery || selectedFilter !== 'all' ? 'No snippets match your filter' : 'No snippets saved yet'}
          </h4>
          <p className="empty-desc">
            {searchQuery || selectedFilter !== 'all'
              ? 'Try changing keywords or resetting the filter.'
              : 'Create reusable snippets to boost your development workflow.'}
          </p>
          {searchQuery || selectedFilter !== 'all' ? (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
            >
              Reset Filters
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onOpenCreateModal}>
              <PlusCircle size={13} /> Create First Snippet
            </button>
          )}
        </div>
      )}
    </div>
  );
};
