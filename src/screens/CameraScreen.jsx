import { useRef, useEffect, useState, useCallback } from 'react';
import { FORMAT_PRESETS } from '../config/formatPresets.js';

/**
 * CameraScreen — Live camera preview with frame capture.
 * Optimized for immersive mobile viewport usage and format-aware guidance.
 *
 * @param {Object} props
 * @param {function} props.onCapture - Called with (imageData, selectedPresetId, isLowLight).
 */
function CameraScreen({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const brightnessCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [error, setError] = useState(null);
  const [isLowLight, setIsLowLight] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isScreenLightOn, setIsScreenLightOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Centralized format presets states
  const [selectedPresetId, setSelectedPresetId] = useState('freeform');
  const [showShutterFlash, setShowShutterFlash] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }

    if (isMountedRef.current) {
      setIsTorchOn(false);
      setIsTorchSupported(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser.');
      return;
    }

    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 }, // High-resolution target
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (!isMountedRef.current || document.visibilityState === 'hidden') {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      stopStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        setIsFrontCamera(settings.facingMode === 'user');

        if (track.getCapabilities) {
          const capabilities = track.getCapabilities();
          setIsTorchSupported(Boolean(capabilities.torch));
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('[CameraScreen] Failed to access camera:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access is required. Please allow camera permissions and reload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [stopStream, facingMode]);

  useEffect(() => {
    let cancelled = false;
    isMountedRef.current = true;

    const startupTimer = window.setTimeout(() => {
      if (!cancelled) {
        startCamera();
      }
    }, 0);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopStream();
        return;
      }

      if (!cancelled) {
        startCamera();
      }
    };

    const handlePageHide = () => {
      stopStream();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      window.clearTimeout(startupTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      stopStream();
    };
  }, [startCamera, stopStream]);

  // Brightness detection loop for twilight feedback
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = brightnessCanvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 10, 10);
      const imageData = ctx.getImageData(0, 0, 10, 10);
      const data = imageData.data;

      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }

      const avgBrightness = totalBrightness / 100;
      setIsLowLight(avgBrightness < 75); // Activated under dim lighting threshold
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && isTorchSupported) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !isTorchOn }]
        });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error('Failed to toggle torch:', err);
      }
    }
  };

  const toggleScreenLight = () => {
    setIsScreenLightOn(!isScreenLightOn);
  };

  const toggleCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    stopStream();
    setFacingMode(next);
    setIsFrontCamera(next === 'user');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onCapture(ev.target?.result, selectedPresetId, false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  function handleCapture() {
    if (isCapturing) return;
    setIsCapturing(true);
    
    // Shutter white flash trigger
    setShowShutterFlash(true);
    setTimeout(() => {
      setShowShutterFlash(false);
    }, 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        setIsCapturing(false);
        return;
      }

      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width === 0 || height === 0) {
        console.warn('[CameraScreen] Video not ready yet — dimensions are 0');
        setIsCapturing(false);
        return;
      }

      // Restrict max width for session preview load but preserve native sharp density
      const MAX_WIDTH = 1920;
      if (width > MAX_WIDTH) {
        const scale = MAX_WIDTH / width;
        width = MAX_WIDTH;
        height = Math.floor(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCapturing(false);
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);

      const imageData = canvas.toDataURL('image/jpeg', 0.96);
      
      // Reclaim memory immediately by zeroing canvas width/height
      canvas.width = 0;
      canvas.height = 0;

      stopStream();
      onCapture(imageData, selectedPresetId, isLowLight);
    } catch (err) {
      console.error("Capture failed:", err);
      setIsCapturing(false);
    }
  }

  // Calculate dynamic framing guide guides based on preset id
  const getFrameDimensions = (presetId) => {
    switch (presetId) {
      case 'a4':
        return { maxWidth: '280px', aspectRatio: '0.707', label: 'A4 Document' };
      case 'letter':
        return { maxWidth: '280px', aspectRatio: '0.773', label: 'US Letter' };
      case 'id_card':
        return { maxWidth: '320px', aspectRatio: '1.586', label: 'ID Card' };
      case 'business_card':
        return { maxWidth: '320px', aspectRatio: '1.75', label: 'Business Card' };
      case 'receipt':
        return { maxWidth: '210px', aspectRatio: '0.400', label: 'Thermal Receipt' };
      case 'freeform':
      default:
        return { maxWidth: '290px', aspectRatio: '0.750', label: 'Freeform Crop' };
    }
  };

  const frameDimensions = getFrameDimensions(selectedPresetId);

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', color: 'white', backgroundColor: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4444' }}>Camera Error</h2>
        <p style={{ color: 'var(--color-text-dim)', maxWidth: '400px', marginBottom: '24px' }}>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()} style={{ maxWidth: '200px' }}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="camera-container" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      
      {/* Screen Light Flash Overlay (Front Camera Capture Assist) */}
      {isFrontCamera && isScreenLightOn && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#fff',
          opacity: 0.9,
          zIndex: 10,
          pointerEvents: 'none'
        }} />
      )}

      {/* Shutter White Flash Feedback */}
      {showShutterFlash && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 100,
          pointerEvents: 'none'
        }} />
      )}

      {/* Top Header controls */}
      <div className="top-bar">
        {isTorchSupported && !isFrontCamera ? (
          <button className={`icon-btn ${isTorchOn ? 'primary' : ''}`} onClick={toggleTorch} title="Toggle Flashlight">
            <span className="material-symbols-outlined">{isTorchOn ? 'flash_on' : 'flash_off'}</span>
          </button>
        ) : (
          <div style={{ width: 48 }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLowLight && (
            <button className="icon-btn" style={{ color: '#ffaa00', animation: 'pulse 2s infinite' }} title="Low-light detected">
              <span className="material-symbols-outlined">wb_twilight</span>
            </button>
          )}
        </div>

        {isFrontCamera ? (
          <button className={`icon-btn ${isScreenLightOn ? 'primary' : ''}`} onClick={toggleScreenLight} title="Toggle Screen Light">
            <span className="material-symbols-outlined">{isScreenLightOn ? 'light_mode' : 'highlight'}</span>
          </button>
        ) : (
          <div style={{ width: 48 }} />
        )}
      </div>

      {isCapturing && (
        <div className="status-pill">
          <div className="status-dot"></div>
          <span className="status-text">SCANNING</span>
        </div>
      )}

      {/* Dynamic, format-aware alignment guide overlay */}
      <div className="scanner-overlay" style={{ zIndex: 5, paddingTop: '72px', paddingBottom: '180px' }}>
        <div 
          className="scanner-frame"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: frameDimensions.maxWidth,
            aspectRatio: frameDimensions.aspectRatio,
            border: isLowLight ? '2px solid #ffaa00' : '2px solid rgba(0, 255, 171, 0.85)',
            boxShadow: '0 0 0 5000px rgba(0, 0, 0, 0.55)',
            borderRadius: '12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Subtle center alignment crosshairs */}
          <div style={{
            width: '10px',
            height: '10px',
            border: isLowLight ? '1px solid rgba(255, 170, 0, 0.4)' : '1px solid rgba(0, 255, 171, 0.4)',
            borderRadius: '50%',
            position: 'absolute'
          }} />
          <div style={{
            width: '1px',
            height: '24px',
            background: isLowLight ? 'rgba(255, 170, 0, 0.3)' : 'rgba(0, 255, 171, 0.3)',
            position: 'absolute'
          }} />
          <div style={{
            width: '24px',
            height: '1px',
            background: isLowLight ? 'rgba(255, 170, 0, 0.3)' : 'rgba(0, 255, 171, 0.3)',
            position: 'absolute'
          }} />

          {/* Brackets styled with primary colors */}
          <div className="corner corner-tl" style={{ borderColor: isLowLight ? '#ffaa00' : '' }} />
          <div className="corner corner-tr" style={{ borderColor: isLowLight ? '#ffaa00' : '' }} />
          <div className="corner corner-bl" style={{ borderColor: isLowLight ? '#ffaa00' : '' }} />
          <div className="corner corner-br" style={{ borderColor: isLowLight ? '#ffaa00' : '' }} />

          {/* Guide telemetry label */}
          <div style={{
            position: 'absolute',
            bottom: '-28px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            color: isLowLight ? '#ffaa00' : 'var(--color-primary)',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '4px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap'
          }}>
            {frameDimensions.label} Guide
          </div>
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />

      {/* Hidden canvases */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={brightnessCanvasRef} width={10} height={10} style={{ display: 'none' }} />

      {/* Hidden file input for gallery import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Bottom control bar — format presets + shutter controls stacked in one panel */}
      <div className="bottom-bar">
        {/* Format preset selector — always visible above the shutter row */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '2px 4px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: '100%',
          maxWidth: '420px',
        }} className="format-presets-scrollbar">
          {Object.values(FORMAT_PRESETS).map((preset) => {
            const isActive = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                style={{
                  flex: '0 0 auto',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderRadius: '20px',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'var(--color-on-primary)' : 'rgba(255, 255, 255, 0.75)',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Shutter + utility controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
          <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Import from Gallery">
            <span className="material-symbols-outlined">photo_library</span>
          </button>

          <div className="shutter-wrapper">
            <div className="shutter-ring">
              <button
                className="shutter-btn"
                onClick={handleCapture}
                disabled={isCapturing}
                aria-label="Shutter Button"
              />
            </div>
          </div>

          <button className="icon-btn" onClick={toggleCamera} disabled={isCapturing} title="Flip Camera">
            <span className="material-symbols-outlined">flip_camera_ios</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraScreen;