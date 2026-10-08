import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  Line,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PointsMaterial,
  Shape,
  SphereGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type Points,
} from "three";
import { runtime } from "../runtime";
import { useUI } from "../ui/state";
import { ignoreRaycast, toon } from "./materials";

type Fish = {
  home: Vector3;
  pos: Vector3;
  vel: Vector3;
  phase: number;
  scale: number;
  school: boolean;
};

const FISH_COLORS = ["#f0d7a8", "#e08a6d", "#e7eef0", "#f3e7c2", "#8fc4be", "#e7b7b4", "#f6e7a4", "#c9d6cf"];
const BIO_COLORS = ["#9dffe0", "#c7c2ff", "#f2a8ff"];

function makeFishGeometry() {
  const shape = new Shape();
  shape.moveTo(0.62, 0);
  shape.bezierCurveTo(0.4, 0.24, 0.02, 0.2, -0.2, 0.1);
  shape.lineTo(-0.56, 0.34);
  shape.lineTo(-0.32, 0.02);
  shape.lineTo(-0.58, -0.3);
  shape.lineTo(-0.2, -0.1);
  shape.bezierCurveTo(0.04, -0.22, 0.4, -0.2, 0.62, 0);
  const geo = new ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.02,
    bevelSegments: 1,
    curveSegments: 6,
  });
  geo.translate(0, 0, -0.08);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function moteTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.22)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

