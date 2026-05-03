# Design System: Rapid Document Scanner
**Project ID:** 1448151403050286344

## 1. Visual Theme & Atmosphere
The design system is built on the philosophy of **"Invisible Utility."** It prioritizes speed, accuracy, and physical ergonomics over decorative elements. The brand personality is clinical and efficient, aimed at professional users who require immediate results without cognitive load.

The style is a fusion of **Minimalism** and **High-Contrast Functionalism**. By stripping away labels and relying on clear iconography and spatial hierarchy, the interface recedes into the background, allowing the document being scanned to remain the focal point.

## 2. Color Palette & Roles
This design system utilizes a binary color logic to define the user's current context:

*   **Primary Surface (#121317):** A deep charcoal black used for the background in Capture Mode to eliminate distractions and make document edges pop.
*   **Pure White (#FFFFFF):** Used for the background in Review Mode to mimic physical paper, providing maximum legibility for text recognition and editing.
*   **Accent Blue (#007AFF):** A systematic blue used sparingly for primary actions and active states.
*   **Secondary Text (#C4C7C8):** Muted gray for non-essential labels and metadata.
*   **Outline/Separator (#8E9192):** Subtle borders used only when necessary to define boundaries without adding visual weight.

## 3. Typography Rules
The system employs **Inter** for its neutral, systematic character and exceptional legibility at small sizes.

*   **Headers:** `display-xl` (32px, Bold) with tight tracking (-0.02em) for authority.
*   **Body:** `body-lg` (17px, Regular) for comfortable reading and document processing.
*   **Labels:** `label-caps` (12px, Semi-Bold) set in uppercase with slight letter spacing (0.05em) to distinguish metadata from content.
*   **Interactive:** `button-text` (16px, Semi-Bold) for immediate recognition during one-handed operation.

## 4. Component Stylings
*   **Primary Buttons:** Large, pill-shaped (rounded-full) or circular, centered at the bottom. Uses a high-contrast fill (White in Dark mode, Blue in Light mode).
*   **Secondary Buttons:** Pill-shaped with a "ghost" style (outline only or subtle tonal fill). Always placed within reach of the primary action.
*   **Cards/Containers:** Uses large-radius corners (2rem to 3rem) for a soft, approachable feel. Often appears as slide-ups from the bottom to keep the user's hand in the same position.
*   **Viewfinder:** A thin, high-visibility blue stroke that "hugs" detected documents. Unlike other components, this is rectangular to match document geometry.

## 5. Layout Principles
The layout is optimized for **one-handed usage**, following a "bottom-heavy" philosophy.

*   **Thumb Zone:** Interactive elements are clustered in the lower 40% of the screen.
*   **Spacing Unit:** 4px base unit ensures consistent vertical rhythm.
*   **Margins:** Wide 24px edge margins for document management screens to provide "breathing room."
*   **Tonal Layering:** Uses different levels of gray (e.g., `#F2F2F7` in light mode) to define surface tiers instead of drop shadows.
*   **Backdrop Blurs:** Uses heavy dark material blurs for control panels in the camera view to create depth without hard lines.
