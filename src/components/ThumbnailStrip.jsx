import { useEffect, useRef, useState, memo } from 'react';
import { normalizeScanFormat } from '../utils/scanModelUtils.js';

/**
 * ThumbnailStrip — Multi-page session horizontal navigator.
 * Optimized with React.memo, scroll-into-view auto-centering, and lightweight previews.
 */
function ThumbnailStrip({
  allImages = [],
  currentIndex = 0,
  onSelectImage,
  onScanMore,
  onRemove,
  onReorder,
  onReplace
}) {
  const activeRef = useRef(null);

  // Lightweight HTML5 drag-and-drop sorting variables
  const draggedIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(e, index) {
    draggedIndexRef.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndexRef.current === index) return;
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    draggedIndexRef.current = null;
    setDragOverIndex(null);
    setIsDragging(false);
  }

  function handleDrop(e, targetIndex) {
    e.preventDefault();
    const sourceIndex = draggedIndexRef.current;
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      onReorder && onReorder(sourceIndex, targetIndex);
    }
    handleDragEnd();
  }

  // Smoothly center active thumbnail in scrolling horizontal bar
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  if (allImages.length === 0) return null;

  const activeItem = allImages[currentIndex]
    ? normalizeScanFormat(allImages[currentIndex])
    : null;

  const presetLabel = activeItem?.format?.presetId
    ? activeItem.format.presetId.toUpperCase().replace('_', ' ')
    : 'FREEFORM';

  return (
    <div className="thumbnail-strip-container">
      {/* Dynamic Page Actions Control Row */}
      <div className="thumbnail-controls-row">
        {/* Left: Metadata and Telemetry */}
        <div className="thumbnail-telemetry-col">
          <span className="thumbnail-page-index-text">
            PAGE {currentIndex + 1} OF {allImages.length}
          </span>
          <span className="thumbnail-preset-label-text">
            {presetLabel} Format
          </span>
        </div>

        {/* Center: Minimal Status Badges */}
        <div className="thumbnail-status-badges">
          {activeItem?.cropped && (
            <span className="badge-cropped">
              Cropped
            </span>
          )}
          {activeItem?.selectedFilter && activeItem.selectedFilter !== 'original' && (
            <span className="badge-enhanced">
              Enhanced
            </span>
          )}
        </div>

        {/* Right: Touch-Safe Action Controls */}
        <div className="thumbnail-actions-row">
          <button
            className="icon-btn"
            onClick={() => onReorder && onReorder(currentIndex, 'left')}
            disabled={currentIndex === 0}
            style={{ width: '36px', height: '36px', opacity: currentIndex === 0 ? 0.3 : 1 }}
            title="Move Page Left"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => onReorder && onReorder(currentIndex, 'right')}
            disabled={currentIndex === allImages.length - 1}
            style={{ width: '36px', height: '36px', opacity: currentIndex === allImages.length - 1 ? 0.3 : 1 }}
            title="Move Page Right"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => onReplace && onReplace(currentIndex)}
            style={{ width: '36px', height: '36px', color: 'var(--color-text-dim)' }}
            title="Replace Page (Rescan)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete Page ${currentIndex + 1}?`)) {
                onRemove && onRemove(currentIndex);
              }
            }}
            style={{ width: '36px', height: '36px', color: '#ff4444' }}
            title="Delete Page"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
          </button>
        </div>
      </div>

      {/* Touch-Friendly Horizontal Scrolling Thumbnail Strip */}
      <div className="thumbnail-list">
        {allImages.map((doc, idx) => {
          const item = normalizeScanFormat(doc);
          const bgUrl = item.thumbnail || item.cropped || item.original || '';
          const isActive = currentIndex === idx;
          
          const isCurrentDragging = draggedIndexRef.current === idx;
          const isCurrentDragOver = dragOverIndex === idx;

          return (
            <div
              key={item.id || idx}
              ref={isActive ? activeRef : null}
              className={`thumbnail ${isActive ? 'active' : ''} ${isCurrentDragging ? 'dragging' : ''} ${isCurrentDragOver ? 'drag-over' : ''}`}
              onClick={() => onSelectImage && onSelectImage(idx)}
              style={{
                backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
              }}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, idx)}
            >
              <div className="thumbnail-badge">{idx + 1}</div>
            </div>
          );
        })}
        {onScanMore && (
          <div
            className="thumbnail thumbnail-add-card"
            onClick={onScanMore}
            title="Add Scanned Page"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ThumbnailStrip);
