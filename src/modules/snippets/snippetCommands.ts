import * as vscode from 'vscode';
import { Snippet } from '../../common/types';
import { SidebarWebviewProvider } from '../../providers/SidebarWebviewProvider';
import { SnippetService } from './snippetService';

export class SnippetCommands {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly sidebarProvider: SidebarWebviewProvider,
    private readonly snippetService: SnippetService
  ) { }

  public registerCommands(): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    // Command: Insert snippet into active editor
    disposables.push(
      vscode.commands.registerCommand('myaz.snippets.insert', async (snippet?: Snippet) => {
        if (!snippet) {
          vscode.window.showInformationMessage('Select a snippet from the myaz sidebar to insert.');
          return;
        }
        await this.insertSnippetIntoEditor(snippet);
      })
    );

    // Command: Open modal to create new snippet
    const createSnippetHandler = async () => {
      await vscode.commands.executeCommand('myaz.sidebarView.focus');
      this.sidebarProvider.postMessage({
        type: 'OPEN_CREATE_SNIPPET_MODAL',
      });
    };
    disposables.push(
      vscode.commands.registerCommand('myaz.snippets.create', createSnippetHandler)
    );

    // Command: Open workspace storage file on device
    const openStorageHandler = async () => {
      await this.snippetService.openStorageFile();
    };
    disposables.push(
      vscode.commands.registerCommand('myaz.openStorageFile', openStorageHandler)
    );

    // Command: Export workspace data to single JSON file
    const exportHandler = async () => {
      await this.snippetService.exportToFile();
    };
    disposables.push(
      vscode.commands.registerCommand('myaz.exportData', exportHandler)
    );

    // Command: Import workspace data from JSON file
    const importHandler = async () => {
      const count = await this.snippetService.importFromFile();
      if (count > 0) {
        this.sidebarProvider.syncSnippets();
      }
    };
    disposables.push(
      vscode.commands.registerCommand('myaz.importData', importHandler)
    );

    // Command: Create snippet from current editor selection
    const createSelectionHandler = async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a file and select text to save as a snippet.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText.trim()) {
        vscode.window.showWarningMessage('Please select some text in the editor first.');
        return;
      }

      const languageId = editor.document.languageId;
      const lineCount = selection.end.line - selection.start.line + 1;
      const suggestedTitle = `Snippet (${lineCount} lines)`;

      // Focus sidebar
      await vscode.commands.executeCommand('myaz.sidebarView.focus');

      // Post message to webview to open create modal with pre-filled selection
      this.sidebarProvider.postMessage({
        type: 'OPEN_CREATE_SNIPPET_MODAL',
        payload: {
          title: suggestedTitle,
          body: selectedText,
          language: languageId,
          tags: [languageId],
        },
      });
    };

    disposables.push(
      vscode.commands.registerCommand('myaz.snippets.createFromSelection', createSelectionHandler)
    );

    return disposables;
  }

  public async insertSnippetIntoEditor(snippet: Snippet): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open a file editor where you want to insert this snippet.');
      return false;
    }

    const snippetString = new vscode.SnippetString(snippet.body);
    const success = await editor.insertSnippet(snippetString);
    if (success) {
      vscode.window.setStatusBarMessage(`Inserted "${snippet.title}"`, 2500);
    }
    return success;
  }
}
