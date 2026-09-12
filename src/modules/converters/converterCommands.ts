import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConverterService } from './converterService';

export class ConverterCommands {
  constructor(private readonly converterService: ConverterService) {}

  public register(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    // Right-click in explorer: Convert file
    disposables.push(
      vscode.commands.registerCommand('myaz.convertFile', async (uri?: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) {
          vscode.window.showInformationMessage('Right-click a file in the explorer to convert it.');
          return;
        }

        await this.handleExplorerConvert(targetUri);
      })
    );

    return disposables;
  }

  private async handleExplorerConvert(fileUri: vscode.Uri): Promise<void> {
    const filePath = fileUri.fsPath;
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const baseName = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);

    // Map extension to available conversion targets
    const targets = this.getAvailableTargets(ext);
    if (!targets || targets.length === 0) {
      vscode.window.showWarningMessage(`myaz does not support converting .${ext} files yet.`);
      return;
    }

    // Show QuickPick
    const selected = await vscode.window.showQuickPick(
      targets.map(t => ({
        label: t.label,
        description: `➔ .${t.ext}`,
        targetFormat: t.format,
        targetExt: t.ext,
      })),
      {
        placeHolder: `Select target format to convert "${path.basename(filePath)}"`,
      }
    );

    if (!selected) return;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Converting ${path.basename(filePath)} to .${selected.targetExt}...`,
        cancellable: false,
      },
      async () => {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const isText = ['md', 'txt', 'html', 'json', 'yaml', 'yml', 'xml', 'env', 'csv', 'tsv'].includes(ext);

          const result = await this.converterService.convert({
            id: String(Date.now()),
            fileName: path.basename(filePath),
            sourceFormat: ext,
            targetFormat: selected.targetFormat,
            textData: isText ? fileBuffer.toString('utf-8') : undefined,
            dataBase64: !isText ? fileBuffer.toString('base64') : undefined,
          });

          if (!result.success) {
            vscode.window.showErrorMessage(`Conversion failed: ${result.error}`);
            return;
          }

          // Write converted file in same directory
          const outFilePath = path.join(dir, `${baseName}.${selected.targetExt}`);
          let outBuffer: Buffer;

          if (result.outputDataBase64) {
            outBuffer = Buffer.from(result.outputDataBase64, 'base64');
          } else if (result.outputText !== undefined) {
            outBuffer = Buffer.from(result.outputText, 'utf-8');
          } else {
            throw new Error('No output generated');
          }

          fs.writeFileSync(outFilePath, outBuffer);

          const action = await vscode.window.showInformationMessage(
            `Converted: ${path.basename(outFilePath)}`,
            'Open File'
          );
          if (action === 'Open File') {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(outFilePath));
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Conversion error: ${msg}`);
        }
      }
    );
  }

  private getAvailableTargets(ext: string): { format: string; label: string; ext: string }[] | null {
    switch (ext) {
      case 'docx':
        return [
          { format: 'pdf', label: 'PDF Document', ext: 'pdf' },
          { format: 'md', label: 'Markdown', ext: 'md' },
          { format: 'html', label: 'HTML Web Page', ext: 'html' },
          { format: 'txt', label: 'Plain Text', ext: 'txt' },
        ];
      case 'md':
      case 'markdown':
        return [
          { format: 'pdf', label: 'PDF Document', ext: 'pdf' },
          { format: 'html', label: 'Styled HTML', ext: 'html' },
          { format: 'txt', label: 'Plain Text', ext: 'txt' },
        ];
      case 'txt':
        return [{ format: 'pdf', label: 'PDF Document', ext: 'pdf' }];
      case 'html':
      case 'htm':
        return [
          { format: 'pdf', label: 'PDF Document', ext: 'pdf' },
          { format: 'md', label: 'Markdown', ext: 'md' },
          { format: 'txt', label: 'Plain Text', ext: 'txt' },
        ];
      case 'xlsx':
      case 'xls':
        return [
          { format: 'json', label: 'JSON Array', ext: 'json' },
          { format: 'md', label: 'Markdown Table', ext: 'md' },
          { format: 'html', label: 'HTML Table', ext: 'html' },
          { format: 'csv', label: 'CSV File', ext: 'csv' },
        ];
      case 'csv':
      case 'tsv':
        return [
          { format: 'json', label: 'JSON Array', ext: 'json' },
          { format: 'md', label: 'Markdown Table', ext: 'md' },
          { format: 'html', label: 'HTML Table', ext: 'html' },
        ];
      case 'json':
        return [
          { format: 'yaml', label: 'YAML', ext: 'yaml' },
          { format: 'xml', label: 'XML', ext: 'xml' },
          { format: 'env', label: '.ENV file', ext: 'env' },
        ];
      case 'yaml':
      case 'yml':
        return [
          { format: 'json', label: 'JSON', ext: 'json' },
          { format: 'xml', label: 'XML', ext: 'xml' },
        ];
      case 'xml':
        return [
          { format: 'json', label: 'JSON', ext: 'json' },
          { format: 'yaml', label: 'YAML', ext: 'yaml' },
        ];
      case 'env':
        return [
          { format: 'json', label: 'JSON', ext: 'json' },
          { format: 'yaml', label: 'YAML', ext: 'yaml' },
        ];
      default:
        return null;
    }
  }
}
