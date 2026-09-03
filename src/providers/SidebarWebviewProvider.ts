import * as vscode from 'vscode';
import { HostToWebviewMessage, WebviewToHostMessage } from '../common/types';
import { SnippetService } from '../modules/snippets/snippetService';
import { SnippetCommands } from '../modules/snippets/snippetCommands';

export class SidebarWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'myaz.sidebarView';
  private _view?: vscode.WebviewView;
  private snippetCommands?: SnippetCommands;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly snippetService: SnippetService
  ) {}

  public setSnippetCommands(commands: SnippetCommands): void {
    this.snippetCommands = commands;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview React frontend
    webviewView.webview.onDidReceiveMessage(async (message: WebviewToHostMessage) => {
      await this.handleWebviewMessage(message);
    });

    // Notify webview of active editor language changes
    const editorChangeSub = vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && this._view) {
        this.postMessage({
          type: 'ACTIVE_EDITOR_LANGUAGE',
          payload: { languageId: editor.document.languageId },
        });
      }
    });

    webviewView.onDidDispose(() => {
      editorChangeSub.dispose();
      this._view = undefined;
    });
  }

  public postMessage(message: HostToWebviewMessage): void {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  public syncSnippets(): void {
    const snippets = this.snippetService.getAll();
    const storagePath = this.snippetService.getStorageFilePath();
    this.postMessage({
      type: 'SYNC_SNIPPETS',
      payload: { snippets, storagePath },
    });
  }

  private async handleWebviewMessage(message: WebviewToHostMessage): Promise<void> {
    switch (message.type) {
      case 'READY':
      case 'GET_SNIPPETS': {
        this.syncSnippets();
        if (vscode.window.activeTextEditor) {
          this.postMessage({
            type: 'ACTIVE_EDITOR_LANGUAGE',
            payload: { languageId: vscode.window.activeTextEditor.document.languageId },
          });
        }
        break;
      }

      case 'OPEN_STORAGE_FILE': {
        await this.snippetService.openStorageFile();
        break;
      }

      case 'EXPORT_SNIPPETS': {
        await this.snippetService.exportToFile();
        break;
      }

      case 'IMPORT_SNIPPETS': {
        const count = await this.snippetService.importFromFile();
        if (count > 0) {
          this.syncSnippets();
        }
        break;
      }

      case 'SAVE_SNIPPET': {
        const saved = this.snippetService.save(message.payload);
        this.syncSnippets();
        vscode.window.setStatusBarMessage(`myaz: Saved snippet "${saved.title}"`, 2500);
        break;
      }

      case 'DELETE_SNIPPET': {
        const confirmed = await vscode.window.showWarningMessage(
          'Are you sure you want to delete this snippet?',
          { modal: true },
          'Delete'
        );
        if (confirmed === 'Delete') {
          this.snippetService.delete(message.payload.id);
          this.syncSnippets();
          vscode.window.setStatusBarMessage('myaz: Snippet deleted', 2500);
        }
        break;
      }

      case 'TOGGLE_FAVORITE': {
        this.snippetService.toggleFavorite(message.payload.id);
        this.syncSnippets();
        break;
      }

      case 'INSERT_SNIPPET': {
        if (this.snippetCommands) {
          await this.snippetCommands.insertSnippetIntoEditor(message.payload.snippet);
        }
        break;
      }

      case 'COPY_SNIPPET': {
        await vscode.env.clipboard.writeText(message.payload.snippet.body);
        vscode.window.setStatusBarMessage(`myaz: Copied "${message.payload.snippet.title}" to clipboard`, 2500);
        break;
      }

      case 'SHOW_MESSAGE': {
        const { text, level } = message.payload;
        if (level === 'error') {
          vscode.window.showErrorMessage(text);
        } else if (level === 'warn') {
          vscode.window.showWarningMessage(text);
        } else {
          vscode.window.showInformationMessage(text);
        }
        break;
      }

      default:
        break;
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.css')
    );

    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src https://fonts.gstatic.com; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: https:;">
  <title>myaz: myaz workspace</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
