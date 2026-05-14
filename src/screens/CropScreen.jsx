import { useRef, useEffect, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import ThumbnailStrip from '../components/ThumbnailStrip';

function CropScreen({ image, allImages, currentIndex, isLowQuality, onSelectImage, onRemove, onScanMore, onBack, onDone }) {
  const imageRef = useRef(null);
  const cropperRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);
  const [rotationCount, setRotationCount] = useState(0);
  const [straightenAngle, setStraightenAngle] = useState(0);
  const [selectedAspect, setSelectedAspect] = useState('free');

  useEffect(() => {
    if (!imageRef.current || !image) return;

    const timer = setTimeout(() => {
      cropperRef.current = new Cropper(imageRef.current, {
        responsive: true,
        viewMode: 1,
        background: false,
        autoCropArea: 1,
        dragMode: 'move',
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [image]);

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

  const handleAspectFree = () => {
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(NaN);
      setSelectedAspect('free');
    }
  };

  const handleAspectA4 = () => {
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(1 / 1.414);
      setSelectedAspect('a4');
    }
  };

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
        <h2>Adjust</h2>
        <p style={{ color: '#c00' }}>No image to adjust.</p>
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
        <h2 className="screen-title">Adjust</h2>
        <button className="icon-btn" onClick={() => onRemove && onRemove(currentIndex)}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="content-area" style={{ padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: '800px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <img
            ref={imageRef}
            src={image}
            alt="Image to adjust"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '60vh'
            }}
          />
        </div>

        {isLowQuality && (
          <div style={{ color: '#ffaa00', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
            Image may be unclear. Consider retaking.
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
            <button className="icon-btn" onClick={handleRotateLeft} style={{ flexShrink: 0 }}>
              <span className="material-symbols-outlined">rotate_left</span>
            </button>
            <button className="icon-btn" onClick={handleRotateRight} style={{ flexShrink: 0 }}>
              <span className="material-symbols-outlined">rotate_right</span>
            </button>
            <button className="icon-btn" onClick={handleReset} style={{ flexShrink: 0 }}>
              <span className="material-symbols-outlined">restart_alt</span>
            </button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <button
              className={`aspect-chip ${selectedAspect === 'free' ? 'active' : ''}`}
              onClick={handleAspectFree}
            >
              Free
            </button>
            <button
              className={`aspect-chip ${selectedAspect === 'a4' ? 'active' : ''}`}
              onClick={handleAspectA4}
            >
              A4
            </button>
            <div style={{ flex: 1, minWidth: '60px', padding: '0 4px' }}>
              <input
                type="range"
                className="adjust-slider"
                min="-10"
                max="10"
                step="0.5"
                value={straightenAngle}
                onChange={handleStraighten}
                style={{ width: '100%' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', minWidth: '24px', textAlign: 'center', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {straightenAngle}°
            </span>
          </div>

          <ThumbnailStrip
            allImages={allImages}
            currentIndex={currentIndex}
            onSelectImage={onSelectImage}
            onScanMore={onScanMore}
          />

          <button className="btn-primary" onClick={handleCrop} disabled={isCropping} style={{ marginTop: '4px' }}>
            {isCropping ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CropScreen;
