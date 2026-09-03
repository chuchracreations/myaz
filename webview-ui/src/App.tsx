import React, { useState, useEffect, useCallback } from 'react';
import { ModuleDefinition, ModuleId, Snippet } from '../../src/common/types';
import { vscode } from './vscodeApi';
import { SnippetList } from './modules/snippets/SnippetList';
import { SnippetModal } from './modules/snippets/SnippetModal';
import { Code2, Plus, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

const MODULES: ModuleDefinition[] = [
  { id: 'snippets', title: 'Snippets', enabled: true },
  { id: 'prompts', title: 'AI Prompts', badge: 'Soon', enabled: false },
  { id: 'templates', title: 'Templates', badge: 'Soon', enabled: false },
];

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('snippets');
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeEditorLanguage, setActiveEditorLanguage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<Snippet> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    // Listen to messages from extension host
    const unsubscribe = vscode.onMessage(msg => {
      switch (msg.type) {
        case 'SYNC_SNIPPETS':
          setSnippets(msg.payload.snippets);
          break;

        case 'ACTIVE_EDITOR_LANGUAGE':
          setActiveEditorLanguage(msg.payload.languageId);
          break;

        case 'OPEN_CREATE_SNIPPET_MODAL':
          setModalData(msg.payload || null);
          setIsModalOpen(true);
          break;

        case 'ACTIVE_MODULE_CHANGED':
          setActiveModule(msg.payload.moduleId);
          break;
      }
    });

    // Announce ready to host
    vscode.postMessage({ type: 'READY' });

    return () => unsubscribe();
  }, []);

  const handleInsert = (snippet: Snippet) => {
    vscode.postMessage({
      type: 'INSERT_SNIPPET',
      payload: { snippet },
    });
    showToast(`Inserted "${snippet.title}"`);
  };

  const handleCopy = (snippet: Snippet) => {
    vscode.postMessage({
      type: 'COPY_SNIPPET',
      payload: { snippet },
    });
    showToast(`Copied to clipboard`);
  };

  const handleSaveSnippet = (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    vscode.postMessage({
      type: 'SAVE_SNIPPET',
      payload: data,
    });
    showToast(data.id ? 'Snippet updated!' : 'Snippet created!');
  };

  const handleDeleteSnippet = (id: string) => {
    vscode.postMessage({
      type: 'DELETE_SNIPPET',
      payload: { id },
    });
  };

  const handleToggleFavorite = (id: string) => {
    vscode.postMessage({
      type: 'TOGGLE_FAVORITE',
      payload: { id },
    });
  };

  const handleOpenCreateModal = (draft?: Partial<Snippet>) => {
    setModalData(draft || null);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    vscode.postMessage({ type: 'GET_SNIPPETS' });
    showToast('Refreshed snippets');
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-identity">
            <Code2 className="brand-icon" size={18} />
            <h1 className="brand-title">MyAz</h1>
          </div>
          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={handleRefresh}
              title="Refresh snippets"
              aria-label="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenCreateModal()}
              title="Create a new snippet"
            >
              <Plus size={12} strokeWidth={2.5} />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Modular Navigation Bar */}
        <nav className="module-tabs" aria-label="Extension Modules">
          {MODULES.map(module => {
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                className={`module-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (module.enabled) {
                    setActiveModule(module.id);
                  } else {
                    showToast(`${module.title} is coming in the next update!`);
                  }
                }}
              >
                <span>{module.title}</span>
                {module.badge && <span className="module-tab-badge">{module.badge}</span>}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Module Body */}
      <main style={{ flex: 1 }}>
        {activeModule === 'snippets' && (
          <SnippetList
            snippets={snippets}
            activeEditorLanguage={activeEditorLanguage}
            onInsert={handleInsert}
            onCopy={handleCopy}
            onEdit={s => handleOpenCreateModal(s)}
            onDelete={handleDeleteSnippet}
            onToggleFavorite={handleToggleFavorite}
            onOpenCreateModal={() => handleOpenCreateModal()}
          />
        )}
      </main>

      {/* Snippet Create / Edit Modal */}
      <SnippetModal
        isOpen={isModalOpen}
        initialData={modalData}
        onClose={() => {
          setIsModalOpen(false);
          setModalData(null);
        }}
        onSave={handleSaveSnippet}
      />

      {/* Toast Feedback */}
      {toast && (
        <div className="toast-bar">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
