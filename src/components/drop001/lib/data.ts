import type { Perspective } from "./types";
import { drop001Looks, drop001Closing, type Drop001Language } from "../../../data/drop001";

/**
 * KAFUR DROP 001 — data for the Codrops "Demo 1" cylinder carousel.
 *
 * The original demo uses 12 remote 1024×1024 images. KAFUR ships 12 atlas
 * tiles built from the four provisional DROP 001 photographs, each one cropped
 * at a different height (`focusY`) so every tile of the cylinder is distinct
 * while the original atlas geometry (12 slices → correct texture aspect on the
 * cylinder) is preserved. These files will be swapped for the final photos.
 */
export type AtlasTile = { src: string; focusY: number };

export const images: AtlasTile[] = [
  { src: drop001Looks[0].image, focusY: 0.5 }, // look-black · centro
  { src: drop001Looks[1].image, focusY: 0.25 }, // look-white · superior
  { src: drop001Looks[2].image, focusY: 0.5 }, // look-charcoal · centro
  { src: drop001Looks[3].image, focusY: 0.5 }, // look-detail · centro
  { src: drop001Looks[0].image, focusY: 0.2 }, // look-black · superior
  { src: drop001Looks[1].image, focusY: 0.75 }, // look-white · inferior
  { src: drop001Looks[2].image, focusY: 0.22 }, // look-charcoal · superior
  { src: drop001Looks[3].image, focusY: 0.2 }, // look-detail · superior
  { src: drop001Looks[0].image, focusY: 0.8 }, // look-black · inferior
  { src: drop001Looks[1].image, focusY: 0.5 }, // look-white · centro
  { src: drop001Looks[2].image, focusY: 0.78 }, // look-charcoal · inferior
  { src: drop001Looks[3].image, focusY: 0.8 }, // look-detail · inferior
];

/** The four scroll chapters of the experience (Codrops "perspectives"). */
export const perspectives = (language: Drop001Language): Perspective[] => [
  {
    title: drop001Looks[0].title[language],
    description: drop001Looks[0].description[language],
    position: "top",
  },
  {
    title: drop001Looks[1].title[language],
    description: drop001Looks[1].description[language],
    position: "center",
  },
  {
    title: drop001Looks[2].title[language],
    description: drop001Looks[2].description[language],
    position: "center",
  },
  {
    title: drop001Looks[3].title[language],
    description: drop001Looks[3].description[language],
    position: "bottom",
  },
];

export const closing = (language: Drop001Language) => ({
  eyebrow: drop001Closing.eyebrow[language],
  cta: language === "es" ? "VER LAS REMERAS" : "VIEW THE T-SHIRTS",
});

export const cylinderConfig = {
  radius: window.innerWidth > 768 ? 2.5 : 2.2,
  height: window.innerWidth > 768 ? 2 : 1.2,
  radialSegments: 64,
  heightSegments: 1,
};

export const particleConfig = {
  numParticles: 12,
  particleRadius: 3.3, // cylinderRadius + 0.8
  segments: 20,
  angleSpan: 0.3,
};

export const imageConfig = {
  width: 1024,
  height: 1024,
};
