import React, { useState, useRef } from 'react';
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
  FileCode,
  FolderOpen,
  ArrowRight,
  X,
  RotateCcw,
  Presentation,
  Archive,
  Layers,
  FileSearch,
} from 'lucide-react';

interface ConversionPreset {
  sourceExts: string[];
  category: 'images' | 'documents' | 'spreadsheets' | 'data';
  targets: { format: string; label: string; ext: string; isBinary: boolean }[];
}

const PRESETS: Record<string, ConversionPreset> = {
  // SVG Vector Suite
  svg: {
    sourceExts: ['svg'],
    category: 'images',
    targets: [
      { format: 'multi-res-png', label: 'Multi-Res PNG Bundle (16px-512px)', ext: 'zip', isBinary: true },
      { format: 'png', label: 'PNG (Rasterized)', ext: 'png', isBinary: true },
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false },
    ],
  },
  // Images
  png: {
    sourceExts: ['png'],
    category: 'images',
    targets: [
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true },
      { format: 'jpg', label: 'JPEG (.jpg)', ext: 'jpg', isBinary: true },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false },
    ],
  },
  jpg: {
    sourceExts: ['jpg', 'jpeg'],
    category: 'images',
    targets: [
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true },
      { format: 'png', label: 'PNG (Lossless)', ext: 'png', isBinary: true },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false },
    ],
  },
  jpeg: {
    sourceExts: ['jpeg'],
    category: 'images',
    targets: [
      { format: 'webp', label: 'WebP (Compressed)', ext: 'webp', isBinary: true },
      { format: 'png', label: 'PNG', ext: 'png', isBinary: true },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false },
    ],
  },
  webp: {
    sourceExts: ['webp'],
    category: 'images',
    targets: [
      { format: 'png', label: 'PNG (Lossless)', ext: 'png', isBinary: true },
      { format: 'jpg', label: 'JPEG (.jpg)', ext: 'jpg', isBinary: true },
      { format: 'ico', label: 'Favicon (.ico)', ext: 'ico', isBinary: true },
      { format: 'base64', label: 'Base64 Data URI', ext: 'txt', isBinary: false },
    ],
  },
  // PDF Document Extractor
  pdf: {
    sourceExts: ['pdf'],
    category: 'documents',
    targets: [
      { format: 'md', label: 'Markdown (.md) - Text & Headings', ext: 'md', isBinary: false },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false },
    ],
  },
  // Markdown Suite
  md: {
    sourceExts: ['md', 'markdown'],
    category: 'documents',
    targets: [
      { format: 'slide-deck', label: 'Interactive Slide Deck (.html)', ext: 'slides.html', isBinary: false },
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true },
      { format: 'html', label: 'Styled Web Page (.html)', ext: 'html', isBinary: false },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false },
    ],
  },
  // Documents
  docx: {
    sourceExts: ['docx'],
    category: 'documents',
    targets: [
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true },
      { format: 'md', label: 'Markdown (.md)', ext: 'md', isBinary: false },
      { format: 'html', label: 'HTML Web Page (.html)', ext: 'html', isBinary: false },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false },
    ],
  },
  txt: {
    sourceExts: ['txt'],
    category: 'documents',
    targets: [
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true },
    ],
  },
  html: {
    sourceExts: ['html', 'htm'],
    category: 'documents',
    targets: [
      { format: 'md', label: 'Markdown (.md)', ext: 'md', isBinary: false },
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true },
      { format: 'txt', label: 'Plain Text (.txt)', ext: 'txt', isBinary: false },
    ],
  },
  // Spreadsheets
  xlsx: {
    sourceExts: ['xlsx', 'xls'],
    category: 'spreadsheets',
    targets: [
      { format: 'json', label: 'JSON Array (.json)', ext: 'json', isBinary: false },
      { format: 'md', label: 'Markdown Table (.md)', ext: 'md', isBinary: false },
      { format: 'html', label: 'HTML Table (.html)', ext: 'html', isBinary: false },
      { format: 'csv', label: 'CSV File (.csv)', ext: 'csv', isBinary: false },
    ],
  },
  csv: {
    sourceExts: ['csv', 'tsv'],
    category: 'spreadsheets',
    targets: [
      { format: 'json', label: 'JSON Array (.json)', ext: 'json', isBinary: false },
      { format: 'md', label: 'Markdown Table (.md)', ext: 'md', isBinary: false },
      { format: 'html', label: 'HTML Table (.html)', ext: 'html', isBinary: false },
    ],
  },
  // Data & Config
  json: {
    sourceExts: ['json'],
    category: 'data',
    targets: [
      { format: 'yaml', label: 'YAML (.yaml)', ext: 'yaml', isBinary: false },
      { format: 'xml', label: 'XML (.xml)', ext: 'xml', isBinary: false },
      { format: 'env', label: 'Environment (.env)', ext: 'env', isBinary: false },
    ],
  },
  yaml: {
    sourceExts: ['yaml', 'yml'],
    category: 'data',
    targets: [
      { format: 'json', label: 'JSON (.json)', ext: 'json', isBinary: false },
      { format: 'xml', label: 'XML (.xml)', ext: 'xml', isBinary: false },
    ],
  },
  xml: {
    sourceExts: ['xml'],
    category: 'data',
    targets: [
      { format: 'json', label: 'JSON (.json)', ext: 'json', isBinary: false },
      { format: 'yaml', label: 'YAML (.yaml)', ext: 'yaml', isBinary: false },
    ],
  },
  env: {
    sourceExts: ['env'],
    category: 'data',
    targets: [
      { format: 'json', label: 'JSON (.json)', ext: 'json', isBinary: false },
      { format: 'yaml', label: 'YAML (.yaml)', ext: 'yaml', isBinary: false },
    ],
  },
};

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

