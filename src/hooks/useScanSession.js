import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  attachFormatToScan,
  generatePreview,
  generateThumbnail,
  normalizeScanFormat,
} from '../utils/scanModelUtils.js';

const DELETE_UNDO_TIMEOUT_MS = 6000;

function replaceAt(items, index, nextItem) {
  const nextItems = [...items];
  nextItems[index] = nextItem;
  return nextItems;
}

function resolveGeneratedAssetIndex(items, preferredIndex, documentId) {
  if (items[preferredIndex]?.id === documentId) {
    return preferredIndex;
  }

  return items.findIndex((item) => item?.id === documentId);
}

export function useScanSession() {
  const [capturedImages, setCapturedImagesState] = useState([]);
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [deletedBuffer, setDeletedBufferState] = useState(null);
  const [documentVersion, setDocumentVersion] = useState(0);

  const capturedImagesRef = useRef(capturedImages);
  const currentIndexRef = useRef(currentIndex);
  const deletedBufferRef = useRef(deletedBuffer);

  const setCapturedImages = useCallback((nextValue) => {
    setCapturedImagesState((previous) => {
      const resolved = typeof nextValue === 'function'
        ? nextValue(previous)
        : nextValue;

      capturedImagesRef.current = resolved;
      return resolved;
    });
  }, []);

  const setCurrentIndex = useCallback((nextValue) => {
    setCurrentIndexState((previous) => {
      const resolved = typeof nextValue === 'function'
        ? nextValue(previous)
        : nextValue;

      currentIndexRef.current = resolved;
      return resolved;
    });
  }, []);

  const setDeletedBuffer = useCallback((nextValue) => {
    setDeletedBufferState((previous) => {
      const resolved = typeof nextValue === 'function'
        ? nextValue(previous)
        : nextValue;

      deletedBufferRef.current = resolved;
      return resolved;
    });
  }, []);

  const bumpDocumentVersion = useCallback(() => {
    setDocumentVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    capturedImagesRef.current = capturedImages;
  }, [capturedImages]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    deletedBufferRef.current = deletedBuffer;
  }, [deletedBuffer]);

  useEffect(() => {
    if (!deletedBuffer) return;

    const timer = setTimeout(() => {
      setDeletedBuffer(null);
    }, DELETE_UNDO_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [deletedBuffer, setDeletedBuffer]);

  const storeGeneratedAsset = useCallback((index, documentId, assetPatch) => {
    setCapturedImages((previous) => {
      const targetIndex = resolveGeneratedAssetIndex(previous, index, documentId);
      if (targetIndex < 0) return previous;

      return replaceAt(previous, targetIndex, {
        ...previous[targetIndex],
        ...assetPatch,
      });
    });
  }, [setCapturedImages]);

  const generateAndStoreThumbnail = useCallback((index, documentId, sourceImage) => {
    if (!sourceImage) return;

    generateThumbnail(sourceImage)
      .then((thumbnail) => {
        storeGeneratedAsset(index, documentId, { thumbnail });
      })
      .catch((err) => {
        console.error('[useScanSession] Failed to generate async thumbnail:', err);
      });
  }, [storeGeneratedAsset]);

  const generateAndStorePreview = useCallback((index, documentId, sourceImage) => {
    if (!sourceImage) return;

    generatePreview(sourceImage)
      .then((preview) => {
        storeGeneratedAsset(index, documentId, { preview });
      })
      .catch((err) => {
        console.error('[useScanSession] Failed to generate async preview:', err);
      });
  }, [storeGeneratedAsset]);

  const updateDerivedImages = useCallback((index, documentId, sourceImage) => {
    generateAndStoreThumbnail(index, documentId, sourceImage);
    generateAndStorePreview(index, documentId, sourceImage);
  }, [generateAndStorePreview, generateAndStoreThumbnail]);

  const updateDocument = useCallback((indexOrUpdater, updaterOrPatch, previewSource) => {
    const index = typeof indexOrUpdater === 'number'
      ? indexOrUpdater
      : currentIndexRef.current;
    const updater = typeof indexOrUpdater === 'number'
      ? updaterOrPatch
      : indexOrUpdater;

    const previous = capturedImagesRef.current;
    if (index < 0 || index >= previous.length || !updater) {
      return null;
    }

    const existing = previous[index];
    const updated = typeof updater === 'function'
      ? updater(existing)
      : { ...existing, ...updater };
    const nextDocument = normalizeScanFormat(updated);

    setCapturedImages(replaceAt(previous, index, nextDocument));
    bumpDocumentVersion();

    if (previewSource) {
      updateDerivedImages(index, nextDocument.id, previewSource);
    }

    return nextDocument;
  }, [bumpDocumentVersion, setCapturedImages, updateDerivedImages]);

  const addDocument = useCallback((imageData, presetId = 'freeform', isLowQuality = false) => {
    const previous = capturedImagesRef.current;
    const activeIndex = currentIndexRef.current;
    const targetPreset = presetId || 'freeform';
    const shouldReplace = activeIndex >= 0 && activeIndex < previous.length;
    const targetIndex = shouldReplace ? activeIndex : previous.length;
    const baseDocument = shouldReplace
      ? {
          ...previous[targetIndex],
          id: Date.now(),
          original: imageData,
          originalImage: imageData,
          cropped: null,
          croppedImage: null,
          enhanced: null,
          enhancedImage: imageData,
          thumbnail: '',
          preview: '',
          selectedFilter: 'original',
          isLowQuality,
        }
      : {
          id: Date.now(),
          original: imageData,
          cropped: null,
          enhanced: null,
          isLowQuality,
        };
    const nextDocument = attachFormatToScan(baseDocument, targetPreset);
    const nextImages = shouldReplace
      ? replaceAt(previous, targetIndex, nextDocument)
      : [...previous, nextDocument];

    setCapturedImages(nextImages);
    setCurrentIndex(targetIndex);
    bumpDocumentVersion();
    updateDerivedImages(targetIndex, nextDocument.id, imageData);

    return targetIndex;
  }, [bumpDocumentVersion, setCapturedImages, setCurrentIndex, updateDerivedImages]);

  const updateDocumentCrop = useCallback((croppedImageData, index = currentIndexRef.current) => (
    updateDocument(index, (existing) => ({
      ...existing,
      cropped: croppedImageData,
      croppedImage: croppedImageData,
      enhanced: { original: croppedImageData, grayscale: null, document: null },
      enhancedImage: croppedImageData,
      thumbnail: '',
      preview: '',
      selectedFilter: 'original',
    }), croppedImageData)
  ), [updateDocument]);

  const updateDocumentEnhancement = useCallback((enhancedFilters, selectedFilter, index = currentIndexRef.current) => {
    const activeEnhanced = enhancedFilters[selectedFilter] || enhancedFilters.original || '';

    updateDocument(index, (existing) => ({
      ...existing,
      enhanced: enhancedFilters,
      selectedFilter,
      enhancedImage: activeEnhanced,
      preview: '',
    }), activeEnhanced);

    return activeEnhanced;
  }, [updateDocument]);

  const updateDocumentFormat = useCallback((presetId, index = currentIndexRef.current) => (
    updateDocument(index, (existing) => attachFormatToScan(existing, presetId))
  ), [updateDocument]);

  const removeDocument = useCallback((indexToRemove) => {
    const previous = capturedImagesRef.current;
    if (indexToRemove < 0 || indexToRemove >= previous.length) {
      return {
        removed: false,
        remainingCount: previous.length,
        currentIndex: currentIndexRef.current,
      };
    }

    setDeletedBuffer({
      page: previous[indexToRemove],
      index: indexToRemove,
    });

    const nextImages = previous.filter((_, index) => index !== indexToRemove);
    let resolvedIndex = currentIndexRef.current;

    setCapturedImages(nextImages);
    setCurrentIndex((latestIndex) => {
      if (nextImages.length === 0) {
        resolvedIndex = 0;
      } else if (latestIndex >= nextImages.length) {
        resolvedIndex = nextImages.length - 1;
      } else if (indexToRemove < latestIndex) {
        resolvedIndex = latestIndex - 1;
      } else {
        resolvedIndex = latestIndex;
      }

      return resolvedIndex;
    });
    bumpDocumentVersion();

    return {
      removed: true,
      remainingCount: nextImages.length,
      currentIndex: resolvedIndex,
    };
  }, [bumpDocumentVersion, setCapturedImages, setCurrentIndex, setDeletedBuffer]);

  const restoreDeletedDocument = useCallback(() => {
    const buffer = deletedBufferRef.current;
    if (!buffer) return false;

    const previous = capturedImagesRef.current;
    const restored = [...previous];
    restored.splice(buffer.index, 0, buffer.page);

    setCapturedImages(restored);
    setCurrentIndex(buffer.index);
    setDeletedBuffer(null);
    bumpDocumentVersion();

    return true;
  }, [bumpDocumentVersion, setCapturedImages, setCurrentIndex, setDeletedBuffer]);

  const replaceDocument = useCallback((index) => {
    const previous = capturedImagesRef.current;
    if (index < 0 || index >= previous.length) {
      return false;
    }

    setCurrentIndex(index);
    return true;
  }, [setCurrentIndex]);

  const reorderDocuments = useCallback((index, targetInput) => {
    const previous = capturedImagesRef.current;
    if (index < 0 || index >= previous.length) return null;

    const targetIndex = typeof targetInput === 'number'
      ? targetInput
      : targetInput === 'left'
        ? index - 1
        : index + 1;

    if (targetIndex < 0 || targetIndex >= previous.length || targetIndex === index) {
      return null;
    }

    const nextImages = [...previous];
    const [movedItem] = nextImages.splice(index, 1);
    nextImages.splice(targetIndex, 0, movedItem);

    setCapturedImages(nextImages);
    setCurrentIndex(targetIndex);
    bumpDocumentVersion();

    return targetIndex;
  }, [bumpDocumentVersion, setCapturedImages, setCurrentIndex]);

  const clearSession = useCallback(() => {
    setCapturedImages([]);
    setCurrentIndex(0);
    setDeletedBuffer(null);
    bumpDocumentVersion();
  }, [bumpDocumentVersion, setCapturedImages, setCurrentIndex, setDeletedBuffer]);

  const activeDocument = useMemo(() => (
    capturedImages[currentIndex] || null
  ), [capturedImages, currentIndex]);

  const activeOriginal = activeDocument ? activeDocument.original : null;
  const activeCropped = activeDocument ? activeDocument.cropped : null;

  return {
    capturedImages,
    currentIndex,
    deletedBuffer,
    documentVersion,
    activeDocument,
    activeOriginal,
    activeCropped,

    setCurrentIndex,

    addDocument,
    updateDocument,
    updateDocumentCrop,
    updateDocumentEnhancement,
    updateDocumentFormat,
    removeDocument,
    replaceDocument,
    reorderDocuments,
    clearSession,
    restoreDeletedDocument,
  };
}
