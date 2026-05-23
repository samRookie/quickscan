==================================================
QUICKSCAN — PHASE 2 MASTER PLAN OF ACTION
(STRUCTURED EXECUTION ROADMAP)
==================================================

PHASE OBJECTIVE:
Transform QuickScan from a stable prototype into a polished,
fast, minimal, format-aware, production-grade scanning product.

CORE PRINCIPLES:
- Stability first
- Performance first
- Mobile-first
- Privacy-first
- Minimalistic UX
- No unnecessary feature bloat
- Commit after stable milestones only

EXECUTION FLOW:
Subphase
→ Main Step
→ Substeps
→ Validation
→ Commit
→ Proceed

==================================================
SUBPHASE 2.1 — FORMAT INTELLIGENCE FOUNDATION
==================================================

OBJECTIVE:
Teach QuickScan to understand document types and ratios.

--------------------------------------------------
MAIN STEP 1 — FORMAT PRESET FOUNDATION
--------------------------------------------------

SUBSTEP 1.1
- Create centralized FORMAT_PRESETS architecture
- Add helper utilities
- Add default fallback preset
- Prepare scalable structure

SUBSTEP 1.2
- Add format metadata system
- Define ratio behavior
- Define orientation behavior

SUBSTEP 1.3
- Add safe preset lookup utilities
- Add invalid-preset fallback handling

SUBSTEP 1.4
- Extend image/page object structure
- Add format persistence support

SUBSTEP 1.5
- Validate preset architecture stability

VALIDATION:
- No undefined states
- Ratios accurate
- Stable fallback handling

COMMIT:
feat: establish format preset foundation system

--------------------------------------------------
MAIN STEP 2 — CROPPER RATIO INTELLIGENCE
--------------------------------------------------

SUBSTEP 2.1
- Bind cropper aspect ratio dynamically

SUBSTEP 2.2
- Implement freeform crop behavior

SUBSTEP 2.3
- Preserve original image dimensions

SUBSTEP 2.4
- Stabilize cropper responsiveness

SUBSTEP 2.5
- Validate crop behavior across presets

VALIDATION:
- No crop distortion
- No image shrinking
- Mobile touch stable

COMMIT:
feat: integrate intelligent crop ratio handling

--------------------------------------------------
MAIN STEP 3 — FORMAT STATE PERSISTENCE
--------------------------------------------------

SUBSTEP 3.1
- Attach format metadata to scan objects

SUBSTEP 3.2
- Preserve independent format per page

SUBSTEP 3.3
- Prepare mixed-format document support

SUBSTEP 3.4
- Validate multi-page format isolation

VALIDATION:
- No cross-page overwrites
- Stable state architecture

COMMIT:
feat: add persistent document format state handling

==================================================
SUBPHASE 2.2 — OUTPUT ENGINE REFINEMENT
==================================================

OBJECTIVE:
Professionalize exported output quality and sizing.

--------------------------------------------------
MAIN STEP 4 — DYNAMIC PDF DIMENSION ENGINE
--------------------------------------------------

SUBSTEP 4.1
- Generate adaptive PDF dimensions

SUBSTEP 4.2
- Map formats to PDF behaviors

SUBSTEP 4.3
- Support mixed page dimensions

SUBSTEP 4.4
- Prevent scaling distortion

SUBSTEP 4.5
- Validate export accuracy

VALIDATION:
- No clipping
- No blur
- No stretching

COMMIT:
feat: implement dynamic pdf dimension engine

--------------------------------------------------
MAIN STEP 5 — EXPORT FORMAT EXPANSION
--------------------------------------------------

SUBSTEP 5.1
- Add JPG export pipeline

SUBSTEP 5.2
- Add PNG export pipeline

SUBSTEP 5.3
- Add batch export handling

SUBSTEP 5.4
- Add smart file naming

SUBSTEP 5.5
- Validate export consistency

VALIDATION:
- Stable exports
- Correct dimensions
- Quality preserved

COMMIT:
feat: add multi-format export support

--------------------------------------------------
MAIN STEP 6 — OUTPUT QUALITY STABILIZATION
--------------------------------------------------

SUBSTEP 6.1
- Improve DPI consistency

SUBSTEP 6.2
- Improve image scaling logic

SUBSTEP 6.3
- Add adaptive compression handling

SUBSTEP 6.4
- Prevent export artifacts

VALIDATION:
- Professional export quality
- Stable repeated exports

COMMIT:
perf: optimize export quality and output stability

==================================================
SUBPHASE 2.3 — MULTI-PAGE EXPERIENCE SYSTEM
==================================================

OBJECTIVE:
Improve usability and document management flow.

--------------------------------------------------
MAIN STEP 7 — THUMBNAIL NAVIGATION SYSTEM
--------------------------------------------------

SUBSTEP 7.1
- Improve thumbnail rendering

SUBSTEP 7.2
- Add active-page highlighting

SUBSTEP 7.3
- Improve touch scrolling behavior

SUBSTEP 7.4
- Validate mobile responsiveness

