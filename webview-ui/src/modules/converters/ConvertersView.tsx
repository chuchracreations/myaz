import React, { useState, useMemo, useEffect } from 'react';
import { vscode } from '../../vscodeApi';
import { convertImage, ConvertedImageResult, MultiResPngItem } from './imageConverter';
import {
  FileUp,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Braces,
  FileCode,
  FolderOpen,
  ArrowRight,
  X,
  RotateCcw,
  Archive,
  ShieldCheck,
} from 'lucide-react';

interface ConversionTarget {
  format: string;
  label: string;
  ext: string;
  isBinary: boolean;
  badge: string;
  shortLabel: string;
  desc: string;
}

interface ConversionPreset {
  sourceExts: string[];
  category: 'images' | 'documents' | 'spreadsheets' | 'data';
  targets: ConversionTarget[];
}

const PRESETS: Record<string, ConversionPreset> = {
  // SVG Vector Suite
  svg: {
    sourceExts: ['svg'],
    category: 'images',
    targets: [
      { format: 'multi-res-png', label: 'Multi-Res PNG Bundle (16px-512px)', ext: 'zip', isBinary: true, badge: 'ZIP', shortLabel: 'Icon Pack', desc: '16px–512px bundle' },
      { format: 'png', label: 'PNG (Rasterized)', ext: 'png', isBinary: true, badge: 'PNG', shortLabel: 'PNG', desc: 'Rasterized' },
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true, badge: 'WEBP', shortLabel: 'WebP', desc: 'Compressed' },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true, badge: 'ICO', shortLabel: 'Favicon', desc: '.ico for apps' },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false, badge: 'B64', shortLabel: 'Base64', desc: 'Data URI string' },
    ],
  },
  // Images
  png: {
    sourceExts: ['png'],
    category: 'images',
    targets: [
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true, badge: 'WEBP', shortLabel: 'WebP', desc: 'Compressed' },
      { format: 'jpg', label: 'JPEG (.jpg)', ext: 'jpg', isBinary: true, badge: 'JPG', shortLabel: 'JPEG', desc: 'Lossy compressed' },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true, badge: 'ICO', shortLabel: 'Favicon', desc: '.ico for apps' },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false, badge: 'B64', shortLabel: 'Base64', desc: 'Data URI string' },
    ],
  },
  jpg: {
    sourceExts: ['jpg', 'jpeg'],
    category: 'images',
    targets: [
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true, badge: 'WEBP', shortLabel: 'WebP', desc: 'Compressed' },
      { format: 'png', label: 'PNG (Lossless)', ext: 'png', isBinary: true, badge: 'PNG', shortLabel: 'PNG', desc: 'Lossless' },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true, badge: 'ICO', shortLabel: 'Favicon', desc: '.ico for apps' },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false, badge: 'B64', shortLabel: 'Base64', desc: 'Data URI string' },
    ],
  },
  jpeg: {
    sourceExts: ['jpeg'],
    category: 'images',
    targets: [
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true, badge: 'WEBP', shortLabel: 'WebP', desc: 'Compressed' },
      { format: 'png', label: 'PNG', ext: 'png', isBinary: true, badge: 'PNG', shortLabel: 'PNG', desc: 'Lossless' },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true, badge: 'ICO', shortLabel: 'Favicon', desc: '.ico for apps' },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false, badge: 'B64', shortLabel: 'Base64', desc: 'Data URI string' },
    ],
  },
  webp: {
    sourceExts: ['webp'],
    category: 'images',
    targets: [
      { format: 'png', label: 'PNG (Lossless)', ext: 'png', isBinary: true, badge: 'PNG', shortLabel: 'PNG', desc: 'Lossless' },
      { format: 'jpg', label: 'JPEG (.jpg)', ext: 'jpg', isBinary: true, badge: 'JPG', shortLabel: 'JPEG', desc: 'Lossy compressed' },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true, badge: 'ICO', shortLabel: 'Favicon', desc: '.ico for apps' },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false, badge: 'B64', shortLabel: 'Base64', desc: 'Data URI string' },
    ],
  },
  // PDF Document Extractor
  pdf: {
    sourceExts: ['pdf'],
    category: 'documents',
    targets: [
      { format: 'md', label: 'Markdown (.md) - Text & Headings', ext: 'md', isBinary: false, badge: 'MD', shortLabel: 'Markdown', desc: 'Text & headings' },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false, badge: 'TXT', shortLabel: 'Plain Text', desc: 'Raw text only' },
    ],
  },
  // Markdown Suite
  md: {
    sourceExts: ['md', 'markdown'],
    category: 'documents',
    targets: [
      { format: 'slide-deck', label: 'Interactive Slide Deck (.html)', ext: 'slides.html', isBinary: false, badge: 'DECK', shortLabel: 'Slide Deck', desc: 'Interactive presentation' },
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true, badge: 'PDF', shortLabel: 'PDF', desc: 'Print-ready document' },
      { format: 'html', label: 'Styled Web Page (.html)', ext: 'html', isBinary: false, badge: 'HTML', shortLabel: 'Web Page', desc: 'Styled HTML' },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false, badge: 'TXT', shortLabel: 'Plain Text', desc: 'Strip formatting' },
    ],
  },
  // Documents
  docx: {
    sourceExts: ['docx'],
    category: 'documents',
    targets: [
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true, badge: 'PDF', shortLabel: 'PDF', desc: 'Print-ready document' },
      { format: 'md', label: 'Markdown (.md)', ext: 'md', isBinary: false, badge: 'MD', shortLabel: 'Markdown', desc: 'Text & headings' },
      { format: 'html', label: 'HTML Web Page (.html)', ext: 'html', isBinary: false, badge: 'HTML', shortLabel: 'Web Page', desc: 'Styled HTML' },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false, badge: 'TXT', shortLabel: 'Plain Text', desc: 'Strip formatting' },
    ],
  },
  txt: {
    sourceExts: ['txt'],
    category: 'documents',
    targets: [
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true, badge: 'PDF', shortLabel: 'PDF', desc: 'Print-ready document' },
    ],
  },
  html: {
    sourceExts: ['html', 'htm'],
    category: 'documents',
    targets: [
      { format: 'md', label: 'Markdown (.md)', ext: 'md', isBinary: false, badge: 'MD', shortLabel: 'Markdown', desc: 'Text & headings' },
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true, badge: 'PDF', shortLabel: 'PDF', desc: 'Print-ready document' },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false, badge: 'TXT', shortLabel: 'Plain Text', desc: 'Strip formatting' },
    ],
  },
  // Spreadsheets
  xlsx: {
    sourceExts: ['xlsx', 'xls'],
    category: 'spreadsheets',
    targets: [
      { format: 'json', label: 'JSON Array (.json)', ext: 'json', isBinary: false, badge: 'JSON', shortLabel: 'JSON', desc: 'Array of rows' },
      { format: 'md', label: 'Markdown Table (.md)', ext: 'md', isBinary: false, badge: 'MD', shortLabel: 'Markdown', desc: 'Table format' },
      { format: 'html', label: 'HTML Table (.html)', ext: 'html', isBinary: false, badge: 'HTML', shortLabel: 'HTML Table', desc: 'Styled table' },
      { format: 'csv', label: 'CSV File (.csv)', ext: 'csv', isBinary: false, badge: 'CSV', shortLabel: 'CSV', desc: 'Comma-separated' },
    ],
  },
  csv: {
    sourceExts: ['csv', 'tsv'],
    category: 'spreadsheets',
    targets: [
      { format: 'json', label: 'JSON Array (.json)', ext: 'json', isBinary: false, badge: 'JSON', shortLabel: 'JSON', desc: 'Array of rows' },
      { format: 'md', label: 'Markdown Table (.md)', ext: 'md', isBinary: false, badge: 'MD', shortLabel: 'Markdown', desc: 'Table format' },
      { format: 'html', label: 'HTML Table (.html)', ext: 'html', isBinary: false, badge: 'HTML', shortLabel: 'HTML Table', desc: 'Styled table' },
    ],
  },
  // Data & Config
  json: {
    sourceExts: ['json'],
    category: 'data',
    targets: [
      { format: 'yaml', label: 'YAML (.yaml)', ext: 'yaml', isBinary: false, badge: 'YAML', shortLabel: 'YAML', desc: 'Human-readable config' },
      { format: 'xml', label: 'XML (.xml)', ext: 'xml', isBinary: false, badge: 'XML', shortLabel: 'XML', desc: 'Markup format' },
      { format: 'env', label: 'Environment (.env)', ext: 'env', isBinary: false, badge: 'ENV', shortLabel: '.env', desc: 'Key=value pairs' },
    ],
  },
  yaml: {
    sourceExts: ['yaml', 'yml'],
    category: 'data',
    targets: [
      { format: 'json', label: 'JSON (.json)', ext: 'json', isBinary: false, badge: 'JSON', shortLabel: 'JSON', desc: 'Structured data' },
      { format: 'xml', label: 'XML (.xml)', ext: 'xml', isBinary: false, badge: 'XML', shortLabel: 'XML', desc: 'Markup format' },
    ],
  },
  xml: {
    sourceExts: ['xml'],
    category: 'data',
    targets: [
      { format: 'json', label: 'JSON (.json)', ext: 'json', isBinary: false, badge: 'JSON', shortLabel: 'JSON', desc: 'Structured data' },
      { format: 'yaml', label: 'YAML (.yaml)', ext: 'yaml', isBinary: false, badge: 'YAML', shortLabel: 'YAML', desc: 'Human-readable config' },
    ],
  },
  env: {
    sourceExts: ['env'],
    category: 'data',
    targets: [
      { format: 'json', label: 'JSON (.json)', ext: 'json', isBinary: false, badge: 'JSON', shortLabel: 'JSON', desc: 'Structured data' },
      { format: 'yaml', label: 'YAML (.yaml)', ext: 'yaml', isBinary: false, badge: 'YAML', shortLabel: 'YAML', desc: 'Human-readable config' },
    ],
  },
};

