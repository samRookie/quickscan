function ThumbnailStrip({ allImages = [], currentIndex = 0, onSelectImage, onScanMore }) {
  if (allImages.length === 0) return null;

  return (
    <div className="thumbnail-list">
      {allImages.map((doc, idx) => (
        <div
          key={doc.id || idx}
          className={`thumbnail ${currentIndex === idx ? 'active' : ''}`}
          onClick={() => onSelectImage && onSelectImage(idx)}
          style={{ backgroundImage: `url(${doc.cropped || doc.original})` }}
        >
          <div className="thumbnail-badge">{idx + 1}</div>
        </div>
      ))}
      {onScanMore && (
        <div
          className="thumbnail"
          onClick={onScanMore}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed rgba(255,255,255,0.2)',
            cursor: 'pointer',
            fontSize: '24px',
            color: 'var(--color-text-dim)',
            background: 'var(--color-surface)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        </div>
      )}
    </div>
  );
}

export default ThumbnailStrip;
