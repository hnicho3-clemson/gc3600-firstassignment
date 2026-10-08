import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type Group,
  type Object3D,
} from "three";
import { ignoreRaycast, toon } from "./materials";
import { runtime } from "../runtime";

export function FramedPrint({ url, height = 0.86, alt = "" }: { url: string; height?: number; alt?: string }) {
  const ref = useRef<Group>(null);
  const id = useId();
  useAnchor(id, ref);
  useEffect(() => {
    const el = document.createElement("img");
    el.className = "relic";
    el.alt = alt;
    el.width = Math.round(168 * height);
    el.draggable = false;
    el.dataset.shift = "-50%";
    el.src = url;
    document.body.appendChild(el);
    runtime.labelEls.set(id, el);
    return () => {
      runtime.labelEls.delete(id);
      el.remove();
    };
  }, [id, url, alt, height]);
  return <group ref={ref} />;
}

export function useAnchor(id: string, ref: RefObject<Object3D | null>) {
  useEffect(() => {
    if (ref.current) runtime.anchors.set(id, ref.current);
    return () => {
      runtime.anchors.delete(id);
    };
  }, [id, ref]);
}

export function Anchor({
  id,
  position,
  bob = 0,
  scale = 1,
  children,
  onClick,
}: {
  id: string;
  position: [number, number, number];
  bob?: number;
  scale?: number;
  children: ReactNode;
  onClick?: () => void;
}) {
  const ref = useRef<Group>(null);
  const inner = useRef<Group>(null);
  useEffect(() => {
    if (ref.current) runtime.anchors.set(id, ref.current);
    return () => {
      runtime.anchors.delete(id);
    };
  }, [id]);
  useFrame(({ clock }) => {
    const group = ref.current;
    const innerGroup = inner.current;
    if (!group || !innerGroup) return;
    const sway = runtime.reduced || bob === 0 ? 0 : Math.sin(clock.elapsedTime * 0.8 + position[0] * 2) * bob;
    group.position.set(position[0], position[1] + sway, position[2]);
    const hot = runtime.hover === id;
    const current = innerGroup.scale.x;
    const target = hot ? 1.05 : 1;
    innerGroup.scale.setScalar(current + (target - current) * 0.14);
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <group
        ref={inner}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          runtime.hover = id;
        }}
        onPointerOut={() => {
          if (runtime.hover === id) runtime.hover = "";
        }}
      >
        {children}
      </group>
    </group>
  );
}

function KelpBlade({
  spot,
  index,
}: {
  spot: { position: [number, number, number]; rot: number; scale: number; color: string };
  index: number;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    const t = runtime.reduced ? 0 : clock.elapsedTime;
    const sway = Math.sin(t * 0.85 + index * 0.7) * 0.22;
    const dx = spot.position[0] - runtime.pointerWorld.x;
    const dy = spot.position[1] - runtime.pointerWorld.y;
    const dist = Math.hypot(dx, dy);
    const push =
      !runtime.reduced && dist < 3.2 ? (1 - dist / 3.2) * 0.5 * Math.sign(dx || 0.0001) : 0;
    group.rotation.z = sway + push;
  });
  return (
    <group ref={ref} position={spot.position} rotation={[0, spot.rot, 0]} scale={spot.scale}>
      <mesh position={[0, 1.2, 0]} raycast={ignoreRaycast} material={toon(spot.color)}>
        <coneGeometry args={[0.18, 2.5, 5]} />
      </mesh>
      <mesh position={[0.2, 0.9, 0.04]} rotation={[0, 0.2, 0.38]} raycast={ignoreRaycast} material={toon(spot.color)}>
        <coneGeometry args={[0.11, 1.75, 4]} />
      </mesh>
      <mesh position={[-0.18, 0.75, -0.04]} rotation={[0, -0.2, -0.42]} raycast={ignoreRaycast} material={toon(spot.color)}>
        <coneGeometry args={[0.1, 1.5, 4]} />
      </mesh>
    </group>
  );
}

export const kelpSpots: { position: [number, number, number]; rot: number; scale: number; color: string }[] = [
  { position: [-3.4, -2.8, -0.4], rot: 0.2, scale: 1.15, color: "#1e6d62" },
  { position: [-2.6, -2.5, 0.8], rot: -0.4, scale: 0.85, color: "#247a62" },
  { position: [3.3, -7.2, 0.2], rot: 0.3, scale: 1.05, color: "#1a5e58" },
  { position: [3.8, -6.2, -0.6], rot: -0.2, scale: 1.3, color: "#2c7a68" },
  { position: [-3.5, -12.2, 0.3], rot: 0.5, scale: 1, color: "#14584f" },
  { position: [-2.2, -16.6, -0.5], rot: -0.3, scale: 1.2, color: "#1d6558" },
  { position: [3.1, -16.2, 0.6], rot: 0.1, scale: 0.9, color: "#24685a" },
  { position: [-2.4, -26.6, 0.2], rot: 0.4, scale: 1.1, color: "#123e45" },
  { position: [2.6, -31.4, -0.3], rot: -0.5, scale: 1.25, color: "#0e4a48" },
  { position: [-3.2, -37.2, 0.4], rot: 0.2, scale: 0.8, color: "#123a32" },
  { position: [1.4, -1.2, -1.2], rot: 0.6, scale: 1.4, color: "#1a6a55" },
  { position: [-4.2, -21.2, -0.8], rot: -0.2, scale: 1.5, color: "#184e55" },
];

