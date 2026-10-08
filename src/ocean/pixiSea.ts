import {
  Application,
  Assets,
  Circle,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  type Ticker,
} from "pixi.js";
import {
  mediaUrl,
  personalTentacles,
  projectById,
  shellIds,
  skills,
  WORLD,
} from "../data";
import { runtime, type Anchor } from "../runtime";

export type SeaHooks = {
  openProject: (id: string, slide?: number) => void;
  openPanel: (
    panel: "about" | "skills" | "contact" | "bottle" | "pearl" | "rock" | "index" | "jelly",
    extra?: { skill?: string; relic?: string; jelly?: number },
  ) => void;
  notify: (message: string) => void;
  collectShell: (id: string) => void;
};

const shellTaps = new Map<string, number[]>();

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function lerpColor(a: number, b: number, t: number) {
  const u = Math.min(1, Math.max(0, t));
  const r = clampByte(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * u);
  const g = clampByte(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * u);
  const bl = clampByte((a & 255) + ((b & 255) - (a & 255)) * u);
  return (r << 16) | (g << 8) | bl;
}

function shade(color: number, k: number) {
  return (
    (clampByte(((color >> 16) & 255) * k) << 16) |
    (clampByte(((color >> 8) & 255) * k) << 8) |
    clampByte((color & 255) * k)
  );
}

const U = 180;

type Fill = number | { color: number; alpha?: number };

function ink() {
  const g = new Graphics();
  const k = (n: number) => n * U;
  const api = {
    g,
    done() {
      g.scale.set(1 / U);
      return g;
    },
    moveTo(x: number, y: number) {
      g.moveTo(k(x), k(y));
      return api;
    },
    lineTo(x: number, y: number) {
      g.lineTo(k(x), k(y));
      return api;
    },
    q(cpx: number, cpy: number, x: number, y: number) {
      g.quadraticCurveTo(k(cpx), k(cpy), k(x), k(y));
      return api;
    },
    close() {
      g.closePath();
      return api;
    },
    fill(style: Fill) {
      g.fill(style);
      return api;
    },
    stroke(width: number, color: number, alpha = 1) {
      g.stroke({ width: Math.max(1.25, width * U), color, alpha, cap: "round" });
      return api;
    },
    ellipse(x: number, y: number, rx: number, ry: number) {
      g.ellipse(k(x), k(y), k(rx), k(ry));
      return api;
    },
    circle(x: number, y: number, r: number) {
      g.circle(k(x), k(y), Math.max(2, k(r)));
      return api;
    },
    rect(x: number, y: number, w: number, h: number) {
      g.rect(k(x), k(y), k(w), k(h));
      return api;
    },
    roundRect(x: number, y: number, w: number, h: number, r = 0) {
      g.roundRect(k(x), k(y), k(w), k(h), k(r));
      return api;
    },
  };
  return api;
}

function depthColor(t: number) {
  const stops = [0x1c8eab, 0x0e5c78, 0x0a3a50, 0x071c2c, 0x040c14];
  const marks = [0, 0.28, 0.55, 0.8, 1];
  for (let i = 0; i < marks.length - 1; i += 1) {
    if (t <= marks[i + 1]) {
      const u = (t - marks[i]) / (marks[i + 1] - marks[i]);
      return lerpColor(stops[i], stops[i + 1], u);
    }
  }
  return stops[stops.length - 1];
}

function washTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;
  const grd = ctx.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "rgba(255, 236, 196, 0.28)");
  grd.addColorStop(0.18, "rgba(255, 236, 196, 0.02)");
  grd.addColorStop(0.55, "rgba(0, 0, 0, 0)");
  grd.addColorStop(1, "rgba(0, 8, 16, 0.45)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 8, 256);
  return Texture.from(canvas);
}

function hit(node: Container, area: Rectangle | Circle, onTap: () => void, id?: string) {
  node.eventMode = "static";
  node.cursor = "pointer";
  node.hitArea = area;
  node.on("pointertap", (event) => {
    event.stopPropagation();
    onTap();
  });
  if (id) {
    node.on("pointerover", () => {
      runtime.hover = id;
    });
    node.on("pointerout", () => {
      if (runtime.hover === id) runtime.hover = "";
    });
  }
}

function framed(tex: Texture | undefined, height: number) {
  const aspect = tex ? tex.width / Math.max(1, tex.height) : 1.35;
  const h = height;
  const w = h * aspect;
  const pad = Math.max(0.06, h * 0.07);
  const node = new Container();
  const board = ink();
  board.roundRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2, 0.04).fill(0xf4ecdc);
  board.roundRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2, 0.04).stroke(0.018, 0x1b2a32, 0.9);
  node.addChild(board.done());
  if (tex) {
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.width = w;
    sprite.height = h;
    node.addChild(sprite);
  } else {
    const missing = ink();
    missing.roundRect(-w / 2, -h / 2, w, h, 0.02).fill(0xd7cbb6);
    node.addChild(missing.done());
  }
  const pin = ink();
  pin.circle(w / 2 + pad * 0.15, -h / 2 - pad * 0.1, 0.04).fill(0xe07a5f);
  node.addChild(pin.done());
  node.hitArea = new Rectangle(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
  return node;
}

function kelpBlade(height: number, width: number, color: number) {
  const node = new Container();
  const blades = [
    { lean: -0.35, h: height, w: width },
    { lean: 0.05, h: height * 1.12, w: width * 0.85 },
    { lean: 0.42, h: height * 0.78, w: width * 0.7 },
  ];
  for (const blade of blades) {
    const top = -blade.h;
    const p = ink();
    p.moveTo(-blade.w, 0)
      .q(-blade.w * 0.2 + blade.lean, top * 0.45, blade.lean * 0.6, top)
      .q(blade.w * 0.8 + blade.lean, top * 0.55, blade.w * 0.45 + blade.lean, top * 0.15)
      .q(blade.w * 0.2, top * 0.4, blade.w * 0.9, 0)
      .close()
      .fill(color);
    p.moveTo(blade.lean * 0.2, top * 0.08)
      .q(blade.w * 0.15 + blade.lean, top * 0.5, blade.lean * 0.3, top * 0.88)
      .stroke(Math.max(0.02, blade.w * 0.08), 0xe7ffe8, 0.35);
    const graphic = p.done();
    graphic.eventMode = "none";
    node.addChild(graphic);
  }
  return node;
}

function drawCoral(color: number, scale = 1) {
  const p = ink();
  const blobs: [number, number, number][] = [
    [0, 0.08, 0.16],
    [-0.05, -0.18, 0.2],
    [0.12, -0.42, 0.18],
    [-0.22, -0.48, 0.16],
    [0.28, -0.62, 0.15],
    [-0.08, -0.72, 0.17],
    [0.08, -0.92, 0.13],
  ];
  for (const [x, y, r] of blobs) p.circle(x, y, r).fill(color);
  p.circle(-0.02, -0.28, 0.07).fill({ color: 0xffffff, alpha: 0.18 });
  p.circle(0.16, -0.7, 0.05).fill(shade(color, 1.2));
  const g = p.done();
  g.scale.set((1 / U) * scale, (1 / U) * scale);
  return g;
}

function drawRock(color: number, scale = 1) {
  const p = ink();
  p.moveTo(-0.48, 0.12)
    .q(-0.55, -0.18, -0.12, -0.34)
    .q(0.28, -0.42, 0.52, -0.06)
    .q(0.42, 0.2, 0.02, 0.2)
    .close()
    .fill(color);
  p.ellipse(-0.08, -0.08, 0.16, 0.06).fill({ color: 0xffffff, alpha: 0.1 });
  const g = p.done();
  g.scale.set((1 / U) * scale, (1 / U) * scale);
  return g;
}

