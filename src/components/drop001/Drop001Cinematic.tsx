import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, Mesh, Program, Renderer, Texture, Transform } from "ogl";
import { drop001Closing, drop001Looks, type Drop001Language } from "../../data/drop001";
import { createCylinderGeometry, createImageAtlas, supportsWebGL } from "./cinematic-utils";
import { cinematicFragment, cinematicVertex } from "./shaders";
import Drop001Fallback from "./Drop001Fallback";
import "./drop001.css";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type AnimationState = {
  rotation: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  darkness: number;
  progress: number;
};

const cameraShots = [
  { x: 0, y: 0, z: 7.2, darkness: 0.1 },
  { x: 0.55, y: 0.35, z: 6.4, darkness: 0.04 },
  { x: -0.65, y: -0.2, z: 6.1, darkness: 0.12 },
  { x: 0.35, y: 0.15, z: 5.65, darkness: 0.02 },
  { x: 0, y: 0, z: 7.4, darkness: 0.2 },
];

export default function Drop001Cinematic({
  language,
  onExplore,
}: {
  language: Drop001Language;
  onExplore: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateFallback = () => setFallback(motionQuery.matches || !supportsWebGL());
    updateFallback();
    motionQuery.addEventListener("change", updateFallback);
    return () => motionQuery.removeEventListener("change", updateFallback);
  }, []);

  useEffect(() => {
    if (fallback || !sectionRef.current || !canvasRef.current) return;

    let disposed = false;
    let frameId = 0;
    let resizeTimer = 0;
    let isVisible = true;
    let texture: Texture | null = null;
    let mesh: Mesh | null = null;
    let timeline: gsap.core.Timeline | null = null;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const isMobile = window.innerWidth < 800;
    const animation: AnimationState = {
      rotation: 0,
      cameraX: cameraShots[0].x,
      cameraY: cameraShots[0].y,
      cameraZ: isMobile ? 8 : cameraShots[0].z,
      darkness: cameraShots[0].darkness,
      progress: 0,
    };

    const renderer = new Renderer({
      canvas,
      alpha: false,
      antialias: !isMobile,
      dpr: Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75),
    });
    const gl = renderer.gl;
    gl.clearColor(0.067, 0.067, 0.063, 1);
    gl.disable(gl.CULL_FACE);
    const camera = new Camera(gl, { fov: isMobile ? 48 : 42 });
    const scene = new Transform();
    const geometry = createCylinderGeometry(gl, {
      radius: isMobile ? 2.45 : 2.85,
      height: isMobile ? 5.8 : 6.4,
      radialSegments: isMobile ? 64 : 128,
    });

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height, fov: width < 800 ? 48 : 42 });
    };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        ScrollTrigger.refresh();
      }, 120);
    };
    resize();
    window.addEventListener("resize", onResize, { passive: true });

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { rootMargin: "100px" });
    observer.observe(section);

    const render = (time: number) => {
      frameId = window.requestAnimationFrame(render);
      if (!isVisible || document.hidden || !mesh) return;
      mesh.rotation.y = animation.rotation + Math.sin(time * 0.00035) * 0.012;
      mesh.position.y = Math.sin(time * 0.00022) * 0.035;
      camera.position.set(animation.cameraX, animation.cameraY, animation.cameraZ);
      camera.lookAt([0, 0, 0]);
      const uniforms = mesh.program.uniforms;
      uniforms.uDarkness.value = animation.darkness;
      uniforms.uProgress.value = animation.progress;
      renderer.render({ scene, camera });
    };

    const setup = async () => {
      try {
        const atlas = await createImageAtlas(drop001Looks.map((look) => look.image), isMobile);
        if (disposed) return;
        texture = new Texture(gl, {
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
          wrapS: gl.REPEAT,
          wrapT: gl.CLAMP_TO_EDGE,
          generateMipmaps: false,
        });
        texture.image = atlas;
        const program = new Program(gl, {
          vertex: cinematicVertex,
          fragment: cinematicFragment,
          uniforms: {
            tMap: { value: texture },
            uDarkness: { value: animation.darkness },
            uProgress: { value: 0 },
          },
          cullFace: null,
          transparent: true,
        });
        mesh = new Mesh(gl, { geometry, program });
        mesh.rotation.y = 0;
        mesh.setParent(scene);

        const chapters = chapterRefs.current.filter(Boolean) as HTMLDivElement[];
        const context = gsap.context(() => {
          gsap.set(chapters, { autoAlpha: 0, yPercent: 20 });
          gsap.set(chapters[0], { autoAlpha: 1, yPercent: 0 });
          timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: isMobile ? 0.45 : 0.8,
              invalidateOnRefresh: true,
              onUpdate: ({ progress }) => {
                animation.progress = progress;
                if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
              },
            },
          });

          cameraShots.slice(1).forEach((shot, index) => {
            const next = index + 1;
            timeline?.to(animation, {
              rotation: -next * Math.PI * 0.5,
              cameraX: shot.x,
              cameraY: shot.y,
              cameraZ: isMobile ? shot.z + 1.05 : shot.z,
              darkness: shot.darkness,
              duration: 1,
            }, index);
            timeline?.to(chapters[index], {
              autoAlpha: 0,
              yPercent: -18,
              duration: 0.2,
            }, index + 0.72);
            timeline?.fromTo(chapters[next], {
              autoAlpha: 0,
              yPercent: 22,
            }, {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.24,
            }, index + 0.82);
          });
        }, section);

        setIsReady(true);
        render(performance.now());
        ScrollTrigger.refresh();

        return () => context.revert();
      } catch (error) {
        console.error("No se pudo iniciar la experiencia DROP 001", error);
        setFallback(true);
      }
    };

    let cleanupGsap: (() => void) | undefined;
    void setup().then((cleanup) => {
      cleanupGsap = cleanup;
    });

    return () => {
      disposed = true;
      setIsReady(false);
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      cleanupGsap?.();
      timeline?.kill();
      geometry.remove();
      mesh?.program.remove();
      if (texture?.texture) gl.deleteTexture(texture.texture);
    };
  }, [fallback]);

  if (fallback) return <Drop001Fallback language={language} onExplore={onExplore} />;

  const chapters = [
    ...drop001Looks.map((look) => ({
      eyebrow: look.eyebrow[language],
      title: look.title[language],
      description: look.description[language],
    })),
    {
      eyebrow: drop001Closing.eyebrow[language],
      title: drop001Closing.title[language],
      description: drop001Closing.description[language],
    },
  ];

  return (
    <section className={`drop-cinematic ${isReady ? "is-ready" : ""}`} ref={sectionRef} aria-label="KAFUR DROP 001">
      <div className="drop-cinematic__stage">
        <canvas ref={canvasRef} className="drop-cinematic__canvas" aria-hidden="true" />
        <div className="drop-cinematic__grain" aria-hidden="true" />
        <div className="drop-cinematic__hud drop-cinematic__hud--top" aria-hidden="true">
          <span>KAFUR® / DROP 001</span><span>BUENOS AIRES — ARG</span>
        </div>
        <div className="drop-cinematic__chapters">
          {chapters.map((chapter, index) => (
            <div
              className={`drop-cinematic__chapter drop-cinematic__chapter--${index + 1}`}
              key={`${chapter.title}-${index}`}
              ref={(element) => { chapterRefs.current[index] = element; }}
            >
              <span>{chapter.eyebrow}</span>
              {index === 0 ? <h1>{chapter.title}</h1> : <h2>{chapter.title}</h2>}
              <p>{chapter.description}</p>
              {index === chapters.length - 1 && (
                <button
                  className="drop-cinematic__cta"
                  type="button"
                  onClick={onExplore}
                >
                  <span>{language === "es" ? "VER LAS REMERAS" : "VIEW THE T-SHIRTS"}</span><span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="drop-cinematic__progress" aria-hidden="true"><div ref={progressRef} /></div>
        <div className="drop-cinematic__scroll" aria-hidden="true"><span>SCROLL</span><i /></div>
      </div>
      <div className="drop-cinematic__accessible">
        {drop001Looks.map((look) => <img key={look.id} src={look.image} alt={look.alt[language]} />)}
      </div>
    </section>
  );
}
