import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generatePDF } from '../utils/generatePDF';
import ThumbnailStrip from '../components/ThumbnailStrip';

function sanitizeFilename(name) {
  return name
    .replace(/[/\\<>:"|?*]/g, '')
    .replace(/\.\./g, '')
    .replace(/\s+/g, '_')
    .trim() || 'QuickScan_Document';
}

function ExportScreen({
  allImages,
  documentVersion = 0,
  currentIndex,
  onSelectImage,
  onRemove,
  onReorder,
  onReplace,
  onScanMore,
  onBack,
  onFinish
}) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [fileName, setFileName] = useState(`QuickScan_Document`);
  const [retryCount, setRetryCount] = useState(0);
  const [shareNotice, setShareNotice] = useState(false);
  const blobUrlRef = useRef(null);
  const allImagesRef = useRef(allImages);

  useEffect(() => {
    allImagesRef.current = allImages;
  }, [allImages]);

  useEffect(() => {
    let isMounted = true;
    const imagesForPdf = allImagesRef.current;

    async function buildPDF() {
      await new Promise(r => setTimeout(r, 50));

      try {
        const pdf = await generatePDF(imagesForPdf);
        const blob = pdf.output('blob');
        if (isMounted) {
          setPdfBlob(blob);
          setPdfError(null);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
        if (isMounted) {
          setPdfError(err.message || 'Unknown error');
          setIsGenerating(false);
        }
      }
    }

    const generationTimer = setTimeout(() => {
      setIsGenerating(true);

      if (imagesForPdf && imagesForPdf.length > 0) {
        buildPDF();
      } else if (isMounted) {
        if (isMounted) {
          setPdfBlob(null);
          setPdfError(null);
          setIsGenerating(false);
        }
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(generationTimer);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [documentVersion, retryCount]);

  useEffect(() => {
    if (!shareNotice) return;
    const timer = setTimeout(() => {
      setShareNotice(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [shareNotice]);

  const handleDownload = useCallback(async () => {
    if (!pdfBlob) return;

    const safeName = sanitizeFilename(fileName);
    const fullFileName = `${safeName}.pdf`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fullFileName,
          types: [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('File System API failed, falling back to basic download:', err);
      }
    }

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const url = URL.createObjectURL(pdfBlob);
    blobUrlRef.current = url;
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    a.href = '';

    window.setTimeout(() => {
      if (blobUrlRef.current === url) {
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
      }
    }, 0);
  }, [fileName, pdfBlob]);

  const handleShare = useCallback(async () => {
    if (!pdfBlob) return;

    const safeName = sanitizeFilename(fileName);
    const fullFileName = `${safeName}.pdf`;
    const file = new File([pdfBlob], fullFileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Scanned Document',
          text: 'Here is your scanned document.'
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setShareNotice(true);
      handleDownload();
    }
  }, [fileName, handleDownload, pdfBlob]);

  const handleRetryPdf = useCallback(() => {
    setIsGenerating(true);
    setPdfError(null);
    setRetryCount((count) => count + 1);
  }, []);

  const handleFileNameChange = useCallback((e) => {
    setFileName(sanitizeFilename(e.target.value));
  }, []);

  const handleRemoveCurrent = useCallback(() => {
    onRemove?.(currentIndex);
  }, [currentIndex, onRemove]);

  const handleFallbackImageDownload = useCallback(() => {
    allImages.forEach((img, idx) => {
      const url = img.enhanced?.[img.selectedFilter] || img.cropped || img.original;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'QuickScan'}_page_${idx + 1}.jpg`;
      a.click();
      a.href = '';
    });
  }, [allImages, fileName]);

  const previewImage = useMemo(() => (allImages.length > 0
    ? (allImages[0].preview || null)
    : null
  ), [allImages]);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="screen-title">Export PDF</h2>
        <button className="icon-btn" onClick={handleRemoveCurrent}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="content-area">
        {isGenerating ? (
          <div style={{ textAlign: 'center' }}>
            <div className="status-pill" style={{ position: 'relative', left: 'auto', transform: 'none', margin: '0 auto 24px' }}>
              <div className="status-dot"></div>
              <span className="status-text">GENERATING PDF</span>
            </div>
            <p style={{ color: 'var(--color-text-dim)' }}>Processing {allImages.length} page{allImages.length !== 1 ? 's' : ''}</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {previewImage && (
              <img src={previewImage} className="image-preview" alt="Preview" style={{ width: '140px', margin: '0 auto' }} />
            )}

            {pdfError ? (
              <div style={{ backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 8px', color: '#ff4444' }}>Generation Failed</h3>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>{pdfError}</p>
                <button className="btn-primary" onClick={handleRetryPdf}>
                  Retry PDF
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>Ready to Export</h3>
                  <p style={{ color: 'var(--color-text-dim)', margin: 0, fontSize: '14px' }}>{allImages.length} page{allImages.length !== 1 ? 's' : ''} Document</p>
                </div>

                  <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>File Name</label>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px' }}>
                      <input
                        type="text"
                        value={fileName}
                        onChange={handleFileNameChange}
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-white)', fontSize: '16px', width: '100%' }}
                        placeholder="Enter filename"
                      />
                    <span style={{ color: 'var(--color-text-dim)', marginLeft: '8px' }}>.pdf</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn-primary" onClick={handleShare} disabled={!pdfBlob}>
                    <span className="material-symbols-outlined">share</span> Share PDF
                  </button>
                  <button className="btn-secondary" onClick={handleDownload} disabled={!pdfBlob}>
                    <span className="material-symbols-outlined">download</span> Download
                  </button>
                </div>

                {shareNotice && (
                  <div className="inline-notice" role="status" aria-live="polite">
                    Sharing is not supported here, so the PDF download started instead.
                  </div>
                )}

                <ThumbnailStrip
                  allImages={allImages}
                  currentIndex={currentIndex}
                  onSelectImage={onSelectImage}
                  onScanMore={onScanMore}
                  onRemove={onRemove}
                  onReorder={onReorder}
                  onReplace={onReplace}
                />
              </>
            )}

            {pdfError && (
              <button className="btn-secondary" onClick={handleFallbackImageDownload}>
                <span className="material-symbols-outlined">image</span> Fallback: Download Images
              </button>
            )}

            {onFinish && (
              <button className="btn-secondary" onClick={onFinish} style={{ marginTop: '4px', border: 'none', backgroundColor: 'transparent' }}>
                <span className="material-symbols-outlined">restart_alt</span> Start Over
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)', fontSize: '12px', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
              <p style={{ margin: 0 }}>Processed locally. No cloud storage.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportScreen;
