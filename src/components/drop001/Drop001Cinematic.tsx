import { useEffect, useState } from "react";
import CylinderCarousel from "./CylinderCarousel";
import Drop001Fallback from "./Drop001Fallback";
import type { Drop001Language } from "../../data/drop001";
import "./drop001.css";

/**
 * Entry point of the DROP 001 experience used by the KAFUR home page.
 *
 * Renders the Codrops Demo 1 implementation (OGL/WebGL + GSAP) and falls back
 * to a static, scrollable version only when the device cannot run it
 * (no WebGL context or "prefers-reduced-motion" enabled). The fallback never
 * replaces the cinematic experience on capable devices.
 */
const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(context);
  } catch {
    return false;
  }
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Drop001Cinematic({
  language,
  onExplore,
}: {
  language: Drop001Language;
  onExplore: () => void;
}) {
  const [unsupported, setUnsupported] = useState(() => prefersReducedMotion() || !supportsWebGL());

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setUnsupported(motionQuery.matches || !supportsWebGL());
    motionQuery.addEventListener("change", update);
    return () => motionQuery.removeEventListener("change", update);
  }, []);

  if (unsupported) return <Drop001Fallback language={language} onExplore={onExplore} />;
  return (
    <CylinderCarousel
      language={language}
      onExplore={onExplore}
      onFallback={() => setUnsupported(true)}
    />
  );
}
