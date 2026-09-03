import * as vscode from 'vscode';
import { SnippetService } from './modules/snippets/snippetService';
import { SnippetCommands } from './modules/snippets/snippetCommands';
import { SidebarWebviewProvider } from './providers/SidebarWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Coders Canvas extension is now active!');

  // Initialize services
  const snippetService = new SnippetService(context);

  // Initialize Sidebar Webview Provider
  const sidebarProvider = new SidebarWebviewProvider(context.extensionUri, snippetService);

  // Initialize and register commands
  const snippetCommands = new SnippetCommands(context, sidebarProvider, snippetService);
  sidebarProvider.setSnippetCommands(snippetCommands);

  // Register Webview View Provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarWebviewProvider.viewType,
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  // Register all extension commands
  context.subscriptions.push(...snippetCommands.registerCommands());

  // Command: Refresh Sidebar View
  const refreshHandler = () => {
    sidebarProvider.syncSnippets();
    vscode.window.setStatusBarMessage('Coders Canvas: Synced with storage', 2000);
  };
  context.subscriptions.push(
    vscode.commands.registerCommand('coders-canvas.refresh', refreshHandler),
    vscode.commands.registerCommand('myaz.refresh', refreshHandler)
  );
}

export function deactivate() {
  console.log('Coders Canvas Extension deactivated.');
}
