import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = useCallback((e) => {
    const index = Number(e.currentTarget.dataset.index);
    draggedIndexRef.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    const index = Number(e.currentTarget.dataset.index);
    if (draggedIndexRef.current === index) return;
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const targetIndex = Number(e.currentTarget.dataset.index);
    const sourceIndex = draggedIndexRef.current;
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      onReorder && onReorder(sourceIndex, targetIndex);
    }
    handleDragEnd();
  }, [handleDragEnd, onReorder]);

  const handleSelectThumbnail = useCallback((e) => {
    onSelectImage?.(Number(e.currentTarget.dataset.index));
  }, [onSelectImage]);

  const handleMoveLeft = useCallback(() => {
    onReorder?.(currentIndex, 'left');
  }, [currentIndex, onReorder]);

  const handleMoveRight = useCallback(() => {
    onReorder?.(currentIndex, 'right');
  }, [currentIndex, onReorder]);

  const handleReplaceCurrent = useCallback(() => {
    onReplace?.(currentIndex);
  }, [currentIndex, onReplace]);

  const handleRemoveCurrent = useCallback(() => {
    onRemove?.(currentIndex);
  }, [currentIndex, onRemove]);

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

  const activeItem = useMemo(() => (
    allImages[currentIndex] || null
  ), [allImages, currentIndex]);

  const presetLabel = useMemo(() => (activeItem?.format?.presetId
    ? activeItem.format.presetId.toUpperCase().replace('_', ' ')
    : 'FREEFORM'
  ), [activeItem]);

  if (allImages.length === 0) return null;

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
            onClick={handleMoveLeft}
            disabled={currentIndex === 0}
            style={{ width: '36px', height: '36px', opacity: currentIndex === 0 ? 0.3 : 1 }}
            title="Move Page Left"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <button
            className="icon-btn"
            onClick={handleMoveRight}
            disabled={currentIndex === allImages.length - 1}
            style={{ width: '36px', height: '36px', opacity: currentIndex === allImages.length - 1 ? 0.3 : 1 }}
            title="Move Page Right"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
          <button
            className="icon-btn"
            onClick={handleReplaceCurrent}
            style={{ width: '36px', height: '36px', color: 'var(--color-text-dim)' }}
            title="Replace Page (Rescan)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
          </button>
          <button
            className="icon-btn"
            onClick={handleRemoveCurrent}
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
          const item = doc || {};
          const bgUrl = item.thumbnail || item.preview || '';
          const isActive = currentIndex === idx;
          
          const isCurrentDragging = draggingIndex === idx;
          const isCurrentDragOver = dragOverIndex === idx;

          return (
            <div
              key={item.id || idx}
              ref={isActive ? activeRef : null}
              data-index={idx}
              className={`thumbnail ${isActive ? 'active' : ''} ${isCurrentDragging ? 'dragging' : ''} ${isCurrentDragOver ? 'drag-over' : ''}`}
              onClick={handleSelectThumbnail}
              style={{
                backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
              }}
              draggable="true"
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
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
