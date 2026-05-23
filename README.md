# QuickScan 📄✨

<div align="center">

[![React](https://img.shields.io/badge/React-19.2.6-%2320232a?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0.12-%2320232a?style=flat&logo=vite&logoColor=%23646CFF)](https://vite.dev)
[![PWA](https://img.shields.io/badge/PWA-Active-%2320232a?style=flat&logo=progressive-web-apps&logoColor=%2300FFAB)](https://vite-pwa-org.netlify.app/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-%2300FFAB?style=flat&logo=security&logoColor=%230c1510)](#-privacy--security)

</div>

**QuickScan** is a high-performance, privacy-first, and local-only web-based document scanner. Designed as a progressive mobile-first application, it transforms raw camera captures into aligned, enhanced, and professionally formatted PDF documents entirely within the client browser.

---

## 🚀 Key Features

### 1. Immersive Guided Camera Screen
* **Fullscreen Mobile Immersion**: Viewport-locked interface that prevents browser URL-bar shifts, page bouncing, or accidental drag pull-downs.
* **Format-Aware Alignment Guides**: Semi-transparent overlays with dynamic aspect ratios that adjust smoothly for **A4**, **Letter**, **ID Card**, **Business Card**, and **Receipt** shapes.
* **Shutter-Flash Feedback**: Generates a fullscreen white shutter flash upon capture for a natural tactile camera feel.
* **Twilight Detector**: Real-time ambient light monitoring that triggers warm-amber guidelines and ambient suggestions under dark scanning conditions.
* **Front-Camera Flash Assist**: Utilizes screen light flash overlays to support high-contrast captures on front-facing lenses.

### 2. Intelligent Cropping & Aspect Lock (CropperJS)
* **Single Source of Truth**: Sourced directly from normalized page presets.
* **Dynamic Preset Locks**: Aspect locks for standard formats alongside an unrestricted **Freeform** mode allowing custom bounds.
* **Tactile 44x44px Touch Targets**: Enlarged corner handle hitboxes using invisible pseudo-elements for seamless one-handed adjustments on high-DPI touchscreens.
* **Viewport Scroll Lock**: Suppresses page body scroll leaks or layout shifts during crop manipulation.

### 3. Tactile Multi-Page Session Navigation & Editing
* **Tactile Highlight Strip**: High-contrast scrolling thumbnail reel with scale animations (`scale(1.06)`) and compress feedback bounces (`scale(0.94)`) on click.
* **Touch-Safe Page Actions Row**: Dedicated capsule toolbar allowing:
  * **Chevrons reordering**: Safely swap page sequences.
  * **Page Deletions**: Prompts double-check confirmation dialogs to prevent accidental loss.
  * **Page Replacements**: Triggers the live camera to rescan and replace a specific slot in-place.
* **Progress Indicators**: Displays real-time progress badges ("Cropped", "Enhanced") above the selected index.

### 4. Format-Aware PDF Sizing & Intelligent Scaling Engine
* **Mixed-Format Page Layouts**: Loop-driven page addition generating custom isolated boundaries (e.g. Page 1 A4, Page 2 Receipt) in a single output PDF document.
* **Proportional Scaling Fit Modes**:
  * `contain`: Center-fits documents safely inside safe print-margins.
  * `fit-width`: Prioritizes vertical receipt widths, scaling height proportionally for maximum vertical text readability.
* **Alignment & Margin Stabilization**: Pre-configured safe borders (10mm for A4, 4mm for Cards, 5mm for Receipts, 0mm for borderless Freeform) and automatic horizontal/vertical mathematical centering.

---

## 🔒 Security & Performance
* **100% Client-Side**: No cloud servers, no OCR trackers, and no external storage leaks. Processing runs locally via lightweight synchronous headers.
* **Zero Hot-Device GPU Leaks**: Canvas objects are zeroed out (`canvas.width = 0`, `height = 0`) immediately post-conversion, releasing graphics buffers cleanly.
* **Inactivity Auto-Clear**: Automatically wipes all scanned base64 data after 15 minutes of inactivity to protect sensitive documents.

---

## 🛠️ Technology Stack
* **Core**: React 19, JavaScript (ESM)
* **Styling**: Vanilla CSS3
* **Libraries**: [CropperJS](https://github.com/fengyuanchen/cropperjs), [jsPDF](https://github.com/parallax/jsPDF)
* **Build Engine**: Vite + PWA Service Workers
