import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Snippet } from '../../common/types';

const STORAGE_KEY = 'coders-canvas.snippets';

const DEFAULT_SNIPPETS: Snippet[] = [];

export class SnippetService {
  private readonly storageFilePath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    const dir = this.context.globalStorageUri.fsPath;
    this.storageFilePath = path.join(dir, 'workspace.json');
    this.ensureInitialized();
  }

  public getStorageFilePath(): string {
    return this.storageFilePath;
  }

  public async openStorageFile(): Promise<void> {
    try {
      if (!fs.existsSync(this.storageFilePath)) {
        this.persistToFile(this.getAll());
      }
      const doc = await vscode.workspace.openTextDocument(this.storageFilePath);
      await vscode.window.showTextDocument(doc);
    } catch (err) {
      vscode.window.showErrorMessage(`Unable to open workspace data file: ${err}`);
    }
  }

  public async exportToFile(): Promise<boolean> {
    const snippets = this.getAll();
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('coders-canvas-workspace.json'),
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*'],
      },
      saveLabel: 'Export Workspace',
      title: 'Export Coders Canvas Workspace Data (JSON)',
    });

    if (!uri) {
      return false;
    }

    try {
      const workspacePayload = {
        version: '1.0',
        appName: 'coders-canvas',
        exportedAt: new Date().toISOString(),
        snippets,
        prompts: [],
        templates: [],
      };
      const jsonContent = JSON.stringify(workspacePayload, null, 2);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf-8'));
      vscode.window.showInformationMessage(
        `Coders Canvas: Successfully exported workspace data to ${path.basename(uri.fsPath)}`
      );
      return true;
    } catch (err) {
      vscode.window.showErrorMessage(`Coders Canvas: Failed to export workspace data: ${err}`);
      return false;
    }
  }

  public async importFromFile(): Promise<number> {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*'],
      },
      openLabel: 'Import Workspace',
      title: 'Import Coders Canvas Workspace Data (JSON)',
    });

    if (!uris || uris.length === 0) {
      return 0;
    }

    try {
      const fileData = await vscode.workspace.fs.readFile(uris[0]);
      const jsonString = Buffer.from(fileData).toString('utf-8');
      const imported = JSON.parse(jsonString);

      // Handle both structured workspace object and raw array
      let rawSnippets: unknown[] = [];
      if (Array.isArray(imported)) {
        rawSnippets = imported;
      } else if (imported && typeof imported === 'object') {
        if (Array.isArray(imported.snippets)) {
          rawSnippets = imported.snippets;
        } else if (imported.modules && Array.isArray(imported.modules.snippets)) {
          rawSnippets = imported.modules.snippets;
        }
      }

      if (rawSnippets.length === 0) {
        vscode.window.showWarningMessage('Coders Canvas: No valid snippets or workspace data found in the selected file.');
        return 0;
      }

      const validSnippets: Snippet[] = [];
      for (const item of rawSnippets) {
        if (item && typeof item === 'object') {
          const s = item as Record<string, unknown>;
          if (s.title && s.body) {
            validSnippets.push({
              id: String(s.id || `snippet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
              title: String(s.title).trim(),
              prefix: s.prefix ? String(s.prefix).trim() : '',
              description: s.description ? String(s.description).trim() : undefined,
              body: String(s.body),
              language: s.language ? String(s.language).trim() : 'plaintext',
              tags: Array.isArray(s.tags) ? s.tags.map((t: unknown) => String(t).trim().toLowerCase()) : [],
              isFavorite: Boolean(s.isFavorite),
              createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
              updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : Date.now(),
            });
          }
        }
      }

      if (validSnippets.length === 0) {
        vscode.window.showWarningMessage('Coders Canvas: No valid data items found in the selected JSON file.');
        return 0;
      }

      const choice = await vscode.window.showQuickPick(
        [
          {
            label: '$(diff-added) Merge with Existing Workspace',
            description: `Keep current data and add ${validSnippets.length} imported item(s)`,
            action: 'merge',
          },
          {
            label: '$(replace-all) Replace All Workspace Data',
            description: `Replace current data with ${validSnippets.length} imported item(s)`,
            action: 'replace',
          },
        ],
        { placeHolder: `Found ${validSnippets.length} item(s). Choose import mode:` }
      );

      if (!choice) {
        return 0;
      }

      let updatedList: Snippet[];
      if (choice.action === 'replace') {
        updatedList = validSnippets;
      } else {
        const current = this.getAll();
        const existingIds = new Set(current.map(s => s.id));
        const newItems = validSnippets.map(s => {
          if (existingIds.has(s.id)) {
            return {
              ...s,
              id: `snippet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            };
          }
          return s;
        });
        updatedList = [...newItems, ...current];
      }

      this.context.globalState.update(STORAGE_KEY, updatedList);
      this.persistToFile(updatedList);
      vscode.window.showInformationMessage(
        `Coders Canvas: Successfully imported workspace data (${validSnippets.length} snippet(s))!`
      );
      return validSnippets.length;
    } catch (err) {
      vscode.window.showErrorMessage(`Coders Canvas: Failed to import workspace data: ${err}`);
      return 0;
    }
  }

  private ensureInitialized(): void {
    const dir = this.context.globalStorageUri.fsPath;
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Check legacy snippets.json migration if workspace.json does not exist
      const legacyFile = path.join(dir, 'snippets.json');
      if (!fs.existsSync(this.storageFilePath) && fs.existsSync(legacyFile)) {
        try {
          const content = fs.readFileSync(legacyFile, 'utf-8');
          const parsed = JSON.parse(content);
          const snippets = Array.isArray(parsed) ? parsed : (parsed.snippets || []);
          if (snippets.length > 0) {
            this.context.globalState.update(STORAGE_KEY, snippets);
            this.persistToFile(snippets);
            return;
          }
        } catch (e) {
          console.error('Error migrating legacy snippets.json:', e);
        }
      }

      if (fs.existsSync(this.storageFilePath)) {
        const content = fs.readFileSync(this.storageFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : (parsed.snippets || []);
        if (Array.isArray(list)) {
          const userOnly = list.filter((s: Snippet) => s && s.id && !s.id.startsWith('seed-'));
          this.context.globalState.update(STORAGE_KEY, userOnly);
          if (userOnly.length !== list.length) {
            this.persistToFile(userOnly);
          }
          return;
        }
      }

      // Check globalState fallback
      const existing = this.context.globalState.get<Snippet[]>(STORAGE_KEY) || this.context.globalState.get<Snippet[]>('myaz.snippets');
      if (existing && existing.length > 0) {
        const userOnly = existing.filter((s: Snippet) => s && s.id && !s.id.startsWith('seed-'));
        this.context.globalState.update(STORAGE_KEY, userOnly);
        this.persistToFile(userOnly);
      } else {
        this.context.globalState.update(STORAGE_KEY, []);
        this.persistToFile([]);
      }
    } catch (err) {
      console.error('Failed to initialize workspace file storage:', err);
    }
  }

  private persistToFile(list: Snippet[]): void {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const workspacePayload = {
        version: '1.0',
        appName: 'coders-canvas',
        updatedAt: new Date().toISOString(),
        snippets: list,
        prompts: [],
        templates: [],
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(workspacePayload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write workspace data to disk:', err);
    }
  }

  public getAll(): Snippet[] {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const content = fs.readFileSync(this.storageFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : (parsed.snippets || []);
        if (Array.isArray(list)) {
          const userOnly = list.filter((s: Snippet) => s && s.id && !s.id.startsWith('seed-'));
          return userOnly.sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) {
              return a.isFavorite ? -1 : 1;
            }
            return b.updatedAt - a.updatedAt;
          });
        }
      }
    } catch (e) {
      // fallback to globalState
    }

    const list = this.context.globalState.get<Snippet[]>(STORAGE_KEY) || [];
    return list.filter((s: Snippet) => s && s.id && !s.id.startsWith('seed-'));
  }

  public save(data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Snippet {
    const list = this.getAll();
    const now = Date.now();

    if (data.id) {
      // Update existing
      const index = list.findIndex(s => s.id === data.id);
      if (index !== -1) {
        const updated: Snippet = {
          ...list[index],
          ...data,
          id: data.id,
          updatedAt: now,
        };
        list[index] = updated;
        this.context.globalState.update(STORAGE_KEY, list);
        this.persistToFile(list);
        return updated;
      }
    }

    // Create new
    const newSnippet: Snippet = {
      id: `snippet-${now}-${Math.random().toString(36).substring(2, 8)}`,
      title: data.title.trim(),
      prefix: data.prefix?.trim() || '',
      description: data.description?.trim(),
      body: data.body,
      language: data.language || 'plaintext',
      tags: data.tags || [],
      isFavorite: Boolean(data.isFavorite),
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newSnippet);
    this.context.globalState.update(STORAGE_KEY, list);
    this.persistToFile(list);
    return newSnippet;
  }

  public delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length !== list.length) {
      this.context.globalState.update(STORAGE_KEY, filtered);
      this.persistToFile(filtered);
      return true;
    }
    return false;
  }

  public toggleFavorite(id: string): Snippet | null {
    const list = this.getAll();
    const target = list.find(s => s.id === id);
    if (target) {
      target.isFavorite = !target.isFavorite;
      target.updatedAt = Date.now();
      this.context.globalState.update(STORAGE_KEY, list);
      this.persistToFile(list);
      return target;
    }
    return null;
  }
}

