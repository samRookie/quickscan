import { useCallback, useEffect, useMemo, useState } from 'react';
import ThumbnailStrip from '../components/ThumbnailStrip';
import {
  ENHANCEMENT_DEFINITIONS,
  ENHANCEMENT_FILTERS,
  applyEnhancement
} from '../utils/enhancementEngine.js';
import { ENHANCEMENT_MODES } from '../constants/formatConstants.js';

function withoutOriginalFilter(cacheLike) {
  if (!cacheLike || typeof cacheLike !== 'object') return {};

  return Object.fromEntries(
    Object.entries(cacheLike).filter(([filterName, imageData]) => (
      filterName !== ENHANCEMENT_MODES.ORIGINAL && Boolean(imageData)
    ))
  );
}

function createFilterState(image, initialFilterCache, initialEnhanced) {
  return {
    image,
    filterCache: {
      ...withoutOriginalFilter(initialEnhanced),
      ...withoutOriginalFilter(initialFilterCache),
    },
  };
}

function EnhanceScreen({
  image,
  initialFilterCache,
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
  const [filterState, setFilterState] = useState(() => createFilterState(image, initialFilterCache, initialEnhanced));
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || 'original');
  const [isProcessing, setIsProcessing] = useState(false);
  const filterCache = filterState.filterCache;

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      setFilterState(createFilterState(image, initialFilterCache, initialEnhanced));
      setSelectedFilter(initialFilter || 'original');
      setIsProcessing(false);
    }, 0);

    return () => clearTimeout(syncTimer);
  }, [image, initialEnhanced, initialFilter, initialFilterCache]);

  useEffect(() => {
    let isCancelled = false;

    if (!image || filterState.image !== image) {
      return;
    }

    if (
      selectedFilter === ENHANCEMENT_MODES.ORIGINAL ||
      filterCache[selectedFilter]
    ) {
      return;
    }

    const processingTimer = setTimeout(() => {
      if (!isCancelled) setIsProcessing(true);
    }, 0);

    const requestEnhancements = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      const nextImage = await applyEnhancement(image, selectedFilter, { quality: 1.0 });

      if (isCancelled) return;

      setFilterState((current) => {
        if (current.image !== image) return current;
        if (!nextImage || nextImage === image) return current;

        return {
          image,
          filterCache: {
            ...current.filterCache,
            [selectedFilter]: nextImage,
          }
        };
      });
      setIsProcessing(false);
    };

    requestEnhancements().catch((err) => {
      console.warn('[EnhanceScreen] Enhancement request failed:', err);
      if (!isCancelled) setIsProcessing(false);
    });

    return () => {
      isCancelled = true;
      clearTimeout(processingTimer);
    };
  }, [filterCache, filterState.image, image, selectedFilter]);

  const handleDone = useCallback(() => {
    onDone(filterCache, selectedFilter);
  }, [filterCache, onDone, selectedFilter]);

  const handleRemoveCurrent = useCallback(() => {
    onRemove?.(currentIndex);
  }, [currentIndex, onRemove]);

  const handleFilterSelect = useCallback((e) => {
    setSelectedFilter(e.currentTarget.dataset.filter);
  }, []);

  const currentDisplayImage = useMemo(() => (
    selectedFilter === ENHANCEMENT_MODES.ORIGINAL
      ? image
      : filterCache[selectedFilter] || image
  ), [filterCache, image, selectedFilter]);

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
        </div>

        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {ENHANCEMENT_FILTERS.map((filterName) => {
              const isOriginal = filterName === ENHANCEMENT_MODES.ORIGINAL;
              const isActive = selectedFilter === filterName;

              return (
                <button
                  key={filterName}
                  className={`btn-secondary ${isActive ? 'active' : ''}`}
                  data-filter={filterName}
                  onClick={handleFilterSelect}
                  disabled={isProcessing && !isOriginal}
                  style={{
                    borderColor: isActive ? 'var(--color-primary)' : '',
                    flex: '1 1 40%'
                  }}
                >
                  {ENHANCEMENT_DEFINITIONS[filterName].label}
                </button>
              );
            })}
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