function drawSand(rx: number, color: number) {
  const p = ink();
  p.ellipse(0, 0, rx, rx * 0.16).fill({ color, alpha: 0.55 });
  p.ellipse(-rx * 0.08, rx * 0.02, rx * 0.55, rx * 0.05).fill({ color: 0xffffff, alpha: 0.06 });
  for (let i = 0; i < 3; i += 1) {
    const y = -rx * 0.04 + i * rx * 0.04;
    p.moveTo(-rx * 0.55, y).q(0, y - rx * 0.03, rx * 0.55, y + rx * 0.008).stroke(0.016, 0xfff6e8, 0.2);
  }
  return p.done();
}

function drawFish(color: number, glow: boolean, seed: number) {
  const node = new Container();
  const p = ink();
  const fin = 0.16 + (seed % 3) * 0.03;
  p.moveTo(-0.22, 0).lineTo(-0.46, fin).q(-0.32, 0, -0.46, -fin * 0.8).close().fill(shade(color, 0.78));
  p.ellipse(0.02, 0, 0.34, 0.145).fill(color);
  p.ellipse(0.05, 0.04, 0.18, 0.065).fill({ color: 0xfff8ee, alpha: 0.42 });
  p.moveTo(-0.02, -0.08)
    .q(0.06, -0.26, 0.16, -0.06)
    .close()
    .fill(shade(color, 0.72));
  if (seed % 2 === 0) p.ellipse(-0.04, 0, 0.055, 0.12).fill({ color: shade(color, 0.68), alpha: 0.9 });
  p.circle(0.18, -0.025, 0.05).fill(0xf7f3ea);
  p.circle(0.195, -0.025, 0.022).fill(0x1a120e);
  p.moveTo(0.28, 0.02).q(0.34, 0.05, 0.27, 0.07).stroke(0.012, 0x1a120e, 0.45);
  node.addChild(p.done());
  if (glow) {
    const light = ink();
    light.circle(0.02, 0.04, 0.16).fill({ color: 0xc8ffb0, alpha: 0.55 });
    const glowG = light.done();
    glowG.blendMode = "add";
    node.addChild(glowG);
  }
  node.hitArea = new Circle(0, 0, 0.48);
  node.eventMode = "dynamic";
  node.cursor = "pointer";
  return node;
}

function drawShell(color: number) {
  const node = new Container();
  const p = ink();
  p.ellipse(0, 0.02, 0.22, 0.16).fill(color);
  p.ellipse(-0.04, 0.01, 0.13, 0.1).fill(shade(color, 0.86));
  p.moveTo(-0.16, 0.04).q(-0.02, -0.18, 0.16, 0.02).stroke(0.018, 0xffffff, 0.5);
  p.moveTo(-0.1, 0.07).q(0, -0.06, 0.11, 0.05).stroke(0.012, 0xffffff, 0.35);
  node.addChild(p.done());
  const pearlInk = ink();
  pearlInk.circle(0.02, -0.02, 0.055).fill(0xf7f3ea);
  pearlInk.circle(-0.01, -0.04, 0.018).fill({ color: 0xffffff, alpha: 0.85 });
  const pearl = pearlInk.done();
  pearl.visible = false;
  node.addChild(pearl);
  return { node, pearl };
}

function drawJelly(color: number) {
  const node = new Container();
  const glowInk = ink();
  glowInk.circle(0, -0.05, 0.55).fill({ color, alpha: 0.28 });
  const glow = glowInk.done();
  glow.blendMode = "add";
  const tent = ink();
  for (const x of [-0.18, -0.06, 0.06, 0.18]) {
    tent.moveTo(x, 0.08).q(x + 0.1, 0.4, x - 0.04, 0.78).stroke(0.02, color, 0.8);
  }
  const bell = ink();
  bell.ellipse(0, 0, 0.38, 0.26).fill({ color, alpha: 0.92 });
  bell.ellipse(0, 0.05, 0.24, 0.11).fill({ color: 0xffffff, alpha: 0.28 });
  bell.ellipse(-0.12, -0.06, 0.07, 0.04).fill({ color: 0xffffff, alpha: 0.4 });
  node.addChild(glow, tent.done(), bell.done());
  node.hitArea = new Circle(0, 0.1, 0.48);
  return { node, glow };
}

function drawTower() {
  const p = ink();
  p.moveTo(-0.32, 0.15).lineTo(-0.14, -0.55).stroke(0.045, 0x16384c);
  p.moveTo(0.32, 0.15).lineTo(0.14, -0.55).stroke(0.045, 0x16384c);
  p.moveTo(-0.22, -0.22).lineTo(0.22, -0.22).stroke(0.03, 0x16384c);
  p.roundRect(-0.42, -1.15, 0.84, 0.55, 0.1).fill(0xf4ecdc);
  p.rect(-0.42, -0.94, 0.84, 0.16).fill(0x1d4e89);
  p.moveTo(-0.48, -1.15).lineTo(0, -1.48).lineTo(0.48, -1.15).close().fill(0x16384c);
  p.circle(0, -0.86, 0.04).fill(0xe07a5f);
  return p.done();
}

function drawChest() {
  const node = new Container();
  const body = ink();
  body.roundRect(-0.58, -0.22, 1.16, 0.55, 0.08).fill(0x6d452c);
  body.rect(-0.58, -0.22, 1.16, 0.1).fill(0x8d5a38);
  body.roundRect(-0.09, -0.02, 0.18, 0.14, 0.04).fill(0xf0d78c);
  body.circle(0, 0.05, 0.028).fill(0x6d452c);
  const lidInk = ink();
  lidInk.roundRect(0, -0.22, 1.16, 0.3, 0.1).fill(0x8a5a38);
  lidInk.rect(0.12, -0.05, 0.92, 0.07).fill({ color: 0xf0d78c, alpha: 0.9 });
  const lid = lidInk.done();
  lid.position.set(-0.58, -0.22);
  node.addChild(body.done(), lid);
  return { node, lid };
}

function drawOctopus() {
  const node = new Container();
  const p = ink();
  const tips = [
    { x: -1.55, y: 0.35, cx: -1.05, cy: 0.55 },
    { x: -1.05, y: 0.95, cx: -0.7, cy: 0.7 },
    { x: -0.35, y: 1.2, cx: -0.15, cy: 0.85 },
    { x: 0.4, y: 1.15, cx: 0.15, cy: 0.85 },
    { x: 1.1, y: 0.85, cx: 0.75, cy: 0.65 },
    { x: 1.6, y: 0.28, cx: 1.15, cy: 0.5 },
  ];
  for (const tip of tips) {
    p.moveTo(tip.x * 0.22, 0.12).q(tip.cx, tip.cy, tip.x, tip.y).stroke(0.14, 0x6a445c);
    for (let i = 1; i <= 3; i += 1) {
      const t = i / 4;
      const u = 1 - t;
      const x0 = tip.x * 0.22;
      const y0 = 0.12;
      const x = u * u * x0 + 2 * u * t * tip.cx + t * t * tip.x;
      const y = u * u * y0 + 2 * u * t * tip.cy + t * t * tip.y;
      p.circle(x, y + 0.045, 0.032).fill(0xf0c2b4);
    }
  }
  p.ellipse(0, -0.08, 0.62, 0.48).fill(0x6a445c);
  p.ellipse(-0.08, -0.24, 0.38, 0.22).fill(0x85556f);
  p.ellipse(-0.18, -0.1, 0.11, 0.13).fill(0xf7f1e6);
  p.ellipse(0.2, -0.1, 0.11, 0.13).fill(0xf7f1e6);
  p.circle(-0.16, -0.08, 0.045).fill(0x1a120e);
  p.circle(0.22, -0.08, 0.045).fill(0x1a120e);
  node.addChild(p.done());
  return { node, tips };
}

