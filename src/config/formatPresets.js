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
 * QuickScan Centralized Format Presets Configuration.
 * These presets establish standard physical properties and layout rules.
 */
export const FORMAT_PRESETS = {
  a4: {
    id: 'a4',
    label: 'A4',
    aspectRatio: 1.4142, // Standard A4 (297mm / 210mm)
    orientation: ORIENTATION_TYPES.PORTRAIT,
    category: 'document',
    displayGroup: DISPLAY_GROUPS.DOCUMENT,
    cropBehavior: CROP_BEHAVIORS.LOCKED,
    exportBehavior: 'fixed',
    
    // Intelligent Behavior Metadata
    supportsRotation: true,
    supportsFreeCrop: false,
    recommendedEnhancement: ENHANCEMENT_MODES.DOCUMENT,
    defaultExportType: EXPORT_TYPES.PDF,
    outputQuality: QUALITY_LEVELS.HIGH,
    cropPadding: 8,
    previewScaleBehavior: PREVIEW_BEHAVIORS.CONTAIN,
    thumbnailBehavior: THUMBNAIL_BEHAVIORS.STANDARD
  },
  letter: {
    id: 'letter',
    label: 'Letter',
    aspectRatio: 1.2941, // Standard Letter (11in / 8.5in)
    orientation: ORIENTATION_TYPES.PORTRAIT,
    category: 'document',
    displayGroup: DISPLAY_GROUPS.DOCUMENT,
    cropBehavior: CROP_BEHAVIORS.LOCKED,
    exportBehavior: 'fixed',
    
    // Intelligent Behavior Metadata
    supportsRotation: true,
    supportsFreeCrop: false,
    recommendedEnhancement: ENHANCEMENT_MODES.DOCUMENT,
    defaultExportType: EXPORT_TYPES.PDF,
    outputQuality: QUALITY_LEVELS.HIGH,
    cropPadding: 8,
    previewScaleBehavior: PREVIEW_BEHAVIORS.CONTAIN,
    thumbnailBehavior: THUMBNAIL_BEHAVIORS.STANDARD
  },
  id_card: {
    id: 'id_card',
    label: 'ID Card',
    aspectRatio: 1.5857, // Standard CR80 Card (85.6mm / 53.98mm)
    orientation: ORIENTATION_TYPES.LANDSCAPE,
    category: 'card',
    displayGroup: DISPLAY_GROUPS.CARD,
    cropBehavior: CROP_BEHAVIORS.LOCKED,
    exportBehavior: 'fixed',
    
    // Intelligent Behavior Metadata
    supportsRotation: false,
    supportsFreeCrop: false,
    recommendedEnhancement: ENHANCEMENT_MODES.ORIGINAL,
    defaultExportType: EXPORT_TYPES.PNG,
    outputQuality: QUALITY_LEVELS.HIGH,
    cropPadding: 16,
    previewScaleBehavior: PREVIEW_BEHAVIORS.CONTAIN,
    thumbnailBehavior: THUMBNAIL_BEHAVIORS.ADAPTIVE
  },
  business_card: {
    id: 'business_card',
    label: 'Business Card',
    aspectRatio: 1.7500, // Standard US Business Card (3.5in / 2.0in)
    orientation: ORIENTATION_TYPES.LANDSCAPE,
    category: 'card',
    displayGroup: DISPLAY_GROUPS.CARD,
    cropBehavior: CROP_BEHAVIORS.LOCKED,
    exportBehavior: 'fixed',
    
    // Intelligent Behavior Metadata
    supportsRotation: false,
    supportsFreeCrop: false,
    recommendedEnhancement: ENHANCEMENT_MODES.ORIGINAL,
    defaultExportType: EXPORT_TYPES.PNG,
    outputQuality: QUALITY_LEVELS.HIGH,
    cropPadding: 16,
    previewScaleBehavior: PREVIEW_BEHAVIORS.CONTAIN,
    thumbnailBehavior: THUMBNAIL_BEHAVIORS.ADAPTIVE
  },
  receipt: {
    id: 'receipt',
    label: 'Receipt',
    aspectRatio: 2.5000,
    orientation: ORIENTATION_TYPES.PORTRAIT,
    category: 'receipt',
    displayGroup: DISPLAY_GROUPS.RECEIPT,
    cropBehavior: CROP_BEHAVIORS.UNLOCKED,
    exportBehavior: 'fit',
    
    // Intelligent Behavior Metadata
    supportsRotation: true,
    supportsFreeCrop: true,
    recommendedEnhancement: ENHANCEMENT_MODES.RECEIPT,
    defaultExportType: EXPORT_TYPES.PDF,
    outputQuality: QUALITY_LEVELS.MEDIUM,
    cropPadding: 12,
    previewScaleBehavior: PREVIEW_BEHAVIORS.CONTAIN,
    thumbnailBehavior: THUMBNAIL_BEHAVIORS.ADAPTIVE
  },
  freeform: {
    id: 'freeform',
    label: 'Freeform',
    aspectRatio: null,
    orientation: ORIENTATION_TYPES.DYNAMIC,
    category: 'freeform',
    displayGroup: DISPLAY_GROUPS.CUSTOM,
    cropBehavior: CROP_BEHAVIORS.UNLOCKED,
    exportBehavior: 'original',
    
    // Intelligent Behavior Metadata
    supportsRotation: true,
    supportsFreeCrop: true,
    recommendedEnhancement: ENHANCEMENT_MODES.ORIGINAL,
    defaultExportType: EXPORT_TYPES.PDF,
    outputQuality: QUALITY_LEVELS.HIGH,
    cropPadding: 0,
    previewScaleBehavior: PREVIEW_BEHAVIORS.ADAPTIVE,
    thumbnailBehavior: THUMBNAIL_BEHAVIORS.ADAPTIVE
  }
};

/**
 * Standard default fallback preset.
 */
export const DEFAULT_FORMAT_PRESET = FORMAT_PRESETS.freeform;
