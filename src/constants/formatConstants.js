/**
 * QuickScan Centralized Format and Behavior Constants.
 * Centralizes all key string enums to prevent magic strings and guarantee type safety.
 */

export const EXPORT_TYPES = Object.freeze({
  PDF: 'pdf',
  JPG: 'jpg',
  PNG: 'png'
});

export const ENHANCEMENT_MODES = Object.freeze({
  ORIGINAL: 'original',
  GRAYSCALE: 'grayscale',
  DOCUMENT: 'document',
  RECEIPT: 'receipt'
});

export const CROP_BEHAVIORS = Object.freeze({
  LOCKED: 'locked',
  UNLOCKED: 'unlocked'
});

export const ORIENTATION_TYPES = Object.freeze({
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
  DYNAMIC: 'dynamic'
});

export const QUALITY_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
});

export const PREVIEW_BEHAVIORS = Object.freeze({
  CONTAIN: 'contain',
  COVER: 'cover',
  FILL: 'fill',
  ADAPTIVE: 'adaptive'
});

export const THUMBNAIL_BEHAVIORS = Object.freeze({
  STANDARD: 'standard',
  ADAPTIVE: 'adaptive',
  CROPPED: 'cropped'
});

export const DISPLAY_GROUPS = Object.freeze({
  DOCUMENT: 'Scanning',
  CARD: 'Cards',
  RECEIPT: 'Receipts',
  CUSTOM: 'Custom'
});
