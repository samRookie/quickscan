import { useRef, useEffect, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import ThumbnailStrip from '../components/ThumbnailStrip';
import { FORMAT_PRESETS, DEFAULT_FORMAT_PRESET } from '../config/formatPresets.js';
import { getFormatPresetById, getAspectRatioForPreset } from '../utils/formatUtils.js';

function CropScreen({
  image,
  allImages,
  currentIndex,
  activeDocument,
  isLowQuality,
  onSelectImage,
  onRemove,
  onReorder,
  onReplace,
  onScanMore,
  onBack,
  onDone,
  onFormatChange
}) {
  const imageRef = useRef(null);
  const cropperRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);
  const [rotationCount, setRotationCount] = useState(0);
  const [straightenAngle, setStraightenAngle] = useState(0);

  // Sourcing the current format preset directly from the active document state
  const activePreset = activeDocument?.format
    ? getFormatPresetById(activeDocument.format.presetId)
    : DEFAULT_FORMAT_PRESET;

  useEffect(() => {
    if (!imageRef.current || !image) return;

    setRotationCount(0);
    setStraightenAngle(0);

    // Calculate aspect ratio safely with preset system fallback
    let initialRatio = NaN;
    try {
      const presetRatio = getAspectRatioForPreset(activePreset);
      if (presetRatio !== null && !isNaN(presetRatio) && presetRatio > 0) {
        initialRatio = presetRatio;
      }
    } catch (e) {
      console.warn('[CropScreen] Error resolving initial aspect ratio, falling back to NaN:', e);
    }

    const timer = setTimeout(() => {
      cropperRef.current = new Cropper(imageRef.current, {
        responsive: true,
        viewMode: 1,
        background: false,
        autoCropArea: 0.92, // Pads the crop box so handles are easy to grab without running off the screen edges
        dragMode: 'move',
        aspectRatio: initialRatio,
        zoomOnTouch: true,
        zoomOnWheel: false, // Prevent page scrolling conflicts on desktop
        toggleDragModeOnDblclick: false, // Prevent accidental double-tap mode toggling on mobile
        checkOrientation: false, // Avoid conflicts with our custom rotation engine
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
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
      // Diagnostic logs to verify natural resolution preservation
      const originalWidth = imageRef.current?.naturalWidth || 0;
      const originalHeight = imageRef.current?.naturalHeight || 0;
      console.log(`[CropScreen] Source natural dimensions: ${originalWidth}x${originalHeight}`);

      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
      
      if (!canvas) {
        throw new Error('No crop area is available.');
      }

      console.log(`[CropScreen] Cropped canvas natural size: ${canvas.width}x${canvas.height}`);

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

  const handlePresetSelect = (presetId) => {
    try {
      const targetPreset = getFormatPresetById(presetId);
      const targetRatio = getAspectRatioForPreset(targetPreset);
      const cropperRatio = (targetRatio === null || isNaN(targetRatio)) ? NaN : targetRatio;

      if (cropperRef.current) {
        cropperRef.current.setAspectRatio(cropperRatio);
      }

      if (onFormatChange) {
        onFormatChange(presetId);
      }
    } catch (err) {
      console.error('[CropScreen] Failed to set format preset:', err);
    }
  };

  function handleReset() {
    const cropper = cropperRef.current;
    if (cropper) {
      cropper.reset();
      setRotationCount(0);
      setStraightenAngle(0);
      
      // Reset aspect ratio to current active format aspect ratio
      const currentRatio = getAspectRatioForPreset(activePreset);
      cropper.setAspectRatio((currentRatio === null || isNaN(currentRatio)) ? NaN : currentRatio);
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
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '800px', 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            touchAction: 'none', // Prevents body scroll leakage during crop manipulation
            userSelect: 'none',  // Prevents accidental text selection highlights
            WebkitUserSelect: 'none'
          }}
          className="cropper-wrapper-outer"
        >
          <img
            ref={imageRef}
            src={image}
            alt="Image to adjust"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '55vh'
            }}
          />
        </div>

        {isLowQuality && (
          <div style={{ color: '#ffaa00', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
            Image may be unclear. Consider retaking.
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Action and utility row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button className="icon-btn" onClick={handleRotateLeft} style={{ flexShrink: 0 }} title="Rotate Left">
                <span className="material-symbols-outlined">rotate_left</span>
              </button>
              <button className="icon-btn" onClick={handleRotateRight} style={{ flexShrink: 0 }} title="Rotate Right">
                <span className="material-symbols-outlined">rotate_right</span>
              </button>
              <button className="icon-btn" onClick={handleReset} style={{ flexShrink: 0 }} title="Reset Adjustments">
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', minWidth: 0 }}>
              <input
                type="range"
                className="adjust-slider"
                min="-10"
                max="10"
                step="0.5"
                value={straightenAngle}
                onChange={handleStraighten}
                style={{ width: '100%', flex: 1 }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', minWidth: '28px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {straightenAngle}°
              </span>
            </div>
          </div>

          {/* Dynamic, responsive format presets scrolling selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '6px 0',
            width: '100%',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} className="format-presets-scrollbar">
            {Object.values(FORMAT_PRESETS).map((preset) => {
              const isActive = activePreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  className={`aspect-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderRadius: '20px',
                    background: isActive ? 'rgba(0, 255, 171, 0.1)' : 'var(--color-surface)',
                    borderColor: isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {preset.label}
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

          <button className="btn-primary" onClick={handleCrop} disabled={isCropping} style={{ marginTop: '2px' }}>
            {isCropping ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CropScreen;
