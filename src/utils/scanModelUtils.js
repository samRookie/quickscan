import { getFormatPresetById, sanitizeFormatPreset } from './formatUtils.js';

function releaseCanvas(canvas) {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}

function releaseImage(img) {
  if (!img) return;
  img.onload = null;
  img.onerror = null;
  img.src = '';
}

/**
 * Normalizes an old or partial scan object to follow the new, extended format-aware scan model structure.
 * Ensures absolute backward compatibility.
 *
 * @param {Object} scan - The raw scan object to normalize.
 * @returns {Object} A fully-formed, migrated scan object.
 */
export function normalizeScanFormat(scan) {
  if (!scan || typeof scan !== 'object') {
    return null;
  }

  // Clone original to avoid state mutation side-effects
  const normalized = { ...scan };

  // 1. Ensure ID exists
  if (!normalized.id) {
    normalized.id = Date.now() + Math.floor(Math.random() * 1000);
  }

  // 2. Map old/new image properties for dual compatibility
  normalized.original = normalized.original || normalized.originalImage || '';
  normalized.originalImage = normalized.originalImage || normalized.original || '';

  normalized.cropped = normalized.cropped || normalized.croppedImage || null;
  normalized.croppedImage = normalized.croppedImage || normalized.cropped || null;

  // Lightweight derivatives are owned separately from source image data.
  // Do not promote full-resolution originals into thumbnail/preview slots.
  normalized.thumbnail = normalized.thumbnail || '';
  normalized.preview = normalized.preview || '';

  // Map active filter enhancement
  let activeEnhanced = null;
  if (normalized.enhanced && typeof normalized.enhanced === 'object') {
    const filter = normalized.selectedFilter || 'original';
    activeEnhanced = normalized.enhanced[filter];
  }
  normalized.enhancedImage = normalized.enhancedImage || activeEnhanced || normalized.croppedImage || normalized.originalImage || '';
  
  if (!normalized.enhanced) {
    normalized.enhanced = {
      original: normalized.cropped || normalized.original || '',
      grayscale: null,
      document: null
    };
    normalized.selectedFilter = normalized.selectedFilter || 'original';
  }

  // 3. Normalize format snapshot (Task 6 compatibility layer)
  if (!normalized.format || typeof normalized.format !== 'object') {
    const defaultPreset = getFormatPresetById('freeform');
    normalized.format = {
      presetId: defaultPreset.id,
      aspectRatio: defaultPreset.aspectRatio, // Physical ratio (null for Freeform)
      orientation: defaultPreset.orientation,
      category: defaultPreset.category
    };
  } else {
    const preset = getFormatPresetById(normalized.format.presetId);
    normalized.format = {
      presetId: normalized.format.presetId || preset.id,
      aspectRatio: 'aspectRatio' in normalized.format ? normalized.format.aspectRatio : preset.aspectRatio,
      orientation: normalized.format.orientation || preset.orientation,
      category: normalized.format.category || preset.category
    };
  }

  // 4. Normalize metadata snapshot
  const now = Date.now();
  if (!normalized.metadata || typeof normalized.metadata !== 'object') {
    normalized.metadata = {
      createdAt: now,
      modifiedAt: now,
      captureMode: normalized.isLowQuality ? 'front' : 'rear'
    };
  } else {
    normalized.metadata = {
      createdAt: normalized.metadata.createdAt || now,
      modifiedAt: normalized.metadata.modifiedAt || now,
      captureMode: normalized.metadata.captureMode || 'rear'
    };
  }

  return normalized;
}

/**
 * Attaches a format snapshot to a scan object.
 *
 * @param {Object} scan - The scan object to attach format metadata to.
 * @param {Object|string} presetInput - Preset object or preset ID string.
 * @returns {Object} A new, format-aware scan object.
 */
export function attachFormatToScan(scan, presetInput) {
  const normalized = normalizeScanFormat(scan);
  if (!normalized) return null;

  const preset = typeof presetInput === 'string'
    ? getFormatPresetById(presetInput)
    : sanitizeFormatPreset(presetInput);

  return {
    ...normalized,
    format: {
      presetId: preset.id,
      aspectRatio: preset.aspectRatio, // Snapshot physical aspect ratio
      orientation: preset.orientation,
      category: preset.category
    },
    metadata: {
      ...normalized.metadata,
      modifiedAt: Date.now()
    }
  };
}

