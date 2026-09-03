import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { FileConversionRequest, FileConversionResult } from '../../common/converterTypes';

export class ConverterService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Execute conversion based on request
   */
  public async convert(req: FileConversionRequest): Promise<FileConversionResult> {
    const ext = (path.extname(req.fileName) || req.sourceFormat).toLowerCase().replace('.', '');
    const target = req.targetFormat.toLowerCase().replace('.', '');

    try {
      // 1. Documents conversions
      if (['docx', 'md', 'txt', 'html'].includes(ext) || ['pdf', 'md', 'html', 'txt'].includes(target)) {
        return await this.convertDocument(req, ext, target);
      }

      // 2. Spreadsheets & Tables
      if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
        return await this.convertSpreadsheet(req, ext, target);
      }

      // 3. Data & Config formats
      if (['json', 'yaml', 'yml', 'xml', 'env'].includes(ext)) {
        return await this.convertData(req, ext, target);
      }

      throw new Error(`Unsupported conversion from .${ext} to .${target}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        id: req.id,
        success: false,
        fileName: this.getTargetFileName(req.fileName, target),
        targetFormat: target,
        isBinary: false,
        mimeType: 'text/plain',
        sizeBytes: 0,
        error: msg,
      };
    }
  }

  /**
   * Convert Documents (DOCX, Markdown, Text, HTML to PDF, MD, HTML, TXT)
   */
  private async convertDocument(req: FileConversionRequest, ext: string, target: string): Promise<FileConversionResult> {
    const baseName = path.basename(req.fileName, path.extname(req.fileName));
    const targetFileName = `${baseName}.${target === 'markdown' ? 'md' : target}`;

    // Get input buffer & text
    let buffer: Buffer | null = null;
    let textContent = req.textData || '';

    if (req.dataBase64) {
      buffer = Buffer.from(req.dataBase64, 'base64');
      if (!textContent && ext !== 'docx') {
        textContent = buffer.toString('utf-8');
      }
    }

    // DOCX conversions via Mammoth
    if (ext === 'docx') {
      if (!buffer) throw new Error('DOCX conversion requires binary file data.');

      if (target === 'html') {
        const result = await mammoth.convertToHtml({ buffer });
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #24292e; }
    h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    table, th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
  </style>
</head>
<body>
${result.value}
</body>
</html>`;
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputText: html,
          isBinary: false,
          mimeType: 'text/html',
          sizeBytes: Buffer.byteLength(html, 'utf-8'),
        };
      }

      if (target === 'md' || target === 'markdown') {
        const result = await mammoth.extractRawText({ buffer });
        const markdown = `# ${baseName}\n\n${result.value}`;
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputText: markdown,
          isBinary: false,
          mimeType: 'text/markdown',
          sizeBytes: Buffer.byteLength(markdown, 'utf-8'),
        };
      }

      if (target === 'txt') {
        const result = await mammoth.extractRawText({ buffer });
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputText: result.value,
          isBinary: false,
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(result.value, 'utf-8'),
        };
      }

      if (target === 'pdf') {
        const result = await mammoth.extractRawText({ buffer });
        const pdfBase64 = this.createPdfFromText(baseName, result.value);
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputDataBase64: pdfBase64,
          isBinary: true,
          mimeType: 'application/pdf',
          sizeBytes: Math.round((pdfBase64.length * 3) / 4),
        };
      }
    }

    // Markdown conversions
    if (ext === 'md' || ext === 'markdown') {
      if (target === 'html') {
        const { marked } = await import('marked');
        const parsedBody = await marked.parse(textContent);
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 860px; margin: 40px auto; padding: 0 24px; color: #1f2328; }
    h1, h2, h3, h4 { border-bottom: 1px solid #d1d9e0; padding-bottom: 0.3em; margin-top: 24px; }
    code { background: rgba(175, 184, 193, 0.2); padding: 0.2em 0.4em; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace; font-size: 85%; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
    blockquote { border-left: 4px solid #d0d7de; padding: 0 1em; color: #656d76; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #d0d7de; padding: 6px 13px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
  </style>
</head>
<body>
${parsedBody}
</body>
</html>`;
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputText: html,
          isBinary: false,
          mimeType: 'text/html',
          sizeBytes: Buffer.byteLength(html, 'utf-8'),
        };
      }

      if (target === 'pdf') {
        const pdfBase64 = this.createPdfFromText(baseName, textContent);
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputDataBase64: pdfBase64,
          isBinary: true,
          mimeType: 'application/pdf',
          sizeBytes: Math.round((pdfBase64.length * 3) / 4),
        };
      }

      if (target === 'txt') {
        const stripped = textContent.replace(/[*#_`~\[\]]/g, '');
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputText: stripped,
          isBinary: false,
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(stripped, 'utf-8'),
        };
      }
    }

    // Plain Text (.txt) to PDF
    if (ext === 'txt' && target === 'pdf') {
      const pdfBase64 = this.createPdfFromText(baseName, textContent);
      return {
        id: req.id,
        success: true,
        fileName: targetFileName,
        targetFormat: target,
        outputDataBase64: pdfBase64,
        isBinary: true,
        mimeType: 'application/pdf',
        sizeBytes: Math.round((pdfBase64.length * 3) / 4),
      };
    }

    // HTML to Markdown
    if (ext === 'html' && (target === 'md' || target === 'markdown')) {
      const md = this.htmlToMarkdown(textContent);
      return {
        id: req.id,
        success: true,
        fileName: targetFileName,
        targetFormat: target,
        outputText: md,
        isBinary: false,
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(md, 'utf-8'),
      };
    }

    throw new Error(`Cannot convert .${ext} to .${target}`);
  }

  /**
   * Convert Spreadsheets (XLSX, XLS, CSV, TSV) to JSON, Markdown Table, HTML Table, CSV
   */
  private async convertSpreadsheet(req: FileConversionRequest, ext: string, target: string): Promise<FileConversionResult> {
    const baseName = path.basename(req.fileName, path.extname(req.fileName));
    const targetFileName = `${baseName}.${target === 'markdown-table' ? 'md' : target === 'html-table' ? 'html' : target}`;

    let buffer: Buffer;
    if (req.dataBase64) {
      buffer = Buffer.from(req.dataBase64, 'base64');
    } else if (req.textData) {
      buffer = Buffer.from(req.textData, 'utf-8');
    } else {
      throw new Error('No spreadsheet data provided.');
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`No readable sheet found in file.`);
    }

    // Convert to JSON array of rows
    const rows = (XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown) as unknown[][];
    if (!rows || rows.length === 0) {
      throw new Error('Spreadsheet is empty.');
    }

    // 1. Target: JSON
    if (target === 'json') {
      const objectRows = XLSX.utils.sheet_to_json(worksheet);
      const jsonStr = JSON.stringify(objectRows, null, 2);
      return {
        id: req.id,
        success: true,
        fileName: targetFileName,
        targetFormat: target,
        outputText: jsonStr,
        isBinary: false,
        mimeType: 'application/json',
        sizeBytes: Buffer.byteLength(jsonStr, 'utf-8'),
      };
    }

    // 2. Target: Markdown Table
    if (target === 'md' || target === 'markdown' || target === 'markdown-table') {
      const mdTable = this.rowsToMarkdownTable(rows);
      return {
        id: req.id,
        success: true,
        fileName: targetFileName,
        targetFormat: target,
        outputText: mdTable,
        isBinary: false,
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(mdTable, 'utf-8'),
      };
    }

    // 3. Target: HTML Table
    if (target === 'html' || target === 'html-table') {
      const htmlTable = XLSX.utils.sheet_to_html(worksheet);
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #d0d7de; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
    tr:nth-child(even) { background: #fafbfc; }
  </style>
</head>
<body>
  <h2>${sheetName}</h2>
  ${htmlTable}
</body>
</html>`;
      return {
        id: req.id,
        success: true,
        fileName: targetFileName,
        targetFormat: target,
        outputText: fullHtml,
        isBinary: false,
        mimeType: 'text/html',
        sizeBytes: Buffer.byteLength(fullHtml, 'utf-8'),
      };
    }

    // 4. Target: CSV
    if (target === 'csv') {
      const csvStr = XLSX.utils.sheet_to_csv(worksheet);
      return {
        id: req.id,
        success: true,
        fileName: targetFileName,
        targetFormat: target,
        outputText: csvStr,
        isBinary: false,
        mimeType: 'text/csv',
        sizeBytes: Buffer.byteLength(csvStr, 'utf-8'),
      };
    }

    throw new Error(`Unsupported target format .${target} for spreadsheet`);
  }

  /**
   * Convert Data & Config Formats (JSON, YAML, XML, .env)
   */
  private async convertData(req: FileConversionRequest, ext: string, target: string): Promise<FileConversionResult> {
    const baseName = path.basename(req.fileName, path.extname(req.fileName));
    const targetFileName = `${baseName}.${target === 'env' ? 'env' : target}`;

    let text = req.textData || '';
    if (!text && req.dataBase64) {
      text = Buffer.from(req.dataBase64, 'base64').toString('utf-8');
    }

    // Step 1: Parse input to JS Object
    let dataObj: Record<string, unknown> | unknown[];

    if (ext === 'json') {
      dataObj = JSON.parse(text);
    } else if (ext === 'yaml' || ext === 'yml') {
      dataObj = yaml.load(text) as Record<string, unknown>;
    } else if (ext === 'xml') {
      const parser = new XMLParser({ ignoreAttributes: false });
      dataObj = parser.parse(text);
    } else if (ext === 'env') {
      dataObj = this.parseEnv(text);
    } else {
      throw new Error(`Unsupported data source format .${ext}`);
    }

    // Step 2: Format to target
    let outputText = '';
    let mimeType = 'text/plain';

    if (target === 'json') {
      outputText = JSON.stringify(dataObj, null, req.options?.indent || 2);
      mimeType = 'application/json';
    } else if (target === 'yaml' || target === 'yml') {
      outputText = yaml.dump(dataObj, { indent: req.options?.indent || 2 });
      mimeType = 'application/x-yaml';
    } else if (target === 'xml') {
      const builder = new XMLBuilder({ format: true, ignoreAttributes: false });
      const wrapped = Array.isArray(dataObj) ? { root: { item: dataObj } } : (dataObj.root ? dataObj : { root: dataObj });
      outputText = `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(wrapped)}`;
      mimeType = 'application/xml';
    } else if (target === 'env') {
      outputText = this.stringifyEnv(dataObj as Record<string, unknown>);
      mimeType = 'text/plain';
    } else {
      throw new Error(`Unsupported data target format .${target}`);
    }

    return {
      id: req.id,
      success: true,
      fileName: targetFileName,
      targetFormat: target,
      outputText,
      isBinary: false,
      mimeType,
      sizeBytes: Buffer.byteLength(outputText, 'utf-8'),
    };
  }

  /**
   * Save converted file to disk via VS Code Save Dialog or Workspace
   */
  public async saveConvertedFile(
    defaultFileName: string,
    outputDataBase64?: string,
    outputText?: string,
    defaultDirectory?: string
  ): Promise<string | null> {
    const ext = path.extname(defaultFileName);
    const filterName = ext ? `${ext.toUpperCase().replace('.', '')} File` : 'All Files';

    const defaultUri = defaultDirectory
      ? vscode.Uri.file(path.join(defaultDirectory, defaultFileName))
      : vscode.workspace.workspaceFolders?.[0]
      ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, defaultFileName)
      : vscode.Uri.file(defaultFileName);

    const targetUri = await vscode.window.showSaveDialog({
      defaultUri,
      saveLabel: 'Save Converted File',
      filters: ext ? { [filterName]: [ext.replace('.', '')] } : undefined,
    });

    if (!targetUri) {
      return null;
    }

    let buffer: Buffer;
    if (outputDataBase64) {
      buffer = Buffer.from(outputDataBase64, 'base64');
    } else if (outputText !== undefined) {
      buffer = Buffer.from(outputText, 'utf-8');
    } else {
      throw new Error('No converted data provided to save.');
    }

    fs.writeFileSync(targetUri.fsPath, buffer);
    vscode.window.showInformationMessage(`Saved: ${path.basename(targetUri.fsPath)}`, 'Open File').then(action => {
      if (action === 'Open File') {
        vscode.commands.executeCommand('vscode.open', targetUri);
      }
    });

    return targetUri.fsPath;
  }

  // --- Helper Methods ---

  private getTargetFileName(original: string, targetExt: string): string {
    const base = path.basename(original, path.extname(original));
    return `${base}.${targetExt}`;
  }

  private createPdfFromText(title: string, text: string): string {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;

    // Header Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, margin, margin + 10);

    // Body Text with auto-wrapping
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10.5);
    const lineHeight = 16;
    let cursorY = margin + 40;

    const lines = doc.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }

    // Output Base64 string
    const output = doc.output('datauristring');
    // Strip data URI prefix: data:application/pdf;filename=...;base64,
    return output.split(',')[1] || '';
  }

  private rowsToMarkdownTable(rows: unknown[][]): string {
    if (rows.length === 0) return '';

    const headers = (rows[0] || []).map(cell => String(cell ?? '').trim());
    const separator = headers.map(() => '---');

    const mdRows = [
      `| ${headers.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
    ];

    for (let i = 1; i < rows.length; i++) {
      const rowCells = (rows[i] || []).map(cell => String(cell ?? '').replace(/\|/g, '\\|').trim());
      // Pad cells if row length is less than header
      while (rowCells.length < headers.length) {
        rowCells.push('');
      }
      mdRows.push(`| ${rowCells.slice(0, headers.length).join(' | ')} |`);
    }

    return mdRows.join('\n');
  }

  private htmlToMarkdown(html: string): string {
    return html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
      .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  private parseEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        let val = trimmed.slice(eqIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result[key] = val;
      }
    }

    return result;
  }

  private stringifyEnv(data: Record<string, unknown>): string {
    const lines: string[] = [];

    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'object' && val !== null) {
        lines.push(`${key}='${JSON.stringify(val)}'`);
      } else {
        lines.push(`${key}="${String(val ?? '')}"`);
      }
    }

    return lines.join('\n');
  }
}