// Capability overview shown on the landing state, derived directly from PRESETS
// so it can never drift out of sync with what's actually supported.
const CATEGORY_META: Record<ConversionPreset['category'], { label: string; icon: React.ReactNode; accentClass: string }> = {
  images: { label: 'Images', icon: <ImageIcon size={12} />, accentClass: 'cat-card--images' },
  documents: { label: 'Documents', icon: <FileText size={12} />, accentClass: 'cat-card--documents' },
  spreadsheets: { label: 'Spreadsheets', icon: <TableIcon size={12} />, accentClass: 'cat-card--spreadsheets' },
  data: { label: 'Data & Config', icon: <Braces size={12} />, accentClass: 'cat-card--data' },
};

const CATEGORY_ORDER: ConversionPreset['category'][] = ['images', 'documents', 'spreadsheets', 'data'];

const CATEGORY_CAPABILITIES = CATEGORY_ORDER.map(category => {
  const presetsInCategory = Object.values(PRESETS).filter(p => p.category === category);
  const fromExts = Array.from(new Set(presetsInCategory.flatMap(p => p.sourceExts)));
  const toBadges = Array.from(new Set(presetsInCategory.flatMap(p => p.targets.map(t => t.badge))));
  return { id: category, fromExts, toBadges, ...CATEGORY_META[category] };
});

