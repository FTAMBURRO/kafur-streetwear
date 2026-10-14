import { useEffect, useRef } from "react";

/**
 * Interludio negro entre el hero y el carrusel: bloque propio con el logo
 * CLAVADO (sticky) mientras se lo atraviesa, y se disuelve antes de que
 * llegue el cinematic para no superponerse nunca con ninguno de los dos.
 */
export default function LogoInterlude() {
  const sectionRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const consumed = window.innerHeight - rect.top;
      const total = rect.height + window.innerHeight;
      // Visible al entrar al bloque, disuelto ANTES de que asome el
      // cinematic (el spacer entra ~a mitad del recorrido total).
      const progress = Math.min(Math.max(consumed / Math.max(total, 1), 0), 1);
      const fade = Math.min(Math.max((progress - 0.22) / 0.24, 0), 1);
      if (logoRef.current) logoRef.current.style.opacity = String(1 - fade);
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
      if (logoRef.current) logoRef.current.style.opacity = "";
    };
  }, []);

  return (
    <section className="logo-interlude" ref={sectionRef} aria-label="KAFUR">
      <div className="logo-interlude__stage">
        <img ref={logoRef} src="/assets/kafur-emblema-cromo.png" alt="KAFUR" loading="eager" />
      </div>
    </section>
  );
}
