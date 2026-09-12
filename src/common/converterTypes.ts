export type ConverterCategory = 'documents' | 'images' | 'spreadsheets' | 'data';

export type DocumentFormat = 'docx' | 'md' | 'txt' | 'html' | 'pdf' | 'slide-deck';
export type ImageFormat =
  'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'ico' | 'bmp' | 'base64' | 'multi-res-png';
export type SpreadsheetFormat =
  'xlsx' | 'xls' | 'csv' | 'tsv' | 'json' | 'markdown-table' | 'html-table';
export type DataFormat = 'json' | 'yaml' | 'yml' | 'xml' | 'toml' | 'env';

export interface ConversionOptionConfig {
  quality?: number; // 0.1 to 1.0 for lossy images
  width?: number;
  height?: number;
  indent?: number; // 2 or 4 for JSON/YAML
  sheetIndex?: number;
  includeHeaders?: boolean;
  replaceOriginal?: boolean;
  originalPath?: string;
  multiResolutions?: number[]; // [16, 32, 64, 128, 256, 512]
}

export interface FileConversionRequest {
  id: string;
  fileName: string;
  sourceFormat: string;
  targetFormat: string;
  dataBase64?: string;
  textData?: string;
  options?: ConversionOptionConfig;
}

export interface FileConversionResult {
  id: string;
  success: boolean;
  fileName: string;
  targetFormat: string;
  outputDataBase64?: string;
  outputText?: string;
  isBinary: boolean;
  mimeType: string;
  sizeBytes: number;
  error?: string;
  multiFiles?: { fileName: string; dataBase64: string; sizeBytes: number }[];
}

export interface BatchFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  ext: string;
  targetFormat: string;
  status: 'pending' | 'converting' | 'success' | 'error';
  result?: FileConversionResult;
  error?: string;
}

export interface FormatCapability {
  format: string;
  label: string;
  category: ConverterCategory;
  extensions: string[];
  targets: {
    format: string;
    label: string;
    extension: string;
    isBinary: boolean;
  }[];
}