function drawCrab() {
  const node = new Container();
  const legInk = ink();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      legInk
        .moveTo(side * 0.16, 0.04)
        .q(side * 0.38, 0.1 + i * 0.02, side * 0.5, 0.2 + i * 0.07)
        .stroke(0.028, 0x9a4636);
    }
  }
  const legs = legInk.done();
  const body = ink();
  body.ellipse(0, 0, 0.36, 0.2).fill(0xc4654a);
  body.ellipse(0, -0.04, 0.22, 0.1).fill(0xe08a6d);
  body.moveTo(-0.26, -0.02).q(-0.55, -0.2, -0.36, 0.06).close().fill(0xa8523e);
  body.moveTo(0.26, -0.02).q(0.55, -0.2, 0.36, 0.06).close().fill(0xa8523e);
  body.circle(-0.12, -0.18, 0.04).fill(0x1a120e);
  body.circle(0.12, -0.18, 0.04).fill(0x1a120e);
  body.moveTo(-0.12, -0.22).lineTo(-0.12, -0.32).stroke(0.015, 0x1a120e);
  body.moveTo(0.12, -0.22).lineTo(0.12, -0.32).stroke(0.015, 0x1a120e);
  const sign = ink();
  sign.roundRect(-0.18, -0.52, 0.36, 0.18, 0.04).fill(0xf3ead7);
  sign.moveTo(0, -0.34).lineTo(0, -0.18).stroke(0.018, 0x6b4a32);
  node.addChild(legs, body.done(), sign.done());
  node.hitArea = new Circle(0, 0, 0.55);
  return { node, legs };
}

function drawBottle() {
  const p = ink();
  p.moveTo(-0.12, 0.34)
    .lineTo(-0.17, -0.02)
    .q(-0.17, -0.18, -0.07, -0.22)
    .lineTo(-0.07, -0.3)
    .lineTo(0.07, -0.3)
    .lineTo(0.07, -0.22)
    .q(0.17, -0.18, 0.17, -0.02)
    .lineTo(0.12, 0.34)
    .close()
    .fill({ color: 0xb7efe4, alpha: 0.45 });
  p.roundRect(-0.065, -0.44, 0.13, 0.16, 0.04).fill(0x6b442c);
  p.roundRect(-0.05, 0.02, 0.08, 0.18, 0.02).fill(0xf3ead7);
  p.circle(0.04, 0.08, 0.012).fill({ color: 0xffffff, alpha: 0.7 });
  return p.done();
}

function drawBuoy() {
  const p = ink();
  p.roundRect(-0.045, 0.08, 0.09, 0.95, 0.04).fill(0x6b4a32);
  p.ellipse(0, 0.16, 0.78, 0.22).fill(0xc45a48);
  p.ellipse(0, 0.1, 0.78, 0.16).fill(0xe07a5f);
  p.ellipse(-0.28, 0.06, 0.18, 0.05).fill({ color: 0xffffff, alpha: 0.28 });
  return p.done();
}

function drawSkill(id: string) {
  const p = ink();
  if (id === "illustration") {
    p.circle(0, -0.02, 0.2).fill(0xe07a5f);
    p.circle(-0.16, 0.08, 0.14).fill(0xd4846a);
    p.circle(0.16, 0.1, 0.13).fill(0xc96b58);
    p.circle(0, 0.16, 0.12).fill(0xe6c27a);
    p.circle(0.02, -0.06, 0.05).fill({ color: 0xfff6e4, alpha: 0.75 });
  } else if (id === "brand") {
    p.ellipse(0, 0.02, 0.24, 0.17).fill(0xf3ead7);
    p.moveTo(-0.18, 0.05).q(0, -0.18, 0.18, 0.02).stroke(0.02, 0x1d4e89);
  } else if (id === "print") {
    p.roundRect(-0.26, -0.16, 0.24, 0.34, 0.03).fill(0xf4ecdc);
    p.roundRect(0.02, -0.16, 0.24, 0.34, 0.03).fill(0xe7dcc4);
    p.moveTo(-0.2, -0.04).lineTo(-0.08, -0.04).stroke(0.012, 0x8d5b45);
    p.moveTo(-0.2, 0.04).lineTo(-0.1, 0.04).stroke(0.012, 0x8d5b45);
  } else if (id === "display") {
    p.roundRect(-0.3, -0.2, 0.6, 0.1, 0.03).fill(0xd7c4a4);
    p.moveTo(-0.22, -0.1).lineTo(-0.22, 0.2).stroke(0.028, 0x6b4a32);
    p.moveTo(0.22, -0.1).lineTo(0.22, 0.2).stroke(0.028, 0x6b4a32);
  } else if (id === "type") {
    p.roundRect(-0.24, -0.18, 0.1, 0.36, 0.03).fill(0xf3ead7);
    p.roundRect(-0.06, -0.08, 0.1, 0.26, 0.03).fill(0xf0d78c);
    p.roundRect(0.12, -0.22, 0.12, 0.4, 0.03).fill(0xf4ecdc);
  } else {
    p.circle(-0.12, 0, 0.13).stroke(0.045, 0xe07a5f);
    p.circle(0.12, 0, 0.13).stroke(0.045, 0xe07a5f);
    p.moveTo(0, -0.12).lineTo(0, 0.12).stroke(0.04, 0xc45a48);
    p.moveTo(0.2, -0.16).q(0.34, 0, 0.18, 0.18).stroke(0.016, 0xf0d78c);
  }
  return p.done();
}

function drawStation() {
  const node = new Container();
  const p = ink();
  p.ellipse(0, 0.18, 1.2, 0.26).fill(0x101820);
  p.roundRect(-0.32, -0.42, 0.48, 0.58, 0.06).fill(0x24343f);
  p.rect(0.22, -0.78, 0.06, 0.72).fill(0xd7c4a4);
  p.circle(0.25, -0.84, 0.08).fill(0xf0d78c);
  node.addChild(p.done());
  const orbs: Graphics[] = [];
  [-0.55, -0.18, 0.2, 0.58].forEach((x, i) => {
    const colors = [0xff7aa2, 0x7ee0ff, 0xf0d78c, 0xb6ff6a];
    const orbInk = ink();
    orbInk.circle(0, 0, 0.1).fill(colors[i]);
    const orb = orbInk.done();
    orb.position.set(x, 0.02);
    orb.blendMode = "add";
    node.addChild(orb);
    orbs.push(orb);
  });
  return { node, orbs };
}

function drawDiver() {
  const node = new Container();
  node.addChild(drawRock(0x2a343c, 1.35));
  const card = ink();
  card.roundRect(-0.42, -1.2, 0.84, 1.08, 0.05).fill(0xf3ead7);
  card.circle(0, -0.82, 0.16).stroke(0.02, 0x1b2a32);
  card.circle(0, -0.82, 0.055).fill(0x1d4e89);
  card.roundRect(-0.16, -0.52, 0.32, 0.28, 0.1).fill(0x16384c);
  card.moveTo(-0.22, -0.12).lineTo(0.22, -0.12).stroke(0.014, 0x8d5b45);
  card.moveTo(-0.22, 0).lineTo(0.12, 0).stroke(0.014, 0x8d5b45);
  node.addChild(card.done());
  return node;
}

