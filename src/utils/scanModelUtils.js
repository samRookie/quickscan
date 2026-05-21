import { getFormatPresetById, sanitizeFormatPreset } from './formatUtils.js';

/**
 * Normalizes an old or partial scan object to follow the new, extended format-aware scan model structure.
 * Ensures absolute backward compatibility.
 *
 * @param {Object} scan - The raw scan object to normalize.
 * @returns {Object} A fully-formed, migrated scan object.
 */
export function normalizeScanFormat(scan) {
  if (!scan || typeof scan !== 'object') {
    return null;
  }

  // Clone original to avoid state mutation side-effects
  const normalized = { ...scan };

  // 1. Ensure ID exists
  if (!normalized.id) {
    normalized.id = Date.now() + Math.floor(Math.random() * 1000);
  }

  // 2. Map old/new image properties for dual compatibility
  normalized.original = normalized.original || normalized.originalImage || '';
  normalized.originalImage = normalized.originalImage || normalized.original || '';

  normalized.cropped = normalized.cropped || normalized.croppedImage || null;
  normalized.croppedImage = normalized.croppedImage || normalized.cropped || null;

  // Map active filter enhancement
  let activeEnhanced = null;
  if (normalized.enhanced && typeof normalized.enhanced === 'object') {
    const filter = normalized.selectedFilter || 'original';
    activeEnhanced = normalized.enhanced[filter];
  }
  normalized.enhancedImage = normalized.enhancedImage || activeEnhanced || normalized.croppedImage || normalized.originalImage || '';
  
  if (!normalized.enhanced) {
    normalized.enhanced = {
      original: normalized.cropped || normalized.original || '',
      grayscale: null,
      document: null
    };
    normalized.selectedFilter = normalized.selectedFilter || 'original';
  }

  // 3. Normalize format snapshot (Task 6 compatibility layer)
  if (!normalized.format || typeof normalized.format !== 'object') {
    const defaultPreset = getFormatPresetById('freeform');
    normalized.format = {
      presetId: defaultPreset.id,
      aspectRatio: defaultPreset.aspectRatio, // Physical ratio (null for Freeform)
      orientation: defaultPreset.orientation,
      category: defaultPreset.category
    };
  } else {
    const preset = getFormatPresetById(normalized.format.presetId);
    normalized.format = {
      presetId: normalized.format.presetId || preset.id,
      aspectRatio: 'aspectRatio' in normalized.format ? normalized.format.aspectRatio : preset.aspectRatio,
      orientation: normalized.format.orientation || preset.orientation,
      category: normalized.format.category || preset.category
    };
  }

  // 4. Normalize metadata snapshot
  const now = Date.now();
  if (!normalized.metadata || typeof normalized.metadata !== 'object') {
    normalized.metadata = {
      createdAt: now,
      modifiedAt: now,
      captureMode: normalized.isLowQuality ? 'front' : 'rear'
    };
  } else {
    normalized.metadata = {
      createdAt: normalized.metadata.createdAt || now,
      modifiedAt: normalized.metadata.modifiedAt || now,
      captureMode: normalized.metadata.captureMode || 'rear'
    };
  }

  return normalized;
}

/**
 * Attaches a format snapshot to a scan object.
 *
 * @param {Object} scan - The scan object to attach format metadata to.
 * @param {Object|string} presetInput - Preset object or preset ID string.
 * @returns {Object} A new, format-aware scan object.
 */
export function attachFormatToScan(scan, presetInput) {
  const normalized = normalizeScanFormat(scan);
  if (!normalized) return null;

  const preset = typeof presetInput === 'string'
    ? getFormatPresetById(presetInput)
    : sanitizeFormatPreset(presetInput);

  return {
    ...normalized,
    format: {
      presetId: preset.id,
      aspectRatio: preset.aspectRatio, // Snapshot physical aspect ratio
      orientation: preset.orientation,
      category: preset.category
    },
    metadata: {
      ...normalized.metadata,
      modifiedAt: Date.now()
    }
  };
}

/**
 * Safely updates the format metadata inside a scan object.
 * Returns a new, updated scan object while preserving all other properties.
 *
 * @param {Object} scan - The scan object to update.
 * @param {Object|string} presetInput - Preset object or preset ID string.
 * @returns {Object} A new, updated format-aware scan object.
 */
export function updateScanFormatSafely(scan, presetInput) {
  return attachFormatToScan(scan, presetInput);
}

/**
 * Retrieves the format metadata snapshot from a scan object safely.
 *
 * @param {Object} scan - The scan object.
 * @returns {Object} The format metadata object.
 */
export function getScanFormat(scan) {
  const normalized = normalizeScanFormat(scan);
  return normalized ? normalized.format : null;
}
