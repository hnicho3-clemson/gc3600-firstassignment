import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Fog,
  MathUtils,
  MeshBasicMaterial,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
  type DirectionalLight,
  type Group,
  type PointLight,
} from "three";
import { WORLD } from "../data";
import { runtime } from "../runtime";
import { KelpForest } from "./bits";
import { ignoreRaycast } from "./materials";
import { Life } from "./Life";
import { Places } from "./Places";

const waterVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float w = sin(vUv.x * 28.0 + uTime * 0.7) * sin(vUv.y * 22.0 - uTime * 0.5);
    w = smoothstep(0.15, 0.95, w * 0.5 + 0.5);
    vec3 deep = vec3(0.08, 0.32, 0.42);
    vec3 shine = vec3(0.85, 0.93, 0.82);
    vec3 col = mix(deep, shine, w * 0.55);
    float fade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    gl_FragColor = vec4(col, 0.42 * fade + 0.18);
  }
`;

export function Ocean() {
  const smooth = useRef(0);
  const raycaster = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  const world = useMemo(() => new Vector3(), []);
  const projected = useMemo(() => new Vector3(), []);
  const fogColor = useMemo(() => new Color("#176684"), []);
  const sunColor = useMemo(() => new Color("#fff1d0"), []);
  const deepColor = useMemo(() => new Color("#9bb4d4"), []);
  const stops = useMemo(
    () => [new Color("#1a7592"), new Color("#0d4664"), new Color("#081626"), new Color("#04070d")],
    [],
  );
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<PointLight>(null);
  const bio = useRef<PointLight>(null);
  const shafts = useRef<Group>(null);
  const shaftMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#fff4d2",
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  );
  const waterMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );

  useFrame((state, dt) => {
    runtime.onFrame?.();
    const eased = MathUtils.damp(smooth.current, runtime.scroll, runtime.reduced ? 7 : 2.6, dt);
    smooth.current = eased;
    runtime.depth = eased;
    const camY = MathUtils.lerp(WORLD.camStart, WORLD.camEnd, eased);
    runtime.camY = camY;
    const px = runtime.pointerOn && !runtime.reduced ? runtime.pointerNdc.x : 0;
    const py = runtime.pointerOn && !runtime.reduced ? runtime.pointerNdc.y : 0;
    const cam = state.camera;
    cam.position.x = MathUtils.damp(cam.position.x, px * 0.75, 2.2, dt);
    cam.position.y = MathUtils.damp(cam.position.y, camY + py * 0.2, runtime.reduced ? 7 : 2.8, dt);
    cam.position.z = 6.15;
    cam.lookAt(px * 0.4, cam.position.y - 0.42, 0);

    ndc.copy(runtime.pointerNdc);
    raycaster.setFromCamera(ndc, cam);
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;
    if (Math.abs(dir.z) > 0.0001) {
      const travel = -origin.z / dir.z;
      if (travel > 0) runtime.pointerWorld.set(origin.x + dir.x * travel, origin.y + dir.y * travel, 0);
    }
    if (runtime.wantsRipple) {
      runtime.wantsRipple = false;
      runtime.ripple?.(runtime.pointerWorld.x, runtime.pointerWorld.y, runtime.pointerWorld.z);
    }

    const fog = state.scene.fog as Fog;
    if (eased < 0.4) fogColor.lerpColors(stops[0], stops[1], eased / 0.4);
    else if (eased < 0.75) fogColor.lerpColors(stops[1], stops[2], (eased - 0.4) / 0.35);
    else fogColor.lerpColors(stops[2], stops[3], (eased - 0.75) / 0.25);
    fog.color.copy(fogColor);
    fog.near = 3.4;
    fog.far = MathUtils.lerp(48, 26, eased);
    state.scene.background = fogColor;

    if (sun.current) {
      sun.current.intensity = MathUtils.lerp(2.5, 0.22, eased);
      sun.current.color.copy(sunColor).lerp(deepColor, eased);
      sun.current.position.set(4, cam.position.y + 8, 3);
    }
    if (fill.current) {
      fill.current.position.set(-4, cam.position.y + 1, 2);
      fill.current.intensity = MathUtils.lerp(10, 4.5, eased);
    }
    if (bio.current) {
      bio.current.position.set(1.5, cam.position.y - 1, 1);
      bio.current.intensity = MathUtils.smoothstep(eased, 0.5, 0.92) * 9;
    }
    const time = waterMat.uniforms.uTime;
    if (time) time.value = runtime.reduced ? 0 : state.clock.elapsedTime;
    shaftMat.opacity = Math.max(0, 0.11 * (1 - eased * 2.4));
    if (shafts.current) shafts.current.visible = shaftMat.opacity > 0.01;

    const root = document.documentElement;
    root.style.setProperty("--depth", eased.toFixed(4));
    root.dataset.sunk = eased > 0.13 ? "1" : "0";

    const width = state.size.width;
    const height = state.size.height;
    runtime.anchors.forEach((obj, id) => {
      obj.getWorldPosition(world);
      const quiet = id.startsWith("shell");
      const range = quiet ? 4.4 : id === "buoy" ? 7 : 8.2;
      const dy = Math.abs(world.y - cam.position.y);
      projected.copy(world).project(cam);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      if (id === "crab") {
        runtime.crabScreen.x = x;
        runtime.crabScreen.y = y;
      }
      const el = runtime.labelEls.get(id);
      if (!el) return;
      const behind = projected.z > 1 || projected.z < -1;
      const visible = !behind && dy < range;
      const fade = visible ? Math.min(1, (range - dy) / 2.4) : 0;
      const hot = runtime.hover === id;
      const shift = el.dataset.shift || "-128%";
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${shift})`;
      el.style.opacity = hot ? "1" : fade.toFixed(3);
      const passive = el.classList.contains("relic") || el.classList.contains("buoy-sign");
      el.style.pointerEvents = !passive && (visible || hot) ? "auto" : "none";
    });
  });

  return (
    <>
      <color attach="background" args={["#176684"]} />
      <fog attach="fog" args={["#176684", 5.5, 32]} />
      <ambientLight intensity={0.42} color="#b7d0dc" />
      <directionalLight ref={sun} position={[4, 12, 3]} intensity={2.4} color="#fff1d0" />
      <pointLight ref={fill} position={[-4, 4, 2]} intensity={6} color="#7eb8c9" distance={30} />
      <pointLight ref={bio} position={[0, -30, 1]} intensity={0} color="#9dffd8" distance={12} />
      <hemisphereLight args={["#d7f0ea", "#1a3040", 0.45]} />

      <mesh position={[0, 7.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMat} raycast={ignoreRaycast}>
        <planeGeometry args={[48, 48, 1, 1]} />
      </mesh>
      <group ref={shafts} position={[0, 5.2, -1]}>
        {[ -2.2, -0.6, 0.8, 2.4 ].map((x, i) => (
          <mesh key={x} material={shaftMat} position={[x, 0, 0]} rotation={[0.1, 0, -0.18 + i * 0.08]}>
            <planeGeometry args={[1.1, 6.5]} />
          </mesh>
        ))}
      </group>

      <KelpForest />
      <Places />
      <Life />
    </>
  );
}
