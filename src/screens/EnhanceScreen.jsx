import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThumbnailStrip from '../components/ThumbnailStrip';

function createFilterState(image, initialEnhanced) {
  return {
    image,
    filters: initialEnhanced || { original: image, grayscale: null, document: null },
  };
}

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
  const [filterState, setFilterState] = useState(() => createFilterState(image, initialEnhanced));
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || 'original');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const filters = filterState.filters;

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      setFilterState(createFilterState(image, initialEnhanced));
      setSelectedFilter(initialFilter || 'original');
      setIsProcessing(false);
    }, 0);

    return () => clearTimeout(syncTimer);
  }, [image, initialEnhanced, initialFilter]);

  useEffect(() => {
    let isMounted = true;
    let processingImage = null;
    const canvasEl = canvasRef.current;

    const releaseProcessingImage = () => {
      if (!processingImage) return;
      processingImage.onload = null;
      processingImage.onerror = null;
      processingImage.src = '';
      processingImage = null;
    };

    if (filterState.image !== image || (filters.document && filters.grayscale && filters.original === image)) {
      return;
    }

    const processingTimer = setTimeout(() => {
      if (isMounted) setIsProcessing(true);
    }, 0);

    const processImage = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));

      const img = new Image();
      processingImage = img;
      img.onload = () => {
        if (!isMounted) {
          releaseProcessingImage();
          return;
        }

        if (!canvasEl) {
          releaseProcessingImage();
          return;
        }

        const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          releaseProcessingImage();
          setIsProcessing(false);
          return;
        }

        canvasEl.width = img.width;
        canvasEl.height = img.height;

        try {
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
            setFilterState((current) => {
              if (current.image !== image) return current;

              return {
                image,
                filters: {
                  original: image,
                  grayscale: grayscaleDataUrl,
                  document: documentDataUrl
                }
              };
            });
            setIsProcessing(false);
          }
        } catch (err) {
          console.error('[EnhanceScreen] Enhancement processing failed:', err);
          if (isMounted) setIsProcessing(false);
        } finally {
          // The enhancement canvas is reused by this component; reset backing memory after each processing pass.
          canvasEl.width = 0;
          canvasEl.height = 0;
          releaseProcessingImage();
        }
      };
      img.onerror = () => {
        if (isMounted) setIsProcessing(false);
        releaseProcessingImage();
      };
      img.src = image;
    };

    processImage();

    return () => {
      isMounted = false;
      clearTimeout(processingTimer);
      releaseProcessingImage();
      if (canvasEl) {
        canvasEl.width = 0;
        canvasEl.height = 0;
      }
    };
  }, [filterState.image, image, filters.document, filters.grayscale, filters.original]);

  const handleDone = useCallback(() => {
    onDone(filters, selectedFilter);
  }, [filters, onDone, selectedFilter]);

  const handleRemoveCurrent = useCallback(() => {
    onRemove?.(currentIndex);
  }, [currentIndex, onRemove]);

  const selectOriginalFilter = useCallback(() => {
    setSelectedFilter('original');
  }, []);

  const selectGrayscaleFilter = useCallback(() => {
    setSelectedFilter('grayscale');
  }, []);

  const selectDocumentFilter = useCallback(() => {
    setSelectedFilter('document');
  }, []);

  const currentDisplayImage = useMemo(() => (
    filters[selectedFilter] || image
  ), [filters, image, selectedFilter]);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="screen-title">Enhance</h2>
        <button className="icon-btn" onClick={handleRemoveCurrent}>
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
              onClick={selectOriginalFilter}
              style={{ borderColor: selectedFilter === 'original' ? 'var(--color-primary)' : '' }}
            >
              Original
            </button>
            <button
              className={`btn-secondary ${selectedFilter === 'grayscale' ? 'active' : ''}`}
              onClick={selectGrayscaleFilter}
              disabled={isProcessing}
              style={{ borderColor: selectedFilter === 'grayscale' ? 'var(--color-primary)' : '' }}
            >
              Grayscale
            </button>
            <button
              className={`btn-secondary ${selectedFilter === 'document' ? 'active' : ''}`}
              onClick={selectDocumentFilter}
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
