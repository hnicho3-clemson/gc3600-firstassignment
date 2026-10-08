import type { Group, Object3D } from "three";
import { Vector2, Vector3 } from "three";

export const runtime = {
  scroll: 0,
  depth: 0,
  camY: 6.4,
  pointerNdc: new Vector2(0, 0),
  pointerWorld: new Vector3(0, 4, 0),
  pointerOn: false,
  hover: "",
  reduced: false,
  mobile: false,
  fine: true,
  locked: false,
  followFish: -1,
  crabHop: 0,
  crabStealUntil: 0,
  crabScreen: { x: 0, y: 0 },
  pearls: new Set<string>(),
  anchors: new Map<string, Object3D>(),
  labelEls: new Map<string, HTMLElement>(),
  ripple: null as null | ((x: number, y: number, z: number) => void),
  burstBubbles: 0,
  wantsRipple: false,
  onFrame: null as null | (() => void),
};

export function scrollToDepth(depth: number, smooth = true) {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const calm = document.documentElement.classList.contains("calm") || runtime.reduced;
  window.scrollTo({
    top: max * Math.min(1, Math.max(0, depth)),
    behavior: smooth && !calm ? "smooth" : "auto",
  });
}

export type AnchorBind = Group;
