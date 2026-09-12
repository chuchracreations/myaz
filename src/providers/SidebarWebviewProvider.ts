import * as vscode from 'vscode';
import * as path from 'path';
import { HostToWebviewMessage, Screen, WebviewToHostMessage } from '../common/types';
import { SnippetService } from '../modules/snippets/snippetService';
import { SnippetCommands } from '../modules/snippets/snippetCommands';
import { ConverterService } from '../modules/converters/converterService';
import { PortService } from '../modules/ports/portService';

export class SidebarWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'myaz.sidebarView';
  private _view?: vscode.WebviewView;
  private snippetCommands?: SnippetCommands;
  private converterService?: ConverterService;
  private portService?: PortService;
  private currentScreen: Screen = 'home';

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly snippetService: SnippetService
  ) {}

  public setSnippetCommands(commands: SnippetCommands): void {
    this.snippetCommands = commands;
  }

  public setConverterService(service: ConverterService): void {
    this.converterService = service;
  }

  public setPortService(service: PortService): void {
    this.portService = service;
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
    this.applyScreenChrome(this.currentScreen);

    // Handle messages from the webview React frontend
    webviewView.webview.onDidReceiveMessage(async (message: WebviewToHostMessage) => {
      await this.handleWebviewMessage(message);
    });

    // Notify webview of active editor language changes
    const editorChangeSub = vscode.window.onDidChangeActiveTextEditor((editor) => {
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

  private applyScreenChrome(screen: Screen): void {
    this.currentScreen = screen;
    // Note: we deliberately don't set `this._view.title` here — VS Code renders a
    // custom WebviewView title as "<container title>: <view title>" for a single-view
    // container, which is exactly the "Myaz: ..." prefix we don't want. The context
    // key below only drives which view/title icons are visible.
    vscode.commands.executeCommand('setContext', 'myaz.screen', screen);
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
        vscode.window.setStatusBarMessage(`Saved snippet "${saved.title}"`, 2500);
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
          vscode.window.setStatusBarMessage('Snippet deleted', 2500);
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
        vscode.window.setStatusBarMessage(
          `Copied "${message.payload.snippet.title}" to clipboard`,
          2500
        );
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

      case 'CONVERT_FILE': {
        if (this.converterService) {
          const result = await this.converterService.convert((message as any).payload);
          this.postMessage({
            type: 'CONVERT_FILE_RESULT',
            payload: result,
          } as any);
        }
        break;
      }

      case 'PICK_CONVERT_FILE': {
        // Opened via the native file dialog (not the webview's sandboxed <input type="file">)
        // specifically so we get a real filesystem path — that's what "Replace original file
        // on disk" needs, and a browser File object picked inside the webview can never carry one.
        const uris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: true,
          openLabel: 'Select File(s) to Convert',
        });

        if (uris && uris.length > 0) {
          const files = await Promise.all(
            uris.map(async (uri) => {
              const bytes = await vscode.workspace.fs.readFile(uri);
              return {
                fileName: path.basename(uri.fsPath),
                dataBase64: Buffer.from(bytes).toString('base64'),
                originalPath: uri.fsPath,
              };
            })
          );

          this.postMessage({
            type: 'CONVERT_FILE_PICKED',
            payload: { files },
          });
        }
        break;
      }

      case 'CONVERT_TEXT': {
        if (this.converterService) {
          const { text, sourceFormat, targetFormat } = (message as any).payload;
          const result = await this.converterService.convert({
            id: String(Date.now()),
            fileName: `scratchpad.${sourceFormat}`,
            sourceFormat,
            targetFormat,
            textData: text,
          });
          this.postMessage({
            type: 'CONVERT_TEXT_RESULT',
            payload: result,
          } as any);
        }
        break;
      }

      case 'SAVE_CONVERTED_FILE': {
        if (this.converterService) {
          const { fileName, outputDataBase64, outputText, originalPath } = (message as any).payload;
          await this.converterService.saveConvertedFile(
            fileName,
            outputDataBase64,
            outputText,
            undefined,
            originalPath
          );
        }
        break;
      }

      case 'SAVE_BATCH_FILES': {
        if (this.converterService) {
          const { items } = (message as any).payload;
          await this.converterService.saveBatchFiles(items);
        }
        break;
      }

      case 'SAVE_BATCH_ZIP': {
        if (this.converterService) {
          const { zipFileName, items } = (message as any).payload;
          await this.converterService.saveBatchAsZip(zipFileName, items);
        }
        break;
      }

      case 'SCAN_PORTS': {
        if (this.portService) {
          const customPort = message.payload?.customPort;
          const { ports, detectedProjectPorts } = await this.portService.scanPorts(customPort);
          this.postMessage({
            type: 'PORT_SCAN_RESULTS',
            payload: { ports, detectedProjectPorts },
          });
        }
        break;
      }

      case 'SCREEN_CHANGED': {
        this.applyScreenChrome(message.payload.screen);
        break;
      }

      case 'KILL_PORT_PROCESS': {
        if (this.portService) {
          const { pid, port } = message.payload;
          const res = await this.portService.killProcess(pid);
          this.postMessage({
            type: 'PORT_KILLED_RESULT',
            payload: { success: res.success, pid, port, error: res.error },
          });

          // Automatically trigger a fresh scan after killing
          if (res.success) {
            const { ports, detectedProjectPorts } = await this.portService.scanPorts();
            this.postMessage({
              type: 'PORT_SCAN_RESULTS',
              payload: { ports, detectedProjectPorts },
            });
          }
        }
        break;
      }

      case 'KILL_ALL_PORTS': {
        if (this.portService) {
          const { pids } = message.payload;
          const confirmed = await vscode.window.showWarningMessage(
            `Kill ${pids.length} process${pids.length === 1 ? '' : 'es'} and free their ports?`,
            { modal: true },
            'Kill All'
          );

          if (confirmed !== 'Kill All') {
            this.postMessage({
              type: 'PORT_KILL_ALL_RESULT',
              payload: { killedCount: 0, failedCount: 0, cancelled: true },
            });
            break;
          }

          const results = await Promise.all(pids.map((pid) => this.portService!.killProcess(pid)));
          const killedCount = results.filter((r) => r.success).length;
          const failedCount = results.length - killedCount;

          this.postMessage({
            type: 'PORT_KILL_ALL_RESULT',
            payload: { killedCount, failedCount },
          });

          const { ports, detectedProjectPorts } = await this.portService.scanPorts();
          this.postMessage({
            type: 'PORT_SCAN_RESULTS',
            payload: { ports, detectedProjectPorts },
          });
        }
        break;
      }

      case 'START_PORT': {
        if (this.portService) {
          const { port } = message.payload;
          const res = await this.portService.startPort(port);
          this.postMessage({
            type: 'PORT_START_RESULT',
            payload: { port, success: res.success, message: res.message },
          });

          if (res.success) {
            this.pollForPortReady(port);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  /**
   * After launching a dev server, its port isn't live immediately — poll for
   * it in the background and push a fresh scan to the webview once it comes
   * up, so the list updates without the user having to hit Scan manually.
   */
  private pollForPortReady(port: number, attempt = 0): void {
    const maxAttempts = 20; // ~20s at 1s intervals

    setTimeout(async () => {
      if (!this.portService) return;

      const isLive = await this.portService.isPortListening(port);
      if (isLive) {
        const { ports, detectedProjectPorts } = await this.portService.scanPorts();
        this.postMessage({
          type: 'PORT_SCAN_RESULTS',
          payload: { ports, detectedProjectPorts },
        });
        return;
      }

      if (attempt + 1 < maxAttempts) {
        this.pollForPortReady(port, attempt + 1);
      }
    }, 1000);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.css')
    );
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'icon-activitybar.png')
    );

    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src https://fonts.gstatic.com; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: https:;">
  <title>myaz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${styleUri}">
  <script nonce="${nonce}">
    window.__LOGO_URI__ = "${logoUri}";
  </script>
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