function drawStrangeRock() {
  const node = new Container();
  const p = ink();
  p.moveTo(-0.42, 0.16).q(-0.52, -0.22, -0.05, -0.38).q(0.42, -0.3, 0.44, 0.06).q(0.2, 0.26, -0.08, 0.2).close().fill(0x2a3338);
  node.addChild(p.done());
  const eyeInk = ink();
  eyeInk.circle(0.08, -0.04, 0.07).fill(0xf3ead7);
  eyeInk.circle(0.1, -0.04, 0.03).fill(0x1a120e);
  const eye = eyeInk.done();
  node.addChild(eye);
  return { node, eye };
}

function drawWhale() {
  const p = ink();
  p.ellipse(0, 0, 2.4, 0.5).fill({ color: 0x10202c, alpha: 0.94 });
  p.moveTo(-2.1, 0).lineTo(-3.15, 0.45).q(-2.55, 0.05, -3.1, -0.34).close().fill(0x10202c);
  p.ellipse(0.15, -0.32, 0.72, 0.18).fill(0x183044);
  p.circle(1.6, -0.06, 0.07).fill(0xf4ecdc);
  p.circle(1.62, -0.06, 0.028).fill(0x1a120e);
  return p.done();
}

function drawRay() {
  const p = ink();
  p.moveTo(1.2, 0).q(0.15, -0.7, -0.15, 0).q(0.15, 0.7, 1.2, 0).fill({ color: 0x163246, alpha: 0.92 });
  p.moveTo(-0.15, 0).lineTo(-0.95, 0.24).q(-0.7, 0, -0.95, -0.24).close().fill(0x163246);
  return p.done();
}

function drawSub() {
  const node = new Container();
  const beamInk = ink();
  beamInk.moveTo(1.25, -0.05).lineTo(3.8, -0.9).lineTo(3.8, 0.75).close().fill({ color: 0xfff1c4, alpha: 0.18 });
  const beam = beamInk.done();
  beam.blendMode = "add";
  const p = ink();
  p.roundRect(-1.25, -0.28, 2.2, 0.56, 0.28).fill(0x1c2830);
  p.circle(0.9, 0.02, 0.22).fill(0x2a3c48);
  p.rect(0.12, -0.58, 0.07, 0.36).fill(0xc9a227);
  p.circle(-0.4, -0.02, 0.07).fill(0x9ee0d6);
  node.addChild(beam, p.done());
  return node;
}

function drawShafts() {
  const g = new Graphics();
  [16, 38, 61, 84].forEach((x, i) => {
    const lean = -8 + i * 4;
    g.moveTo(x, -2)
      .lineTo(x + 5, -2)
      .lineTo(x + lean + 14, 78)
      .lineTo(x + lean, 78)
      .closePath()
      .fill({ color: 0xfff6e0, alpha: 0.1 });
  });
  g.blendMode = "add";
  return g;
}

type Bob = { id: string; node: Container; anchor: Anchor; x: number; y: number; phase: number; amp: number };
type Fish = {
  node: Container;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeY: number;
  phase: number;
  amp: number;
  speed: number;
  dir: number;
  size: number;
  id: number;
};
type Bubble = { node: Graphics; x: number; y: number; v: number; wob: number };

const THUMBS = [
  mediaUrl("media/thumbs/sjwd-welcome.webp"),
  mediaUrl("media/thumbs/sjwd-map.webp"),
  mediaUrl("media/thumbs/imagine-11.webp"),
  mediaUrl("media/thumbs/imagine-01.webp"),
  mediaUrl("media/thumbs/frog-machine.webp"),
  mediaUrl("media/thumbs/plush-juno.webp"),
  mediaUrl("media/thumbs/plush-jamie.webp"),
  mediaUrl("media/thumbs/personal-02.webp"),
  ...personalTentacles.map((item) => item.thumb),
];