VALIDATION:
- Smooth navigation
- Stable rendering

COMMIT:
feat: improve multi-page thumbnail navigation

--------------------------------------------------
MAIN STEP 8 — PAGE REORDERING SYSTEM
--------------------------------------------------

SUBSTEP 8.1
- Add lightweight drag sorting

SUBSTEP 8.2
- Stabilize reorder state updates

SUBSTEP 8.3
- Preserve page integrity after reorder

VALIDATION:
- No index corruption
- Stable drag behavior

COMMIT:
feat: add multi-page reorder functionality

--------------------------------------------------
MAIN STEP 9 — PAGE REMOVAL & RECOVERY
--------------------------------------------------

SUBSTEP 9.1
- Add safe delete handling

SUBSTEP 9.2
- Add undo-safe architecture

SUBSTEP 9.3
- Cleanup removed page resources

VALIDATION:
- No orphaned state
- No memory leaks

COMMIT:
feat: improve page removal and recovery flow

==================================================
SUBPHASE 2.4 — PERFORMANCE & MEMORY OPTIMIZATION
==================================================

OBJECTIVE:
Make QuickScan lightweight and fast.

--------------------------------------------------
MAIN STEP 10 — PREVIEW COMPRESSION SYSTEM
--------------------------------------------------

SUBSTEP 10.1
- Add lightweight preview generation

SUBSTEP 10.2
- Reduce runtime image memory

SUBSTEP 10.3
- Preserve final export quality

VALIDATION:
- Faster rendering
- Reduced memory usage

COMMIT:
perf: optimize preview memory pipeline

--------------------------------------------------
MAIN STEP 11 — REACT RENDER OPTIMIZATION
--------------------------------------------------

SUBSTEP 11.1
- Reduce unnecessary rerenders

SUBSTEP 11.2
- Add memoization where appropriate

SUBSTEP 11.3
- Isolate heavy state updates

VALIDATION:
- Smoother interactions
- Stable rendering

COMMIT:
perf: optimize react rendering behavior

--------------------------------------------------
MAIN STEP 12 — RESOURCE LIFECYCLE CLEANUP
--------------------------------------------------

SUBSTEP 12.1
- Audit revokeObjectURL usage

SUBSTEP 12.2
- Audit canvas destruction

SUBSTEP 12.3
- Audit stream cleanup

SUBSTEP 12.4
- Stress test repeated sessions

VALIDATION:
- No memory ballooning
- Stable long sessions

COMMIT:
fix: strengthen runtime resource cleanup lifecycle

--------------------------------------------------
MAIN STEP 13 — LAZY LOADING & CHUNK OPTIMIZATION
--------------------------------------------------

SUBSTEP 13.1
- Lazy load heavy screens

SUBSTEP 13.2
- Optimize chunk splitting

SUBSTEP 13.3
- Reduce initial bundle weight

VALIDATION:
- Faster startup
- Reduced load time

COMMIT:
perf: optimize app loading and chunk behavior

==================================================
SUBPHASE 2.5 — CAMERA EXPERIENCE POLISH
==================================================

OBJECTIVE:
Make camera feel premium and stable.

--------------------------------------------------
MAIN STEP 14 — CAMERA LAYOUT STABILIZATION
--------------------------------------------------

SUBSTEP 14.1
- Lock viewport behavior

SUBSTEP 14.2
- Remove overflow scrolling

SUBSTEP 14.3
- Improve fullscreen fit

VALIDATION:
- Stable mobile layout
- No scroll bugs

COMMIT:
fix: stabilize fullscreen camera layout behavior

--------------------------------------------------
MAIN STEP 15 — ALIGNMENT ASSISTANCE SYSTEM
--------------------------------------------------

SUBSTEP 15.1
- Add subtle alignment grid

SUBSTEP 15.2
- Improve framing assistance

SUBSTEP 15.3
- Refine visual balance

VALIDATION:
- Better scan positioning
- Cleaner framing

COMMIT:
feat: add document alignment assistance system

--------------------------------------------------
MAIN STEP 16 — CAPTURE FEEDBACK SYSTEM
--------------------------------------------------

SUBSTEP 16.1
- Add visual capture flash

SUBSTEP 16.2
- Improve transition feedback

SUBSTEP 16.3
- Improve responsiveness feel

VALIDATION:
- More natural capture flow

COMMIT:
feat: improve camera capture feedback experience

--------------------------------------------------
MAIN STEP 17 — LIGHTING ASSISTANCE SYSTEM
--------------------------------------------------

SUBSTEP 17.1
- Detect low-light conditions

SUBSTEP 17.2
- Add auto flashlight assistance

SUBSTEP 17.3
- Improve front-camera visibility

VALIDATION:
- Better low-light usability

COMMIT:
feat: implement adaptive lighting assistance system

==================================================
SUBPHASE 2.6 — ENHANCEMENT ENGINE REFINEMENT
==================================================

OBJECTIVE:
Improve readability and enhancement quality.

--------------------------------------------------
MAIN STEP 18 — ENHANCEMENT PRESET REDESIGN
--------------------------------------------------

