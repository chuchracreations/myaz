import React, { useState, useEffect, useCallback } from 'react';
import { Screen, Snippet } from '../../src/common/types';
import { vscode } from './vscodeApi';
import { HomeView } from './modules/home/HomeView';
import { SnippetList } from './modules/snippets/SnippetList';
import { SnippetModal } from './modules/snippets/SnippetModal';
import { ConvertersView } from './modules/converters/ConvertersView';
import { PortsView } from './modules/ports/PortsView';
import { UtilityView } from './modules/utility/UtilityView';
import { RandomDataView } from './modules/randomdata/RandomDataView';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
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
          setScreen('snippets');
          setModalData(msg.payload || null);
          setIsModalOpen(true);
          break;

        case 'ACTIVE_MODULE_CHANGED':
          setScreen(msg.payload.moduleId as Screen);
          break;

        case 'NAVIGATE_HOME':
          setScreen('home');
          break;
      }
    });

    // Announce ready to host
    vscode.postMessage({ type: 'READY' });

    return () => unsubscribe();
  }, []);

  // Keep the native VS Code title bar (title text + action icons) in sync with the active screen
  useEffect(() => {
    vscode.postMessage({ type: 'SCREEN_CHANGED', payload: { screen } });
  }, [screen]);

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

  return (
    <div className="app-container">
      {screen === 'home' ? (
        <HomeView snippetCount={snippets.length} onNavigate={setScreen} />
      ) : (
        <main style={{ flex: 1 }}>
          {screen === 'snippets' && (
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
          {screen === 'converters' && <ConvertersView />}
          {screen === 'ports' && <PortsView />}
          {screen === 'utility' && <UtilityView />}
          {screen === 'randomdata' && <RandomDataView />}
        </main>
      )}

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
