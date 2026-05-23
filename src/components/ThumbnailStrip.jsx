import { normalizeScanFormat } from '../utils/scanModelUtils.js';

function ThumbnailStrip({
  allImages = [],
  currentIndex = 0,
  onSelectImage,
  onScanMore,
  onRemove,
  onReorder,
  onReplace
}) {
  if (allImages.length === 0) return null;

  const activeItem = allImages[currentIndex]
    ? normalizeScanFormat(allImages[currentIndex])
    : null;

  const presetLabel = activeItem?.format?.presetId
    ? activeItem.format.presetId.toUpperCase().replace('_', ' ')
    : 'FREEFORM';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Dynamic Page Actions Control Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '6px 12px',
        width: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {/* Left: Metadata and Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
            PAGE {currentIndex + 1} OF {allImages.length}
          </span>
          <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {presetLabel} Format
          </span>
        </div>

        {/* Center: Minimal Status Badges */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {activeItem?.cropped && (
            <span style={{
              fontSize: '8px',
              fontWeight: '800',
              background: 'rgba(0, 255, 171, 0.1)',
              color: 'var(--color-primary)',
              padding: '1px 5px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Cropped
            </span>
          )}
          {activeItem?.selectedFilter && activeItem.selectedFilter !== 'original' && (
            <span style={{
              fontSize: '8px',
              fontWeight: '800',
              background: 'rgba(0, 255, 171, 0.1)',
              color: 'var(--color-primary)',
              padding: '1px 5px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Enhanced
            </span>
          )}
        </div>

        {/* Right: Touch-Safe Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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
      <div className="thumbnail-list" style={{ width: '100%', margin: '4px 0', scrollBehavior: 'smooth' }}>
        {allImages.map((doc, idx) => {
          const item = normalizeScanFormat(doc);
          const bgUrl = item.cropped || item.original || '';
          return (
            <div
              key={item.id || idx}
              className={`thumbnail ${currentIndex === idx ? 'active' : ''}`}
              onClick={() => onSelectImage && onSelectImage(idx)}
              style={{
                backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <div className="thumbnail-badge">{idx + 1}</div>
            </div>
          );
        })}
        {onScanMore && (
          <div
            className="thumbnail"
            onClick={onScanMore}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(255,255,255,0.15)',
              cursor: 'pointer',
              fontSize: '24px',
              color: 'var(--color-text-dim)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
            title="Add Scanned Page"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThumbnailStrip;
