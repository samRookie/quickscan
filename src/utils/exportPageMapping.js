import { DEFAULT_FORMAT_PRESET } from '../config/formatPresets.js';
import { getFormatPresetById } from './formatUtils.js';

/**
 * Resolves the physical page dimensions (width, height in mm) and orientation
 * for a page scan based on its format preset and the image's actual aspect ratio.
 *
 * @param {Object} scan - The page scan object.
 * @param {number} imgWidth - Natural width of the processed image.
 * @param {number} imgHeight - Natural height of the processed image.
 * @returns {Object} { width, height, orientation, margin }
 */
export function getExportPageDimensions(scan, imgWidth, imgHeight) {
  // Safe preset resolution
  let preset = DEFAULT_FORMAT_PRESET;
  try {
    if (scan?.format?.presetId) {
      preset = getFormatPresetById(scan.format.presetId);
    }
  } catch (e) {
    console.warn('[exportPageMapping] Error resolving preset, falling back to default:', e);
  }

  const imageRatio = (imgWidth && imgHeight) ? imgWidth / imgHeight : 1; // width / height

  let width;
  let height;
  let orientation;
  let margin;

  switch (preset.id) {
    case 'a4':
      width = 210;
      height = 297;
      orientation = preset.orientation || 'portrait';
      margin = 10; // Standard 10mm print margins
      break;
    case 'letter':
      width = 215.9;
      height = 279.4;
      orientation = preset.orientation || 'portrait';
      margin = 10; // Standard 10mm print margins
      break;
    case 'id_card':
      width = 85.6;
      height = 53.98;
      orientation = preset.orientation || 'landscape';
      margin = 4; // Clean framing margins for pocket cards
      break;
    case 'business_card':
      width = 88.9;
      height = 50.8;
      orientation = preset.orientation || 'landscape';
      margin = 4; // Clean framing margins for business cards
      break;
    case 'receipt':
      width = 80;
      // Dynamic height based on image proportions to capture long receipts cleanly without shrinking
      if (imageRatio > 0) {
        height = 80 / imageRatio;
      } else {
        height = 80 * 2.5; // fallback to standard receipt ratio
      }
      orientation = 'portrait';
      margin = 5; // Tight margins for vertical thermal paper lists
      break;
    case 'freeform':
    default:
      // Adaptive sizing based on image dimensions
      width = 210; // base on standard A4 width
      if (imageRatio > 0) {
        height = 210 / imageRatio;
      } else {
        height = 297;
      }
      orientation = imageRatio >= 1 ? 'landscape' : 'portrait';
      margin = 0; // Borderless look for custom shapes
      break;
  }

  // Double-check and enforce absolute sanity of values
  if (isNaN(width) || width <= 0) width = 210;
  if (isNaN(height) || height <= 0) height = 297;
  if (isNaN(margin) || margin < 0) margin = 0;

  // Ensure orientation matches dimensions (swap if inconsistent)
  const isLandscape = orientation === 'landscape';
  const currentIsLandscape = width > height;

  if (isLandscape !== currentIsLandscape) {
    const temp = width;
    width = height;
    height = temp;
  }

  return {
    width,
    height,
    orientation,
    margin
  };
}

/**
 * Calculates proportional coordinates and dimensions for placing the image on the PDF page.
 *
 * @param {number} pageWidth - Page width in mm.
 * @param {number} pageHeight - Page height in mm.
 * @param {number} imgWidth - Natural width of image.
 * @param {number} imgHeight - Natural height of image.
 * @param {number} margin - Safe page margin in mm.
 * @param {string} fitMode - Scaling fit behavior ('contain' | 'fit-width' | 'fit-height' | 'adaptive')
 * @returns {Object} { x, y, width, height } in mm coordinates.
 */
export function calculateImagePlacement(pageWidth, pageHeight, imgWidth, imgHeight, margin = 0, fitMode = 'adaptive') {
  const printableWidth = Math.max(0, pageWidth - 2 * margin);
  const printableHeight = Math.max(0, pageHeight - 2 * margin);

  const imgRatio = (imgWidth && imgHeight) ? imgWidth / imgHeight : 1; // width / height ratio

  let targetWidth = printableWidth;
  let targetHeight = printableWidth / imgRatio;

  // Resolve adaptive mode based on proportions and formats
  let resolvedMode = fitMode;
  if (fitMode === 'adaptive') {
    if (imgHeight > 1.8 * imgWidth) {
      resolvedMode = 'fit-width'; // Tall receipt-like images prioritize width fit
    } else {
      resolvedMode = 'contain';
    }
  }

  if (resolvedMode === 'contain') {
    // Fit completely inside the printable area
    if (targetHeight > printableHeight) {
      targetHeight = printableHeight;
      targetWidth = printableHeight * imgRatio;
    }
  } else if (resolvedMode === 'fit-width') {
    targetWidth = printableWidth;
    targetHeight = printableWidth / imgRatio;
    
    // Safety check: if width fit is so large that it overflows printable height on standard files, scale it back
    if (targetHeight > printableHeight && fitMode !== 'adaptive') {
      targetHeight = printableHeight;
      targetWidth = printableHeight * imgRatio;
    }
  } else if (resolvedMode === 'fit-height') {
    targetHeight = printableHeight;
    targetWidth = printableHeight * imgRatio;
  }

  // Centering math inside the printable boundaries
  const x = margin + (printableWidth - targetWidth) / 2;
  const y = margin + (printableHeight - targetHeight) / 2;

  return {
    x,
    y,
    width: targetWidth,
    height: targetHeight
  };
}