/**
 * Safely updates the format metadata inside a scan object.
 * Returns a new, updated scan object while preserving all other properties.
 *
 * @param {Object} scan - The scan object to update.
 * @param {Object|string} presetInput - Preset object or preset ID string.
 * @returns {Object} A new, updated format-aware scan object.
 */
export function updateScanFormatSafely(scan, presetInput) {
  return attachFormatToScan(scan, presetInput);
}

/**
 * Retrieves the format metadata snapshot from a scan object safely.
 *
 * @param {Object} scan - The scan object.
 * @returns {Object} The format metadata object.
 */
export function getScanFormat(scan) {
  const normalized = normalizeScanFormat(scan);
  return normalized ? normalized.format : null;
}

/**
 * Asynchronously generates a compressed lightweight thumbnail (120x160px JPEG, ~5-10KB)
 * using an offscreen canvas.
 *
 * @param {string} base64Src - The original high-resolution base64 image source.
 * @param {number} maxWidth - Target max width.
 * @param {number} maxHeight - Target max height.
 * @returns {Promise<string>} A Promise that resolves to the compressed thumbnail base64 string.
 */
export async function generateThumbnail(base64Src, maxWidth = 120, maxHeight = 160) {
  if (!base64Src) return '';
  return new Promise((resolve) => {
    const img = new Image();
    let canvas = null;

    const settle = (value) => {
      releaseCanvas(canvas);
      releaseImage(img);
      resolve(value);
    };

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          settle('');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
        settle(canvas.toDataURL('image/jpeg', 0.8));
      } catch (err) {
        console.warn('[scanModelUtils] Thumbnail generation failed:', err);
        settle('');
      }
    };
    img.onerror = () => {
      settle('');
    };
    img.src = base64Src;
  });
}

/**
 * Asynchronously generates a compressed lightweight preview (800px max dimension, ~40-50KB JPEG)
 * using an offscreen canvas.
 *
 * @param {string} base64Src - The original high-resolution base64 image source.
 * @param {number} maxDim - Target max dimension (width or height).
 * @returns {Promise<string>} A Promise that resolves to the compressed preview base64 string.
 */
export async function generatePreview(base64Src, maxDim = 800) {
  if (!base64Src) return '';
  return new Promise((resolve) => {
    const img = new Image();
    let canvas = null;

    const settle = (value) => {
      releaseCanvas(canvas);
      releaseImage(img);
      resolve(value);
    };

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          settle('');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        settle(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        console.warn('[scanModelUtils] Preview generation failed:', err);
        settle('');
      }
    };
    img.onerror = () => {
      settle('');
    };
    img.src = base64Src;
  });
}

/**
 * Asynchronously applies Grayscale or Document filter enhancements to a raw high-resolution base64 scan
 * using a background offscreen canvas. Used on-demand during exports.
 *
 * @param {string} base64Src - The natural high-resolution base64 image.
 * @param {string} filterName - The name of the enhancement filter ('original', 'grayscale', 'document').
 * @returns {Promise<string>} A Promise that resolves to the processed high-resolution base64 JPEG.
 */
export async function applyFilterToImage(base64Src, filterName) {
  if (!base64Src || !filterName || filterName === 'original') {
    return base64Src;
  }

  return new Promise((resolve) => {
    const img = new Image();
    let canvas = null;

    const settle = (value) => {
      releaseCanvas(canvas);
      releaseImage(img);
      resolve(value);
    };

    img.onload = () => {
      try {
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          settle(base64Src);
          return;
        }
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        if (filterName === 'grayscale') {
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
          }
          ctx.putImageData(imageData, 0, 0);
          settle(canvas.toDataURL('image/jpeg', 0.95));
        } else if (filterName === 'document') {
          const contrastFactor = 1.4;
          const brightnessOffset = 25;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrastFactor) + 128 + brightnessOffset));
            data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrastFactor) + 128 + brightnessOffset));
            data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrastFactor) + 128 + brightnessOffset));
          }
          ctx.putImageData(imageData, 0, 0);
          settle(canvas.toDataURL('image/jpeg', 0.95));
        } else {
          settle(base64Src);
        }
      } catch (err) {
        console.warn('[scanModelUtils] Filter application failed:', err);
        settle(base64Src);
      }
    };
    img.onerror = () => {
      settle(base64Src);
    };
    img.src = base64Src;
  });
}


