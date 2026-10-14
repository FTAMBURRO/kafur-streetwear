import { useEffect, useRef } from "react";
import type { Drop001Language } from "../../data/drop001";
import "./kafur-depth-hero.css";

/**
 * KAFUR — hero principal: la imagen definitiva tal cual, sin tocar nada.
 * Sin capas, sin warp, sin movimiento. Solo foto + fundido inferior para
 * que la transición al siguiente bloque (cinematic DROP 001, negro) fluya.
 */
const IMG_SRC = "/assets/hero-kafur.jpg";

export default function KafurDepthHero({
  language,
  onExplore,
}: {
  language: Drop001Language;
  onExplore?: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Puente negro: la foto (y el HUD) se disuelven a negro mientras sale;
  // el logo queda fijo sobre el negro y el cinematic aparece sobre negro.
  // Listener directo (sin GSAP/ticker): escribe opacidad en el momento.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const range = window.innerHeight * 0.55;
      const progress = Math.min(Math.max(-rect.top / Math.max(range, 1), 0), 1);
      if (photoRef.current) photoRef.current.style.opacity = String(1 - progress);
      if (hudRef.current) hudRef.current.style.opacity = String(1 - Math.min(progress * 1.6, 1));
      if (ctaRef.current) ctaRef.current.style.opacity = String(1 - progress);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        update();
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (photoRef.current) photoRef.current.style.opacity = "";
      if (hudRef.current) hudRef.current.style.opacity = "";
      if (ctaRef.current) ctaRef.current.style.opacity = "";
    };
  }, []);

  return (
    <section
      className="kaf-depth"
      id="hero-kaf-dinamico"
      ref={sectionRef}
      aria-label={language === "es" ? "KAFUR — hero principal" : "KAFUR — main hero"}
    >
      <h1 className="kaf-depth__sr">
        {language === "es" ? "KAFUR® — Diseño independiente de indumentaria. Buenos Aires" : "KAFUR® — Independent clothing design. Buenos Aires"}
      </h1>
      <img
        ref={photoRef}
        src={IMG_SRC}
        alt={language === "es" ? "Persona de espaldas entre muros de hormigón con el texto KAFUR" : "Person seen from behind between concrete walls with KAFUR text"}
        className="kaf-depth__static"
        loading="eager"
      />
      <div className="kaf-depth__hud" ref={hudRef} aria-hidden="true">
        <span>{language === "es" ? "DESLIZÁ ↓" : "SCROLL ↓"}</span>
      </div>
      <div className="kaf-depth__cta" ref={ctaRef}>
        <button className="kaf-cta" type="button" onClick={onExplore}>
          <span>{language === "es" ? "VER CATÁLOGO" : "VIEW CATALOG"}</span>
        </button>
      </div>
    </section>
  );
}