export function KelpForest() {
  return (
    <group>
      {kelpSpots.map((spot, index) => (
        <KelpBlade key={index} spot={spot} index={index} />
      ))}
    </group>
  );
}

export function Sand({
  position,
  radius = 4.4,
  color = "#b7a88a",
}: {
  position: [number, number, number];
  radius?: number;
  color?: string;
  strength?: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={position} raycast={ignoreRaycast} material={toon(color)}>
      <circleGeometry args={[radius, 24]} />
    </mesh>
  );
}

export function Coral({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  const mat = toon(color);
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          raycast={ignoreRaycast}
          position={[Math.sin(i * 1.4) * 0.18, 0.22 + (i % 3) * 0.08, Math.cos(i) * 0.16]}
          rotation={[0.15 * (i % 2), i, 0.1]}
          material={mat}
        >
          <coneGeometry args={[0.1 + (i % 2) * 0.05, 0.48 + (i % 3) * 0.12, 5]} />
        </mesh>
      ))}
    </group>
  );
}

export function Rock({
  position,
  scale = 1,
  color = "#3d4a52",
}: {
  position: [number, number, number];
  scale?: number | [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} scale={scale} raycast={ignoreRaycast} rotation={[0.2, position[0], 0.1]} material={toon(color)}>
      <icosahedronGeometry args={[0.45, 0]} />
    </mesh>
  );
}

export function usePaintedTexture(
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
  key = "once",
) {
  const [tex, setTex] = useState<CanvasTexture | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    let cancel = false;
    const make = () => {
      if (cancel) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
      if (!ctx) return;
      drawRef.current(ctx, canvas);
      const next = new CanvasTexture(canvas);
      next.colorSpace = SRGBColorSpace;
      next.premultiplyAlpha = false;
      next.generateMipmaps = false;
      next.minFilter = LinearFilter;
      next.magFilter = LinearFilter;
      next.needsUpdate = true;
      setTex((current) => {
        current?.dispose();
        return next;
      });
    };
    void document.fonts.ready.then(make);
    return () => {
      cancel = true;
    };
  }, [key]);
  return tex;
}

export function paperSign(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  canvas.width = 1024;
  canvas.height = 576;
  ctx.fillStyle = "#f3ead7";
  ctx.fillRect(0, 0, 1024, 576);
  ctx.strokeStyle = "#1b2a32";
  ctx.lineWidth = 10;
  ctx.strokeRect(36, 36, 952, 504);
  ctx.strokeStyle = "#e07a5f";
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, 916, 468);
  ctx.fillStyle = "#e07a5f";
  ctx.beginPath();
  ctx.arc(140, 120, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b2a32";
  ctx.textAlign = "center";
  ctx.font = "620 108px Fraunces, Georgia, serif";
  ctx.fillText("HALEY NICHOLS", 512, 250);
  ctx.font = "500 32px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = "#1f6f74";
  ctx.fillText("GRAPHIC COMMUNICATIONS", 512, 330);
  ctx.fillStyle = "#8d5b45";
  ctx.font = "400 26px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillText("STATION HN-03   ·   CLEMSON SOUND", 512, 400);
}

export function diverCard(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  canvas.width = 760;
  canvas.height = 980;
  ctx.clearRect(0, 0, 760, 980);
  ctx.fillStyle = "#f3ead7";
  roundRect(ctx, 40, 40, 680, 900, 28);
  ctx.fill();
  ctx.strokeStyle = "#1b2a32";
  ctx.lineWidth = 6;
  roundRect(ctx, 40, 40, 680, 900, 28);
  ctx.stroke();

  ctx.fillStyle = "#12323c";
  ctx.beginPath();
  ctx.ellipse(380, 820, 150, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d7efe8";
  roundRect(ctx, 250, 430, 260, 280, 80);
  ctx.fill();
  ctx.fillStyle = "#e07a5f";
  roundRect(ctx, 270, 560, 220, 28, 10);
  ctx.fill();

  ctx.fillStyle = "#f7f1e4";
  ctx.beginPath();
  ctx.arc(380, 300, 118, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#1b2a32";
  ctx.stroke();
  ctx.fillStyle = "#163844";
  ctx.beginPath();
  ctx.arc(410, 305, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(158,224,214,0.7)";
  ctx.beginPath();
  ctx.arc(432, 284, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1b2a32";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(250, 520);
  ctx.quadraticCurveTo(180, 620, 210, 760);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(510, 540);
  ctx.quadraticCurveTo(600, 640, 560, 780);
  ctx.stroke();

  ctx.fillStyle = "#1b2a32";
  ctx.textAlign = "center";
  ctx.font = "500 22px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillText("SPECIMEN  ·  THE DIVER", 380, 120);
  ctx.font = "500 42px Fraunces, Georgia, serif";
  ctx.fillText("field notes", 380, 180);
}

export function letterTexture(letter: string) {
  return (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    canvas.width = 512;
    canvas.height = 512;
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = "#f3ead7";
    ctx.font = "620 340px Fraunces, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, 256, 270);
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
