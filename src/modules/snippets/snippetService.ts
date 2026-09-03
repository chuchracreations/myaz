import * as vscode from 'vscode';
import { Snippet } from '../../common/types';

const STORAGE_KEY = 'myaz.snippets';

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'seed-1',
    title: 'React Functional Component (TS)',
    prefix: 'rfc-ts',
    description: 'Modern React functional component with typed props',
    language: 'typescriptreact',
    tags: ['react', 'frontend', 'components'],
    isFavorite: true,
    body: `import React from 'react';

interface \${1:ComponentName}Props {
  \${2:title}: \${3:string};
}

export const \${1:ComponentName}: React.FC<\${1:ComponentName}Props> = ({ \${2:title} }) => {
  return (
    <div className="\${4:container}">
      <h1>{\${2:title}}</h1>
      \${0}
    </div>
  );
};
`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'seed-2',
    title: 'Safe Async Fetch with Try/Catch',
    prefix: 'fetch-safe',
    description: 'Resilient fetch wrapper with typed JSON response and error handling',
    language: 'typescript',
    tags: ['typescript', 'api', 'async'],
    isFavorite: true,
    body: `async function fetch\${1:Resource}<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
`,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'seed-3',
    title: 'Python Typed Function with Docstring',
    prefix: 'py-func',
    description: 'Standard Python function structure with type hints and docstring',
    language: 'python',
    tags: ['python', 'backend', 'clean-code'],
    isFavorite: false,
    body: `def \${1:process_data}(\${2:payload}: dict) -> \${3:bool}:
    """
    \${4:Summary of what this function achieves.}

    Args:
        \${2:payload}: Input dictionary containing data.

    Returns:
        \${3:bool}: Success status.
    """
    \${0:pass}
`,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'seed-4',
    title: 'CSS Glassmorphism Container',
    prefix: 'css-glass',
    description: 'Frosted glass container effect with backdrop filter',
    language: 'css',
    tags: ['css', 'styling', 'glassmorphism'],
    isFavorite: false,
    body: `.\${1:glass-card} {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  padding: \${2:16px};
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
`,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
  }
];

export class SnippetService {
  constructor(private readonly context: vscode.ExtensionContext) {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    const existing = this.context.globalState.get<Snippet[]>(STORAGE_KEY);
    if (!existing || existing.length === 0) {
      this.context.globalState.update(STORAGE_KEY, DEFAULT_SNIPPETS);
    }
  }

  public getAll(): Snippet[] {
    const list = this.context.globalState.get<Snippet[]>(STORAGE_KEY, []);
    return list.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
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
    return newSnippet;
  }

  public delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length !== list.length) {
      this.context.globalState.update(STORAGE_KEY, filtered);
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
      return target;
    }
    return null;
  }
}
