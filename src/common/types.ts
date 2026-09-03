export type ModuleId = 'snippets' | 'prompts' | 'templates' | 'notes';

export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  badge?: string;
  enabled: boolean;
  description?: string;
}

export interface Snippet {
  id: string;
  title: string;
  prefix: string;
  description?: string;
  body: string;
  language: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type WebviewToHostMessage =
  | { type: 'READY' }
  | { type: 'GET_SNIPPETS' }
  | { type: 'SAVE_SNIPPET'; payload: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } }
  | { type: 'DELETE_SNIPPET'; payload: { id: string } }
  | { type: 'TOGGLE_FAVORITE'; payload: { id: string } }
  | { type: 'INSERT_SNIPPET'; payload: { snippet: Snippet } }
  | { type: 'COPY_SNIPPET'; payload: { snippet: Snippet } }
  | { type: 'OPEN_STORAGE_FILE' }
  | { type: 'SHOW_MESSAGE'; payload: { text: string; level?: 'info' | 'warn' | 'error' } }
  | { type: 'EXPORT_SNIPPETS' }
  | { type: 'IMPORT_SNIPPETS' };

export type HostToWebviewMessage =
  | { type: 'SYNC_SNIPPETS'; payload: { snippets: Snippet[]; storagePath?: string } }
  | { type: 'OPEN_CREATE_SNIPPET_MODAL'; payload?: Partial<Snippet> }
  | { type: 'ACTIVE_EDITOR_LANGUAGE'; payload: { languageId: string } }
  | { type: 'ACTIVE_MODULE_CHANGED'; payload: { moduleId: ModuleId } };
