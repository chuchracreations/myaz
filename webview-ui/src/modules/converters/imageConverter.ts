export interface ImageConversionOptions {
  format: 'png' | 'jpg' | 'jpeg' | 'webp' | 'ico' | 'base64' | 'multi-res-png';
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
}

export interface ConvertedImageResult {
  dataUrl: string;
  base64: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: string;
  mimeType: string;
  multiFiles?: MultiResPngItem[];
}

export interface MultiResPngItem {
  size: number;
  fileName: string;
  dataUrl: string;
  base64: string;
  sizeBytes: number;
}

/**
 * Convert an image file or DataUrl using HTML5 Canvas
 */
export async function convertImage(
  fileOrUrl: File | string,
  options: ImageConversionOptions,
  baseName = 'image'
): Promise<ConvertedImageResult> {
  const img = await loadImage(fileOrUrl);

  // Multi-Resolution SVG/PNG Mode
  if (options.format === 'multi-res-png') {
    const multiFiles = await convertSvgToMultiRes(fileOrUrl, baseName);
    const primary = multiFiles[multiFiles.length - 1]; // largest e.g. 512px
    return {
      dataUrl: primary.dataUrl,
      base64: primary.base64,
      sizeBytes: primary.sizeBytes,
      width: primary.size,
      height: primary.size,
      format: 'multi-res-png',
      mimeType: 'image/png',
      multiFiles,
    };
  }

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  // Optional proportional resizing
  if (options.maxWidth && targetWidth > options.maxWidth) {
    targetHeight = Math.round((targetHeight * options.maxWidth) / targetWidth);
    targetWidth = options.maxWidth;
  }
  if (options.maxHeight && targetHeight > options.maxHeight) {
    targetWidth = Math.round((targetWidth * options.maxHeight) / targetHeight);
    targetHeight = options.maxHeight;
  }

  // Favicon ICO mode
  if (options.format === 'ico') {
    return await generateIco(img, 32);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas context');

  // Fill white background for JPG if transparent
  if (options.format === 'jpg' || options.format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let mimeType = 'image/png';
  if (options.format === 'jpg' || options.format === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (options.format === 'webp') {
    mimeType = 'image/webp';
  }

  const quality = options.quality !== undefined ? options.quality : 0.92;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const base64 = dataUrl.split(',')[1] || '';
  const sizeBytes = Math.round((base64.length * 3) / 4);

  return {
    dataUrl,
    base64,
    sizeBytes,
    width: targetWidth,
    height: targetHeight,
    format: options.format,
    mimeType,
  };
}

/**
 * Convert SVG or Image into a full set of PNG icon resolutions
 */
export async function convertSvgToMultiRes(
  fileOrUrl: File | string,
  baseName: string,
  sizes = [16, 32, 64, 128, 256, 512]
): Promise<MultiResPngItem[]> {
  const img = await loadImage(fileOrUrl);
  const results: MultiResPngItem[] = [];

  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1] || '';
    const sizeBytes = Math.round((base64.length * 3) / 4);

    results.push({
      size,
      fileName: `${baseName}-${size}x${size}.png`,
      dataUrl,
      base64,
      sizeBytes,
    });
  }

  return results;
}

function loadImage(fileOrUrl: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image into memory.'));

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsDataURL(fileOrUrl);
    }
  });
}

/**
 * Generate a standard Windows / Web ICO file binary from canvas
 */
async function generateIco(img: HTMLImageElement, size = 32): Promise<ConvertedImageResult> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0, size, size);
  const pngDataUrl = canvas.toDataURL('image/png');
  const pngBase64 = pngDataUrl.split(',')[1];
  const pngBinary = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));

  const icoBuffer = new Uint8Array(6 + 16 + pngBinary.length);
  const view = new DataView(icoBuffer.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);

  icoBuffer[6] = size >= 256 ? 0 : size;
  icoBuffer[7] = size >= 256 ? 0 : size;
  icoBuffer[8] = 0;
  icoBuffer[9] = 0;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBinary.length, true);
  view.setUint32(18, 22, true);

  icoBuffer.set(pngBinary, 22);

  let binaryStr = '';
  for (let i = 0; i < icoBuffer.length; i++) {
    binaryStr += String.fromCharCode(icoBuffer[i]);
  }
  const icoBase64 = btoa(binaryStr);
  const dataUrl = `data:image/x-icon;base64,${icoBase64}`;

  return {
    dataUrl,
    base64: icoBase64,
    sizeBytes: icoBuffer.length,
    width: size,
    height: size,
    format: 'ico',
    mimeType: 'image/x-icon',
  };
}