export async function mountSea(host: HTMLElement, hooks: SeaHooks) {
  const app = new Application();
  await app.init({
    background: 0x0c4e66,
    antialias: !runtime.mobile,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, runtime.mobile ? 1.25 : 1.6),
    resizeTo: window,
    preference: "webgl",
    powerPreference: "high-performance",
  });
  app.canvas.className = "sea";
  app.canvas.setAttribute("aria-hidden", "true");
  host.appendChild(app.canvas);

  let dead = false;
  const destroy = () => {
    if (dead) return;
    dead = true;
    runtime.ripple = null;
    runtime.anchors.clear();
    app.destroy({ removeView: true }, { children: true });
  };

  const loaded = new Map<string, Texture>();
  await Promise.all(
    THUMBS.map(async (url) => {
      try {
        loaded.set(url, await Assets.load<Texture>(url));
      } catch {
        /* a missing print stays a cream board */
      }
    }),
  );
  if (dead) return destroy;

  const tex = (url: string) => loaded.get(url);

  const bg = new Sprite(Texture.WHITE);
  bg.eventMode = "none";
  const wash = new Sprite(washTexture());
  wash.eventMode = "none";
  const shadeVeil = new Sprite(Texture.WHITE);
  shadeVeil.tint = 0x02060c;
  shadeVeil.eventMode = "none";
  const shaft = drawShafts();
  shaft.eventMode = "none";

  const far = new Container();
  far.eventMode = "none";
  const world = new Container();
  world.eventMode = "passive";
  const fx = new Container();
  fx.eventMode = "none";

  app.stage.eventMode = "static";
  app.stage.addChild(bg, wash, far, world, shadeVeil, shaft, fx);
  app.stage.on("pointerdown", (event) => {
    const w = Math.max(1, app.screen.width);
    const h = Math.max(1, app.screen.height);
    runtime.pointerOn = true;
    runtime.pointerNdc.set((event.global.x / w) * 2 - 1, -(event.global.y / h) * 2 + 1);
    runtime.wantsRipple = true;
  });

  const ridges: [number, number, number][] = [
    [-1.2, 2.4, 4.2],
    [1.4, -8.5, 4.6],
    [-0.6, -18.5, 5],
    [0.8, -29, 4.8],
    [0, -37.2, 5.2],
  ];
  for (const [x, y, rx] of ridges) {
    const hill = ink();
    hill.ellipse(0, 0.4, rx, 0.55).fill({ color: 0x042433, alpha: 0.45 });
    const g = hill.done();
    g.position.set(x, -y);
    far.addChild(g);
  }

  const sands: [number, number, number, number][] = [
    [-1.6, -2.2, 1.7, 0xc6b496],
    [1.5, -7, 1.55, 0xb09a7c],
    [-1.4, -11.8, 1.5, 0x8d8070],
    [1.2, -16.4, 1.6, 0x7a7268],
    [-0.2, -21, 1.7, 0x5c6366],
    [0.3, -26.2, 1.45, 0x3e4a50],
    [0, -31, 1.5, 0x243038],
    [0.1, -36.8, 1.7, 0x141c22],
  ];
  for (const [x, y, rx, color] of sands) {
    const bed = drawSand(rx, color);
    bed.position.set(x, -y);
    world.addChild(bed);
  }

  const surfaceInk = ink();
  surfaceInk.moveTo(-8, 0);
  for (let i = 0; i <= 24; i += 1) {
    const x = -8 + (16 * i) / 24;
    surfaceInk.lineTo(x, Math.sin(i * 0.55) * 0.1);
  }
  surfaceInk.lineTo(8, 0.7).lineTo(-8, 0.7).close().fill({ color: 0xd7fff4, alpha: 0.16 });
  const surface = surfaceInk.done();
  surface.position.set(0, -7.05);
  world.addChild(surface);

  const kelpSpecs: [number, number, number, number, number][] = [
    [-3.3, 5.5, 2.6, 0.16, 0x1f7a52],
    [-2.5, 4.7, 3.2, 0.12, 0x166246],
    [2.7, 5.1, 2.4, 0.18, 0x248a58],
    [3.4, 3.8, 2.9, 0.14, 0x0f4e3a],
    [-3.5, -0.4, 2.5, 0.15, 0x1c6b4a],
    [3.1, -1.8, 2.8, 0.13, 0x14704c],
    [-2.8, -3.4, 2.2, 0.17, 0x1e7a55],
    [2.4, -4.6, 2.6, 0.12, 0x0e4e3c],
    [-3.4, -8.2, 2.4, 0.16, 0x145e48],
    [3.3, -9.4, 2.7, 0.14, 0x1a6844],
    [-3.2, -13.2, 2.3, 0.15, 0x134e40],
    [2.8, -14.8, 2.5, 0.13, 0x1c5c48],
    [-3.5, -18.6, 2.2, 0.14, 0x143c38],
    [3.2, -20.8, 2.4, 0.16, 0x124038],
    [-2.8, -24.4, 2.1, 0.12, 0x0f3330],
    [2.6, -27.6, 2.2, 0.15, 0x123832],
    [-3.1, -32.4, 1.8, 0.13, 0x0e2c2c],
    [2.4, -35.6, 1.7, 0.14, 0x143434],
  ];
  const kelps: { node: Container; x: number; y: number; phase: number }[] = [];
  for (const [x, y, h, w, color] of kelpSpecs) {
    const node = kelpBlade(h, w, color);
    node.position.set(x, -y);
    node.eventMode = "none";
    world.addChild(node);
    kelps.push({ node, x, y: y + h * 0.45, phase: x * 1.7 + y });
  }

  const corals: [number, number, number, number][] = [
    [-1.5, -2.55, 0xd4846a, 1],
    [2.5, -2.2, 0xe6c27a, 0.75],
    [3.1, -6.8, 0xc46b5a, 0.9],
    [-3.1, -11.4, 0x2f6f6a, 1],
    [2.6, -16.2, 0xd08a62, 0.7],
    [-2.4, -21.6, 0x3d6a62, 0.85],
    [2.7, -31.1, 0x7dffc2, 1],
    [-2.3, -31.5, 0xd7a0ff, 0.8],
  ];
  for (const [x, y, color, scale] of corals) {
    const node = drawCoral(color, scale);
    node.position.set(x, -y);
    node.eventMode = "none";
    world.addChild(node);
  }

  const rocks: [number, number, number, number][] = [
    [-3.4, -2.2, 1.15, 0x5c6a72],
    [3.3, -6.9, 0.8, 0x4e5c64],
    [-3.6, -16.2, 1.2, 0x2c3840],
    [3.2, -26.1, 0.9, 0x243038],
    [-1.2, 3.4, 0.7, 0x6a5a48],
  ];
  for (const [x, y, scale, color] of rocks) {
    const node = drawRock(color, scale);
    node.position.set(x, -y);
    node.eventMode = "none";
    world.addChild(node);
  }

  const bobs: Bob[] = [];
  const place = (id: string, x: number, y: number, node: Container, amp = 0.05) => {
    node.position.set(x, -y);
    world.addChild(node);
    const anchor: Anchor = { x, y };
    runtime.anchors.set(id, anchor);
    const bob: Bob = { id, node, anchor, x, y, phase: x * 2 + y, amp };
    bobs.push(bob);
    return bob;
  };

  const pokeShell = (id: string) => {
    const now = performance.now();
    const taps = (shellTaps.get(id) ?? []).filter((t) => now - t < 1100);
    taps.push(now);
    shellTaps.set(id, taps);
    hooks.collectShell(id);
    if (taps.length >= 3 && !runtime.pearls.has(id)) {
      runtime.pearls.add(id);
      runtime.burstBubbles = 8;
      hooks.notify("A pearl. Unnecessary. Keep it.");
    }
  };

  const shellPearls: { id: string; pearl: Graphics }[] = [];
  const shellSpots: [string, number, number, number][] = [
    [shellIds[0], 2.7, 0.35, 0xf3ead7],
    [shellIds[1], -3.55, -2.15, 0xe7c3a4],
    [shellIds[2], -3.3, -11.7, 0xf0d78c],
    [shellIds[3], 0.55, -26.15, 0xf3ead7],
    [shellIds[4], -2.7, -36.85, 0xd7fff0],
  ];
  for (const [id, x, y, color] of shellSpots) {
    const shell = drawShell(color);
    hit(shell.node, new Circle(0, 0, 0.34), () => pokeShell(id), id);
    place(id, x, y, shell.node, 0.03);
    shellPearls.push({ id, pearl: shell.pearl });
  }

  const buoy = new Container();
  buoy.addChild(drawBuoy());
  place("buoy", 1.15, 4.05, buoy, 0.08);

  const bottle = new Container();
  bottle.addChild(drawBottle());
  hit(bottle, new Rectangle(-0.28, -0.5, 0.56, 0.95), () => hooks.openPanel("bottle"), "bottle");
  place("bottle", 3.15, 1.35, bottle, 0.08);

  const sjwd = projectById("sjwd");
  const imagine = projectById("imagine");
  const frog = projectById("frog");
  const plush = projectById("plush");
  const personal = projectById("personal");

  const hotbeds: { id: string; node: Container; base: number }[] = [];
  const lids: Graphics[] = [];

  if (sjwd) {
    const node = new Container();
    node.addChild(drawTower());
    const welcome = framed(tex(mediaUrl("media/thumbs/sjwd-welcome.webp")), 1.28);
    welcome.position.set(0.95, -0.35);
    welcome.rotation = -0.06;
    const map = framed(tex(mediaUrl("media/thumbs/sjwd-map.webp")), 1.05);
    map.position.set(1.15, 0.55);
    map.rotation = 0.08;
    node.addChild(welcome, map);
    const open = () => hooks.openProject(sjwd.id);
    hit(welcome, welcome.hitArea as Rectangle, open, sjwd.id);
    hit(map, map.hitArea as Rectangle, open, sjwd.id);
    hit(node, new Rectangle(-0.6, -1.5, 1.2, 1.8), open, sjwd.id);
    place(sjwd.id, -2.15, sjwd.y, node, 0.04);
    hotbeds.push({ id: sjwd.id, node, base: 1 });
  }

  if (imagine) {
    const node = new Container();
    const tables = ink();
    tables.roundRect(-0.7, 0.15, 1.3, 0.1, 0.03).fill(0xd7c4a4);
    tables.roundRect(-0.5, -0.15, 0.95, 0.1, 0.03).fill(0xe7d3b4);
    tables.roundRect(-0.32, -0.42, 0.6, 0.1, 0.03).fill(0xf0e0c4);
    tables.moveTo(-0.55, 0.25).lineTo(-0.55, 0.55).stroke(0.03, 0x6b4a32);
    tables.moveTo(0.45, 0.25).lineTo(0.45, 0.55).stroke(0.03, 0x6b4a32);
    const hero = framed(tex(mediaUrl("media/thumbs/imagine-11.webp")), 1.25);
    hero.position.set(-0.15, -0.15);
    hero.rotation = -0.04;
    const concept = framed(tex(mediaUrl("media/thumbs/imagine-01.webp")), 0.72);
    concept.position.set(0.95, -0.55);
    concept.rotation = 0.12;
    node.addChild(tables.done(), hero, concept);
    const open = () => hooks.openProject(imagine.id);
    hit(hero, hero.hitArea as Rectangle, open, imagine.id);
    hit(concept, concept.hitArea as Rectangle, open, imagine.id);
    hit(node, new Rectangle(-0.8, -0.9, 2.1, 1.7), open, imagine.id);
    place(imagine.id, 1.85, imagine.y, node, 0.035);
    hotbeds.push({ id: imagine.id, node, base: 1 });
  }

  if (frog) {
    const chest = drawChest();
    const print = framed(tex(mediaUrl("media/thumbs/frog-machine.webp")), 1.15);
    print.position.set(0.95, -0.45);
    print.rotation = -0.08;
    const node = new Container();
    node.addChild(chest.node, print);
    const open = () => hooks.openProject(frog.id);
    hit(chest.node, new Rectangle(-0.7, -0.7, 1.4, 1.15), open, frog.id);
    hit(print, print.hitArea as Rectangle, open, frog.id);
    place(frog.id, -1.85, frog.y, node, 0.04);
    hotbeds.push({ id: frog.id, node, base: 1 });
    lids.push(chest.lid);
  }

  if (plush) {
    const node = new Container();
    const dolls = ink();
    dolls.ellipse(-0.85, 0.15, 0.28, 0.34).fill(0x3a4e98);
    dolls.circle(-0.85, -0.22, 0.16).fill(0xf0d2b4);
    dolls.ellipse(0.95, 0.18, 0.26, 0.32).fill(0x6d8a58);
    dolls.circle(0.95, -0.18, 0.15).fill(0xf3ddc4);
    const juno = framed(tex(mediaUrl("media/thumbs/plush-juno.webp")), 1.05);
    juno.position.set(-0.35, -0.15);
    juno.rotation = -0.05;
    const jamie = framed(tex(mediaUrl("media/thumbs/plush-jamie.webp")), 1.02);
    jamie.position.set(0.45, 0.05);
    jamie.rotation = 0.06;
    node.addChild(dolls.done(), juno, jamie);
    const open = () => hooks.openProject(plush.id);
    hit(juno, juno.hitArea as Rectangle, open, plush.id);
    hit(jamie, jamie.hitArea as Rectangle, open, plush.id);
    place(plush.id, 1.7, plush.y, node, 0.05);
    hotbeds.push({ id: plush.id, node, base: 1 });
  }

  if (personal) {
    const octo = drawOctopus();
    personalTentacles.forEach((item, index) => {
      const tip = octo.tips[index];
      const print = framed(tex(item.thumb), runtime.mobile ? 0.62 : 0.78);
      print.position.set(tip.x, tip.y);
      print.rotation = (index - 2.5) * 0.08;
      octo.node.addChild(print);
      hit(print, print.hitArea as Rectangle, () => hooks.openProject(personal.id, item.slide), personal.id);
    });
    hit(octo.node, new Circle(0, 0, 0.7), () => hooks.openProject(personal.id, 0), personal.id);
    place(personal.id, -0.15, personal.y, octo.node, 0.05);
    hotbeds.push({ id: personal.id, node: octo.node, base: 1 });
  }

  const portrait = framed(tex(mediaUrl("media/thumbs/personal-02.webp")), 1.2);
  portrait.rotation = -0.08;
  hit(portrait, portrait.hitArea as Rectangle, () => hooks.openProject("personal", 1), "portrait");
  place("portrait", 1.15, -24.7, portrait, 0.03);
  hotbeds.push({ id: "portrait", node: portrait, base: 1 });

  const diver = drawDiver();
  hit(diver, new Rectangle(-0.55, -1.25, 1.1, 1.6), () => hooks.openPanel("about", { relic: "clemson" }), "diver");
  place("diver", -1.55, -25.55, diver, 0.02);

  const jellySpots: [number, number, number][] = [
    [-3.1, 3.4, 0xf2c9b4],
    [3.5, -4.2, 0xd7c4f2],
    [-3.4, -17.2, 0xf0d9a0],
    [2.6, -33.4, 0x9dffe0],
  ];
  const jellies: { id: string; node: Container; glow: Graphics; anchor: Anchor; y: number; phase: number }[] = [];
  jellySpots.forEach(([x, y, color], index) => {
    const jelly = drawJelly(color);
    const id = `jelly-${index}`;
    hit(jelly.node, jelly.node.hitArea as Circle, () => hooks.openPanel("jelly", { jelly: index }), id);
    const bob = place(id, x, y, jelly.node, 0);
    jellies.push({ id, node: jelly.node, glow: jelly.glow, anchor: bob.anchor, y, phase: index * 1.4 });
  });

  skills.forEach((skill, index) => {
    const ang = -1.15 + index * 0.46;
    const node = new Container();
    const halo = ink();
    halo.circle(0, 0, 0.42).fill({ color: 0x9ee0d6, alpha: 0.1 });
    node.addChild(halo.done(), drawSkill(skill.id));
    const id = `skill-${skill.id}`;
    hit(node, new Circle(0, 0, 0.42), () => hooks.openPanel("skills", { skill: skill.id }), id);
    place(id, Math.sin(ang) * 3.15, -30.55, node, 0.05);
    hotbeds.push({ id, node, base: 1 });
  });

  const station = drawStation();
  hit(station.node, new Circle(0, 0, 1.1), () => hooks.openPanel("contact"), "station");
  place("station", 0.2, -36.6, station.node, 0.03);

  const rock = drawStrangeRock();
  hit(rock.node, new Circle(0, 0, 0.5), () => {
    hooks.notify("The rock has an eye in it.");
    hooks.openPanel("rock");
  }, "rock");
  place("rock", 3.25, -34.15, rock.node, 0.02);

  const crabHome = { x: 1.35, y: -25.15 };
  const crab = drawCrab();
  const crabAnchor: Anchor = { x: crabHome.x, y: crabHome.y };
  runtime.anchors.set("crab", crabAnchor);
  world.addChild(crab.node);
  let crabOffset = 0;
  let crabTarget = 0;
  let crabSeen = 0;
  const crabClicks: number[] = [];
  crab.node.eventMode = "dynamic";
  crab.node.cursor = "pointer";
  crab.node.on("pointerover", () => {
    runtime.hover = "crab";
  });
  crab.node.on("pointerout", () => {
    if (runtime.hover === "crab") runtime.hover = "";
  });
  crab.node.on("pointertap", (event) => {
    event.stopPropagation();
    const now = performance.now();
    const recent = crabClicks.filter((t) => now - t < 1500);
    recent.push(now);
    crabClicks.length = 0;
    crabClicks.push(...recent);
    runtime.crabHop += 1;
    if (crabClicks.length >= 3) {
      runtime.crabStealUntil = now + 4600;
      crabClicks.length = 0;
      hooks.notify("The crab took the cursor. It will get bored.");
    }
  });

  const fish: Fish[] = [];
  const schools: { y: number; n: number; color: number; speed: number; glow?: boolean }[] = [
    { y: 5.5, n: 4, color: 0xf2d2a2, speed: 0.55 },
    { y: 3.6, n: 5, color: 0xf4b183, speed: 0.7 },
    { y: -0.6, n: 5, color: 0x7ec8c8, speed: 0.48 },
    { y: -5.4, n: 4, color: 0xe8d38a, speed: 0.42 },
    { y: -9.2, n: 4, color: 0xc98b6a, speed: 0.5 },
    { y: -14.4, n: 4, color: 0x8fd0c8, speed: 0.38 },
    { y: -19.2, n: 4, color: 0x6a8fbf, speed: 0.34 },
    { y: -23.8, n: 3, color: 0x9ec4d4, speed: 0.3 },
    { y: -29.2, n: 3, color: 0x9dffd2, speed: 0.26, glow: true },
    { y: -34.6, n: 3, color: 0xc7b6ff, speed: 0.22, glow: true },
  ];
  let fishId = 0;
  for (const school of schools) {
    const count = runtime.mobile ? Math.max(2, Math.ceil(school.n / 2)) : school.n;
    for (let i = 0; i < count; i += 1) {
      const id = fishId;
      fishId += 1;
      const node = drawFish(school.color, Boolean(school.glow), i + Math.round(school.y));
      const dir = school.y > -10 ? 1 : -1;
      const critter: Fish = {
        node,
        x: -4 + ((i * 1.7 + school.y) % 8),
        y: school.y,
        vx: 0,
        vy: 0,
        homeY: school.y + (i - count / 2) * 0.18,
        phase: i * 1.3 + school.y,
        amp: 0.18 + (i % 3) * 0.06,
        speed: school.speed * (0.85 + (i % 4) * 0.08),
        dir,
        size: 0.85 + (i % 3) * 0.12,
        id,
      };
      node.on("pointertap", (event) => {
        event.stopPropagation();
        if (runtime.followFish === id) {
          runtime.followFish = -1;
          hooks.notify("It lost interest.");
        } else {
          runtime.followFish = id;
          hooks.notify("This one is following you.");
        }
      });
      world.addChild(node);
      fish.push(critter);
    }
  }

  const bubbles: Bubble[] = [];
  const spawnBubble = (x: number, y: number, fast = false) => {
    const r = 0.045 + Math.random() * 0.05;
    const bubble = ink();
    bubble.circle(0, 0, r).stroke(0.012, 0xffffff, 0.7);
    bubble.circle(-r * 0.28, -r * 0.28, r * 0.28).fill({ color: 0xffffff, alpha: 0.4 });
    const node = bubble.done();
    node.eventMode = "none";
    world.addChild(node);
    bubbles.push({
      node,
      x,
      y,
      v: (fast ? 0.85 : 0.28) + Math.random() * 0.35,
      wob: Math.random() * Math.PI * 2,
    });
  };
  for (let i = 0; i < (runtime.mobile ? 10 : 20); i += 1) {
    spawnBubble(-3.5 + Math.random() * 7, 8 - Math.random() * 48);
  }

  const ripples: { node: Graphics; x: number; y: number; age: number; on: boolean }[] = [];
  for (let i = 0; i < 6; i += 1) {
    const ring = ink();
    ring.circle(0, 0, 1).stroke(0.045, 0xf4ecdc, 0.85);
    const node = ring.done();
    node.visible = false;
    node.eventMode = "none";
    fx.addChild(node);
    ripples.push({ node, x: 0, y: 0, age: 0, on: false });
  }
  runtime.ripple = (x, y) => {
    const slot = ripples.find((ring) => !ring.on) ?? ripples[0];
    slot.on = true;
    slot.age = 0;
    slot.x = x;
    slot.y = y;
    slot.node.visible = true;
  };

  let eventNode: Container | null = null;
  let eventAge = 0;
  let eventLife = 1;
  let nextEvent = performance.now() + 9000;

  const clearEvent = () => {
    eventNode?.destroy();
    eventNode = null;
  };
  const spawnEvent = () => {
    clearEvent();
    const roll = Math.random();
    const kind = roll < 0.34 ? "school" : roll < 0.58 ? "whale" : roll < 0.8 ? "ray" : "sub";
    const node = new Container();
    if (kind === "school") {
      for (let i = 0; i < 8; i += 1) {
        const fishlet = drawFish(0xf4ecdc, false, i);
        fishlet.position.set(i * 0.45, Math.sin(i) * 0.2);
        fishlet.scale.set(0.7);
        fishlet.eventMode = "none";
        node.addChild(fishlet);
      }
      eventLife = 9;
    } else if (kind === "whale") {
      node.addChild(drawWhale());
      eventLife = 16;
    } else if (kind === "ray") {
      node.addChild(drawRay());
      eventLife = 11;
    } else {
      node.addChild(drawSub());
      eventLife = 14;
    }
    node.eventMode = "none";
    world.addChild(node);
    eventNode = node;
    eventAge = 0;
  };

  let smooth = runtime.scroll;
  let cam = WORLD.camStart;
  let sway = 0;
  let look = 0;
  let clock = 0;

  const tick = (ticker: Ticker) => {
    if (dead) return;
    runtime.onFrame?.();
    const dt = Math.min(0.05, ticker.deltaMS / 1000);
    clock += runtime.reduced ? 0 : dt;
    const calm = runtime.reduced ? 7 : 2.6;
    smooth = damp(smooth, runtime.scroll, calm, dt);
    runtime.depth = smooth;
    const camTarget = lerp(WORLD.camStart, WORLD.camEnd, smooth);
    cam = damp(cam, camTarget, runtime.reduced ? 7 : 2.8, dt);
    runtime.camY = cam;
    const width = Math.max(1, app.screen.width);
    const height = Math.max(1, app.screen.height);
    const unit = runtime.mobile ? width / 6.4 : Math.min(width, height * 1.25) / 7.2;
    const px = runtime.pointerOn && !runtime.reduced ? runtime.pointerNdc.x : 0;
    const py = runtime.pointerOn && !runtime.reduced ? runtime.pointerNdc.y : 0;
    sway = damp(sway, px * unit * 0.42, 2.2, dt);
    look = damp(look, py * unit * 0.1, 2.2, dt);

    bg.tint = depthColor(smooth);
    bg.width = width;
    bg.height = height;
    wash.width = width;
    wash.height = height;
    shadeVeil.width = width;
    shadeVeil.height = height;
    shadeVeil.alpha = smooth * 0.38;
    shaft.scale.set(width / 100, height / 100);
    shaft.alpha = Math.max(0, 0.85 * (1 - smooth * 2.3));
    shaft.x = sway * 0.15;

    const originY = height * 0.46 + look;
    far.position.set(width / 2 + sway * 0.45, originY + cam * unit * 0.9);
    far.scale.set(unit * 0.9);
    world.position.set(width / 2 + sway, originY + cam * unit);
    world.scale.set(unit);
    fx.position.copyFrom(world.position);
    fx.scale.copyFrom(world.scale);

    const sx = (runtime.pointerNdc.x * 0.5 + 0.5) * width;
    const sy = (-runtime.pointerNdc.y * 0.5 + 0.5) * height;
    runtime.pointerWorld.set((sx - width / 2 - sway) / unit, cam - (sy - originY) / unit, 0);
    if (runtime.wantsRipple) {
      runtime.wantsRipple = false;
      runtime.ripple?.(runtime.pointerWorld.x, runtime.pointerWorld.y, 0);
    }
    if (runtime.burstBubbles > 0) {
      for (let i = 0; i < runtime.burstBubbles; i += 1) {
        spawnBubble(runtime.pointerWorld.x + (Math.random() - 0.5), runtime.pointerWorld.y - Math.random() * 0.4, true);
      }
      runtime.burstBubbles = 0;
    }

    const root = document.documentElement;
    root.style.setProperty("--depth", smooth.toFixed(4));
    root.style.setProperty("--depth-pct", `${(smooth * 100).toFixed(2)}%`);
    root.dataset.sunk = smooth > 0.13 ? "1" : "0";
    app.stage.hitArea = app.screen;

    for (const item of kelps) {
      const dist = Math.hypot(item.x - runtime.pointerWorld.x, item.y - runtime.pointerWorld.y);
      const push = runtime.pointerOn && !runtime.reduced ? Math.max(0, 1 - dist / 1.7) : 0;
      const sign = runtime.pointerWorld.x > item.x ? -1 : 1;
      const swayK = runtime.reduced ? 0 : Math.sin(clock * 0.7 + item.phase) * 0.09;
      item.node.rotation = swayK + sign * push * 0.5;
    }

    for (const item of bobs) {
      const bob = runtime.reduced ? 0 : Math.sin(clock * 1.15 + item.phase) * item.amp;
      const drop = runtime.mobile && item.id === "buoy" ? -1.15 : 0;
      item.anchor.x = item.x;
      item.anchor.y = item.y + drop + bob;
      item.node.position.set(item.anchor.x, -item.anchor.y);
    }

    for (const bed of hotbeds) {
      const hot = runtime.hover === bed.id;
      const target = bed.base * (hot ? 1.045 : 1);
      bed.node.scale.set(damp(bed.node.scale.x, target, 6, dt));
    }
    for (const lid of lids) {
      const openLid = runtime.hover === "frog" ? -0.85 : -0.05;
      lid.rotation = damp(lid.rotation, openLid, runtime.reduced ? 8 : 4, dt);
    }

    for (const shell of shellPearls) shell.pearl.visible = runtime.pearls.has(shell.id);

    for (const jelly of jellies) {
      const bob = runtime.reduced ? 0 : Math.sin(clock * 0.85 + jelly.phase) * 0.14;
      jelly.anchor.y = jelly.y + bob;
      jelly.node.position.y = -jelly.anchor.y;
      jelly.node.rotation = runtime.reduced ? 0 : Math.sin(clock * 0.6 + jelly.phase) * 0.06;
      jelly.glow.alpha = 0.65 + (runtime.reduced ? 0 : Math.sin(clock * 2 + jelly.phase) * 0.35);
      jelly.glow.scale.set((runtime.hover === jelly.id ? 1.25 : 1) / U);
    }

    if (runtime.crabHop !== crabSeen) {
      crabSeen = runtime.crabHop;
      crabTarget = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.1);
    }
    crabOffset = damp(crabOffset, crabTarget, runtime.reduced ? 1.2 : 2.8, dt);
    crabAnchor.x = crabHome.x + crabOffset;
    crabAnchor.y = crabHome.y + (runtime.reduced ? 0 : Math.sin(clock * 2) * 0.03);
    crab.node.position.set(crabAnchor.x, -crabAnchor.y);
    crab.node.scale.x = crabOffset < crabTarget ? 1 : -1;
    const hurry = Math.min(1, Math.abs(crabTarget - crabOffset) * 2);
    crab.legs.rotation = runtime.reduced ? 0 : Math.sin(clock * 14) * 0.18 * hurry;

    station.orbs.forEach((orb, i) => {
      const pulse = 0.85 + (runtime.reduced ? 0 : Math.sin(clock * 2.2 + i) * 0.2);
      orb.alpha = 0.45 + (runtime.reduced ? 0 : Math.sin(clock * 2.2 + i) * 0.4);
      orb.scale.set(pulse / U);
    });
    rock.eye.scale.set((runtime.hover === "rock" ? 1.35 : 1) / U);

    for (const critter of fish) {
      const dx = critter.x - runtime.pointerWorld.x;
      const dy = critter.y - runtime.pointerWorld.y;
      const dist = Math.hypot(dx, dy);
      if (runtime.pointerOn && !runtime.reduced && runtime.followFish !== critter.id && dist < 1.7 && dist > 0.001) {
        critter.vx += (dx / dist) * 4.2 * dt;
        critter.vy += (dy / dist) * 4.2 * dt;
      }
      critter.vx *= Math.exp(-2.4 * dt);
      critter.vy *= Math.exp(-2.4 * dt);
      if (runtime.followFish === critter.id) {
        critter.x += (runtime.pointerWorld.x - 0.45 * critter.dir - critter.x) * Math.min(1, dt * 2.4);
        critter.y += (runtime.pointerWorld.y - 0.2 - critter.y) * Math.min(1, dt * 2.4);
        if (Math.abs(runtime.pointerWorld.x - critter.x) > 0.25) {
          critter.dir = runtime.pointerWorld.x > critter.x ? 1 : -1;
        }
      } else {
        const pace = runtime.reduced ? 0.08 : 1;
        critter.x += critter.dir * critter.speed * pace * dt + critter.vx * dt;
        const home =
          critter.homeY + (runtime.reduced ? 0 : Math.sin(clock * 0.8 + critter.phase) * critter.amp);
        critter.y += (home - critter.y) * Math.min(1, dt * 0.9) + critter.vy * dt;
        if (critter.dir > 0 && critter.x > 6.2) critter.x = -6.2;
        if (critter.dir < 0 && critter.x < -6.2) critter.x = 6.2;
      }
      critter.node.position.set(critter.x, -critter.y);
      critter.node.scale.set(critter.dir * critter.size, critter.size);
      critter.node.rotation = critter.vy * 0.12;
    }

    for (const bubble of bubbles) {
      if (!runtime.reduced) {
        bubble.y += bubble.v * dt;
        bubble.x += Math.sin(clock * 1.4 + bubble.wob) * 0.15 * dt;
      }
      if (bubble.y > cam + 4) {
        bubble.y = cam - 4 - Math.random();
        bubble.x = -3.5 + Math.random() * 7;
      }
      bubble.node.position.set(bubble.x, -bubble.y);
    }
    if (bubbles.length > 80) {
      const extra = bubbles.splice(0, bubbles.length - 70);
      for (const bubble of extra) bubble.node.destroy();
    }

    for (const ring of ripples) {
      if (!ring.on) continue;
      ring.age += dt;
      const k = ring.age / 1.15;
      if (k >= 1) {
        ring.on = false;
        ring.node.visible = false;
        continue;
      }
      ring.node.position.set(ring.x, -ring.y);
      ring.node.scale.set((0.15 + k * 1.35) / U);
      ring.node.alpha = (1 - k) * 0.6;
    }

    if (!runtime.reduced && !runtime.mobile) {
      if (!eventNode && performance.now() > nextEvent) spawnEvent();
      if (eventNode) {
        eventAge += dt;
        const p = eventAge / eventLife;
        const y = cam - 0.15;
        eventNode.position.set(lerp(-8.5, 8.5, p), -y);
        eventNode.alpha = p < 0.08 ? p / 0.08 : p > 0.88 ? (1 - p) / 0.12 : 1;
        if (p >= 1) {
          clearEvent();
          nextEvent = performance.now() + 14000 + Math.random() * 16000;
        }
      }
    }

    runtime.anchors.forEach((anchor, id) => {
      const x = width / 2 + sway + anchor.x * unit;
      const y = originY + (cam - anchor.y) * unit;
      if (id === "crab") {
        runtime.crabScreen.x = x;
        runtime.crabScreen.y = y;
      }
      const el = runtime.labelEls.get(id);
      if (!el) return;
      const quiet = id.startsWith("shell");
      const range = quiet ? 4.4 : id === "buoy" ? 7 : 8.2;
      const dy = Math.abs(anchor.y - cam);
      const visible = dy < range;
      const fade = visible ? Math.min(1, (range - dy) / 2.4) : 0;
      const hot = runtime.hover === id;
      const shift = el.dataset.shift || "-128%";
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${shift})`;
      el.style.opacity = hot ? "1" : fade.toFixed(3);
      const passive = el.classList.contains("relic") || el.classList.contains("buoy-sign");
      el.style.pointerEvents = !passive && (visible || hot) ? "auto" : "none";
    });
  };

  app.ticker.add(tick);
  return destroy;
}
