import {
  CanvasTexture,
  Color,
  MeshToonMaterial,
  NearestFilter,
  SRGBColorSpace,
  type Texture,
} from "three";

let gradient: Texture | null = null;

export function toonGradient() {
  if (gradient) return gradient;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d");
  const values = [70, 130, 185, 255];
  values.forEach((v, i) => {
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(i, 0, 1, 1);
  });
  const tex = new CanvasTexture(canvas);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  gradient = tex;
  return tex;
}

const cache = new Map<string, MeshToonMaterial>();

export function toon(color: string) {
  const hit = cache.get(color);
  if (hit) return hit;
  const mat = new MeshToonMaterial({ color: new Color(color), gradientMap: toonGradient() });
  cache.set(color, mat);
  return mat;
}

export function ignoreRaycast() {
  /* decorative meshes should not swallow clicks */
}
