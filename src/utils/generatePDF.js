import { jsPDF } from 'jspdf';

/**
 * Generates a PDF from an array of document objects.
 * @param {Array} images - Array of { original, cropped, enhanced, selectedFilter }
 * @returns {jsPDF} - The generated jsPDF instance.
 */
export async function generatePDF(images) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;

  for (let i = 0; i < images.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const docObj = images[i];
    const imageData = docObj.enhanced?.[docObj.selectedFilter] || docObj.cropped || docObj.original;

    if (!imageData) continue;

    // Get natural dimensions of the image
    const imgProps = pdf.getImageProperties(imageData);

    let pdfWidth = A4_WIDTH;
    let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // If image is too tall for A4, scale it down to fit height
    if (pdfHeight > A4_HEIGHT) {
      pdfHeight = A4_HEIGHT;
      pdfWidth = (imgProps.width * pdfHeight) / imgProps.height;
    }

    // Center the image on the A4 page
    const x = (A4_WIDTH - pdfWidth) / 2;
    const y = (A4_HEIGHT - pdfHeight) / 2;

    pdf.addImage(imageData, 'JPEG', x, y, pdfWidth, pdfHeight);
  }

  return pdf;
}
