import * as vscode from 'vscode';
import { SnippetService } from './modules/snippets/snippetService';
import { SnippetCommands } from './modules/snippets/snippetCommands';
import { ConverterService } from './modules/converters/converterService';
import { ConverterCommands } from './modules/converters/converterCommands';
import { PortService } from './modules/ports/portService';
import { PortCommands } from './modules/ports/portCommands';
import { SidebarWebviewProvider } from './providers/SidebarWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('myaz extension is now active!');

  // Initialize services
  const snippetService = new SnippetService(context);
  const converterService = new ConverterService(context);
  const portService = new PortService(context);

  // Initialize Sidebar Webview Provider
  const sidebarProvider = new SidebarWebviewProvider(context.extensionUri, snippetService);
  sidebarProvider.setConverterService(converterService);
  sidebarProvider.setPortService(portService);

  // Initialize and register commands
  const snippetCommands = new SnippetCommands(context, sidebarProvider, snippetService);
  sidebarProvider.setSnippetCommands(snippetCommands);

  const converterCommands = new ConverterCommands(converterService);
  const portCommands = new PortCommands(sidebarProvider);

  // Register Webview View Provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarWebviewProvider.viewType, sidebarProvider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    })
  );

  // Register all extension commands
  context.subscriptions.push(
    ...snippetCommands.registerCommands(),
    ...converterCommands.register(),
    ...portCommands.register()
  );

  // Command: Refresh Sidebar View
  const refreshHandler = () => {
    sidebarProvider.syncSnippets();
    vscode.window.setStatusBarMessage('Synced with storage', 2000);
  };
  context.subscriptions.push(
    vscode.commands.registerCommand('myaz.refresh', refreshHandler),
    vscode.commands.registerCommand('myaz.goHome', () => {
      sidebarProvider.postMessage({ type: 'NAVIGATE_HOME' });
    })
  );
}

export function deactivate() {
  console.log('myaz Extension deactivated.');
}
