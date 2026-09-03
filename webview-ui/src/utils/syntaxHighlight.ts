import Prism from 'prismjs';

// Load language grammars
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

/**
 * Maps VS Code language IDs to Prism language identifiers
 */
function normalizeLanguage(lang?: string): string {
  if (!lang) return 'javascript';
  const lower = lang.toLowerCase().trim();

  switch (lower) {
    case 'typescriptreact':
    case 'tsx':
      return 'tsx';
    case 'javascriptreact':
    case 'jsx':
      return 'jsx';
    case 'typescript':
    case 'ts':
      return 'typescript';
    case 'javascript':
    case 'js':
      return 'javascript';
    case 'python':
    case 'py':
      return 'python';
    case 'html':
    case 'xml':
      return 'markup';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'json':
      return 'json';
    case 'sql':
      return 'sql';
    case 'shellscript':
    case 'bash':
    case 'sh':
    case 'zsh':
      return 'bash';
    case 'markdown':
    case 'md':
      return 'markdown';
    default:
      if (Prism.languages[lower]) {
        return lower;
      }
      return 'javascript';
  }
}

/**
 * Escape HTML special characters for safe rendering
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Highlights snippet code according to the given language ID using Prism.js.
 * Also highlights VS Code snippet placeholders/tabstops like $1, ${1:label}, $0.
 */
export function highlightSnippetCode(code: string, languageId?: string): string {
  if (!code) return '';

  const prismLang = normalizeLanguage(languageId);
  const grammar = Prism.languages[prismLang] || Prism.languages.javascript;

  try {
    let highlighted = Prism.highlight(code, grammar, prismLang);

    // Highlight snippet tab-stops ($1, ${1:foo}, $0) with a distinct pill style
    highlighted = highlighted.replace(
      /(\$\{\d+:[^}]+\}|\$\d+)/g,
      '<span class="snippet-tabstop">$1</span>'
    );

    return highlighted;
  } catch (err) {
    console.error('Syntax highlighting error:', err);
    return escapeHtml(code);
  }
}
