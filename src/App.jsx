import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { normalizeScanFormat, attachFormatToScan, generateThumbnail, generatePreview } from './utils/scanModelUtils.js';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Lazy load screens for bundle optimization
const CameraScreen = React.lazy(() => import('./screens/CameraScreen'));
const CropScreen = React.lazy(() => import('./screens/CropScreen'));
const EnhanceScreen = React.lazy(() => import('./screens/EnhanceScreen'));
const ExportScreen = React.lazy(() => import('./screens/ExportScreen'));

/**
 * Workflow steps for the QuickScan app flow.
 * Each step represents a stage in the document scanning pipeline.
 *
 * Flow: camera → adjust → enhance → export
 */
const STEPS = {
  CAMERA: 'camera',
  ADJUST: 'adjust',
  ENHANCE: 'enhance',
  EXPORT: 'export',
};

function App() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA SW] Registered successfully:', r);
    },
    onRegisterError(error) {
      console.error('[PWA SW] Registration failed:', error);
    },
  });

  const [currentStep, setCurrentStep] = useState(STEPS.CAMERA);
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deletedBuffer, setDeletedBuffer] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(false);

  // Clear session to ensure data privacy
  const clearSession = useCallback(() => {
    setCapturedImages([]);
    setCurrentIndex(0);
    setDeletedBuffer(null);
    setSessionNotice(false);
    setCurrentStep(STEPS.CAMERA);
  }, []);

  // Auto-expire deletion buffer after 6 seconds for clean memory recycling
  useEffect(() => {
    if (!deletedBuffer) return;
    const timer = setTimeout(() => {
      setDeletedBuffer(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [deletedBuffer]);

  // Auto-dismiss privacy notice without blocking the runtime
  useEffect(() => {
    if (!sessionNotice) return;
    const timer = setTimeout(() => {
      setSessionNotice(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [sessionNotice]);

  // Asynchronous thumbnail generation pipeline to compress images to tiny ~5-10KB previews
  const generateAndStoreThumbnail = useCallback((index, sourceImage) => {
    if (!sourceImage) return;
    generateThumbnail(sourceImage).then((thumb) => {
      setCapturedImages((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const newArray = [...prev];
        newArray[index] = { ...newArray[index], thumbnail: thumb };
        return newArray;
      });
    }).catch(err => {
      console.error('[App] Failed to generate async preview:', err);
    });
  }, []);

  // Asynchronous preview generation pipeline to compress images to medium-resolution ~40-50KB previews
  const generateAndStorePreview = useCallback((index, sourceImage) => {
    if (!sourceImage) return;
    generatePreview(sourceImage).then((previewImg) => {
      setCapturedImages((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const newArray = [...prev];
        newArray[index] = { ...newArray[index], preview: previewImg };
        return newArray;
      });
    }).catch(err => {
      console.error('[App] Failed to generate async preview:', err);
    });
  }, []);

  // 15-minute inactivity auto-clear for privacy
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (capturedImages.length > 0) {
          clearSession();
          setSessionNotice(true);
        }
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [capturedImages, clearSession]);

  // Get the currently active document
  const activeDocument = capturedImages[currentIndex]
    ? normalizeScanFormat(capturedImages[currentIndex])
    : null;
  const activeOriginal = activeDocument ? activeDocument.original : null;
  const activeCropped = activeDocument ? activeDocument.cropped : null;

  /**
   * Called by CameraScreen after a frame is captured.
   * Stores the base64 image and navigates to the adjust step.
   */
  function handleCapture(imageData, presetId = 'freeform', isLowQuality = false) {
    let targetIndex = currentIndex;
    setCapturedImages((prev) => {
      const newArray = [...prev];
      let rawScan;
      const targetPreset = presetId || 'freeform';
      if (currentIndex < newArray.length) {
        rawScan = { ...newArray[currentIndex], original: imageData, cropped: null, enhanced: null, isLowQuality };
        newArray[currentIndex] = attachFormatToScan(rawScan, targetPreset);
        targetIndex = currentIndex;
      } else {
        rawScan = { id: Date.now(), original: imageData, cropped: null, enhanced: null, isLowQuality };
        newArray.push(attachFormatToScan(rawScan, targetPreset));
        targetIndex = newArray.length - 1;
      }
      return newArray;
    });

    // Trigger non-blocking async preview compression
    generateAndStoreThumbnail(targetIndex, imageData);
    generateAndStorePreview(targetIndex, imageData);
    setCurrentStep(STEPS.ADJUST);
  }

  /**
   * Called to retake the current image.
   * Soft return to camera — session state is preserved.
   */
  function handleRetake() {
    setCurrentStep(STEPS.CAMERA);
  }

  /**
   * Called to scan another page without losing previous images.
   */
  function handleScanMore() {
    setCurrentIndex(capturedImages.length);
    setCurrentStep(STEPS.CAMERA);
  }

  /**
   * Called to remove a page with a 6-second undo capability.
   * Shifts selection focus logically and atomic-clears the page.
   */
  const handleRemoveImage = useCallback((indexToRemove) => {
    setCapturedImages((prev) => {
      if (indexToRemove < 0 || indexToRemove >= prev.length) return prev;
      
      // Store in temporary deletion buffer before filtering out
      setDeletedBuffer({
        page: prev[indexToRemove],
        index: indexToRemove
      });

      const newArray = prev.filter((_, idx) => idx !== indexToRemove);
      
      if (newArray.length === 0) {
        // All images deleted, reset state and go to camera
        setCurrentIndex(0);
        setCurrentStep(STEPS.CAMERA);
      } else if (currentIndex >= newArray.length) {
        setCurrentIndex(newArray.length - 1);
      } else if (indexToRemove < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      }
      return newArray;
    });
  }, [currentIndex]);

  /**
   * Safe accidental recovery undo handler.
   * Restores the page from temporary buffer back to its original array slot.
   */
  const handleUndoDelete = useCallback(() => {
    if (!deletedBuffer) return;
    const { page, index } = deletedBuffer;
    setCapturedImages((prev) => {
      const restored = [...prev];
      // Splice the page back to its exact index
      restored.splice(index, 0, page);
      return restored;
    });
    setCurrentIndex(index);
    setDeletedBuffer(null);
  }, [deletedBuffer]);

  function handleCropDone(croppedImageData) {
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (newArray[currentIndex]) {
        const existing = newArray[currentIndex];
        const updated = {
          ...existing,
          cropped: croppedImageData,
          croppedImage: croppedImageData,
          enhanced: { original: croppedImageData, grayscale: null, document: null },
          enhancedImage: croppedImageData,
          selectedFilter: 'original'
        };
        newArray[currentIndex] = normalizeScanFormat(updated);
      }
      return newArray;
    });

    // Trigger non-blocking async preview compression
    generateAndStoreThumbnail(currentIndex, croppedImageData);
    generateAndStorePreview(currentIndex, croppedImageData);
    setCurrentStep(STEPS.ENHANCE);
  }

  /**
   * Called by EnhanceScreen when user is done applying filters.
   * Advances to the export step.
   */
  function handleEnhanceDone(enhancedFilters, selectedFilter) {
    const activeEnhanced = enhancedFilters[selectedFilter] || enhancedFilters.original || '';
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (newArray[currentIndex]) {
        const existing = newArray[currentIndex];
        const updated = {
          ...existing,
          enhanced: enhancedFilters,
          selectedFilter: selectedFilter,
          enhancedImage: activeEnhanced
        };
        newArray[currentIndex] = normalizeScanFormat(updated);
      }
      return newArray;
    });

    // Trigger non-blocking async preview compression
    generateAndStoreThumbnail(currentIndex, activeEnhanced);
    generateAndStorePreview(currentIndex, activeEnhanced);
    setCurrentStep(STEPS.EXPORT);
  }

  /**
   * Called when a format preset is updated for the active scanned image.
   * Preserves state of pages independently.
   */
  const handleFormatChange = useCallback((presetId) => {
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (newArray[currentIndex]) {
        newArray[currentIndex] = attachFormatToScan(newArray[currentIndex], presetId);
      }
      return newArray;
    });
  }, [currentIndex]);

  /**
   * Triggers rescanning / replacing the current scanned page at the given index.
   * Switches to the camera screen while preserving the target replacement index.
   */
  const handleReplacePage = useCallback((index) => {
    setCurrentIndex(index);
    setCurrentStep(STEPS.CAMERA);
  }, []);

  const handleReorderPage = useCallback((index, targetInput) => {
    setCapturedImages((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      
      let targetIndex;
      if (typeof targetInput === 'number') {
        targetIndex = targetInput;
      } else {
        targetIndex = targetInput === 'left' ? index - 1 : index + 1;
      }
      
      if (targetIndex < 0 || targetIndex >= prev.length || targetIndex === index) return prev;

      const newArray = [...prev];
      // Atomic insert reordering via array splicing (mobile-native feel)
      const [movedItem] = newArray.splice(index, 1);
      newArray.splice(targetIndex, 0, movedItem);

      setCurrentIndex(targetIndex);
      return newArray;
    });
  }, []);

  /**
   * Renders the active screen component based on current workflow step.
   */
  function renderScreen() {
    switch (currentStep) {
      case STEPS.CAMERA:
        return <CameraScreen onCapture={handleCapture} />;

      case STEPS.ADJUST:
        return (
          <CropScreen
            image={activeOriginal}
            allImages={capturedImages}
            currentIndex={currentIndex}
            activeDocument={activeDocument}
            isLowQuality={activeDocument?.isLowQuality}
            onSelectImage={(index) => setCurrentIndex(index)}
            onRemove={handleRemoveImage}
            onReorder={handleReorderPage}
            onReplace={handleReplacePage}
            onScanMore={handleScanMore}
            onBack={handleRetake}
            onDone={handleCropDone}
            onFormatChange={handleFormatChange}
          />
        );

      case STEPS.ENHANCE:
        return (
          <EnhanceScreen
            image={activeDocument?.preview || activeCropped || activeOriginal}
            initialEnhanced={activeDocument?.enhanced}
            initialFilter={activeDocument?.selectedFilter}
            allImages={capturedImages}
            currentIndex={currentIndex}
            onSelectImage={(index) => setCurrentIndex(index)}
            onRemove={handleRemoveImage}
            onReorder={handleReorderPage}
            onReplace={handleReplacePage}
            onScanMore={handleScanMore}
            onBack={() => setCurrentStep(STEPS.ADJUST)}
            onDone={handleEnhanceDone}
          />
        );

      case STEPS.EXPORT:
        return (
          <ExportScreen
            allImages={capturedImages}
            currentIndex={currentIndex}
            onSelectImage={(index) => setCurrentIndex(index)}
            onRemove={handleRemoveImage}
            onReorder={handleReorderPage}
            onReplace={handleReplacePage}
            onScanMore={handleScanMore}
            onBack={() => setCurrentStep(STEPS.ENHANCE)}
            onFinish={clearSession}
          />
        );

      default:
        return <p>Unknown screen</p>;
    }
  }

  return (
    <div className="app-container">
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Loading...</div>}>
        {renderScreen()}
      </Suspense>

      {deletedBuffer && (
        <div className="undo-banner" role="status" aria-live="polite">
          <div className="undo-banner-content">
            <span className="material-symbols-outlined undo-banner-icon">delete_sweep</span>
            <span className="undo-banner-text">Page {deletedBuffer.index + 1} deleted.</span>
          </div>
          <button className="undo-banner-btn" onClick={handleUndoDelete}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>undo</span>
            Undo
          </button>
        </div>
      )}

      {sessionNotice && (
        <div className="session-toast" role="status" aria-live="polite">
          <div className="session-toast-content">
            <span className="material-symbols-outlined session-toast-icon">lock_reset</span>
            <span className="session-toast-text">Session expired. Images were cleared for privacy.</span>
          </div>
          <button className="session-toast-btn" onClick={() => setSessionNotice(false)}>
            Dismiss
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="update-toast" role="alert" aria-live="assertive">
          <div className="update-toast-content">
            <span className="material-symbols-outlined update-toast-icon">system_update_alt</span>
            <div className="update-toast-text">
              <h4 className="update-toast-title">Update Available</h4>
              <p className="update-toast-desc">A new version of QuickScan is ready.</p>
            </div>
          </div>
          <div className="update-toast-actions">
            <button className="update-toast-btn primary" onClick={() => updateServiceWorker(true)}>
              Update
            </button>
            <button className="update-toast-btn secondary" onClick={() => setNeedRefresh(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
