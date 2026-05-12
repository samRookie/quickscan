import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * CameraScreen — Live camera preview with frame capture.
 *
 * Uses the rear camera (environment) when available.
 * On capture, draws the current video frame to an off-screen canvas,
 * converts it to a JPEG data URL, and passes it upstream via onCapture.
 *
 * @param {Object} props
 * @param {function} props.onCapture - Called with the captured base64 image string.
 */
function CameraScreen({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const brightnessCanvasRef = useRef(null);
  const isMountedRef = useRef(true);
  const [error, setError] = useState(null);
  const [isLowLight, setIsLowLight] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isScreenLightOn, setIsScreenLightOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

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
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
  }, [stopStream]);

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

  // Brightness detection loop
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
      
      const avgBrightness = totalBrightness / 100; // 10x10 pixels
      setIsLowLight(avgBrightness < 80);
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

  /**
   * Captures the current video frame onto a canvas and converts to JPEG.
   * Uses the native video resolution (videoWidth/videoHeight) so the
   * captured image matches the actual camera output, not the CSS size.
   */
  function handleCapture() {
    if (isCapturing) return;
    setIsCapturing(true);

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

      const MAX_WIDTH = 1400;
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

      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      stopStream();
      onCapture(imageData, isLowLight);
    } catch (err) {
      console.error("Capture failed:", err);
      setIsCapturing(false);
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Camera</h2>
        <p style={{ color: '#c00' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="camera-container">
      
      {/* Screen Light Overlay */}
      {isFrontCamera && isScreenLightOn && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'white',
          opacity: 0.85,
          zIndex: 10,
          pointerEvents: 'none'
        }} />
      )}

      {/* Header controls */}
      <div className="top-bar">
        {isTorchSupported && !isFrontCamera ? (
          <button className={`icon-btn ${isTorchOn ? 'primary' : ''}`} onClick={toggleTorch}>
            <span className="material-symbols-outlined">{isTorchOn ? 'flash_on' : 'flash_off'}</span>
          </button>
        ) : (
          <div style={{ width: 48 }} />
        )}

        {isLowLight && (
           <button className="icon-btn" style={{ color: 'var(--color-primary)' }}>
             <span className="material-symbols-outlined">wb_twilight</span>
           </button>
        )}
        
        {isFrontCamera ? (
          <button className={`icon-btn ${isScreenLightOn ? 'primary' : ''}`} onClick={toggleScreenLight}>
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

      <div className="scanner-overlay">
        <div className="scanner-frame">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
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

      {/* Bottom controls */}
      <div className="bottom-bar">
        <button className="icon-btn">
          <span className="material-symbols-outlined">photo_library</span>
        </button>

        <div className="shutter-wrapper">
          <div className="shutter-ring">
            <button
              className="shutter-btn"
              onClick={handleCapture}
              disabled={isCapturing}
              aria-label="Take photo"
            />
          </div>
        </div>

        <button className="icon-btn">
          <span className="material-symbols-outlined">flip_camera_ios</span>
        </button>
      </div>
    </div>
  );
}

export default CameraScreen;
