import { Geometry } from "ogl";

export type CylinderGeometryOptions = {
  radius: number;
  height: number;
  radialSegments: number;
};

export function createCylinderGeometry(
  gl: WebGLRenderingContext,
  { radius, height, radialSegments }: CylinderGeometryOptions,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let yIndex = 0; yIndex <= 1; yIndex += 1) {
    const y = (yIndex - 0.5) * height;
    for (let segment = 0; segment <= radialSegments; segment += 1) {
      const u = segment / radialSegments;
      const angle = u * Math.PI * 2;
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
      uvs.push(u, 1 - yIndex);
    }
  }

  const row = radialSegments + 1;
  for (let segment = 0; segment < radialSegments; segment += 1) {
    const a = segment;
    const b = segment + 1;
    const c = row + segment;
    const d = row + segment + 1;
    indices.push(a, c, b, b, c, d);
  }

  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(positions) },
    uv: { size: 2, data: new Float32Array(uvs) },
    index: { data: new Uint16Array(indices) },
  });
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

export async function createImageAtlas(imageSources: string[], isMobile: boolean) {
  const images = await Promise.all(
    imageSources.map(
      (source) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.decoding = "async";
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error(`No se pudo cargar ${source}`));
          image.src = source;
        }),
    ),
  );

  const sliceWidth = isMobile ? 512 : 768;
  const sliceHeight = isMobile ? 768 : 1024;
  const canvas = document.createElement("canvas");
  canvas.width = sliceWidth * images.length;
  canvas.height = sliceHeight;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("No se pudo crear el atlas de DROP 001");
  context.fillStyle = "#111110";
  context.fillRect(0, 0, canvas.width, canvas.height);
  images.forEach((image, index) => drawImageCover(context, image, index * sliceWidth, 0, sliceWidth, sliceHeight));
  return canvas;
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}
