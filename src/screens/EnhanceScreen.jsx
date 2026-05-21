import { useState, useEffect, useRef } from 'react';
import ThumbnailStrip from '../components/ThumbnailStrip';

function EnhanceScreen({ image, initialEnhanced, initialFilter, allImages, currentIndex, onSelectImage, onRemove, onScanMore, onBack, onDone }) {
  const [filters, setFilters] = useState(
    initialEnhanced || { original: image, grayscale: null, document: null }
  );
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || 'original');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);

  // Sync state when active page/image changes to prevent visual bleed from previous image
  useEffect(() => {
    if (initialEnhanced) {
      setFilters(initialEnhanced);
    } else {
      setFilters({ original: image, grayscale: null, document: null });
    }
    setSelectedFilter(initialFilter || 'original');
  }, [image, initialEnhanced, initialFilter]);

  useEffect(() => {
    let isMounted = true;

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

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

        ctx.putImageData(new ImageData(grayData, canvas.width, canvas.height), 0, 0);
        const grayscaleDataUrl = canvas.toDataURL('image/jpeg', 1.0);

        ctx.putImageData(new ImageData(docData, canvas.width, canvas.height), 0, 0);
        const documentDataUrl = canvas.toDataURL('image/jpeg', 1.0);

        if (isMounted) {
          setFilters({
            original: image,
            grayscale: grayscaleDataUrl,
            document: documentDataUrl
          });
          setIsProcessing(false);

          // Zero out canvas size to immediately release GPU backing memory
          canvas.width = 0;
          canvas.height = 0;
        }
      };
      img.src = image;
    };

    processImage();

    return () => {
      isMounted = false;
      clearTimeout(processingTimer);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
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