interface BatchQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  ext: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  targetFormat?: string;
  outputFileName?: string;
  outputDataBase64?: string;
  outputText?: string;
  error?: string;
}

/**
 * Target formats valid for every file currently in the batch queue (the intersection of each
 * file's own preset targets). Files with an unrecognized extension have no targets, so they
 * contribute none — the dropdown only ever offers a target every queued file can actually reach.
 */
function computeBatchTargetOptions(
  items: { ext: string }[]
): ConversionTarget[] {
  const presets = items.map(i => PRESETS[i.ext]).filter((p): p is ConversionPreset => !!p);
  if (presets.length === 0 || presets.length !== items.length) return [];

  const [first, ...rest] = presets;
  return first.targets
    // Batch mode saves one output per queued file, so a target that produces a bundle of
    // multiple files (e.g. the multi-res icon pack) isn't offered here — only in the single-file flow.
    .filter(t => t.format !== 'multi-res-png')
    .filter(t => rest.every(p => p.targets.some(pt => pt.format === t.format)));
}

/**
 * Reconstruct a real browser File from base64 bytes the extension host read off disk.
 * Used for files picked via the native file dialog, so the rest of the conversion flow
 * (which is written against the standard File API) doesn't need to know the difference.
 */
function base64ToFile(base64: string, fileName: string): File {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new File([buffer], fileName);
}

