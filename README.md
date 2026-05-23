# QuickScan 📄✨

<div align="center">

[![React](https://img.shields.io/badge/React-19.2.6-%2320232a?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0.12-%2320232a?style=flat&logo=vite&logoColor=%23646CFF)](https://vite.dev)
[![PWA](https://img.shields.io/badge/PWA-Hardened-%2320232a?style=flat&logo=progressive-web-apps&logoColor=%2300FFAB)](https://vite-pwa-org.netlify.app/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-%2300FFAB?style=flat&logo=security&logoColor=%230c1510)](#-absolute-privacy--security)

</div>

**QuickScan** is a high-performance, privacy-first, and local-only mobile document scanner. Engineered entirely as a Progressive Web Application (PWA), it transforms raw camera captures into aligned, enhanced, and professionally formatted PDF documents 100% in-browser on the client side.

---

## 🚀 Key Features

### 1. Immersive Guided Camera Screen
* **Fullscreen Mobile Viewport Lock**: Prevents browser navigation, URL bar resizing jumps, pull-to-refresh pull-downs, or vertical page bouncing.
* **Format-Aware Alignment Guides**: Transparent overlays that dynamically animate their aspect ratio for **A4**, **Letter**, **ID Card**, **Business Card**, and **Receipt** dimensions.
* **Shutter-Flash Feedback**: Full-screen white screen capture flashes for natural shutter feedback.
* **Twilight Detection**: Real-time ambient light monitoring that glows guides warm amber and suggests ambient assistance under dark scanning conditions.
* **Front-Camera Flash Assist**: Utilizes screen-light overlay flashes to support high-contrast captures on front-facing lenses.

### 2. Intelligent Cropping & Aspect Lock (CropperJS)
* **Dynamic Preset Locks**: Sourced directly from normalized page presets with a dynamic locking toggle and an unrestricted **Freeform** crop mode.
* **Tactile 44x44px Touch Targets**: Enlarged corner handle hitboxes using invisible pseudo-elements for seamless touch adjustments on high-DPI viewports.
* **Viewport scroll Lock**: Suppresses page body scroll leaks or touch gesture conflicts during crop adjustments.

### 3. Tactile Multi-Page Session Navigation & Drag Sorting
* **Lightweight HTML5 Drag Sorting**: Native zero-dependency drag-and-drop handles directly on thumbnails. Rearranging index hierarchies moves cards atomically with glowing drag borders and scales.
* **Automatic Scroll-Into-View Centering**: Tapping index chevrons, thumbnails, or drag-sorting automatically pans and scrolls the active card to the absolute visual center of the horizontal reel.
* **Tactile Highlight Strip**: High-contrast scrolling thumbnail strip wrapped inside `React.memo` to eliminate parent-propagated rerenders, featuring responsive badges.

### 4. Safe Deletion & Deletion Recovery Undo buffers
* **Logical Page Focus Recalculation**: Removing pages shifts active indexes seamlessly to adjacent cards, navigating back to the camera stream cleanly if the list is zeroed.
* **Temporary 6-Second Recovery Buffer**: Deleting a page stores it in a scoped local memory state and slides up a floating glassmorphic **"Undo Banner"**.
* **Auto-Expiration Garbage Collection**: After 6 seconds, the buffer is cleared and raw base64 resources are instantly dereferenced for immediate garbage collection, preventing RAM memory bloat.

### 5. Format-Aware PDF Sizing & Dynamic Scaling Engine
* **Mixed-Format Page Layouts**: Dynamic page addition inside `generatePDF.js` that generates custom isolated dimensions (e.g. Page 1 A4, Page 2 Receipt, Page 3 ID Card) in a single exported PDF document.
* **Proportional Scaling Fit Modes**:
  * `contain`: Center-fits documents safely inside print-margins.
  * `fit-width`: Prioritizes vertical receipt widths, scaling height proportionally for maximum vertical text readability.
  * `adaptive`: Automatically upgrades long vertical captures to width-fit.
* **Alignment & Margin Stabilization**: Decoupled margins (10mm for A4/Letter, 4mm for Cards, 5mm for Receipts, 0mm for borderless Freeform) and automatic horizontal/vertical centering.

---

## 🔒 Absolute Privacy & Security

* **100% Client-Side Processing**: No cloud uploads, no server analytics, and no OCR tracking logs. All captures, crops, filters, and PDF generation compile locally within the browser context.
* **Dual-Fidelity Image Pipeline**: Decouples lightweight previews (~50KB) and thumbnails (~5KB) from original export-quality scans. Heavy original base64 strings are **never** rendered in the DOM, preventing browser texture memory from ballooning.
* **On-Demand High-Resolution Enhancements**: Grayscale and Document filter algorithms are applied to the raw high-resolution image **on-the-fly** *only* during the PDF compilation phase, saving up to **95% of in-session active memory (RAM)**.
* **Zero Hot-Device GPU Leaks**: Canvas dimensions in the offscreen preview compressor and filter processor are zeroed out (`width = 0; height = 0;`) immediately after conversions, freeing GPU backing buffers.
* **Inactivity Auto-Clear**: Automatically wipes all scanned base64 data and temporary deletion buffers after 15 minutes of inactivity to protect sensitive documents.
* **Exclusionary Offline Cache**: Workbox service workers cache **only** static web application shell assets (`.js`, `.css`, `.html`, `.svg`). Dynamically scanned documents or dynamic canvas blobs are strictly bypassed, leaving 0 persistent offline footprints.

---

## 🛠️ Technology Stack

* **Core**: React 19 (Hooks, Suspense, Dynamic Lazy Loading)
* **Styling**: Modern CSS3 (Vanilla custom variables, glassmorphism, responsive safe-area bottom bounds)
* **Libraries**: [CropperJS](https://github.com/fengyuanchen/cropperjs) (Touch Crop Alignments), [jsPDF](https://github.com/parallax/jsPDF) (Export PDF Generation)
* **Build Engine**: Vite + Progressive Web App Workbox Service Workers (With non-disruptive floating glassmorphic Controlled Update Toast alerts)

---

## ⚙️ Installation & Running Locally

### Prerequisites
Make sure you have Node.js installed on your machine.

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/samRookie/quickscan.git
   cd quickscan
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs Vite with SSL support to allow local camera access):
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Preview production build locally:
   ```bash
   npm run preview
   ```
