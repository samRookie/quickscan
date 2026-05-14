import React, { useState, useEffect, useCallback, Suspense } from 'react';

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
  const [currentStep, setCurrentStep] = useState(STEPS.CAMERA);
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Clear session to ensure data privacy
  const clearSession = useCallback(() => {
    setCapturedImages([]);
    setCurrentIndex(0);
    setCurrentStep(STEPS.CAMERA);
  }, []);

  // 15-minute inactivity auto-clear for privacy
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (capturedImages.length > 0) {
          clearSession();
          alert('Session expired due to inactivity. Images cleared for privacy.');
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
  const activeDocument = capturedImages[currentIndex] || null;
  const activeOriginal = activeDocument ? activeDocument.original : null;
  const activeCropped = activeDocument ? activeDocument.cropped : null;

  /**
   * Called by CameraScreen after a frame is captured.
   * Stores the base64 image and navigates to the adjust step.
   */
  function handleCapture(imageData, isLowQuality = false) {
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (currentIndex < newArray.length) {
        newArray[currentIndex] = { ...newArray[currentIndex], original: imageData, cropped: null, enhanced: null, isLowQuality };
      } else {
        newArray.push({ id: Date.now(), original: imageData, cropped: null, enhanced: null, isLowQuality });
      }
      return newArray;
    });
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
   * Called to completely remove a scanned page from the sequence.
   */
  function handleRemoveImage(indexToRemove) {
    setCapturedImages((prev) => {
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
  }

  /**
   * Called by CropScreen when the user confirms their crop.
   * Stores the cropped image and advances to the enhance step.
   */
  function handleCropDone(croppedImageData) {
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (newArray[currentIndex]) {
        newArray[currentIndex].cropped = croppedImageData;
        newArray[currentIndex].enhanced = { original: croppedImageData, grayscale: null, document: null };
        newArray[currentIndex].selectedFilter = 'original';
      }
      return newArray;
    });
    setCurrentStep(STEPS.ENHANCE);
  }

  /**
   * Called by EnhanceScreen when user is done applying filters.
   * Advances to the export step.
   */
  function handleEnhanceDone(enhancedFilters, selectedFilter) {
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (newArray[currentIndex]) {
        newArray[currentIndex].enhanced = enhancedFilters;
        newArray[currentIndex].selectedFilter = selectedFilter;
      }
      return newArray;
    });
    setCurrentStep(STEPS.EXPORT);
  }

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
            isLowQuality={activeDocument?.isLowQuality}
            onSelectImage={(index) => setCurrentIndex(index)}
            onRemove={handleRemoveImage}
            onScanMore={handleScanMore}
            onBack={handleRetake}
            onDone={handleCropDone}
          />
        );

      case STEPS.ENHANCE:
        return (
          <EnhanceScreen
            image={activeCropped || activeOriginal}
            initialEnhanced={activeDocument?.enhanced}
            initialFilter={activeDocument?.selectedFilter}
            allImages={capturedImages}
            currentIndex={currentIndex}
            onSelectImage={(index) => setCurrentIndex(index)}
            onRemove={handleRemoveImage}
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
    </div>
  );
}

export default App;
