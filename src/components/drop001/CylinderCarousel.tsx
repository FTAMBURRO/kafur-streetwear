import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Texture, Program, Mesh } from "ogl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

import type { CameraAnimation, ParticleMesh } from "./lib/types";
import { images, perspectives, closing, cylinderConfig, particleConfig, imageConfig } from "./lib/data";
import { drawImageCover, createCylinderGeometry, createParticleGeometry } from "./lib/utils";
import { cylinderVertex, cylinderFragment, particleVertex, particleFragment } from "./lib/shaders";
import type { Drop001Language } from "../../data/drop001";

/**
 * KAFUR DROP 001 — cinematic scroll experience.
 *
 * Based on the real "Demo 1" (CylinderCarousel) of
 * https://github.com/JosephASG/codrops-cinematic-scroll-animations (MIT),
 * which uses OGL + WebGL + GSAP ScrollTrigger. The WebGL scene (cylinder,
 * atlas texture, shaders, particles, camera choreography and text timelines)
 * is reproduced from that source; only content, layout and lifecycle handling
 * are adapted to KAFUR.
 *
 * Deliberate deviations from the original demo:
 *  - `ScrollSmoother` is not used: it takes over the document scroll (it sets
 *    `body` height and makes its wrapper `position: fixed`), which would alter
 *    KAFUR's global scroll and break navigation/cart/checkout. The cinematic
 *    easing still comes from GSAP via `scrub`.
 *  - The Codrops frame / loader chrome is replaced by KAFUR styling.
 *  - Fixed layers are hidden once the section leaves the viewport so the rest
 *    of the storefront is never covered.
 */

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  CustomEase.create("cinematicSilk", "0.45, 0.05, 0.55, 0.95");
  CustomEase.create("cinematicSmooth", "0.25, 0.1, 0.25, 1");
  CustomEase.create("cinematicFlow", "0.33, 0, 0.2, 1");
  CustomEase.create("cinematicLinear", "0.4, 0, 0.6, 1");
}

type CylinderCarouselProps = {
  language: Drop001Language;
  onExplore: () => void;
  onFallback?: () => void;
};

