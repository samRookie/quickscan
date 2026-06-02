import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useScanSession } from './hooks/useScanSession.js';

// Lazy load screens for bundle optimization
const CameraScreen = React.lazy(() => import('./screens/CameraScreen'));
const CropScreen = React.lazy(() => import('./screens/CropScreen'));
const EnhanceScreen = React.lazy(() => import('./screens/EnhanceScreen'));
const ExportScreen = React.lazy(() => import('./screens/ExportScreen'));

/**
 * Workflow steps for the QuickScan app flow.
 * Each step represents a stage in the document scanning pipeline.
 *
 * Flow: camera -> adjust -> enhance -> export
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

  const {
    capturedImages,
    currentIndex,
    deletedBuffer,
    documentVersion,
    activeDocument,
    activeOriginal,
    activeCropped,
    setCurrentIndex,
    addDocument,
    updateDocumentCrop,
    updateDocumentEnhancement,
    updateDocumentFormat,
    removeDocument,
    replaceDocument,
    reorderDocuments,
    clearSession,
    restoreDeletedDocument,
  } = useScanSession();

  const [currentStep, setCurrentStep] = useState(STEPS.CAMERA);
  const [sessionNotice, setSessionNotice] = useState(false);

  const handleClearSession = useCallback(() => {
    clearSession();
    setSessionNotice(false);
    setCurrentStep(STEPS.CAMERA);
  }, [clearSession]);

  // Auto-dismiss privacy notice without blocking the runtime
  useEffect(() => {
    if (!sessionNotice) return;
    const timer = setTimeout(() => {
      setSessionNotice(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [sessionNotice]);

  // 15-minute inactivity auto-clear for privacy
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (capturedImages.length > 0) {
          handleClearSession();
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
  }, [capturedImages.length, handleClearSession]);

  /**
   * Called by CameraScreen after a frame is captured.
   * Stores the image in the scan session and navigates to the adjust step.
   */
  const handleCapture = useCallback((imageData, presetId = 'freeform', isLowQuality = false) => {
    addDocument(imageData, presetId, isLowQuality);
    setCurrentStep(STEPS.ADJUST);
  }, [addDocument]);

  /**
   * Called to retake the current image.
   * Soft return to camera - session state is preserved.
   */
  const handleRetake = useCallback(() => {
    setCurrentStep(STEPS.CAMERA);
  }, []);

  /**
   * Called to scan another page without losing previous images.
   */
  const handleScanMore = useCallback(() => {
    setCurrentIndex(capturedImages.length);
    setCurrentStep(STEPS.CAMERA);
  }, [capturedImages.length, setCurrentIndex]);

  /**
   * Called to remove a page with undo capability.
   * If the session becomes empty, the shell returns to camera.
   */
  const handleRemoveImage = useCallback((indexToRemove) => {
    const result = removeDocument(indexToRemove);
    if (result.removed && result.remainingCount === 0) {
      setCurrentStep(STEPS.CAMERA);
    }
  }, [removeDocument]);

  const handleCropDone = useCallback((croppedImageData) => {
    updateDocumentCrop(croppedImageData);
    setCurrentStep(STEPS.ENHANCE);
  }, [updateDocumentCrop]);

  /**
   * Called by EnhanceScreen when user is done applying filters.
   * Advances to the export step.
   */
  const handleEnhanceDone = useCallback((enhancedFilters, selectedFilter) => {
    updateDocumentEnhancement(enhancedFilters, selectedFilter);
    setCurrentStep(STEPS.EXPORT);
  }, [updateDocumentEnhancement]);

  /**
   * Triggers rescanning / replacing the current scanned page at the given index.
   * Switches to the camera screen while preserving the target replacement index.
   */
  const handleReplacePage = useCallback((index) => {
    if (replaceDocument(index)) {
      setCurrentStep(STEPS.CAMERA);
    }
  }, [replaceDocument]);

  const handleBackToAdjust = useCallback(() => {
    setCurrentStep(STEPS.ADJUST);
  }, []);

  const handleBackToEnhance = useCallback(() => {
    setCurrentStep(STEPS.ENHANCE);
  }, []);

  const handleDismissSessionNotice = useCallback(() => {
    setSessionNotice(false);
  }, []);

  const handleApplyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  const handleDismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

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
            onSelectImage={setCurrentIndex}
            onRemove={handleRemoveImage}
            onReorder={reorderDocuments}
            onReplace={handleReplacePage}
            onScanMore={handleScanMore}
            onBack={handleRetake}
            onDone={handleCropDone}
            onFormatChange={updateDocumentFormat}
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
            onSelectImage={setCurrentIndex}
            onRemove={handleRemoveImage}
            onReorder={reorderDocuments}
            onReplace={handleReplacePage}
            onScanMore={handleScanMore}
            onBack={handleBackToAdjust}
            onDone={handleEnhanceDone}
          />
        );

      case STEPS.EXPORT:
        return (
          <ExportScreen
            allImages={capturedImages}
            documentVersion={documentVersion}
            currentIndex={currentIndex}
            onSelectImage={setCurrentIndex}
            onRemove={handleRemoveImage}
            onReorder={reorderDocuments}
            onReplace={handleReplacePage}
            onScanMore={handleScanMore}
            onBack={handleBackToEnhance}
            onFinish={handleClearSession}
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
          <button className="undo-banner-btn" onClick={restoreDeletedDocument}>
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
          <button className="session-toast-btn" onClick={handleDismissSessionNotice}>
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
            <button className="update-toast-btn primary" onClick={handleApplyUpdate}>
              Update
            </button>
            <button className="update-toast-btn secondary" onClick={handleDismissUpdate}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