export const ConvertersView: React.FC = () => {
  // Mode Selection: Single File vs Batch Queue
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchTarget, setBatchTarget] = useState<string>('');

  // Single File State
  const [sourceExt, setSourceExt] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [imageQuality, setImageQuality] = useState<number>(0.9);
  const [replaceOriginal, setReplaceOriginal] = useState<boolean>(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (single or multiple)
  const handleFilesSelected = (files: FileList | File[]) => {
    setErrorMsg(null);
    setConvertedText(null);
    setConvertedImage(null);
    setConvertedDataBase64(null);
    setMultiResFiles(null);

    if (files.length === 1) {
      // Single file flow
      const file = files[0];
      setSelectedFile(file);
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

      // Auto-determine common target format
      const firstExt = items[0].ext;
      const preset = PRESETS[firstExt];
      if (preset && preset.targets.length > 0) {
        setBatchTarget(preset.targets[0].format);
      } else {
        setBatchTarget('');
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            const arrayBuf = e.target?.result as ArrayBuffer;
            let binary = '';
            const bytes = new Uint8Array(arrayBuf);
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const b64 = btoa(binary);
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
        reader.readAsArrayBuffer(selectedFile);
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
          resolve({ isText: true, content: e.target?.result as string });
        } else {
          const arrayBuf = e.target?.result as ArrayBuffer;
          let binary = '';
          const bytes = new Uint8Array(arrayBuf);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          resolve({ isText: false, content: btoa(binary) });
        }
      };

      reader.onerror = reject;
      if (isText) reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
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
        replaceOriginal,
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
        replaceOriginal,
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

  return (
    <div className="converters-container">
      {/* Hidden file input with multiple support */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
          }
        }}
      />

      {/* STATE 1: Empty Dropzone */}
      {!selectedFile && batchQueue.length === 0 ? (
        <div className="empty-dropzone-wrapper">
          <div
            className={`dropzone-card ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Title & subtitle positioned above icon */}
            <div className="dropzone-text-block">
              <h3 className="dropzone-main-title">Drop your file(s) here</h3>
              <p className="dropzone-sub-title">Single or batch multiple files supported</p>
            </div>

            <div className="dropzone-icon-ring">
              <FileUp size={24} className="dropzone-icon" />
            </div>

            <button
              type="button"
              className="dropzone-cta-btn"
              onClick={e => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FolderOpen size={14} />
              <span>Browse Files</span>
            </button>

            <div className="dropzone-supported-tags">
              <span className="tag-pill">DOCX</span>
              <span className="tag-pill">PDF</span>
              <span className="tag-pill">SVG</span>
              <span className="tag-pill">PNG / WebP</span>
              <span className="tag-pill">XLSX</span>
              <span className="tag-pill">MD</span>
              <span className="tag-pill">JSON / YAML</span>
            </div>
          </div>

          {/* Specialized Tools & Popular Presets */}
          <div className="specialized-tools-shelf">
            <div className="shelf-heading">
              <Sparkles size={12} className="shelf-sparkle-icon" />
              <span>Developer Power Tools</span>
            </div>

            <div className="power-tools-grid">
              <button
                type="button"
                className="tool-shortcut-card"
                onClick={() => fileInputRef.current?.click()}
                title="Drop an SVG to generate a full set of PNG icon resolutions (16px to 512px)"
              >
                <div className="tool-card-icon svg-accent">
                  <Layers size={16} />
                </div>
                <div className="tool-card-info">
                  <span className="tool-card-title">SVG Multi-Res Suite</span>
                  <span className="tool-card-desc">16px to 512px icon pack</span>
                </div>
              </button>

              <button
                type="button"
                className="tool-shortcut-card"
                onClick={() => fileInputRef.current?.click()}
                title="Convert Markdown with --- dividers into an interactive HTML slide deck"
              >
                <div className="tool-card-icon slide-accent">
                  <Presentation size={16} />
                </div>
                <div className="tool-card-info">
                  <span className="tool-card-title">Markdown ➔ Slide Deck</span>
                  <span className="tool-card-desc">Interactive HTML presentation</span>
                </div>
              </button>

              <button
                type="button"
                className="tool-shortcut-card"
                onClick={() => fileInputRef.current?.click()}
                title="Extract text, headings and tables from PDF documents into Markdown"
              >
                <div className="tool-card-icon pdf-accent">
                  <FileSearch size={16} />
                </div>
                <div className="tool-card-info">
                  <span className="tool-card-title">PDF ➔ Markdown</span>
                  <span className="tool-card-desc">Extract text & structure</span>
                </div>
              </button>

              <button
                type="button"
                className="tool-shortcut-card"
                onClick={() => fileInputRef.current?.click()}
                title="Drop multiple images or documents to convert together in 1 click"
              >
                <div className="tool-card-icon batch-accent">
                  <Archive size={16} />
                </div>
                <div className="tool-card-info">
                  <span className="tool-card-title">Batch Multi-File</span>
                  <span className="tool-card-desc">Convert & Save to ZIP</span>
                </div>
              </button>
            </div>
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
            <div className="batch-target-row">
              <label>Convert all to:</label>
              <select
                value={batchTarget}
                onChange={e => setBatchTarget(e.target.value)}
                className="batch-select-input"
              >
                <option value="webp">WebP (Compressed)</option>
                <option value="png">PNG (Lossless)</option>
                <option value="jpg">JPEG (.jpg)</option>
                <option value="pdf">PDF Document</option>
                <option value="md">Markdown (.md)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>

            <label className="replace-toggle-label">
              <input
                type="checkbox"
                checked={replaceOriginal}
                onChange={e => setReplaceOriginal(e.target.checked)}
              />
              <span>Replace original files on disk</span>
            </label>

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
                <span>Convert to format:</span>
              </div>

              <div className="targets-grid">
                {preset.targets.map(t => (
                  <button
                    key={t.format}
                    type="button"
                    className={`target-pill-btn ${targetFormat === t.format ? 'active' : ''}`}
                    onClick={() => setTargetFormat(t.format)}
                  >
                    <span className="target-pill-label">{t.label}</span>
                  </button>
                ))}
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

              {/* In-Place Replace Option */}
              <label className="replace-toggle-label">
                <input
                  type="checkbox"
                  checked={replaceOriginal}
                  onChange={e => setReplaceOriginal(e.target.checked)}
                />
                <span>Replace original file on disk</span>
              </label>

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