export default function CylinderCarousel({ language, onExplore, onFallback }: CylinderCarouselProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<Transform | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const cylinderRef = useRef<Mesh | null>(null);
  const cameraAnimRef = useRef<CameraAnimation>({ x: 0, y: 0, z: 8, rotY: 0 });
  const particlesRef = useRef<ParticleMesh[]>([]);
  const lastRotationRef = useRef(0);
  const velocityRef = useRef(0);
  const momentumRef = useRef(0);

  const chapters = perspectives(language);
  const closingCopy = closing(language);

  // Loader dismissal (same timing idea as the Codrops loader component).
  useEffect(() => {
    if (isLoading) return;
    const timer = window.setTimeout(() => setShowLoader(false), 700);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !container || !viewport) return;

    let disposed = false;
    let rafId = 0;
    let layersVisible = true;
    let texture: Texture | null = null;
    let gsContext: gsap.Context | null = null;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true,
        antialias: true,
      });
    } catch (error) {
      console.error("DROP 001: no se pudo crear el contexto WebGL", error);
      onFallback?.();
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    gl.disable(gl.CULL_FACE);
    rendererRef.current = renderer;

    const getResponsiveDimensions = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      const maxRadius = isMobile ? 1.8 : isTablet ? 2.2 : 2.5;
      const cylinderHeight = isMobile ? 0.8 : isTablet ? 1.0 : 1.2;
      const cameraZ = isMobile ? 6 : isTablet ? 7 : 8;
      const fov = isMobile ? 50 : 45;

      return {
        cylinderScale: maxRadius / cylinderConfig.radius,
        cylinderHeight,
        cameraZ,
        fov,
        isMobile,
      };
    };

    const dimensions = getResponsiveDimensions();

    const camera = new Camera(gl, { fov: dimensions.fov });
    camera.position.set(0, 0, dimensions.cameraZ);
    cameraRef.current = camera;

    const scene = new Transform();
    sceneRef.current = scene;

    const geometry = createCylinderGeometry(gl, cylinderConfig);

    const hardwareLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const isMobileDevice = window.innerWidth < 768;
    const safeLimit = isMobileDevice ? 2048 : Math.min(hardwareLimit, 8192);

    const atlasCanvas = document.createElement("canvas");
    const ctx = atlasCanvas.getContext("2d", { willReadFrequently: false, alpha: false });
    if (!ctx) {
      console.error("DROP 001: no se pudo crear el canvas del atlas");
      onFallback?.();
      return;
    }
    const numImages = images.length;

    const totalWidthOriginal = imageConfig.width * numImages;
    const heightOriginal = imageConfig.height;
    const scale = Math.min(1, safeLimit / totalWidthOriginal);

    atlasCanvas.width = Math.floor(totalWidthOriginal * scale);
    atlasCanvas.height = Math.floor(heightOriginal * scale);

    const circumference = 2 * Math.PI * cylinderConfig.radius;
    const textureAspectRatio = imageConfig.height / (imageConfig.width * images.length);
    const idealHeight = circumference * textureAspectRatio;
    const heightCorrection = idealHeight / cylinderConfig.height;

    // Store the initial window width to track horizontal changes
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      if (rendererRef.current && cameraRef.current && cylinderRef.current) {
        const currentWidth = window.innerWidth;
        const newDimensions = getResponsiveDimensions();

        // 1. Mobile Address Bar Jump Prevention
        // If it's a mobile device and the width hasn't changed, it means only the URL bar hid/showed.
        // I abort the resize here to prevent the camera from zooming in and cropping the cylinder.
        if (newDimensions.isMobile && currentWidth === lastWidth) {
          return;
        }
        lastWidth = currentWidth;

        rendererRef.current.setSize(currentWidth, window.innerHeight);

        cameraRef.current.perspective({
          fov: newDimensions.fov,
          aspect: currentWidth / window.innerHeight,
        });

        // 2. Responsive Cylinder Scaling
        // I apply the height correction on mobile to prevent stretched images,
        // but keep the original uncompressed scale for the panoramic desktop look.
        if (newDimensions.isMobile) {
          cylinderRef.current.scale.set(
            newDimensions.cylinderScale,
            newDimensions.cylinderScale * heightCorrection,
            newDimensions.cylinderScale
          );
        } else {
          cylinderRef.current.scale.set(
            newDimensions.cylinderScale,
            newDimensions.cylinderScale,
            newDimensions.cylinderScale
          );
        }

        if (cameraAnimRef.current.z === 8 || cameraAnimRef.current.z === 7 || cameraAnimRef.current.z === 6) {
          cameraAnimRef.current.z = newDimensions.cameraZ;
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // If the browser drops the WebGL context (driver/GPU memory pressure) the
    // experience cannot continue: stop the loop and switch to the static
    // fallback instead of leaving a broken page behind.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(rafId);
      console.error("DROP 001: se perdió el contexto WebGL");
      setIsLoading(false);
      onFallback?.();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const loadTile = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error("DROP 001: no se pudo cargar la imagen", src);
          resolve(null);
        };
        img.src = src;
      });

    const buildAtlas = (imageElements: (HTMLImageElement | null)[]) => {
      const totalCanvasWidth = atlasCanvas.width;
      const canvasHeight = atlasCanvas.height;

      imageElements.forEach((img, i) => {
        const xStartExact = (i / numImages) * totalCanvasWidth;
        const xEndExact = ((i + 1) / numImages) * totalCanvasWidth;
        const xPos = Math.floor(xStartExact);
        const xEnd = Math.floor(xEndExact);
        const drawWidthActual = xEnd - xPos;

        if (img) {
          drawImageCover(ctx, img, xPos, 0, drawWidthActual, canvasHeight, images[i].focusY);
        } else {
          // Placeholder KAFUR-toned cell so the cylinder still renders.
          ctx.fillStyle = "#111110";
          ctx.fillRect(xPos, 0, drawWidthActual, canvasHeight);
        }
      });
    };

    const startExperienceInner = () => {
      if (disposed) return;

      texture = new Texture(gl, {
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        generateMipmaps: false,
      });

      texture.image = atlasCanvas;
      texture.needsUpdate = true;

      const program = new Program(gl, {
        vertex: cylinderVertex,
        fragment: cylinderFragment,
        uniforms: {
          tMap: { value: texture },
          uDarkness: { value: 0.3 },
        },
        cullFace: null,
      });

      const cylinder = new Mesh(gl, { geometry, program });
      cylinder.setParent(scene);
      cylinder.rotation.y = 0.5;
      cylinder.scale.set(dimensions.cylinderScale, dimensions.cylinderScale, dimensions.cylinderScale);
      cylinderRef.current = cylinder;

      setIsLoading(false);

      gsContext = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        tl.to(cameraAnimRef.current, {
          x: 0,
          y: 0,
          z: dimensions.cameraZ,
          duration: 1,
          ease: "cinematicSilk",
        })
          .to(cameraAnimRef.current, {
            x: 0,
            y: 5,
            z: 5,
            duration: 1,
            ease: "cinematicFlow",
          })
          .to(cameraAnimRef.current, {
            x: 1.5,
            y: 2,
            z: 2,
            duration: 2,
            ease: "cinematicLinear",
          })
          .to(cameraAnimRef.current, {
            x: 0.5,
            y: 0,
            z: 0.8,
            duration: 3.5,
            ease: "power1.inOut",
          })
          .to(cameraAnimRef.current, {
            x: -6,
            y: -1,
            z: dimensions.cameraZ,
            duration: 1,
            ease: "cinematicSmooth",
          });

        tl.to(
          cylinderRef.current!.rotation,
          {
            y: "+=28.27",
            duration: 8.5,
            ease: "none",
          },
          0
        );

        // Text chapters. The demo maps each chapter onto `x% top` of the
        // spacer; because KAFUR keeps the rest of the page below the
        // experience, the boundaries are mapped onto the same scroll range as
        // the camera timeline (`top top` → `bottom bottom`) so the closing
        // chapter and its CTA are fully visible before the section ends.
        const segmentCount = textRefs.current.filter(Boolean).length;
        const boundary = (index: number) => () => {
          const total = container.offsetHeight;
          const span = ((Math.max(total - window.innerHeight, 1)) / total) * 100;
          return `${(index / Math.max(segmentCount, 1)) * span}% top`;
        };

        textRefs.current.forEach((textEl, index) => {
          if (!textEl) return;

          const textTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: boundary(index),
              end: boundary(index + 1),
              scrub: 0.8,
            },
          });

          if (index === 0) {
            // The first chapter is already on screen when the page loads.
            textTimeline
              .fromTo(textEl, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.8, ease: "none" })
              .to(textEl, { autoAlpha: 0, duration: 0.2, ease: "cinematicSmooth" });
          } else {
            textTimeline
              .fromTo(textEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "cinematicSmooth" })
              .to(textEl, { autoAlpha: 1, duration: 0.6, ease: "none" })
              .to(textEl, { autoAlpha: 0, duration: 0.2, ease: "cinematicSmooth" });
          }
        });
      }, container);

      for (let i = 0; i < particleConfig.numParticles; i++) {
        const { geometry: lineGeometry, userData } = createParticleGeometry(
          gl,
          particleConfig,
          i,
          cylinderConfig.height
        );

        const lineProgram = new Program(gl, {
          vertex: particleVertex,
          fragment: particleFragment,
          uniforms: {
            uColor: { value: [1.0, 1.0, 1.0] },
            uOpacity: { value: 0.0 },
          },
          transparent: true,
          depthTest: true,
        });

        const particle = new Mesh(gl, {
          geometry: lineGeometry,
          program: lineProgram,
          mode: gl.LINE_STRIP,
        }) as ParticleMesh;

        particle.userData = userData;
        particle.setParent(scene);
        particlesRef.current.push(particle);
      }

      const animate = () => {
        if (disposed) return;
        rafId = requestAnimationFrame(animate);

        // Only paint the cinematic layers while the section owns the viewport.
        const rect = container.getBoundingClientRect();
        const shouldShow = rect.bottom >= window.innerHeight - 1;
        if (shouldShow !== layersVisible) {
          layersVisible = shouldShow;
          viewport.dataset.hidden = shouldShow ? "false" : "true";
        }
        if (!shouldShow || document.hidden) return;

        camera.position.set(cameraAnimRef.current.x, cameraAnimRef.current.y, cameraAnimRef.current.z);
        camera.lookAt([0, 0, 0]);

        if (cylinderRef.current) {
          const currentRotation = cylinderRef.current.rotation.y;
          velocityRef.current = currentRotation - lastRotationRef.current;
          lastRotationRef.current = currentRotation;

          const inertiaFactor = 0.15;
          const decayFactor = 0.92;

          momentumRef.current = momentumRef.current * decayFactor + velocityRef.current * inertiaFactor;

          const speed = Math.abs(velocityRef.current) * 100;
          const isRotating = Math.abs(velocityRef.current) > 0.0001;

          // Update particles
          particlesRef.current.forEach((particle) => {
            const userData = particle.userData;

            const targetOpacity = isRotating ? Math.min(speed * 3, 0.95) : 0;
            const currentOpacity = particle.program.uniforms.uOpacity.value as number;
            particle.program.uniforms.uOpacity.value = currentOpacity + (targetOpacity - currentOpacity) * 0.15;

            if (isRotating) {
              const rotationOffset = velocityRef.current * userData.speed * 1.5;
              const newBaseAngle = userData.baseAngle + rotationOffset;
              userData.baseAngle = newBaseAngle;

              const segments = particleConfig.segments;
              const positions = particle.geometry.attributes.position.data as Float32Array;

              for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const angle = newBaseAngle + userData.angleSpan * t;
                const radiusWithSpeed = userData.radius;

                positions[j * 3] = Math.cos(angle) * radiusWithSpeed;
                positions[j * 3 + 1] = userData.baseY;
                positions[j * 3 + 2] = Math.sin(angle) * radiusWithSpeed;
              }

              particle.geometry.attributes.position.needsUpdate = true;
            }
          });
        }

        try {
          renderer.render({ scene, camera });
        } catch (error) {
          console.error("DROP 001: fallo al renderizar", error);
          cancelAnimationFrame(rafId);
          setIsLoading(false);
          onFallback?.();
        }
      };

      animate();
      ScrollTrigger.refresh();
    };

    const startExperience = () => {
      try {
        startExperienceInner();
      } catch (error) {
        console.error("DROP 001: no se pudo iniciar la experiencia", error);
        setIsLoading(false);
        onFallback?.();
      }
    };

    Promise.all(images.map((tile) => loadTile(tile.src))).then((imageElements) => {
      if (disposed) return;
      try {
        buildAtlas(imageElements);
      } catch (error) {
        console.error("DROP 001: no se pudo construir el atlas de imágenes", error);
        setIsLoading(false);
        onFallback?.();
        return;
      }
      startExperience();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gsContext?.revert();
      gsContext = null;
      gsap.killTweensOf(cameraAnimRef.current);

      particlesRef.current.forEach((particle) => {
        particle.geometry.remove();
        particle.program.remove();
      });
      particlesRef.current = [];

      if (cylinderRef.current) {
        cylinderRef.current.program.remove();
        cylinderRef.current = null;
      }
      geometry.remove();

      if (texture) {
        gl.deleteTexture(texture.texture);
        texture = null;
      }

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      velocityRef.current = 0;
      momentumRef.current = 0;
      lastRotationRef.current = 0;
    };
  }, []);

  return (
    <section className="drop001" aria-label="KAFUR DROP 001">
      <div className="drop001__viewport" ref={viewportRef} data-hidden="false">
        <div className="drop001__canvas-layer">
          <canvas ref={canvasRef} />
        </div>

        <div className="drop001__hud drop001__hud--top" aria-hidden="true">
          <span>KAFUR® / DROP 001</span>
          <span>BUENOS AIRES — ARG</span>
        </div>

        <div className="drop001__copy">
          {chapters.map((chapter, index) => (
            <div
              className={`drop001__text drop001__text--${chapter.position}`}
              key={`${chapter.title}-${index}`}
              ref={(element) => {
                textRefs.current[index] = element;
              }}
            >
              <h2 className="drop001__title">{chapter.title}</h2>
              {chapter.description && <p className="drop001__subtitle">{chapter.description}</p>}
              {index === chapters.length - 1 && (
                <button className="drop001__cta" type="button" onClick={onExplore}>
                  <span>{closingCopy.cta}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="drop001__hint" aria-hidden="true">
          <span>SCROLL</span>
          <i />
        </div>
      </div>

      <div className="drop001__spacer" ref={containerRef} style={{ height: "500svh" }} />

      {showLoader && (
        <div className={`drop001-loader ${isLoading ? "" : "is-done"}`} aria-hidden="true">
          <span />
        </div>
      )}
    </section>
  );
}
