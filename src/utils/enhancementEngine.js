import { ENHANCEMENT_MODES } from '../constants/formatConstants.js';

export const ENHANCEMENT_DEFINITIONS = Object.freeze({
  [ENHANCEMENT_MODES.ORIGINAL]: {
    id: ENHANCEMENT_MODES.ORIGINAL,
    label: 'Original',
  },
  [ENHANCEMENT_MODES.GRAYSCALE]: {
    id: ENHANCEMENT_MODES.GRAYSCALE,
    label: 'Grayscale',
  },
  [ENHANCEMENT_MODES.DOCUMENT]: {
    id: ENHANCEMENT_MODES.DOCUMENT,
    label: 'Document',
  },
  [ENHANCEMENT_MODES.RECEIPT]: {
    id: ENHANCEMENT_MODES.RECEIPT,
    label: 'Receipt',
  },
});

export const ENHANCEMENT_FILTERS = Object.freeze(Object.keys(ENHANCEMENT_DEFINITIONS));

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

function clampChannel(value) {
  return Math.min(255, Math.max(0, value));
}

function applyDocumentChannel(channel) {
  return clampChannel(((channel - 128) * 1.4) + 128 + 25);
}

function applyReceiptChannel(channel, average) {
  const contrasted = ((channel - 128) * 1.75) + 128 + 35;
  const textBoost = average < 115 ? contrasted - 28 : contrasted + 10;
  return clampChannel(textBoost);
}

function createFilterData(sourceData, filterName) {
  const output = new Uint8ClampedArray(sourceData);

  for (let i = 0; i < sourceData.length; i += 4) {
    const r = sourceData[i];
    const g = sourceData[i + 1];
    const b = sourceData[i + 2];
    const avg = (r + g + b) / 3;

    if (filterName === ENHANCEMENT_MODES.GRAYSCALE) {
      output[i] = avg;
      output[i + 1] = avg;
      output[i + 2] = avg;
    } else if (filterName === ENHANCEMENT_MODES.DOCUMENT) {
      output[i] = applyDocumentChannel(r);
      output[i + 1] = applyDocumentChannel(g);
      output[i + 2] = applyDocumentChannel(b);
    } else if (filterName === ENHANCEMENT_MODES.RECEIPT) {
      output[i] = applyReceiptChannel(r, avg);
      output[i + 1] = applyReceiptChannel(g, avg);
      output[i + 2] = applyReceiptChannel(b, avg);
    }

    output[i + 3] = sourceData[i + 3];
  }

  return output;
}

export function createEnhancementResult(sourceImage, existing = null) {
  const result = {
    [ENHANCEMENT_MODES.ORIGINAL]: sourceImage || '',
  };

  ENHANCEMENT_FILTERS.forEach((filterName) => {
    if (filterName === ENHANCEMENT_MODES.ORIGINAL) return;
    result[filterName] = existing?.[filterName] || null;
  });

  return result;
}

export async function processImage(sourceImage, options = {}) {
  const modes = options.modes || ENHANCEMENT_FILTERS;
  const quality = options.quality ?? 1.0;
  const result = createEnhancementResult(sourceImage, options.existing);

  if (!sourceImage) {
    return result;
  }

  const requestedModes = modes.filter((mode) => (
    mode && mode !== ENHANCEMENT_MODES.ORIGINAL && ENHANCEMENT_DEFINITIONS[mode]
  ));

  if (requestedModes.length === 0) {
    return result;
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
          console.warn('[enhancementEngine] Canvas context unavailable; using original image fallback.');
          settle(result);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        requestedModes.forEach((mode) => {
          const filteredData = createFilterData(imageData.data, mode);
          ctx.putImageData(new ImageData(filteredData, canvas.width, canvas.height), 0, 0);
          result[mode] = canvas.toDataURL('image/jpeg', quality);
        });

        settle(result);
      } catch (err) {
        console.warn('[enhancementEngine] Enhancement processing failed; using original image fallback:', err);
        settle(result);
      }
    };

    img.onerror = () => {
      console.warn('[enhancementEngine] Image failed to load; using original image fallback.');
      settle(result);
    };

    img.src = sourceImage;
  });
}

export async function applyEnhancement(sourceImage, filterName, options = {}) {
  if (!sourceImage || !filterName || filterName === ENHANCEMENT_MODES.ORIGINAL) {
    return sourceImage;
  }

  const result = await processImage(sourceImage, {
    modes: [filterName],
    quality: options.quality ?? 1.0,
  });

  return result[filterName] || sourceImage;
}

export function enhanceGrayscale(sourceImage, options) {
  return applyEnhancement(sourceImage, ENHANCEMENT_MODES.GRAYSCALE, options);
}

export function enhanceDocument(sourceImage, options) {
  return applyEnhancement(sourceImage, ENHANCEMENT_MODES.DOCUMENT, options);
}

export function enhanceReceipt(sourceImage, options) {
  return applyEnhancement(sourceImage, ENHANCEMENT_MODES.RECEIPT, options);
}
