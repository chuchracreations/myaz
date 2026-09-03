import React, { useState, useRef, useCallback } from 'react';
import { vscode } from '../../vscodeApi';
import { convertImage, ConvertedImageResult } from './imageConverter';
import {
  FileUp,
  ArrowRight,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Code2,
  FileCode,
} from 'lucide-react';

interface ConversionPreset {
  sourceExts: string[];
  category: 'images' | 'documents' | 'spreadsheets' | 'data';
  targets: { format: string; label: string; ext: string; isBinary: boolean }[];
}

const PRESETS: Record<string, ConversionPreset> = {
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
  md: {
    sourceExts: ['md', 'markdown'],
    category: 'documents',
    targets: [
      { format: 'pdf', label: 'PDF Document (.pdf)', ext: 'pdf', isBinary: true },
      { format: 'html', label: 'Styled HTML (.html)', ext: 'html', isBinary: false },
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

export const ConvertersView: React.FC = () => {
  const [mode, setMode] = useState<'file' | 'scratchpad'>('file');

  // File Mode States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceExt, setSourceExt] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [imageQuality, setImageQuality] = useState<number>(0.9);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Result States
  const [convertedText, setConvertedText] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<ConvertedImageResult | null>(null);
  const [convertedDataBase64, setConvertedDataBase64] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Scratchpad States
  const [scratchSource, setScratchSource] = useState<'json' | 'yaml' | 'xml' | 'env'>('json');
  const [scratchTarget, setScratchTarget] = useState<'yaml' | 'json' | 'xml' | 'env'>('yaml');
  const [scratchInput, setScratchInput] = useState<string>('');
  const [scratchOutput, setScratchOutput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect format & select default target
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setConvertedText(null);
    setConvertedImage(null);
    setConvertedDataBase64(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setSourceExt(ext);

    const preset = PRESETS[ext];
    if (preset && preset.targets.length > 0) {
      setTargetFormat(preset.targets[0].format);
    } else {
      setTargetFormat('');
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Run Conversion
  const handleConvert = async () => {
    if (!selectedFile || !targetFormat) return;

    setIsConverting(true);
    setErrorMsg(null);

    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
    const isImageSource = ['png', 'jpg', 'jpeg', 'webp'].includes(sourceExt);

    try {
      // Client-side image conversion
      if (isImageSource && ['png', 'jpg', 'webp', 'ico', 'base64'].includes(targetFormat)) {
        const result = await convertImage(selectedFile, {
          format: targetFormat as 'png' | 'jpg' | 'webp' | 'ico' | 'base64',
          quality: imageQuality,
        });

        const targetExt = targetFormat === 'base64' ? 'txt' : targetFormat;
        setOutputFileName(`${baseName}.${targetExt}`);

        if (targetFormat === 'base64') {
          setConvertedText(result.dataUrl);
        } else {
          setConvertedImage(result);
          setConvertedDataBase64(result.base64);
        }
        setIsConverting(false);
        return;
      }

      // Extension Host conversion for Documents, Spreadsheets, Data
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
            // Binary arraybuffer to base64
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

          // Listen for response from host
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

  // Save converted file to VS Code workspace
  const handleSaveToWorkspace = () => {
    if (!outputFileName) return;

    vscode.postMessage({
      type: 'SAVE_CONVERTED_FILE',
      payload: {
        fileName: outputFileName,
        outputDataBase64: convertedDataBase64 || undefined,
        outputText: convertedText || undefined,
      },
    });
  };

  // Copy converted output
  const handleCopy = () => {
    const textToCopy = convertedText || convertedImage?.dataUrl || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  // Quick Scratchpad Convert
  const handleScratchpadConvert = useCallback(() => {
    if (!scratchInput.trim()) {
      setScratchOutput('');
      return;
    }

    try {
      if (scratchSource === 'json') {
        const obj = JSON.parse(scratchInput);
        if (scratchTarget === 'json') setScratchOutput(JSON.stringify(obj, null, 2));
        else {
          // Send to host for yaml/xml/env conversion
          vscode.postMessage({
            type: 'CONVERT_TEXT',
            payload: { text: scratchInput, sourceFormat: scratchSource, targetFormat: scratchTarget },
          });
        }
      } else {
        vscode.postMessage({
          type: 'CONVERT_TEXT',
          payload: { text: scratchInput, sourceFormat: scratchSource, targetFormat: scratchTarget },
        });
      }
    } catch (err: unknown) {
      setScratchOutput(`Error parsing ${scratchSource.toUpperCase()}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [scratchInput, scratchSource, scratchTarget]);

  // Listen for scratchpad responses
  React.useEffect(() => {
    const unsub = vscode.onMessage(msg => {
      if (msg.type === 'CONVERT_TEXT_RESULT') {
        if (msg.payload.success) {
          setScratchOutput(msg.payload.outputText || '');
        } else {
          setScratchOutput(`Conversion Error: ${msg.payload.error}`);
        }
      }
    });
    return () => unsub();
  }, []);

  const preset = sourceExt ? PRESETS[sourceExt] : null;

  return (
    <div className="converters-container">
      {/* Mode Switcher */}
      <div className="converters-mode-pills">
        <button
          className={`mode-pill ${mode === 'file' ? 'active' : ''}`}
          onClick={() => setMode('file')}
        >
          <FileUp size={12} />
          <span>File Converter</span>
        </button>
        <button
          className={`mode-pill ${mode === 'scratchpad' ? 'active' : ''}`}
          onClick={() => setMode('scratchpad')}
        >
          <Code2 size={12} />
          <span>Quick Scratchpad</span>
        </button>
      </div>

      {mode === 'file' ? (
        <div className="file-converter-view">
          {/* Dropzone */}
          <div
            className={`dropzone-card ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />
            <div className="dropzone-content">
              <div className="dropzone-icon-ring">
                {selectedFile ? (
                  ['png', 'jpg', 'jpeg', 'webp'].includes(sourceExt) ? (
                    <ImageIcon size={22} className="dropzone-icon accent" />
                  ) : ['xlsx', 'csv'].includes(sourceExt) ? (
                    <TableIcon size={22} className="dropzone-icon accent" />
                  ) : (
                    <FileText size={22} className="dropzone-icon accent" />
                  )
                ) : (
                  <FileUp size={22} className="dropzone-icon" />
                )}
              </div>

              {selectedFile ? (
                <div className="file-meta">
                  <span className="file-name" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Detected: .{sourceExt.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="dropzone-prompt">
                  <span className="prompt-title">Drag & drop any file here</span>
                  <span className="prompt-subtitle">
                    Supports Word (.docx), PDF, Markdown, Images, Excel & JSON
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Target Format Selector */}
          {selectedFile && preset ? (
            <div className="target-selector-box">
              <div className="selector-header">
                <span className="selector-title">Convert .{sourceExt.toUpperCase()} to:</span>
              </div>
              <div className="target-chips-row">
                {preset.targets.map(t => (
                  <button
                    key={t.format}
                    className={`target-chip ${targetFormat === t.format ? 'active' : ''}`}
                    onClick={() => setTargetFormat(t.format)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Quality slider for lossy images */}
              {['jpg', 'webp'].includes(targetFormat) && (
                <div className="quality-slider-row">
                  <div className="quality-label">
                    <span>Quality</span>
                    <span className="quality-val">{Math.round(imageQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={imageQuality}
                    onChange={e => setImageQuality(parseFloat(e.target.value))}
                    className="slider-input"
                  />
                </div>
              )}

              {/* Convert Action Button */}
              <button
                className="btn btn-primary convert-cta-btn"
                disabled={isConverting || !targetFormat}
                onClick={handleConvert}
              >
                {isConverting ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Convert Now</span>
                  </>
                )}
              </button>
            </div>
          ) : selectedFile && !preset ? (
            <div className="unsupported-box">
              <span>Format .{sourceExt.toUpperCase()} is not yet recognized. Supported: DOCX, MD, TXT, HTML, PNG, JPG, WEBP, XLSX, CSV, JSON, YAML, XML, .ENV</span>
            </div>
          ) : null}

          {/* Error Message */}
          {errorMsg && (
            <div className="converter-error-banner">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Card */}
          {(convertedText !== null || convertedImage !== null || convertedDataBase64 !== null) && (
            <div className="result-card">
              <div className="result-header">
                <div className="result-identity">
                  <Check size={14} className="success-icon" />
                  <span className="result-filename">{outputFileName}</span>
                </div>
                <div className="result-actions">
                  {convertedText && (
                    <button className="btn-icon" onClick={handleCopy} title="Copy to Clipboard">
                      {hasCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSaveToWorkspace}
                    title="Save converted file into workspace"
                  >
                    <Download size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="result-preview-box">
                {convertedImage ? (
                  <div className="image-preview-wrapper">
                    <img
                      src={convertedImage.dataUrl}
                      alt="Converted Preview"
                      className="image-preview-render"
                    />
                    <div className="image-preview-stats">
                      {convertedImage.width}×{convertedImage.height}px • {(convertedImage.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ) : convertedText ? (
                  <pre className="code-preview-render">
                    <code>{convertedText.slice(0, 1500)}{convertedText.length > 1500 ? '\n\n... (truncated for preview)' : ''}</code>
                  </pre>
                ) : (
                  <div className="binary-preview-placeholder">
                    <FileCode size={24} />
                    <span>Binary output ready: {outputFileName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Scratchpad Mode */
        <div className="scratchpad-view">
          <div className="scratchpad-selectors">
            <div className="scratchpad-select-group">
              <label>From:</label>
              <select
                value={scratchSource}
                onChange={e => setScratchSource(e.target.value as 'json' | 'yaml' | 'xml' | 'env')}
                className="select-input"
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="xml">XML</option>
                <option value="env">.ENV</option>
              </select>
            </div>
            <ArrowRight size={14} className="scratchpad-arrow" />
            <div className="scratchpad-select-group">
              <label>To:</label>
              <select
                value={scratchTarget}
                onChange={e => setScratchTarget(e.target.value as 'yaml' | 'json' | 'xml' | 'env')}
                className="select-input"
              >
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="env">.ENV</option>
              </select>
            </div>
          </div>

          <div className="scratchpad-panes">
            <div className="scratchpad-pane">
              <div className="pane-header">Input ({scratchSource.toUpperCase()})</div>
              <textarea
                className="pane-textarea"
                placeholder={`Paste your ${scratchSource.toUpperCase()} here...`}
                value={scratchInput}
                onChange={e => {
                  setScratchInput(e.target.value);
                }}
              />
            </div>

            <div className="scratchpad-pane">
              <div className="pane-header">
                <span>Output ({scratchTarget.toUpperCase()})</span>
                {scratchOutput && (
                  <button
                    className="btn-icon"
                    onClick={() => {
                      navigator.clipboard.writeText(scratchOutput);
                      setHasCopied(true);
                      setTimeout(() => setHasCopied(false), 2000);
                    }}
                    title="Copy Output"
                  >
                    {hasCopied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                  </button>
                )}
              </div>
              <textarea
                className="pane-textarea output"
                readOnly
                placeholder="Converted output will appear here..."
                value={scratchOutput}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleScratchpadConvert}>
            <Sparkles size={12} /> Convert Scratchpad
          </button>
        </div>
      )}
    </div>
  );
};
