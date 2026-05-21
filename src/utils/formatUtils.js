import { FORMAT_PRESETS, DEFAULT_FORMAT_PRESET } from '../config/formatPresets.js';
import {
  EXPORT_TYPES,
  ENHANCEMENT_MODES,
  CROP_BEHAVIORS,
  ORIENTATION_TYPES,
  QUALITY_LEVELS,
  PREVIEW_BEHAVIORS,
  THUMBNAIL_BEHAVIORS,
  DISPLAY_GROUPS
} from '../constants/formatConstants.js';

/**
 * Development-only console warning logger.
 * Assists in tracking invalid preset usage during development while remaining silent in production.
 *
 * @param {string} message - The warning message to display.
 */
export function logDevWarning(message) {
  try {
    const isDev = (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
                  (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true);
    if (isDev) {
      console.warn(`[QuickScan Format System Warning]: ${message}`);
    }
  } catch (e) {
    // Fail silently in environments where process or import.meta are constrained
  }
}

/**
 * Safely retrieves a format preset by its ID (case-insensitive).
 * Guaranteed to return a valid preset object (fallback to DEFAULT_FORMAT_PRESET).
 *
 * @param {string} id - The format preset identifier
 * @returns {Object} The matched preset object or the default fallback preset.
 */
export function getFormatPresetById(id) {
  if (!id || typeof id !== 'string') {
    logDevWarning(`Invalid ID requested: ${id}. Falling back to default preset.`);
    return DEFAULT_FORMAT_PRESET;
  }
  const cleanId = id.trim().toLowerCase();
  const matched = FORMAT_PRESETS[cleanId];
  if (!matched) {
    logDevWarning(`Preset ID not found: "${id}". Falling back to default preset.`);
    return DEFAULT_FORMAT_PRESET;
  }
  return matched;
}

/**
 * Retrieves the default fallback preset (Freeform).
 *
 * @returns {Object} The default format preset object.
 */
export function getDefaultFormatPreset() {
  return DEFAULT_FORMAT_PRESET;
}

/**
 * Strict structural validation asserting metadata types and values.
 * Prevents malformed preset usage.
 *
 * @param {Object} preset - The preset object to validate.
 * @returns {boolean} True if the preset is valid, false otherwise.
 */
export function isValidFormatPreset(preset) {
  if (!preset || typeof preset !== 'object') {
    return false;
  }

  // Schema properties type matching
  const typeMap = {
    id: 'string',
    label: 'string',
    orientation: 'string',
    category: 'string',
    displayGroup: 'string',
    cropBehavior: 'string',
    exportBehavior: 'string',
    supportsRotation: 'boolean',
    supportsFreeCrop: 'boolean',
    recommendedEnhancement: 'string',
    defaultExportType: 'string',
    outputQuality: 'string',
    cropPadding: 'number',
    previewScaleBehavior: 'string',
    thumbnailBehavior: 'string'
  };

  const hasAllKeys = Object.entries(typeMap).every(([key, expectedType]) => {
    return (key in preset) && (typeof preset[key] === expectedType);
  });

  const hasAspectRatio = 'aspectRatio' in preset && (preset.aspectRatio === null || typeof preset.aspectRatio === 'number');

  if (!hasAllKeys || !hasAspectRatio) {
    return false;
  }

  // Value range validation matching enums
  const isOrientationValid = Object.values(ORIENTATION_TYPES).includes(preset.orientation);
  const isDisplayGroupValid = Object.values(DISPLAY_GROUPS).includes(preset.displayGroup);
  const isCropBehaviorValid = Object.values(CROP_BEHAVIORS).includes(preset.cropBehavior);
  const isEnhancementValid = Object.values(ENHANCEMENT_MODES).includes(preset.recommendedEnhancement);
  const isExportTypeValid = Object.values(EXPORT_TYPES).includes(preset.defaultExportType);
  const isQualityValid = Object.values(QUALITY_LEVELS).includes(preset.outputQuality);
  const isPreviewValid = Object.values(PREVIEW_BEHAVIORS).includes(preset.previewScaleBehavior);
  const isThumbnailValid = Object.values(THUMBNAIL_BEHAVIORS).includes(preset.thumbnailBehavior);

  return (
    isOrientationValid &&
    isDisplayGroupValid &&
    isCropBehaviorValid &&
    isEnhancementValid &&
    isExportTypeValid &&
    isQualityValid &&
    isPreviewValid &&
    isThumbnailValid
  );
}

/**
 * Sanitizes and normalizes an incoming preset object.
 * Corrects wrong types, auto-fills missing configurations, and validates bounds.
 *
 * @param {Object} presetInput - The preset configuration to sanitize
 * @returns {Object} A fully-formed, guaranteed-safe preset object.
 */
export function sanitizeFormatPreset(presetInput) {
  if (!presetInput || typeof presetInput !== 'object') {
    logDevWarning('Attempted to sanitize non-object preset. Returning default.');
    return { ...DEFAULT_FORMAT_PRESET };
  }

  const sanitized = {};

  // 1. Strings Validation
  sanitized.id = (typeof presetInput.id === 'string' && presetInput.id.trim() !== '')
    ? presetInput.id.trim().toLowerCase()
    : DEFAULT_FORMAT_PRESET.id;

  sanitized.label = (typeof presetInput.label === 'string' && presetInput.label.trim() !== '')
    ? presetInput.label.trim()
    : (FORMAT_PRESETS[sanitized.id]?.label || DEFAULT_FORMAT_PRESET.label);

  // 2. Aspect Ratio Validation (null or positive float)
  if ('aspectRatio' in presetInput) {
    if (presetInput.aspectRatio === null) {
      sanitized.aspectRatio = null;
    } else {
      const parsed = parseFloat(presetInput.aspectRatio);
      sanitized.aspectRatio = (!isNaN(parsed) && parsed > 0) ? parsed : DEFAULT_FORMAT_PRESET.aspectRatio;
    }
  } else {
    sanitized.aspectRatio = DEFAULT_FORMAT_PRESET.aspectRatio;
  }

  // 3. Enums validations with strict fallbacks
  sanitized.orientation = (typeof presetInput.orientation === 'string' && Object.values(ORIENTATION_TYPES).includes(presetInput.orientation))
    ? presetInput.orientation
    : DEFAULT_FORMAT_PRESET.orientation;

  sanitized.category = (typeof presetInput.category === 'string' && presetInput.category.trim() !== '')
    ? presetInput.category.trim()
    : DEFAULT_FORMAT_PRESET.category;

  sanitized.displayGroup = (typeof presetInput.displayGroup === 'string' && Object.values(DISPLAY_GROUPS).includes(presetInput.displayGroup))
    ? presetInput.displayGroup
    : DEFAULT_FORMAT_PRESET.displayGroup;

  sanitized.cropBehavior = (typeof presetInput.cropBehavior === 'string' && Object.values(CROP_BEHAVIORS).includes(presetInput.cropBehavior))
    ? presetInput.cropBehavior
    : DEFAULT_FORMAT_PRESET.cropBehavior;

  sanitized.exportBehavior = (typeof presetInput.exportBehavior === 'string' && presetInput.exportBehavior.trim() !== '')
    ? presetInput.exportBehavior.trim()
    : DEFAULT_FORMAT_PRESET.exportBehavior;

  // 4. Booleans validations
  sanitized.supportsRotation = typeof presetInput.supportsRotation === 'boolean'
    ? presetInput.supportsRotation
    : DEFAULT_FORMAT_PRESET.supportsRotation;

  sanitized.supportsFreeCrop = typeof presetInput.supportsFreeCrop === 'boolean'
    ? presetInput.supportsFreeCrop
    : DEFAULT_FORMAT_PRESET.supportsFreeCrop;

  // 5. Intelligent behaviors enums validations
  sanitized.recommendedEnhancement = (typeof presetInput.recommendedEnhancement === 'string' && Object.values(ENHANCEMENT_MODES).includes(presetInput.recommendedEnhancement))
    ? presetInput.recommendedEnhancement
    : DEFAULT_FORMAT_PRESET.recommendedEnhancement;

  sanitized.defaultExportType = (typeof presetInput.defaultExportType === 'string' && Object.values(EXPORT_TYPES).includes(presetInput.defaultExportType))
    ? presetInput.defaultExportType
    : DEFAULT_FORMAT_PRESET.defaultExportType;

  sanitized.outputQuality = (typeof presetInput.outputQuality === 'string' && Object.values(QUALITY_LEVELS).includes(presetInput.outputQuality))
    ? presetInput.outputQuality
    : DEFAULT_FORMAT_PRESET.outputQuality;

  // 6. Padding Validation (must be positive integer or 0)
  if ('cropPadding' in presetInput) {
    const parsed = parseInt(presetInput.cropPadding, 10);
    sanitized.cropPadding = (!isNaN(parsed) && parsed >= 0) ? parsed : DEFAULT_FORMAT_PRESET.cropPadding;
  } else {
    sanitized.cropPadding = DEFAULT_FORMAT_PRESET.cropPadding;
  }

  sanitized.previewScaleBehavior = (typeof presetInput.previewScaleBehavior === 'string' && Object.values(PREVIEW_BEHAVIORS).includes(presetInput.previewScaleBehavior))
    ? presetInput.previewScaleBehavior
    : DEFAULT_FORMAT_PRESET.previewScaleBehavior;

  sanitized.thumbnailBehavior = (typeof presetInput.thumbnailBehavior === 'string' && Object.values(THUMBNAIL_BEHAVIORS).includes(presetInput.thumbnailBehavior))
    ? presetInput.thumbnailBehavior
    : DEFAULT_FORMAT_PRESET.thumbnailBehavior;

  return sanitized;
}

/**
 * Safely accesses metadata properties of a preset, preventing undefined crashes.
 * Automatically falls back to the default fallback preset properties if needed.
 *
 * @param {Object|string} presetInput - The preset object or preset ID
 * @param {string} key - The metadata property name
 * @param {*} [defaultValue] - Final fallback value if property is missing everywhere
 * @returns {*} The value of the requested property.
 */
export function getPresetMetadata(presetInput, key, defaultValue) {
  if (!key || typeof key !== 'string') {
    return defaultValue;
  }

  let preset = typeof presetInput === 'string'
    ? getFormatPresetById(presetInput)
    : presetInput;

  if (!isValidFormatPreset(preset)) {
    // Try to sanitize the malformed preset object first
    preset = sanitizeFormatPreset(preset);
  }

  if (key in preset) {
    return preset[key];
  }

  if (key in DEFAULT_FORMAT_PRESET) {
    return DEFAULT_FORMAT_PRESET[key];
  }

  return defaultValue;
}

/**
 * Safe metadata access helper for preset orientation.
 */
export function getPresetOrientation(presetInput) {
  return getPresetMetadata(presetInput, 'orientation', DEFAULT_FORMAT_PRESET.orientation);
}

/**
 * Safe metadata access helper for preset export type.
 */
export function getPresetExportType(presetInput) {
  return getPresetMetadata(presetInput, 'defaultExportType', DEFAULT_FORMAT_PRESET.defaultExportType);
}

/**
 * Safe metadata access helper for preset crop behavior.
 */
export function getPresetCropBehavior(presetInput) {
  return getPresetMetadata(presetInput, 'cropBehavior', DEFAULT_FORMAT_PRESET.cropBehavior);
}

/**
 * Safe metadata access helper for preset recommended enhancement mode.
 */
export function getPresetEnhancementMode(presetInput) {
  return getPresetMetadata(presetInput, 'recommendedEnhancement', DEFAULT_FORMAT_PRESET.recommendedEnhancement);
}

/**
 * Safe metadata access helper for preset display group.
 */
export function getPresetDisplayGroup(presetInput) {
  return getPresetMetadata(presetInput, 'displayGroup', DEFAULT_FORMAT_PRESET.displayGroup);
}

/**
 * Safe metadata access helper for preset crop padding.
 */
export function getPresetCropPadding(presetInput) {
  return getPresetMetadata(presetInput, 'cropPadding', DEFAULT_FORMAT_PRESET.cropPadding);
}

/**
 * Safe metadata access helper for preset preview scale behavior.
 */
export function getPresetPreviewScaleBehavior(presetInput) {
  return getPresetMetadata(presetInput, 'previewScaleBehavior', DEFAULT_FORMAT_PRESET.previewScaleBehavior);
}

/**
 * Safe metadata access helper for preset thumbnail behavior.
 */
export function getPresetThumbnailBehavior(presetInput) {
  return getPresetMetadata(presetInput, 'thumbnailBehavior', DEFAULT_FORMAT_PRESET.thumbnailBehavior);
}

/**
 * Calculates the crop / canvas aspect ratio (width / height) for a given preset.
 * Properly adjusts based on the designated orientation or overrides.
 *
 * Calculations:
 * - If physical aspectRatio is null (Freeform), returns customWidth / customHeight
 *   if provided and valid; otherwise, returns null.
 * - If physical aspectRatio is locked:
 *   - Portrait (width < height): returns 1 / physicalAspectRatio.
 *   - Landscape (width > height): returns physicalAspectRatio.
 *
 * @param {Object|string} presetInput - The preset object or preset ID string
 * @param {string} [orientationOverride] - Optional orientation override ('portrait' | 'landscape')
 * @param {number} [customWidth] - Optional actual image width (for Freeform dynamic ratios)
 * @param {number} [customHeight] - Optional actual image height (for Freeform dynamic ratios)
 * @returns {number|null} The computed aspect ratio (width / height) or null if Freeform.
 */
export function getAspectRatioForPreset(presetInput, orientationOverride, customWidth, customHeight) {
  let preset = typeof presetInput === 'string'
    ? getFormatPresetById(presetInput)
    : presetInput;

  if (!isValidFormatPreset(preset)) {
    preset = sanitizeFormatPreset(preset);
  }

  // Handle Freeform/unlocked ratio presets
  if (preset.aspectRatio === null) {
    if (typeof customWidth === 'number' && typeof customHeight === 'number' && customHeight > 0) {
      return customWidth / customHeight;
    }
    return null;
  }

  // Determine target orientation
  const targetOrientation = (orientationOverride === 'portrait' || orientationOverride === 'landscape')
    ? orientationOverride
    : preset.orientation;

  if (targetOrientation === 'landscape') {
    return preset.aspectRatio;
  }

  // Default is portrait (1 / physicalAspectRatio)
  return 1 / preset.aspectRatio;
}
