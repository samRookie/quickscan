import { useState, useEffect, useRef } from 'react';
import ThumbnailStrip from '../components/ThumbnailStrip';

function EnhanceScreen({
  image,
  initialEnhanced,
  initialFilter,
  allImages,
  currentIndex,
  onSelectImage,
  onRemove,
  onReorder,
  onReplace,
  onScanMore,
  onBack,
  onDone
}) {
  const [filters, setFilters] = useState(
    initialEnhanced || { original: image, grayscale: null, document: null }
  );
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || 'original');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);

  const [prevImage, setPrevImage] = useState(image);

  if (image !== prevImage) {
    setPrevImage(image);
    setFilters(initialEnhanced || { original: image, grayscale: null, document: null });
    setSelectedFilter(initialFilter || 'original');
  }

  useEffect(() => {
    let isMounted = true;
    const canvasEl = canvasRef.current;

    if (filters.document && filters.grayscale && filters.original === image) {
      return;
    }

    const processingTimer = setTimeout(() => {
      if (isMounted) setIsProcessing(true);
    }, 0);

    const processImage = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));

      const img = new Image();
      img.onload = () => {
        if (!isMounted) return;

        if (!canvasEl) return;

        const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
        canvasEl.width = img.width;
        canvasEl.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
        const data = imageData.data;

        const grayData = new Uint8ClampedArray(data);
        const docData = new Uint8ClampedArray(data);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const avg = (r + g + b) / 3;
          grayData[i] = avg;
          grayData[i + 1] = avg;
          grayData[i + 2] = avg;
          grayData[i + 3] = data[i + 3];

          const contrastFactor = 1.4;
          const brightnessOffset = 25;

          const applyEnhancement = (channel) => {
            let val = ((channel - 128) * contrastFactor) + 128 + brightnessOffset;
            return Math.min(255, Math.max(0, val));
          };

          docData[i] = applyEnhancement(r);
          docData[i + 1] = applyEnhancement(g);
          docData[i + 2] = applyEnhancement(b);
          docData[i + 3] = data[i + 3];
        }

        ctx.putImageData(new ImageData(grayData, canvasEl.width, canvasEl.height), 0, 0);
        const grayscaleDataUrl = canvasEl.toDataURL('image/jpeg', 1.0);

        ctx.putImageData(new ImageData(docData, canvasEl.width, canvasEl.height), 0, 0);
        const documentDataUrl = canvasEl.toDataURL('image/jpeg', 1.0);

        if (isMounted) {
          setFilters({
            original: image,
            grayscale: grayscaleDataUrl,
            document: documentDataUrl
          });
          setIsProcessing(false);

          // Zero out canvas size to immediately release GPU backing memory
          canvasEl.width = 0;
          canvasEl.height = 0;
        }
      };
      img.src = image;
    };

    processImage();

    return () => {
      isMounted = false;
      clearTimeout(processingTimer);
      if (canvasEl) {
        canvasEl.width = 0;
        canvasEl.height = 0;
      }
    };
  }, [image, filters.document, filters.grayscale, filters.original]);

  const handleDone = () => {
    onDone(filters, selectedFilter);
  };

  const currentDisplayImage = filters[selectedFilter] || image;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="screen-title">Enhance</h2>
        <button className="icon-btn" onClick={() => onRemove && onRemove(currentIndex)}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="content-area" style={{ padding: '0 24px' }}>
        {isProcessing && (
          <div className="status-pill" style={{ top: '50%' }}>
            <div className="status-dot"></div>
            <span className="status-text">PROCESSING</span>
          </div>
        )}

        <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
          <img
            src={currentDisplayImage}
            className="image-preview"
            alt="Enhanced document"
            style={{ maxHeight: '60vh', width: 'auto' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={`btn-secondary ${selectedFilter === 'original' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('original')}
              style={{ borderColor: selectedFilter === 'original' ? 'var(--color-primary)' : '' }}
            >
              Original
            </button>
            <button
              className={`btn-secondary ${selectedFilter === 'grayscale' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('grayscale')}
              disabled={isProcessing}
              style={{ borderColor: selectedFilter === 'grayscale' ? 'var(--color-primary)' : '' }}
            >
              Grayscale
            </button>
            <button
              className={`btn-secondary ${selectedFilter === 'document' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('document')}
              disabled={isProcessing}
              style={{ borderColor: selectedFilter === 'document' ? 'var(--color-primary)' : '' }}
            >
              Document
            </button>
          </div>

          <ThumbnailStrip
            allImages={allImages}
            currentIndex={currentIndex}
            onSelectImage={onSelectImage}
            onScanMore={onScanMore}
            onRemove={onRemove}
            onReorder={onReorder}
            onReplace={onReplace}
          />

          <button className="btn-primary" onClick={handleDone} disabled={isProcessing}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnhanceScreen;
