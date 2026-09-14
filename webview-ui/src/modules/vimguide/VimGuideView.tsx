import React, { useMemo, useState } from 'react';
import { Keyboard, Search, X, Copy, Check } from 'lucide-react';
import { VIM_CATEGORIES } from './vimCommands';

export const VimGuideView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedKeys, setCopiedKeys] = useState<string | null>(null);

  const totalCount = useMemo(
    () => VIM_CATEGORIES.reduce((sum, cat) => sum + cat.commands.length, 0),
    []
  );

  const visibleCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VIM_CATEGORIES.map((cat) => ({
      ...cat,
      commands: cat.commands.filter(
        (c) => !q || c.keys.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      ),
    }))
      .filter((cat) => (activeCategory === 'all' || cat.id === activeCategory) && cat.commands.length > 0);
  }, [searchQuery, activeCategory]);

  const handleCopy = (keys: string) => {
    navigator.clipboard.writeText(keys);
    setCopiedKeys(keys);
    setTimeout(() => setCopiedKeys((k) => (k === keys ? null : k)), 1500);
  };

  return (
    <div className="utility-landing">
      <div className="utility-header">
        <div className="utility-icon-tile">
          <Keyboard size={16} />
        </div>
        <div>
          <div className="utility-title">Vim Guide</div>
          <div className="utility-subtitle">{totalCount} commands, organized for quick lookup</div>
        </div>
      </div>

      <div className="search-container">
        <Search size={13} className="search-icon" />
        <input
          className="search-input"
          type="text"
          placeholder="Search commands (e.g. delete, paste, dd)..."
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

      <div className="filter-pills-row">
        <button
          type="button"
          className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {VIM_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {visibleCategories.length === 0 && (
        <div className="empty-state">
          <Search size={22} className="empty-icon" />
          <span className="empty-title">No commands found</span>
          <span className="empty-desc">Try a different search term.</span>
        </div>
      )}

      <div className="vim-guide-body">
        {visibleCategories.map((cat) => (
          <div key={cat.id} className="vim-category-block">
            <span className="discover-label">{cat.title}</span>
            <div className="vim-command-list">
              {cat.commands.map((cmd) => (
                <button
                  key={cmd.keys}
                  type="button"
                  className="vim-command-row"
                  onClick={() => handleCopy(cmd.keys)}
                  title="Click to copy"
                >
                  <kbd className="vim-command-keys">{cmd.keys}</kbd>
                  <span className="vim-command-desc">{cmd.desc}</span>
                  {copiedKeys === cmd.keys ? (
                    <Check size={12} className="vim-command-copy-icon is-copied" />
                  ) : (
                    <Copy size={12} className="vim-command-copy-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
