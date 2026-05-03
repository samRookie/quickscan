import { useRef, useEffect, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

/**
 * CropScreen — Allows the user to crop the captured image using Cropper.js.
 *
 * @param {Object} props
 * @param {string} props.image - Base64 JPEG data URL of the captured frame.
 * @param {function} props.onBack - Navigate back to preview screen.
 * @param {function} props.onDone - Called with the cropped base64 image string.
 */
function CropScreen({ image, onBack, onDone }) {
  const imageRef = useRef(null);
  const cropperRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);
  const [rotationCount, setRotationCount] = useState(0);
  const [straightenAngle, setStraightenAngle] = useState(0);

  // Initialize Cropper.js on mount
  useEffect(() => {
    if (!imageRef.current || !image) return;

    // Small delay to ensure the image element is fully rendered in the DOM
    const timer = setTimeout(() => {
      cropperRef.current = new Cropper(imageRef.current, {
        responsive: true,
        viewMode: 1,
        background: false,
        autoCropArea: 1,
        dragMode: 'move',
      });
    }, 100);

    // Cleanup: destroy cropper instance on unmount
    return () => {
      clearTimeout(timer);
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [image]);

  /**
   * Gets the cropped region from the selection, converts to JPEG data URL,
   * and passes it upstream via onDone.
   */
  async function handleCrop() {
    const cropper = cropperRef.current;
    if (!cropper) return;

    setIsCropping(true);

    try {
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
      if (!canvas) {
        throw new Error('No crop area is available.');
      }
      
      const croppedImage = canvas.toDataURL('image/jpeg', 1.0);
      onDone(croppedImage);
    } catch (err) {
      console.error('[CropScreen] Crop failed:', err);
    } finally {
      setIsCropping(false);
    }
  }

  const applyRotation = (count, angle) => {
    if (cropperRef.current) {
      cropperRef.current.rotateTo((count * 90) + angle);
    }
  };

  const handleRotateLeft = () => {
    const newCount = rotationCount - 1;
    setRotationCount(newCount);
    applyRotation(newCount, straightenAngle);
  };

  const handleRotateRight = () => {
    const newCount = rotationCount + 1;
    setRotationCount(newCount);
    applyRotation(newCount, straightenAngle);
  };

  const handleStraighten = (e) => {
    const angle = parseFloat(e.target.value);
    setStraightenAngle(angle);
    applyRotation(rotationCount, angle);
  };

  /**
   * Resets the crop selection back to its initial state (full coverage).
   */
  function handleReset() {
    const cropper = cropperRef.current;
    if (cropper) {
      cropper.reset();
      setRotationCount(0);
      setStraightenAngle(0);
    }
  }

  if (!image) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Crop</h2>
        <p style={{ color: '#c00' }}>No image to crop.</p>
        <button onClick={onBack}>← Back</button>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="screen-title">Crop Image</h2>
        <button className="icon-btn" onClick={handleReset}>
          <span className="material-symbols-outlined">restart_alt</span>
        </button>
      </div>

      <div className="content-area" style={{ padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: '800px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <img
            ref={imageRef}
            src={image}
            alt="Image to crop"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '60vh'
            }}
          />
        </div>

        <div style={{ width: '100%', maxWidth: '400px', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-secondary" onClick={handleRotateLeft}>
              <span className="material-symbols-outlined">rotate_left</span>
            </button>
            <button className="btn-secondary" onClick={handleRotateRight}>
              <span className="material-symbols-outlined">rotate_right</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px' }}>-10°</span>
            <input 
              type="range" 
              min="-10" 
              max="10" 
              step="0.5"
              value={straightenAngle} 
              onChange={handleStraighten} 
              style={{ flex: 1, accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontSize: '12px' }}>+10°</span>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-secondary" onClick={() => cropperRef.current && cropperRef.current.setAspectRatio(NaN)}>
              Free
            </button>
            <button className="btn-secondary" onClick={() => cropperRef.current && cropperRef.current.setAspectRatio(1 / 1.414)}>
              A4
            </button>
          </div>
          
          <button className="btn-primary" onClick={handleCrop} disabled={isCropping} style={{ marginTop: '8px' }}>
            {isCropping ? 'Cropping...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CropScreen;
