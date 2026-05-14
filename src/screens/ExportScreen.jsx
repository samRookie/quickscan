import { useState, useEffect, useRef } from 'react';
import { generatePDF } from '../utils/generatePDF';
import ThumbnailStrip from '../components/ThumbnailStrip';

function sanitizeFilename(name) {
  return name
    .replace(/[/\\<>:"|?*]/g, '')
    .replace(/\.\./g, '')
    .replace(/\s+/g, '_')
    .trim() || 'QuickScan_Document';
}

function ExportScreen({ allImages, currentIndex, onSelectImage, onRemove, onScanMore, onBack, onFinish }) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [fileName, setFileName] = useState(`QuickScan_Document`);
  const [retryCount, setRetryCount] = useState(0);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function buildPDF() {
      await new Promise(r => setTimeout(r, 50));

      try {
        const pdf = await generatePDF(allImages);
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

    if (allImages && allImages.length > 0) {
      buildPDF();
    } else {
      const emptyTimer = setTimeout(() => {
        if (isMounted) setIsGenerating(false);
      }, 0);
      return () => {
        isMounted = false;
        clearTimeout(emptyTimer);
      };
    }

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [allImages, retryCount]);

  const handleDownload = async () => {
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
  };

  const handleShare = async () => {
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
      alert("Sharing is not supported on this device or browser. Downloading instead.");
      handleDownload();
    }
  };

  const previewImage = allImages.length > 0
    ? (allImages[0].enhanced?.[allImages[0].selectedFilter] || allImages[0].cropped || allImages[0].original)
    : null;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="screen-title">Export PDF</h2>
        <button className="icon-btn" onClick={() => onRemove && onRemove(currentIndex)}>
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
                <button className="btn-primary" onClick={() => { setIsGenerating(true); setPdfError(null); setRetryCount((count) => count + 1); }}>
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
                        onChange={(e) => setFileName(sanitizeFilename(e.target.value))}
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

                <ThumbnailStrip
                  allImages={allImages}
                  currentIndex={currentIndex}
                  onSelectImage={onSelectImage}
                  onScanMore={onScanMore}
                />
              </>
            )}

            {pdfError && (
              <button className="btn-secondary" onClick={() => {
                allImages.forEach((img, idx) => {
                  const url = img.enhanced?.[img.selectedFilter] || img.cropped || img.original;
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${fileName || 'QuickScan'}_page_${idx+1}.jpg`;
                  a.click();
                });
              }}>
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
