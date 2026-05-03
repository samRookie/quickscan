/**
 * PreviewScreen — Displays the captured image and offers retake/continue actions.
 *
 * @param {Object} props
 * @param {string} props.image - Base64 JPEG data URL of the captured frame.
 * @param {Array} props.allImages - Array of all captured document objects.
 * @param {number} props.currentIndex - Index of the currently active document.
 * @param {function} props.onSelectImage - Callback to select a different image index.
 * @param {function} props.onRetake - Go back to camera to capture again.
 * @param {function} props.onContinue - Proceed to the next step (crop).
 * @param {function} props.onEnhance - Proceed to enhance.
 * @param {function} props.onScanMore - Go back to camera to scan another page.
 * @param {function} props.onRemove - Remove the selected image from the array.
 * @param {function} props.onExport - Proceed to the PDF export screen.
 */
function PreviewScreen({ image, allImages = [], currentIndex = 0, onSelectImage, onRetake, onScanMore, onContinue, onEnhance, onRemove, onExport }) {
  const currentDoc = allImages[currentIndex];
  return (
    <div className="screen-container">
      <div className="screen-header">
        <button className="icon-btn" onClick={onRetake}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="screen-title">Review Scan</h2>
        <button className="icon-btn" onClick={() => onRemove && onRemove(currentIndex)} style={{ color: '#ff4444' }}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="content-area">
        {image ? (
          <img src={image} className="image-preview" alt="Captured preview" />
        ) : (
          <p style={{ color: '#ff4444' }}>No image captured.</p>
        )}

        {currentDoc?.isLowQuality && (
          <div style={{ color: '#ffaa00', marginTop: '1rem', fontSize: '12px', fontWeight: 'bold' }}>
            ⚠️ Image may be unclear. Consider retaking.
          </div>
        )}

        <div className="action-grid">
          <button className="btn-secondary" onClick={onContinue} disabled={!image}>
            <span className="material-symbols-outlined">crop</span> Crop
          </button>
          <button className="btn-secondary" onClick={onEnhance} disabled={!image}>
            <span className="material-symbols-outlined">tune</span> Enhance
          </button>
        </div>

        {allImages && allImages.length > 0 && (
          <div className="thumbnail-list" style={{ marginTop: '24px' }}>
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
          </div>
        )}

        <div style={{ marginTop: 'auto', width: '100%', maxWidth: '400px', display: 'flex', gap: '16px', paddingTop: '24px' }}>
          <button className="btn-secondary" onClick={onScanMore}>
            <span className="material-symbols-outlined">add_a_photo</span> Add
          </button>
          <button className="btn-primary" onClick={onExport} disabled={allImages.length === 0} style={{ flex: 1 }}>
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewScreen;
