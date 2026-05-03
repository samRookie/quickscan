import React, { useState, useEffect, useCallback, Suspense } from 'react';

// Lazy load screens for bundle optimization
const CameraScreen = React.lazy(() => import('./screens/CameraScreen'));
const PreviewScreen = React.lazy(() => import('./screens/PreviewScreen'));
const CropScreen = React.lazy(() => import('./screens/CropScreen'));
const EnhanceScreen = React.lazy(() => import('./screens/EnhanceScreen'));
const ExportScreen = React.lazy(() => import('./screens/ExportScreen'));

/**
 * Screen states for the QuickScan app flow.
 * Each state represents a step in the document scanning pipeline.
 *
 * Flow: camera → preview → crop → enhance
 */
const SCREENS = {
  CAMERA: 'camera',
  PREVIEW: 'preview',
  CROP: 'crop',
  ENHANCE: 'enhance',
  EXPORT: 'export',
};

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.CAMERA);
  const [capturedImages, setCapturedImages] = useState([]); // array of objects { id, original, cropped, enhanced }
  const [currentIndex, setCurrentIndex] = useState(0);

  // Clear session to ensure data privacy
  const clearSession = useCallback(() => {
    setCapturedImages([]);
    setCurrentIndex(0);
    setCurrentScreen(SCREENS.CAMERA);
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
      }, 15 * 60 * 1000); // 15 mins
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

  const goTo = (screen) => setCurrentScreen(screen);

  // Get the currently active document
  const activeDocument = capturedImages[currentIndex] || null;
  const activeOriginal = activeDocument ? activeDocument.original : null;
  const activeCropped = activeDocument ? activeDocument.cropped : null;
  const activeEnhanced = activeDocument?.enhanced?.[activeDocument?.selectedFilter] || null;

  /**
   * Called by CameraScreen after a frame is captured.
   * Stores the base64 image and navigates to the preview screen.
   * Resets any previous crop result.
   */
  function handleCapture(imageData, isLowQuality = false) {
    setCapturedImages((prev) => {
      const newArray = [...prev];
      if (currentIndex < newArray.length) {
        // Retaking an existing image
        newArray[currentIndex] = { ...newArray[currentIndex], original: imageData, cropped: null, enhanced: null, isLowQuality };
      } else {
        // Appending a new image
        newArray.push({ id: Date.now(), original: imageData, cropped: null, enhanced: null, isLowQuality });
      }
      return newArray;
    });
    setCurrentScreen(SCREENS.PREVIEW);
  }

  /**
   * Called to retake the current image.
   * We keep the same currentIndex so handleCapture overwrites it.
   */
  function handleRetake() {
    setCurrentScreen(SCREENS.CAMERA);
  }

  /**
   * Called to scan another page without losing previous images.
   */
  function handleScanMore() {
    setCurrentIndex(capturedImages.length);
    setCurrentScreen(SCREENS.CAMERA);
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
        setCurrentScreen(SCREENS.CAMERA);
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
   * Stores the cropped image and advances to the enhance screen.
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
    setCurrentScreen(SCREENS.PREVIEW); // Go back to preview to view or scan more
  }

  /**
   * Called by EnhanceScreen when user is done applying filters.
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
    setCurrentScreen(SCREENS.PREVIEW);
  }

  /**
   * Renders the active screen component based on current state.
   */
  function renderScreen() {
    switch (currentScreen) {
      case SCREENS.CAMERA:
        return <CameraScreen onCapture={handleCapture} />;

      case SCREENS.PREVIEW:
        return (
          <PreviewScreen
            image={activeEnhanced || activeCropped || activeOriginal}
            allImages={capturedImages}
            currentIndex={currentIndex}
            onSelectImage={(index) => setCurrentIndex(index)}
            onRetake={handleRetake}
            onScanMore={handleScanMore}
            onRemove={handleRemoveImage}
            onContinue={() => goTo(SCREENS.CROP)}
            onEnhance={() => goTo(SCREENS.ENHANCE)}
            onExport={() => goTo(SCREENS.EXPORT)}
          />
        );

      case SCREENS.CROP:
        return (
          <CropScreen
            image={activeOriginal} // Always crop from the original source
            onBack={() => goTo(SCREENS.PREVIEW)}
            onDone={handleCropDone}
          />
        );

      case SCREENS.ENHANCE:
        return (
          <EnhanceScreen
            image={activeCropped || activeOriginal}
            initialEnhanced={activeDocument?.enhanced}
            initialFilter={activeDocument?.selectedFilter}
            onBack={() => goTo(SCREENS.PREVIEW)}
            onDone={handleEnhanceDone}
          />
        );

      case SCREENS.EXPORT:
        return (
          <ExportScreen
            allImages={capturedImages}
            onBack={() => goTo(SCREENS.PREVIEW)}
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