function Jelly({
  index,
  position,
  color,
}: {
  index: number;
  position: [number, number, number];
  color: string;
}) {
  const id = `jelly-${index}`;
  const group = useRef<Group>(null);
  const { openPanel } = useUI();
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.72,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.18,
        depthWrite: false,
      }),
    [color],
  );
  const lines = useMemo(() => {
    return Array.from({ length: 7 }, () => {
      const geo = new BufferGeometry();
      geo.setAttribute("position", new BufferAttribute(new Float32Array(12 * 3), 3));
      return new Line(geo, new LineBasicMaterial({ color, transparent: true, opacity: 0.65 }));
    });
  }, [color]);

  useEffect(() => {
    if (group.current) runtime.anchors.set(id, group.current);
    return () => {
      runtime.anchors.delete(id);
    };
  }, [id]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const amp = runtime.reduced ? 0.04 : 0.38;
    if (group.current) {
      group.current.position.set(
        position[0] + Math.sin(t * 0.22 + index) * 0.25,
        position[1] + Math.sin(t * 0.45 + index * 1.7) * amp,
        position[2],
      );
    }
    const hot = runtime.hover === id;
    material.emissiveIntensity = hot ? 1.15 : 0.16;
    lines.forEach((line, li) => {
      const attr = line.geometry.getAttribute("position");
      const pts = attr.count;
      for (let p = 0; p < pts; p += 1) {
        const f = p / (pts - 1);
        const ang = (li / lines.length) * Math.PI * 2;
        const radius = 0.16 + f * 0.05;
        const wave = runtime.reduced ? 0 : Math.sin(t * 1.5 + li + f * 5) * 0.1 * f;
        attr.setXYZ(p, Math.cos(ang) * radius + wave, -0.05 - f * (hot ? 1.25 : 0.95), Math.sin(ang) * radius);
      }
      attr.needsUpdate = true;
    });
  });

  return (
    <group ref={group} position={position}>
      <mesh
        material={material}
        onClick={(event) => {
          event.stopPropagation();
          openPanel("jelly", { jelly: index });
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          runtime.hover = id;
        }}
        onPointerOut={() => {
          if (runtime.hover === id) runtime.hover = "";
        }}
      >
        <sphereGeometry args={[0.42, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
      </mesh>
      <mesh position={[0, -0.02, 0]} raycast={ignoreRaycast}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

export function Life() {
  const mobile = runtime.mobile;
  const count = mobile ? 18 : 36;
  const schoolCount = mobile ? 8 : 12;
  const { notify } = useUI();
  const fishGeo = useMemo(() => makeFishGeometry(), []);
  const fishMat = useMemo(() => toon("#ffffff"), []);
  const eyeGeo = useMemo(() => new SphereGeometry(0.045, 8, 8), []);
  const eyeMat = useMemo(() => new MeshBasicMaterial({ color: "#1a120e" }), []);
  const bubbleGeo = useMemo(() => new SphereGeometry(1, 10, 8), []);
  const mesh = useRef<InstancedMesh>(null);
  const eyes = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const eyeDummy = useMemo(() => new Object3D(), []);
  const eyeOffset = useMemo(() => new Vector3(), []);

  const fish = useMemo<Fish[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const school = i >= count - schoolCount;
      const y = school ? -8 : MathUtils.randFloat(-37, 5.2);
      return {
        home: new Vector3(MathUtils.randFloat(-6.5, 6.5), y, MathUtils.randFloat(-2.2, 1.6)),
        pos: new Vector3(MathUtils.randFloat(-6.5, 6.5), y, MathUtils.randFloat(-2, 1.4)),
        vel: new Vector3(),
        phase: Math.random() * Math.PI * 2,
        scale: MathUtils.randFloat(0.55, 1.15),
        school,
      };
    });
  }, [count, schoolCount]);

  useEffect(() => {
    const inst = mesh.current;
    if (!inst) return;
    fish.forEach((item, i) => {
      const deep = item.home.y < -28;
      const palette = deep ? BIO_COLORS : FISH_COLORS;
      const color = new Color(palette[i % palette.length]);
      if (deep) color.multiplyScalar(0.9);
      inst.setColorAt(i, color);
    });
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [fish]);

  const bubbles = useMemo(
    () =>
      Array.from({ length: mobile ? 16 : 34 }, () => ({
        x: MathUtils.randFloat(-7, 7),
        y: MathUtils.randFloat(-38, 6),
        z: MathUtils.randFloat(-2, 2),
        s: MathUtils.randFloat(0.035, 0.12),
        speed: MathUtils.randFloat(0.18, 0.55),
        wobble: Math.random() * Math.PI * 2,
      })),
    [mobile],
  );
  const bubbleMesh = useRef<InstancedMesh>(null);
  const bubbleMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#f7fffd",
        transparent: true,
        opacity: 0.32,
        roughness: 0.04,
        depthWrite: false,
      }),
    [],
  );

  const moteCount = mobile ? 70 : 150;
  const motes = useMemo(() => {
    const positions = new Float32Array(moteCount * 3);
    const home = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i += 1) {
      home[i * 3] = MathUtils.randFloat(-8, 8);
      home[i * 3 + 1] = MathUtils.randFloat(-38, 7);
      home[i * 3 + 2] = MathUtils.randFloat(-3, 2);
      positions[i * 3] = home[i * 3];
      positions[i * 3 + 1] = home[i * 3 + 1];
      positions[i * 3 + 2] = home[i * 3 + 2];
    }
    return { positions, home };
  }, [moteCount]);
  const points = useRef<Points>(null);
  const moteMat = useMemo(
    () =>
      new PointsMaterial({
        map: moteTexture(),
        color: "#d7f3ea",
        size: mobile ? 0.07 : 0.085,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [mobile],
  );

  const event = useRef({ name: "idle", t: 0, dur: 0, next: 9 });
  const whale = useRef<Group>(null);
  const ray = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const sub = useRef<Group>(null);
  const whaleMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#10283a",
        transparent: true,
        opacity: 0,
        roughness: 1,
      }),
    [],
  );

  const ripples = useRef<{ x: number; y: number; z: number; age: number }[]>([]);
  const rippleMeshes = useRef<Mesh[]>([]);
  useEffect(() => {
    runtime.ripple = (x, y, z) => {
      ripples.current.push({ x, y, z, age: 0 });
      if (ripples.current.length > 5) ripples.current.shift();
      runtime.burstBubbles = 5;
    };
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);
    const pointer = runtime.pointerWorld;
    const inst = mesh.current;
    const eyeInst = eyes.current;
    if (!inst || !eyeInst) return;

    const ev = event.current;
    if (!runtime.reduced) {
      ev.t += step;
      if (ev.name === "idle" && ev.t > ev.next) {
        const pool = ["school", "bubbles", "ray", "shadow"];
        if (!runtime.mobile && runtime.depth > 0.28 && runtime.depth < 0.82) pool.push("whale");
        if (runtime.depth > 0.62) pool.push("light");
        ev.name = pool[Math.floor(Math.random() * pool.length)];
        ev.t = 0;
        ev.dur = ev.name === "whale" ? 16 : ev.name === "school" ? 7.5 : ev.name === "light" ? 11 : 8;
      } else if (ev.name !== "idle" && ev.t > ev.dur) {
        ev.name = "idle";
        ev.t = 0;
        ev.next = 14 + Math.random() * 16;
      }
    }

    fish.forEach((item, i) => {
      if (item.school) {
        const playing = ev.name === "school";
        const p = playing ? ev.t / ev.dur : 0;
        const lane = (i % 5) - 2;
        const x = playing ? -18 + p * 38 + (i % 3) * 0.35 : 40;
        const y = runtime.camY + lane * 0.32;
        item.pos.set(x, y, -0.4 + (i % 4) * 0.25);
        dummy.position.copy(item.pos);
        dummy.lookAt(x + 1, y, item.pos.z);
        dummy.scale.setScalar(item.scale * 0.85);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        eyeOffset.set(0, 0.05, 0.32).applyQuaternion(dummy.quaternion);
        eyeDummy.position.copy(item.pos).add(eyeOffset);
        eyeDummy.scale.setScalar(item.scale);
        eyeDummy.updateMatrix();
        eyeInst.setMatrixAt(i, eyeDummy.matrix);
        return;
      }

      const follow = runtime.followFish === i;
      const tx = item.home.x + Math.sin(t * 0.23 + item.phase) * 1.5;
      const ty = item.home.y + Math.sin(t * 0.17 + item.phase * 1.3) * 0.35;
      const tz = item.home.z + Math.cos(t * 0.19 + item.phase) * 0.55;
      let targetX = follow ? pointer.x : tx;
      let targetY = follow ? pointer.y : ty;
      const targetZ = follow ? 0.8 : tz;
      if (!follow && runtime.pointerOn && !runtime.reduced) {
        const dx = item.pos.x - pointer.x;
        const dy = item.pos.y - pointer.y;
        const dz = item.pos.z - pointer.z;
        const dist = Math.hypot(dx, dy, dz) || 0.001;
        if (dist < 2.5) {
          const force = ((2.5 - dist) / 2.5) * 2.4;
          targetX += (dx / dist) * force;
          targetY += (dy / dist) * force * 0.6;
        }
      }
      const ease = follow ? 0.045 : 0.02;
      item.vel.x += (targetX - item.pos.x) * ease;
      item.vel.y += (targetY - item.pos.y) * ease;
      item.vel.z += (targetZ - item.pos.z) * ease;
      item.vel.multiplyScalar(0.88);
      item.pos.addScaledVector(item.vel, 1);
      dummy.position.copy(item.pos);
      const moving = item.vel.lengthSq() > 0.00001;
      if (moving) dummy.lookAt(item.pos.x + item.vel.x, item.pos.y + item.vel.y, item.pos.z + item.vel.z);
      else dummy.lookAt(item.pos.x, item.pos.y, item.pos.z + 1);
      dummy.rotateZ(Math.sin(t * 5 + item.phase) * (runtime.reduced ? 0 : 0.12));
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      eyeOffset.set(0, 0.055, 0.33).applyQuaternion(dummy.quaternion);
      eyeDummy.position.copy(item.pos).add(eyeOffset);
      eyeDummy.scale.setScalar(item.scale * 0.9);
      eyeDummy.updateMatrix();
      eyeInst.setMatrixAt(i, eyeDummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
    eyeInst.instanceMatrix.needsUpdate = true;

    const bubbleInst = bubbleMesh.current;
    if (bubbleInst) {
      let bursts = runtime.burstBubbles;
      bubbles.forEach((bubble, i) => {
        if (bursts > 0 && i < 8) {
          bubble.x = pointer.x + MathUtils.randFloatSpread(0.4);
          bubble.y = pointer.y;
          bubble.z = pointer.z;
          bursts -= 1;
        }
        const boost = ev.name === "bubbles" ? 2.3 : 1;
        bubble.y += bubble.speed * step * boost * (runtime.reduced ? 0.25 : 1);
        bubble.x += Math.sin(t + bubble.wobble) * 0.15 * step;
        if (runtime.pointerOn && !runtime.reduced) {
          const dx = bubble.x - pointer.x;
          const dy = bubble.y - pointer.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist < 1.7) bubble.x += (dx / dist) * 0.8 * step;
        }
        if (bubble.y > runtime.camY + 7) {
          bubble.y = runtime.camY - 9;
          bubble.x = MathUtils.randFloat(-7, 7);
        }
        dummy.position.set(bubble.x, bubble.y, bubble.z);
        dummy.scale.setScalar(bubble.s);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        bubbleInst.setMatrixAt(i, dummy.matrix);
      });
      runtime.burstBubbles = 0;
      bubbleInst.instanceMatrix.needsUpdate = true;
    }

    const attr = points.current?.geometry.getAttribute("position");
    if (attr) {
      for (let i = 0; i < moteCount; i += 1) {
        const i3 = i * 3;
        let x = motes.positions[i3];
        let y = motes.positions[i3 + 1];
        let z = motes.positions[i3 + 2];
        y += Math.sin(t * 0.3 + motes.home[i3]) * 0.004;
        x += Math.cos(t * 0.2 + i) * 0.003;
        if (runtime.pointerOn && !runtime.reduced) {
          const dx = pointer.x - x;
          const dy = pointer.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist < 4.5 && dist > 0.05) {
            x += dx * 0.004;
            y += dy * 0.004;
          }
        }
        if (y > 8) y = -38;
        motes.positions[i3] = x;
        motes.positions[i3 + 1] = y;
        motes.positions[i3 + 2] = z;
        attr.setXYZ(i, x, y, z);
      }
      attr.needsUpdate = true;
    }

    const p = ev.name === "idle" ? 0 : ev.t / ev.dur;
    const fade = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
    if (whale.current) {
      const show = ev.name === "whale";
      whale.current.visible = show;
      if (show) {
        whale.current.position.set(-30 + p * 60, runtime.camY - 0.4, -14);
        whaleMat.opacity = 0.95 * fade;
      }
    }
    if (ray.current) {
      const show = ev.name === "ray";
      ray.current.visible = show;
      if (show) ray.current.position.set(-22 + p * 44, runtime.camY + 1.7, -2);
    }
    if (shadow.current) {
      const show = ev.name === "shadow";
      shadow.current.visible = show;
      const mat = shadow.current.material as MeshBasicMaterial;
      if (show) {
        shadow.current.position.set(-10 + p * 22, runtime.camY + 2.4, -1);
        mat.opacity = 0.28 * fade;
      }
    }
    if (sub.current) {
      const show = ev.name === "light";
      sub.current.visible = show;
      if (show) sub.current.position.set(16 - p * 28, runtime.camY + 0.4, -11);
    }

    ripples.current.forEach((ripple, i) => {
      ripple.age += step;
      const ring = rippleMeshes.current[i];
      if (!ring) return;
      const k = ripple.age / 1.15;
      ring.visible = k < 1;
      ring.position.set(ripple.x, ripple.y, ripple.z);
      ring.scale.setScalar(0.15 + k * 2.4);
      const mat = ring.material as MeshBasicMaterial;
      mat.opacity = (1 - k) * 0.5;
    });
  });

  const onFish = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const id = event.instanceId;
    if (typeof id !== "number" || id >= count - schoolCount) return;
    if (runtime.followFish === id) {
      runtime.followFish = -1;
      notify("It lost interest.");
    } else {
      runtime.followFish = id;
      notify("This one is following you.");
    }
  };

  return (
    <group>
      <instancedMesh ref={mesh} args={[fishGeo, fishMat, count]} onClick={onFish} />
      <instancedMesh ref={eyes} args={[eyeGeo, eyeMat, count]} raycast={ignoreRaycast} />

      <instancedMesh ref={bubbleMesh} args={[bubbleGeo, bubbleMat, bubbles.length]} raycast={ignoreRaycast} />

      <points ref={points} raycast={ignoreRaycast} material={moteMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motes.positions, 3]} />
        </bufferGeometry>
      </points>

      <Jelly index={0} position={[-3.1, 3.4, -0.6]} color="#f2c9b4" />
      <Jelly index={1} position={[3.5, -4.2, -1]} color="#d7c4f2" />
      <Jelly index={2} position={[-3.4, -17.2, -0.8]} color="#f0d9a0" />
      <Jelly index={3} position={[2.6, -33.4, -1.1]} color="#9dffe0" />

      <group ref={whale} visible={false}>
        <mesh material={whaleMat} scale={[7.2, 1.7, 2]}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <mesh material={whaleMat} position={[-6.4, 0.1, 0]} rotation={[0, 0, 0.6]} scale={[1.6, 1.3, 0.4]}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      </group>

      <group ref={ray} visible={false}>
        <mesh rotation={[0.2, 0.4, 0]} scale={[2.6, 0.08, 1.15]} material={toon("#1d3344")}>
          <sphereGeometry args={[1, 14, 8]} />
        </mesh>
      </group>

      <mesh ref={shadow} visible={false} rotation={[-Math.PI / 2, 0, 0]} raycast={ignoreRaycast}>
        <circleGeometry args={[3.2, 20]} />
        <meshBasicMaterial color="#02060a" transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={sub} visible={false}>
        <mesh>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshBasicMaterial color="#f6e7a8" />
        </mesh>
        <pointLight color="#f6e7a8" intensity={8} distance={14} decay={2} />
        <mesh position={[-1.4, 0, 0]} scale={[2.2, 0.28, 0.28]} material={toon("#152433")}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      </group>

      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          ref={(node) => {
            if (node) rippleMeshes.current[i] = node;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          raycast={ignoreRaycast}
        >
          <ringGeometry args={[0.72, 0.86, 28]} />
          <meshBasicMaterial color="#f3ead7" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}
