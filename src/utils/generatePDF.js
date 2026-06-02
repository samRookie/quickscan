import { jsPDF } from 'jspdf';
import { normalizeScanFormat } from './scanModelUtils.js';
import { applyEnhancement } from './enhancementEngine.js';
import { getExportPageDimensions, calculateImagePlacement } from './exportPageMapping.js';

async function resolveExportImage(scan) {
  const filterName = scan.selectedFilter || 'original';
  const rawSource = scan.cropped || scan.original;

  if (!rawSource || filterName === 'original') {
    return rawSource;
  }

  return scan.filterCache?.[filterName] || applyEnhancement(rawSource, filterName);
}

/**
 * Generates a high-quality PDF from an array of scan page objects.
 * Supports mixed formats, proportional scaling, dynamic margins, and safe fallbacks.
 *
 * @param {Array} images - Array of page scan objects.
 * @returns {jsPDF} - The dynamically generated and aligned jsPDF instance.
 */
export async function generatePDF(images) {
  if (!images || images.length === 0) {
    return new jsPDF();
  }

  // 1. Pre-calculate first page dimensions to initialize jsPDF instance correctly
  const firstScan = normalizeScanFormat(images[0]);
  const firstData = await resolveExportImage(firstScan);
  
  let firstWidth = 210;
  let firstHeight = 297;
  let firstOrientation = 'portrait';
  
  if (firstData) {
    const tempPdf = new jsPDF();
    try {
      const imgProps = tempPdf.getImageProperties(firstData);
      const dims = getExportPageDimensions(firstScan, imgProps.width, imgProps.height);
      firstWidth = dims.width;
      firstHeight = dims.height;
      firstOrientation = dims.orientation;
    } catch (err) {
      console.warn('[generatePDF] Synchronous image query failed for first page initialization:', err);
    }
  }

  // Initialize jsPDF with the exact dimensions and orientation of the first page
  const pdf = new jsPDF({
    orientation: firstOrientation,
    unit: 'mm',
    format: [firstWidth, firstHeight]
  });

  // 2. Iterate pages and render dynamic scales and custom margins
  for (let i = 0; i < images.length; i++) {
    const scan = normalizeScanFormat(images[i]);
    const imageData = await resolveExportImage(scan);

    if (!imageData) continue;

    try {
      // Query natural width/height properties synchronously in microseconds
      const imgProps = pdf.getImageProperties(imageData);
      
      // Calculate dynamic physical dimensions, orientation, and margins for this specific page preset
      const { width: pageWidth, height: pageHeight, orientation, margin } = getExportPageDimensions(
        scan,
        imgProps.width,
        imgProps.height
      );

      // Page 1 is already created at initialization with correct bounds; subsequent pages are added dynamically
      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight], orientation);
      }

      // Calculate format-aware scaling and stable margin alignments
      const { x, y, width: drawWidth, height: drawHeight } = calculateImagePlacement(
        pageWidth,
        pageHeight,
        imgProps.width,
        imgProps.height,
        margin,
        'adaptive'
      );

      // Render original image fidelity into the PDF canvas coordinates
      pdf.addImage(imageData, 'JPEG', x, y, drawWidth, drawHeight);
    } catch (err) {
      console.error(`[generatePDF] Failed to compile page ${i + 1}:`, err);
      // Fallback: add page with default A4 if page addition crashed
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297);
    }
  }

  return pdf;
}
