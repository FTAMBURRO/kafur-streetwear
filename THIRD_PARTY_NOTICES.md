# Third-party notices

## Cinematic 3D Scroll Experiences with GSAP — Codrops Demo 1

The DROP 001 cinematic experience on the home page is a direct adaptation of:

- Project: `codrops-cinematic-scroll-animations`
- Demo: **Demo 1 — "CylinderCarousel"** (OGL + WebGL + GSAP ScrollTrigger)
- Author: Joseph Santamaria (JosephASG)
- Source: https://github.com/JosephASG/codrops-cinematic-scroll-animations
- Article: https://tympanus.net/codrops/?p=103299
- License: MIT, as declared by the upstream repository

The following upstream files are vendored under `src/components/drop001/lib/`
with minimal changes:

| Upstream file | Local file |
| --- | --- |
| `src/lib/variant-1/types.ts` | `src/components/drop001/lib/types.ts` |
| `src/lib/variant-1/shaders.ts` | `src/components/drop001/lib/shaders.ts` |
| `src/lib/variant-1/utils.ts` | `src/components/drop001/lib/utils.ts` |
| `src/lib/variant-1/data.ts` | `src/components/drop001/lib/data.ts` (content replaced with KAFUR data) |
| `src/components/pages/variant-1/cylinder-carousel.tsx` | `src/components/drop001/CylinderCarousel.tsx` |

Preserved from the original: renderer/camera/scene setup, cylinder geometry,
image-atlas texture, cylinder and particle shaders, particle streaks, camera
choreography, CustomEase definitions, GSAP ScrollTrigger timelines and the
responsive/mobile handling.

Deliberate adaptations:

- `ScrollSmoother` is not used, because it takes over the document scroll
  (it sets `body` height and fixes its wrapper), which would alter KAFUR's
  global scroll and affect navigation, cart and checkout. The cinematic easing
  is still driven by GSAP (`scrub`).
- Codrops frame, loader chrome and demo copy are replaced by KAFUR content,
  typography and layout.
- Text chapters are mapped to the same scroll range as the camera timeline, and
  the fixed layers are hidden once the section leaves the viewport, so the
  storefront below is never covered.
- Lifecycle handling (RAF cancellation, scoped `gsap.context` teardown, WebGL
  buffer/program/texture deletion) is added for React StrictMode and for
  navigation between pages.

All KAFUR imagery, texts and brand assets remain the property of their
respective owners.
