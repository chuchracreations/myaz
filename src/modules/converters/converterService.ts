import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import JSZip from 'jszip';
import * as zlib from 'zlib';
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
      // 1. Spreadsheets & Tables (checked first: unambiguous by source extension, and their
      // targets like "md"/"html" would otherwise collide with the document branch below)
      if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
        return await this.convertSpreadsheet(req, ext, target);
      }

      // 2. Data & Config formats (also unambiguous by source extension)
      if (['json', 'yaml', 'yml', 'xml', 'env'].includes(ext)) {
        return await this.convertData(req, ext, target);
      }

      // 3. Documents & PDF conversions
      if (['docx', 'md', 'txt', 'html', 'pdf'].includes(ext) || ['pdf', 'md', 'html', 'txt', 'slide-deck', 'slides'].includes(target)) {
        return await this.convertDocument(req, ext, target);
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
   * Convert Documents (DOCX, Markdown, Text, HTML, PDF to PDF, MD, HTML, TXT, Slide-Deck)
   */
  private async convertDocument(req: FileConversionRequest, ext: string, target: string): Promise<FileConversionResult> {
    const baseName = path.basename(req.fileName, path.extname(req.fileName));
    const targetExt = target === 'markdown' ? 'md' : target === 'slide-deck' || target === 'slides' ? 'html' : target;
    const targetFileName = `${baseName}.${targetExt}`;

    // Get input buffer & text
    let buffer: Buffer | null = null;
    let textContent = req.textData || '';

    if (req.dataBase64) {
      buffer = Buffer.from(req.dataBase64, 'base64');
      if (!textContent && ext !== 'docx' && ext !== 'pdf') {
        textContent = buffer.toString('utf-8');
      }
    }

    // 1. PDF Extractor (PDF ➔ Markdown, Plain Text)
    if (ext === 'pdf') {
      if (!buffer) throw new Error('PDF extraction requires binary file data.');

      const { totalPages, markdown, text } = this.parsePdfBuffer(buffer);

      if (target === 'md' || target === 'markdown') {
        const md = `# Extracted Content: ${baseName}\n\n*Source: ${req.fileName} • Pages: ${totalPages}*\n\n---\n\n${markdown.trim()}`;
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

      if (target === 'txt') {
        return {
          id: req.id,
          success: true,
          fileName: targetFileName,
          targetFormat: target,
          outputText: text.trim(),
          isBinary: false,
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(text, 'utf-8'),
        };
      }

      throw new Error(`Cannot convert PDF to .${target}. Supported targets: Markdown (.md) or Plain Text (.txt)`);
    }

    // 2. DOCX conversions via Mammoth
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

    // 3. Markdown conversions
    if (ext === 'md' || ext === 'markdown') {
      // 3.1 Markdown to Slide Deck (HTML Presentation)
      if (target === 'slide-deck' || target === 'slides') {
        const slideDeckHtml = await this.generateSlideDeck(baseName, textContent);
        return {
          id: req.id,
          success: true,
          fileName: `${baseName}.slides.html`,
          targetFormat: 'html',
          outputText: slideDeckHtml,
          isBinary: false,
          mimeType: 'text/html',
          sizeBytes: Buffer.byteLength(slideDeckHtml, 'utf-8'),
        };
      }

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

    // 4. Plain Text (.txt) to PDF
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

    // 5. HTML to Markdown
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
   * Save converted file to disk via VS Code Save Dialog. When the source file's original
   * path is known, the save dialog defaults to that same folder for convenience.
   */
  public async saveConvertedFile(
    defaultFileName: string,
    outputDataBase64?: string,
    outputText?: string,
    defaultDirectory?: string,
    originalPath?: string
  ): Promise<string | null> {
    const ext = path.extname(defaultFileName);
    const filterName = ext ? `${ext.toUpperCase().replace('.', '')} File` : 'All Files';

    const defaultUri = defaultDirectory
      ? vscode.Uri.file(path.join(defaultDirectory, defaultFileName))
      : originalPath
      ? vscode.Uri.file(path.join(path.dirname(originalPath), defaultFileName))
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

  /**
   * Save multiple batch converted files to a selected folder
   */
  public async saveBatchFiles(
    items: { fileName: string; outputDataBase64?: string; outputText?: string }[]
  ): Promise<{ savedCount: number; destinationDir: string } | null> {
    const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;
    const folderUri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri,
      openLabel: 'Select Output Destination Folder',
    });

    if (!folderUri || folderUri.length === 0) {
      return null;
    }

    const targetDir = folderUri[0].fsPath;
    let count = 0;

    for (const item of items) {
      try {
        const filePath = path.join(targetDir, item.fileName);
        let buf: Buffer;
        if (item.outputDataBase64) {
          buf = Buffer.from(item.outputDataBase64, 'base64');
        } else if (item.outputText !== undefined) {
          buf = Buffer.from(item.outputText, 'utf-8');
        } else {
          continue;
        }

        fs.writeFileSync(filePath, buf);
        count++;
      } catch (err: unknown) {
        console.error(`Failed to save batch item ${item.fileName}:`, err);
      }
    }

    vscode.window.showInformationMessage(`Batch complete: Saved ${count} files to ${path.basename(targetDir)}`);
    return { savedCount: count, destinationDir: targetDir };
  }

  /**
   * Package multiple batch files into a single .ZIP archive
   */
  public async saveBatchAsZip(
    zipFileName: string,
    items: { fileName: string; outputDataBase64?: string; outputText?: string }[]
  ): Promise<string | null> {
    const zip = new JSZip();

    for (const item of items) {
      if (item.outputDataBase64) {
        zip.file(item.fileName, Buffer.from(item.outputDataBase64, 'base64'));
      } else if (item.outputText !== undefined) {
        zip.file(item.fileName, item.outputText);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const defaultUri = vscode.workspace.workspaceFolders?.[0]
      ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, zipFileName)
      : vscode.Uri.file(zipFileName);

    const targetUri = await vscode.window.showSaveDialog({
      defaultUri,
      saveLabel: 'Save ZIP Archive',
      filters: { 'ZIP Archive': ['zip'] },
    });

    if (!targetUri) return null;

    fs.writeFileSync(targetUri.fsPath, zipBuffer);
    vscode.window.showInformationMessage(`Exported ZIP: ${path.basename(targetUri.fsPath)}`);
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

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, margin, margin + 10);

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

    const output = doc.output('datauristring');
    return output.split(',')[1] || '';
  }

  /**
   * Generate an interactive, standalone HTML slide deck presentation from Markdown
   */
  private async generateSlideDeck(title: string, markdown: string): Promise<string> {
    const { marked } = await import('marked');

    // Split markdown by slide separators: '---' or '___'
    const rawSlides = markdown
      .split(/\n---\n|\n___\n/)
      .map(s => s.trim())
      .filter(Boolean);

    const slideContents: string[] = [];
    for (const raw of rawSlides) {
      slideContents.push(await marked.parse(raw));
    }

    const total = slideContents.length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Slide Deck</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(255, 255, 255, 0.04);
      --accent: #0078d4;
      --accent-glow: rgba(0, 120, 212, 0.35);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      user-select: none;
    }
    .deck-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 40px;
    }
    .slide {
      display: none;
      width: 100%;
      max-width: 900px;
      min-height: 480px;
      max-height: 80vh;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 48px;
      overflow-y: auto;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .slide.active { display: block; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    h1 { font-size: 2.4em; font-weight: 800; margin-bottom: 0.5em; color: #ffffff; }
    h2 { font-size: 1.8em; font-weight: 700; margin-bottom: 0.4em; color: var(--accent); }
    h3 { font-size: 1.3em; margin-bottom: 0.4em; }
    p, li { font-size: 1.1em; line-height: 1.65; color: var(--text); margin-bottom: 0.8em; }
    ul, ol { padding-left: 1.5em; margin-bottom: 1em; }
    code {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.2em 0.4em;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 0.9em;
    }
    pre {
      background: #030712;
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 1em;
    }
    pre code { background: transparent; padding: 0; }
    /* Bottom Controls */
    .deck-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 28px;
      background: rgba(0, 0, 0, 0.4);
      border-top: 1px solid var(--border);
    }
    .controls-nav { display: flex; gap: 8px; }
    .control-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .control-btn:hover { background: var(--accent); color: #fff; }
    .slide-counter { font-size: 13px; font-weight: 700; color: var(--text-muted); }
    .progress-bar-track { width: 100%; height: 3px; background: var(--border); }
    .progress-bar-fill { height: 100%; background: var(--accent); transition: width 0.25s ease; }
  </style>
</head>
<body>
  <div class="progress-bar-track">
    <div id="progress" class="progress-bar-fill" style="width: ${(1 / total) * 100}%"></div>
  </div>

  <main class="deck-container">
    ${slideContents
      .map(
        (html, idx) => `
    <section class="slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
      ${html}
    </section>`
      )
      .join('\n')}
  </main>

  <footer class="deck-controls">
    <div class="controls-nav">
      <button class="control-btn" onclick="prevSlide()">❮ Prev</button>
      <button class="control-btn" onclick="nextSlide()">Next ❯</button>
      <button class="control-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
    </div>
    <div id="counter" class="slide-counter">Slide 1 / ${total}</div>
  </footer>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;
    const counter = document.getElementById('counter');
    const progress = document.getElementById('progress');

    function update() {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
      counter.textContent = 'Slide ' + (current + 1) + ' / ' + total;
      progress.style.width = ((current + 1) / total * 100) + '%';
    }

    function nextSlide() {
      if (current < total - 1) { current++; update(); }
    }

    function prevSlide() {
      if (current > 0) { current--; update(); }
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextSlide();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'Home') { current = 0; update(); }
      else if (e.key === 'End') { current = total - 1; update(); }
    });
  </script>
</body>
</html>`;
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

  private cleanPdfString(raw: string): string {
    return raw
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  private parsePdfBuffer(buffer: Buffer): { totalPages: number; markdown: string; text: string } {
    const binaryStr = buffer.toString('binary');
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;
    const extractedLines: string[] = [];

    while ((match = streamRegex.exec(binaryStr)) !== null) {
      const streamContent = match[1];
      let decompressed = '';
      try {
        decompressed = zlib.inflateSync(Buffer.from(streamContent, 'binary')).toString('latin1');
      } catch {
        try {
          decompressed = zlib.inflateRawSync(Buffer.from(streamContent, 'binary')).toString('latin1');
        } catch {
          decompressed = streamContent;
        }
      }

      // 1. Literal strings: (text) Tj
      const tjRegex = /\(([\s\S]*?)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
        const t = this.cleanPdfString(tjMatch[1]);
        if (t.trim()) extractedLines.push(t.trim());
      }

      // 2. String array: [(t1) 120 (t2)] TJ
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let tjaMatch: RegExpExecArray | null;
      while ((tjaMatch = tjArrayRegex.exec(decompressed)) !== null) {
        const inner = tjaMatch[1];
        const strParts = [...inner.matchAll(/\(([\s\S]*?)\)/g)].map(m => this.cleanPdfString(m[1]));
        const combined = strParts.join('').trim();
        if (combined) extractedLines.push(combined);
      }

      // 3. Hex strings: <48656c6c6f> Tj
      const hexRegex = /<([0-9a-fA-F\s]+)>\s*Tj/g;
      let hexMatch: RegExpExecArray | null;
      while ((hexMatch = hexRegex.exec(decompressed)) !== null) {
        const hex = hexMatch[1].replace(/\s+/g, '');
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        if (decoded.trim()) extractedLines.push(decoded.trim());
      }
    }

    const pageMatches = binaryStr.match(/\/Type\s*\/Page\b/g);
    const totalPages = pageMatches ? pageMatches.length : 1;
    const cleanedLines = extractedLines.filter(l => l.trim().length > 0);

    return {
      totalPages,
      text: cleanedLines.join('\n'),
      markdown: cleanedLines.join('\n\n'),
    };
  }
}