export const ConvertersView: React.FC = () => {
  // Mode Selection: Single File vs Batch Queue
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchTarget, setBatchTarget] = useState<string>('');

  // Single File State
  const [sourceExt, setSourceExt] = useState<string>('');
  const [selectedFileOriginalPath, setSelectedFileOriginalPath] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [imageQuality, setImageQuality] = useState<number>(0.9);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Single File Result States
  const [convertedText, setConvertedText] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<ConvertedImageResult | null>(null);
  const [convertedDataBase64, setConvertedDataBase64] = useState<string | null>(null);
  const [multiResFiles, setMultiResFiles] = useState<MultiResPngItem[] | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle file selection (single or multiple). `pathsByName` carries real filesystem
  // paths when files came from the native file dialog (see handleBrowseClick) — files
  // dropped via drag-and-drop never get one, since a browser File object in a VS Code
  // webview has no access to its real path.
  const handleFilesSelected = (files: FileList | File[], pathsByName?: Record<string, string>) => {
    setErrorMsg(null);
    setConvertedText(null);
    setConvertedImage(null);
    setConvertedDataBase64(null);
    setMultiResFiles(null);

    if (files.length === 1) {
      // Single file flow
      const file = files[0];
      setSelectedFile(file);
      setSelectedFileOriginalPath(pathsByName?.[file.name] || null);
      setBatchQueue([]);

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      setSourceExt(ext);

      const preset = PRESETS[ext];
      if (preset && preset.targets.length > 0) {
        setTargetFormat(preset.targets[0].format);
      } else {
        setTargetFormat('');
      }
    } else if (files.length > 1) {
      // Multi-file batch flow
      setSelectedFile(null);
      const items: BatchQueueItem[] = Array.from(files).map((f, i) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return {
          id: `${Date.now()}-${i}`,
          file: f,
          name: f.name,
          size: f.size,
          ext,
          status: 'pending',
        };
      });

      setBatchQueue(items);

      // Auto-determine a target format common to every file's supported presets
      const options = computeBatchTargetOptions(items);
      setBatchTarget(options.length > 0 ? options[0].format : '');
    }
  };

  // Open the native "Open File" dialog in the extension host (instead of the webview's
  // sandboxed <input type="file">), specifically so we get real filesystem paths back —
  // that's what makes "Replace original file on disk" actually able to work.
  const handleBrowseClick = () => {
    vscode.postMessage({ type: 'PICK_CONVERT_FILE' });
  };

  useEffect(() => {
    const unsub = vscode.onMessage(msg => {
      if (msg.type === 'CONVERT_FILE_PICKED') {
        const pathsByName: Record<string, string> = {};
        const files = msg.payload.files.map(f => {
          pathsByName[f.fileName] = f.originalPath;
          return base64ToFile(f.dataBase64, f.fileName);
        });
        handleFilesSelected(files, pathsByName);
      }
    });
    return () => unsub();
  }, []);

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedFileOriginalPath(null);
    setBatchQueue([]);
    setSourceExt('');
    setTargetFormat('');
    setBatchTarget('');
    setConvertedText(null);
    setConvertedImage(null);
    setConvertedDataBase64(null);
    setMultiResFiles(null);
    setOutputFileName('');
    setErrorMsg(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Convert Single File
  const handleConvertSingle = async () => {
    if (!selectedFile || !targetFormat) return;

    setIsConverting(true);
    setErrorMsg(null);

    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
    const isImageSource = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(sourceExt);

    try {
      // Client-side image & SVG conversions
      if (isImageSource && ['png', 'jpg', 'webp', 'ico', 'base64', 'multi-res-png'].includes(targetFormat)) {
        const result = await convertImage(
          selectedFile,
          {
            format: targetFormat as 'png' | 'jpg' | 'webp' | 'ico' | 'base64' | 'multi-res-png',
            quality: imageQuality,
          },
          baseName
        );

        if (targetFormat === 'multi-res-png' && result.multiFiles) {
          setMultiResFiles(result.multiFiles);
          setOutputFileName(`${baseName}-icon-bundle.zip`);
          setConvertedImage(result);
        } else {
          const targetExt = targetFormat === 'base64' ? 'txt' : targetFormat;
          setOutputFileName(`${baseName}.${targetExt}`);

          if (targetFormat === 'base64') {
            setConvertedText(result.dataUrl);
          } else {
            setConvertedImage(result);
            setConvertedDataBase64(result.base64);
          }
        }

        setIsConverting(false);
        return;
      }

      // Extension Host conversion for Documents, PDF Extractor, Slides, Spreadsheets, Data
      const reader = new FileReader();
      const isTextSource = ['md', 'txt', 'html', 'json', 'yaml', 'yml', 'xml', 'env', 'csv', 'tsv'].includes(sourceExt);

      reader.onload = async e => {
        try {
          let reqPayload;
          if (isTextSource) {
            reqPayload = {
              id: String(Date.now()),
              fileName: selectedFile.name,
              sourceFormat: sourceExt,
              targetFormat,
              textData: e.target?.result as string,
            };
          } else {
            const dataUrl = (e.target?.result as string) || '';
            const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            reqPayload = {
              id: String(Date.now()),
              fileName: selectedFile.name,
              sourceFormat: sourceExt,
              targetFormat,
              dataBase64: b64,
            };
          }

          const unsub = vscode.onMessage(msg => {
            if (msg.type === 'CONVERT_FILE_RESULT' && msg.payload.id === reqPayload.id) {
              unsub();
              setIsConverting(false);
              if (msg.payload.success) {
                setOutputFileName(msg.payload.fileName);
                if (msg.payload.isBinary) {
                  setConvertedDataBase64(msg.payload.outputDataBase64);
                } else {
                  setConvertedText(msg.payload.outputText);
                }
              } else {
                setErrorMsg(msg.payload.error || 'Conversion failed.');
              }
            }
          });

          vscode.postMessage({
            type: 'CONVERT_FILE',
            payload: reqPayload,
          });
        } catch (err: unknown) {
          setIsConverting(false);
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      };

      if (isTextSource) {
        reader.readAsText(selectedFile);
      } else {
        reader.readAsDataURL(selectedFile);
      }
    } catch (err: unknown) {
      setIsConverting(false);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  // Convert All Files in Batch Queue
  const handleConvertBatch = async () => {
    if (batchQueue.length === 0 || !batchTarget) return;

    setIsConverting(true);
    setErrorMsg(null);

    const updated = [...batchQueue];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      item.status = 'converting';
      setBatchQueue([...updated]);

      try {
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(item.ext);

        if (isImage && ['png', 'jpg', 'webp', 'ico', 'base64'].includes(batchTarget)) {
          const res = await convertImage(item.file, {
            format: batchTarget as any,
            quality: imageQuality,
          });

          item.status = 'done';
          item.outputFileName = `${baseName}.${batchTarget === 'base64' ? 'txt' : batchTarget}`;
          item.outputDataBase64 = res.base64;
        } else {
          // Send to extension host
          const text = await readFileAsTextOrBase64(item.file);
          const reqId = `${Date.now()}-${i}`;

          const result = await new Promise<any>((resolve, reject) => {
            const unsub = vscode.onMessage(msg => {
              if (msg.type === 'CONVERT_FILE_RESULT' && msg.payload.id === reqId) {
                unsub();
                resolve(msg.payload);
              }
            });

            vscode.postMessage({
              type: 'CONVERT_FILE',
              payload: {
                id: reqId,
                fileName: item.name,
                sourceFormat: item.ext,
                targetFormat: batchTarget,
                textData: text.isText ? text.content : undefined,
                dataBase64: !text.isText ? text.content : undefined,
              },
            });

            setTimeout(() => {
              unsub();
              reject(new Error('Conversion timed out'));
            }, 30000);
          });

          if (result.success) {
            item.status = 'done';
            item.outputFileName = result.fileName;
            item.outputDataBase64 = result.outputDataBase64;
            item.outputText = result.outputText;
          } else {
            item.status = 'error';
            item.error = result.error;
          }
        }
      } catch (err: unknown) {
        item.status = 'error';
        item.error = err instanceof Error ? err.message : String(err);
      }

      setBatchQueue([...updated]);
    }

    setIsConverting(false);
  };

  // Helper: Read file text or base64
  const readFileAsTextOrBase64 = (file: File): Promise<{ isText: boolean; content: string }> => {
    return new Promise((resolve, reject) => {
      const isText = ['md', 'txt', 'html', 'json', 'yaml', 'yml', 'xml', 'env', 'csv', 'tsv'].includes(
        file.name.split('.').pop()?.toLowerCase() || ''
      );
      const reader = new FileReader();

      reader.onload = e => {
        if (isText) {
          resolve({ isText: true, content: (e.target?.result as string) || '' });
        } else {
          const dataUrl = (e.target?.result as string) || '';
          const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          resolve({ isText: false, content: b64 });
        }
      };

      reader.onerror = reject;
      if (isText) reader.readAsText(file);
      else reader.readAsDataURL(file);
    });
  };

  // Save Single Converted File
  const handleSaveToWorkspace = () => {
    if (!outputFileName) return;

    // If multi-resolution bundle, export as ZIP
    if (multiResFiles && multiResFiles.length > 0) {
      vscode.postMessage({
        type: 'SAVE_BATCH_ZIP',
        payload: {
          zipFileName: outputFileName,
          items: multiResFiles.map(f => ({ fileName: f.fileName, outputDataBase64: f.base64 })),
        },
      });
      return;
    }

    vscode.postMessage({
      type: 'SAVE_CONVERTED_FILE',
      payload: {
        fileName: outputFileName,
        outputDataBase64: convertedDataBase64 || undefined,
        outputText: convertedText || undefined,
        originalPath: selectedFileOriginalPath || undefined,
      },
    });
  };

  // Save Batch Files to Folder
  const handleSaveBatchToFolder = () => {
    const completed = batchQueue.filter(i => i.status === 'done');
    if (completed.length === 0) return;

    vscode.postMessage({
      type: 'SAVE_BATCH_FILES',
      payload: {
        items: completed.map(i => ({
          fileName: i.outputFileName || i.name,
          outputDataBase64: i.outputDataBase64,
          outputText: i.outputText,
        })),
      },
    });
  };

  // Save Batch Files as ZIP
  const handleSaveBatchAsZip = () => {
    const completed = batchQueue.filter(i => i.status === 'done');
    if (completed.length === 0) return;

    const defaultZipName = `converted-batch-${Date.now()}.zip`;
    vscode.postMessage({
      type: 'SAVE_BATCH_ZIP',
      payload: {
        zipFileName: defaultZipName,
        items: completed.map(i => ({
          fileName: i.outputFileName || i.name,
          outputDataBase64: i.outputDataBase64,
          outputText: i.outputText,
        })),
      },
    });
  };

  // Copy Single Converted Output
  const handleCopy = () => {
    const textToCopy = convertedText || convertedImage?.dataUrl || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const preset = sourceExt ? PRESETS[sourceExt] : null;
  const batchCompletedCount = batchQueue.filter(i => i.status === 'done').length;
  const batchTargetOptions = useMemo(() => computeBatchTargetOptions(batchQueue), [batchQueue]);

  return (
    <div className="converters-container">
      {/* STATE 1: Landing / Discovery */}
      {!selectedFile && batchQueue.length === 0 ? (
        <div className="converters-landing">
          <div className="converters-header">
            <div className="converters-icon-tile">
              <RefreshCw size={16} />
            </div>
            <div>
              <div className="converters-title">Converters</div>
              <div className="converters-subtitle">Offline file conversion, no uploads</div>
            </div>
          </div>

          <div
            className={`dropzone-compact ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <div className="dropzone-icon-ring-sm">
              <FileUp size={16} />
            </div>
            <div className="dropzone-text-sm">
              <span className="dropzone-title-sm">Drop a file here</span>
              <span className="dropzone-sub-sm">or drop several to batch-convert</span>
            </div>
            <button
              type="button"
              className="dropzone-browse-chip"
              onClick={e => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              <FolderOpen size={11} />
              Browse
            </button>
          </div>

          <div className="discover-label">What can I convert?</div>
          <div className="cat-list">
            {CATEGORY_CAPABILITIES.map(cat => (
              <div key={cat.id} className={`cat-card ${cat.accentClass}`}>
                <div className="cat-head">
                  <div className="cat-icon">{cat.icon}</div>
                  <span className="cat-name">{cat.label}</span>
                  <span className="cat-count">{cat.fromExts.length} formats</span>
                </div>
                <div className="cat-flow">
                  {cat.fromExts.map(ext => (
                    <span key={ext} className="fmt-chip from">{ext.toUpperCase()}</span>
                  ))}
                  <span className="cat-arrow">
                    <ArrowRight size={11} />
                  </span>
                  {cat.toBadges.map(badge => (
                    <span key={badge} className="fmt-chip to">{badge}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="converters-privacy-line">
            <ShieldCheck size={11} />
            <span>Every conversion runs locally</span>
          </div>
        </div>
      ) : batchQueue.length > 1 ? (
        /* STATE 2: Batch Queue Flow */
        <div className="batch-converter-flow">
          <div className="batch-queue-header">
            <div className="batch-title-group">
              <Archive size={14} className="batch-header-icon" />
              <span className="batch-title">Batch Queue ({batchQueue.length} files)</span>
            </div>
            <button type="button" className="btn-icon" onClick={handleReset} title="Clear Queue">
              <X size={14} />
            </button>
          </div>

          {/* Batch Target Selector */}
          <div className="batch-control-box">
            {batchTargetOptions.length > 0 ? (
              <div className="batch-target-row">
                <label>Convert all to:</label>
                <select
                  value={batchTarget}
                  onChange={e => setBatchTarget(e.target.value)}
                  className="batch-select-input"
                >
                  {batchTargetOptions.map(t => (
                    <option key={t.format} value={t.format}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="unsupported-format-box">
                <span>These files don't share a common target format. Remove files of a different type, or convert them separately.</span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary batch-cta-btn"
              disabled={isConverting || !batchTarget}
              onClick={handleConvertBatch}
            >
              {isConverting ? (
                <>
                  <RefreshCw size={13} className="spin" />
                  <span>Converting Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Convert All ({batchQueue.length} files)</span>
                </>
              )}
            </button>
          </div>

          {/* Queue Items List */}
          <div className="batch-items-list">
            {batchQueue.map(item => (
              <div key={item.id} className={`batch-item-row ${item.status}`}>
                <div className="batch-item-info">
                  <span className="batch-item-name" title={item.name}>
                    {item.name}
                  </span>
                  <span className="batch-item-size">{(item.size / 1024).toFixed(1)} KB</span>
                </div>

                <div className="batch-item-status">
                  {item.status === 'pending' && <span className="status-badge pending">Pending</span>}
                  {item.status === 'converting' && <RefreshCw size={12} className="spin status-badge converting" />}
                  {item.status === 'done' && <Check size={13} color="#10b981" />}
                  {item.status === 'error' && <span className="status-badge error">Failed</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Batch Actions when Completed */}
          {batchCompletedCount > 0 && (
            <div className="batch-actions-bar">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveBatchToFolder}
                title="Save all converted files to a selected folder"
              >
                <FolderOpen size={12} />
                <span>Save All to Folder</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveBatchAsZip}
                title="Export all converted files as a ZIP archive"
              >
                <Download size={12} />
                <span>Export ZIP</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STATE 3: Single File Flow */
        <div className="loaded-converter-flow">
          {/* Active File Card */}
          <div className="active-file-card">
            <div className="file-card-leading">
              <div className="file-avatar-ring">
                {['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(sourceExt) ? (
                  <ImageIcon size={18} className="file-type-icon img" />
                ) : ['xlsx', 'csv'].includes(sourceExt) ? (
                  <TableIcon size={18} className="file-type-icon xlsx" />
                ) : (
                  <FileText size={18} className="file-type-icon doc" />
                )}
              </div>
              <div className="file-details">
                <span className="active-filename" title={selectedFile?.name}>
                  {selectedFile?.name}
                </span>
                <span className="active-filemeta">
                  {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB • .{sourceExt.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-icon change-file-btn"
              onClick={handleReset}
              title="Remove / Change File"
            >
              <X size={14} />
            </button>
          </div>

          {/* Target Format Selector */}
          {preset ? (
            <div className="target-selection-card">
              <div className="selection-label">
                <span>Convert to:</span>
              </div>

              <div className="fmt-grid">
                {preset.targets.map(t => {
                  const isSelected = targetFormat === t.format;
                  return (
                    <button
                      key={t.format}
                      type="button"
                      className={`fmt-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setTargetFormat(t.format)}
                    >
                      <span className="fmt-badge">{t.badge}</span>
                      <span className="fmt-info">
                        <span className="fmt-name">{t.shortLabel}</span>
                        <span className="fmt-desc">{t.desc}</span>
                      </span>
                      {isSelected && (
                        <span className="fmt-check">
                          <Check size={9} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quality Slider for lossy images */}
              {['jpg', 'webp'].includes(targetFormat) && (
                <div className="quality-control-block">
                  <div className="quality-header-row">
                    <span className="quality-title">Compression Quality</span>
                    <span className="quality-badge">{Math.round(imageQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={imageQuality}
                    onChange={e => setImageQuality(parseFloat(e.target.value))}
                    className="quality-range-slider"
                  />
                </div>
              )}


              {/* Convert Action CTA */}
              <button
                type="button"
                className="btn btn-primary convert-action-cta"
                disabled={isConverting || !targetFormat}
                onClick={handleConvertSingle}
              >
                {isConverting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Convert Now</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="unsupported-format-box">
              <span>Format .{sourceExt.toUpperCase()} is not yet recognized.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="converter-error-banner">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conversion Result Card */}
          {(convertedText !== null || convertedImage !== null || convertedDataBase64 !== null || multiResFiles !== null) && (
            <div className="conversion-result-card">
              <div className="result-card-header">
                <div className="result-name-group">
                  <Check size={14} className="result-check-icon" />
                  <span className="result-output-filename" title={outputFileName}>
                    {outputFileName}
                  </span>
                </div>

                <div className="result-header-actions">
                  {convertedText && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={handleCopy}
                      title="Copy to Clipboard"
                    >
                      {hasCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm save-result-btn"
                    onClick={handleSaveToWorkspace}
                    title="Save Converted File"
                  >
                    <Download size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Multi-Resolution PNG Bundle View */}
              {multiResFiles ? (
                <div className="multires-grid-preview">
                  <div className="multires-header">
                    <span>Generated {multiResFiles.length} Resolutions</span>
                  </div>
                  <div className="multires-tiles">
                    {multiResFiles.map(res => (
                      <div key={res.size} className="multires-tile">
                        <img src={res.dataUrl} alt={`${res.size}px`} className="multires-thumb" />
                        <span className="multires-size-label">{res.size}×{res.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : convertedImage ? (
                <div className="result-content-preview">
                  <div className="image-preview-box">
                    <img src={convertedImage.dataUrl} alt="Converted Render" className="preview-image-element" />
                    <div className="preview-meta-tag">
                      {convertedImage.width}×{convertedImage.height}px • {(convertedImage.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              ) : convertedText ? (
                <div className="result-content-preview">
                  <pre className="text-preview-code">
                    <code>
                      {convertedText.slice(0, 1800)}
                      {convertedText.length > 1800 ? '\n\n... (preview truncated)' : ''}
                    </code>
                  </pre>
                </div>
              ) : (
                <div className="binary-preview-box">
                  <FileCode size={22} className="binary-preview-icon" />
                  <span>Output ready: {outputFileName}</span>
                </div>
              )}

              {/* Convert Another File Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm convert-another-btn"
                onClick={handleReset}
              >
                <RotateCcw size={12} />
                <span>Convert Another File</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
