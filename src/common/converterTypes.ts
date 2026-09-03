export type ConverterCategory = 'documents' | 'images' | 'spreadsheets' | 'data';

export type DocumentFormat = 'docx' | 'md' | 'txt' | 'html' | 'pdf';
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'ico' | 'bmp' | 'base64';
export type SpreadsheetFormat = 'xlsx' | 'xls' | 'csv' | 'tsv' | 'json' | 'markdown-table' | 'html-table';
export type DataFormat = 'json' | 'yaml' | 'yml' | 'xml' | 'toml' | 'env';

export interface ConversionOptionConfig {
  quality?: number; // 0.1 to 1.0 for lossy images
  width?: number;
  height?: number;
  indent?: number; // 2 or 4 for JSON/YAML
  sheetIndex?: number;
  includeHeaders?: boolean;
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
