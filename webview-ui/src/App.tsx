import React, { useState, useEffect, useCallback } from 'react';
import { ModuleDefinition, ModuleId, Snippet } from '../../src/common/types';
import { vscode } from './vscodeApi';
import { SnippetList } from './modules/snippets/SnippetList';
import { SnippetModal } from './modules/snippets/SnippetModal';
import { ConvertersView } from './modules/converters/ConvertersView';
import { PortsView } from './modules/ports/PortsView';
import { UtilityView } from './modules/utility/UtilityView';
import { CheckCircle2, Code2, RefreshCw, Radio, Wrench } from 'lucide-react';

const MODULES: ModuleDefinition[] = [
  { id: 'snippets', title: 'Snippets', enabled: true },
  { id: 'converters', title: 'Converters', enabled: true },
  { id: 'ports', title: 'Ports', enabled: true },
  { id: 'utility', title: 'Utility', enabled: true },
];

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('snippets');
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [storagePath, setStoragePath] = useState<string>('');
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
          if (msg.payload.storagePath) {
            setStoragePath(msg.payload.storagePath);
          }
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
    showToast('Refreshed workspace');
  };

  const handleOpenStorageFile = () => {
    vscode.postMessage({ type: 'OPEN_STORAGE_FILE' });
    showToast('Opened workspace data');
  };

  const handleExport = () => {
    vscode.postMessage({ type: 'EXPORT_SNIPPETS' });
  };

  const handleImport = () => {
    vscode.postMessage({ type: 'IMPORT_SNIPPETS' });
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        {/* Modular Navigation Bar */}
        <nav className="module-tabs" aria-label="Extension Modules">
          {MODULES.map(module => {
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                className={`module-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveModule(module.id)}
              >
                {module.id === 'snippets' && <Code2 size={13} />}
                {module.id === 'converters' && <RefreshCw size={13} />}
                {module.id === 'ports' && <Radio size={13} />}
                {module.id === 'utility' && <Wrench size={13} />}
                <span>{module.title}</span>
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
        {activeModule === 'converters' && <ConvertersView />}
        {activeModule === 'ports' && <PortsView />}
        {activeModule === 'utility' && <UtilityView />}
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