SUBSTEP 18.1
- Replace generic filter naming

SUBSTEP 18.2
- Introduce document-oriented presets

VALIDATION:
- Better UX clarity

COMMIT:
feat: redesign enhancement preset system

--------------------------------------------------
MAIN STEP 19 — PRESET TUNING ENGINE
--------------------------------------------------

SUBSTEP 19.1
- Tune contrast handling

SUBSTEP 19.2
- Improve shadow cleanup

SUBSTEP 19.3
- Improve text sharpening

VALIDATION:
- Cleaner readability
- Better low-light output

COMMIT:
feat: refine enhancement tuning engine

--------------------------------------------------
MAIN STEP 20 — PREVIEW PERFORMANCE OPTIMIZATION
--------------------------------------------------

SUBSTEP 20.1
- Optimize preview switching

SUBSTEP 20.2
- Add preview caching

SUBSTEP 20.3
- Reduce render lag

VALIDATION:
- Instant preset switching

COMMIT:
perf: optimize enhancement preview rendering

==================================================
SUBPHASE 2.7 — UI MINIMALIZATION & UX POLISH
==================================================

OBJECTIVE:
Make QuickScan visually cleaner and more native-like.

--------------------------------------------------
MAIN STEP 21 — VISUAL CLUTTER REDUCTION
--------------------------------------------------

SUBSTEP 21.1
- Remove excessive borders

SUBSTEP 21.2
- Reduce unnecessary shadows

SUBSTEP 21.3
- Remove redundant labels

VALIDATION:
- Cleaner interface hierarchy

COMMIT:
style: simplify and declutter interface visuals

--------------------------------------------------
MAIN STEP 22 — TOUCH UX OPTIMIZATION
--------------------------------------------------

SUBSTEP 22.1
- Increase touch targets

SUBSTEP 22.2
- Improve thumb accessibility

SUBSTEP 22.3
- Refine spacing consistency

VALIDATION:
- Better mobile ergonomics

COMMIT:
style: improve mobile touch interaction ergonomics

--------------------------------------------------
MAIN STEP 23 — MOTION & TRANSITION POLISH
--------------------------------------------------

SUBSTEP 23.1
- Add subtle transitions

SUBSTEP 23.2
- Improve navigation smoothness

SUBSTEP 23.3
- Refine loading states

VALIDATION:
- Native-like interaction feel

COMMIT:
style: refine motion and transition experience

==================================================
SUBPHASE 2.8 — FINAL HARDENING & PRODUCTION VALIDATION
==================================================

OBJECTIVE:
Prepare QuickScan for real-world usage and soft launch.

--------------------------------------------------
MAIN STEP 24 — SECURITY HARDENING PASS
--------------------------------------------------

SUBSTEP 24.1
- Tighten CSP rules

SUBSTEP 24.2
- Validate permission policies

SUBSTEP 24.3
- Audit sensitive runtime behavior

VALIDATION:
- Stronger browser security posture

COMMIT:
chore: harden runtime security configuration

--------------------------------------------------
MAIN STEP 25 — PWA RELIABILITY VALIDATION
--------------------------------------------------

SUBSTEP 25.1
- Validate offline behavior

SUBSTEP 25.2
- Validate cache strategy

SUBSTEP 25.3
- Validate install flow

VALIDATION:
- Stable PWA experience

COMMIT:
fix: stabilize pwa offline and install behavior

--------------------------------------------------
MAIN STEP 26 — FINAL REGRESSION AUDIT
--------------------------------------------------

SUBSTEP 26.1
- Validate complete scan pipeline

SUBSTEP 26.2
- Validate export flow

SUBSTEP 26.3
- Validate repeated session stability

VALIDATION:
- No regressions
- No memory instability

COMMIT:
test: complete final regression validation pass

--------------------------------------------------
MAIN STEP 27 — REAL DEVICE STRESS TESTING
--------------------------------------------------

SUBSTEP 27.1
- Test low-end Android devices

SUBSTEP 27.2
- Test long scan sessions

SUBSTEP 27.3
- Test repeated exports

SUBSTEP 27.4
- Test orientation changes

VALIDATION:
- Soft-launch readiness confirmed

COMMIT:
test: complete real-device production stress validation

==================================================
FINAL PHASE 2 RESULT
==================================================

QuickScan becomes:

- Fast
- Lightweight
- Format-aware
- Minimalistic
- Privacy-first
- Stable
- Production-grade
- Soft-launch ready

==================================================
IMPORTANT EXECUTION RULES
==================================================

1. Never skip validation.
2. Never rush commits.
3. Never implement multiple main steps together.
4. Stability > Features.
5. Performance > Visual complexity.
6. Mobile-first always.
7. No unnecessary AI/cloud/OCR expansion during Phase 2.

==================================================
PHASE 2 EXECUTION STATUS
==================================================

CURRENT TARGET:
SUBPHASE 2.1
→ MAIN STEP 1
→ SUBSTEP 1.1
FORMAT PRESET FOUNDATION SYSTEM
==================================================