import * as vscode from 'vscode';
import { SidebarWebviewProvider } from '../../providers/SidebarWebviewProvider';

export class PortCommands {
  constructor(private readonly sidebarProvider: SidebarWebviewProvider) {}

  public register(): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    // Command: Focus sidebar on the Ports module and trigger a scan
    disposables.push(
      vscode.commands.registerCommand('myaz.scanPorts', async () => {
        await vscode.commands.executeCommand('myaz.sidebarView.focus');
        this.sidebarProvider.postMessage({
          type: 'ACTIVE_MODULE_CHANGED',
          payload: { moduleId: 'ports' },
        });
        this.sidebarProvider.postMessage({ type: 'SCAN_PORTS' } as any);
      })
    );

    return disposables;
  }
}
