import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import {
  LatheGeometry,
  MathUtils,
  MeshStandardMaterial,
  Vector2,
  type Group,
  type Mesh,
} from "three";
import { personalTentacles, projects, shellIds, skills } from "../data";
import { runtime } from "../runtime";
import { useUI } from "../ui/state";
import {
  Anchor,
  Coral,
  FramedPrint,
  Rock,
  Sand,
  diverCard,
  letterTexture,
  useAnchor,
  usePaintedTexture,
} from "./bits";
import { toon } from "./materials";

function Shell({ id, position, tint }: { id: string; position: [number, number, number]; tint: string }) {
  const { collectShell, notify, shells } = useUI();
  const clicks = useRef<number[]>([]);
  const pearl = useRef<Mesh>(null);
  const geo = useMemo(() => {
    const pts: Vector2[] = [];
    for (let i = 0; i <= 10; i += 1) {
      const t = i / 10;
      const radius = Math.sin(t * Math.PI) * 0.2 * (1 - t * 0.2);
      pts.push(new Vector2(Math.max(0.028, radius), t * 0.4));
    }
    return new LatheGeometry(pts, 7);
  }, []);
  useFrame(() => {
    if (!pearl.current) return;
    const target = runtime.pearls.has(id) ? 1 : 0;
    const current = pearl.current.scale.x;
    pearl.current.scale.setScalar(current + (target - current) * 0.14);
  });
  return (
    <Anchor
      id={id}
      position={position}
      bob={0.05}
      onClick={() => {
        const now = performance.now();
        clicks.current = clicks.current.filter((t) => now - t < 1100);
        clicks.current.push(now);
        const fresh = !shells.includes(id);
        if (fresh) collectShell(id);
        if (clicks.current.length >= 3 && !runtime.pearls.has(id)) {
          runtime.pearls.add(id);
          runtime.burstBubbles = 8;
          notify("A pearl. Unnecessary. Keep it.");
          return;
        }
        if (fresh) notify(`Shell ${shells.length + 1} of 5.`);
      }}
    >
      <mesh geometry={geo} rotation={[0.5, 0.8, 1.05]} scale={1.15} material={toon(tint)}>
      </mesh>
      <mesh ref={pearl} position={[0.02, 0.16, 0.06]} scale={0}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <meshStandardMaterial color="#fff8f0" emissive="#f3d2c6" emissiveIntensity={0.55} roughness={0.2} />
      </mesh>
    </Anchor>
  );
}

function Buoy() {
  return (
    <Anchor id="buoy" position={[1.15, 4.05, 0.15]} bob={0.1}>
      <mesh position={[0, 0.15, 0]} material={toon("#e07a5f")}>
        <cylinderGeometry args={[0.34, 0.4, 0.7, 10]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon("#f3ead7")}>
        <torusGeometry args={[0.28, 0.045, 8, 16]} />
      </mesh>
      <mesh position={[0, -0.45, 0]} material={toon("#6b4a32")}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
      </mesh>
    </Anchor>
  );
}

function WaterTower() {
  return (
    <group position={[-0.15, 0, 0]}>
      <mesh position={[0, 0.55, 0]} material={toon("#1a3e58")}>
        <cylinderGeometry args={[0.1, 0.13, 1.1, 8]} />
      </mesh>
      <mesh position={[0, 1.25, 0]} scale={[0.42, 0.32, 0.42]} material={toon("#f4ecdc")}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.25, 0]} scale={[0.34, 0.16, 0.34]} material={toon("#1d4e89")}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
    </group>
  );
}

function NestingTables() {
  const leg = toon("#8e969b");
  const top = toon("#16191d");
  const draw = (w: number, h: number, y: number) => (
    <group position={[0, y, 0]}>
      <mesh position={[0, h, 0]} material={top}>
        <boxGeometry args={[w, 0.06, w * 0.62]} />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x * (w * 0.42), h / 2, z * (w * 0.24)]} material={leg}>
          <boxGeometry args={[0.045, h, 0.045]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group>
      {draw(1.35, 0.72, 0)}
      <group position={[0.28, 0, 0.18]}>{draw(0.95, 0.48, 0)}</group>
    </group>
  );
}

function Chest() {
  const lid = useRef<Group>(null);
  useFrame(() => {
    if (!lid.current) return;
    const target = runtime.hover === "frog" ? -1.15 : -0.15;
    lid.current.rotation.x += (target - lid.current.rotation.x) * 0.08;
  });
  return (
    <group>
      <mesh position={[0, 0.28, 0]} material={toon("#6d452c")}>
        <boxGeometry args={[1.15, 0.56, 0.72]} />
      </mesh>
      <mesh position={[0, 0.28, 0.37]} material={toon("#8d5a38")}>
        <boxGeometry args={[0.7, 0.28, 0.04]} />
      </mesh>
      <group ref={lid} position={[0, 0.56, -0.36]}>
        <mesh position={[0, 0.08, 0.36]} material={toon("#8a5a38")}>
          <boxGeometry args={[1.2, 0.16, 0.76]} />
        </mesh>
      </group>
      <mesh position={[0, 0.95, 0.05]}>
        <sphereGeometry args={[0.26, 16, 12]} />
        <meshStandardMaterial color="#c6de86" emissive="#7ea24a" emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.12, 0.12]} scale={[0.16, 0.1, 0.12]} material={toon("#6f8f4a")}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
    </group>
  );
}

function Octopus() {
  const { openProject } = useUI();
  const head = useRef<Group>(null);
  const segs = useRef<(Mesh | null)[][]>([[], [], [], [], [], [], [], []]);
  const tips = useRef<(Group | null)[]>([]);
  const count = 7;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (head.current) {
      head.current.position.y = 0.95 + Math.sin(t * 0.8) * (runtime.reduced ? 0 : 0.06);
      const look = MathUtils.clamp((runtime.pointerWorld.x - -0.2) * 0.08, -0.35, 0.35);
      head.current.rotation.y = look;
    }
    segs.current.forEach((chain, index) => {
      chain.forEach((mesh, i) => {
        if (!mesh) return;
        const f = i / (count - 1);
        const ang = (index / 8) * Math.PI * 2 - Math.PI / 2;
        const reach = 0.35 + f * 1.85;
        const wave = runtime.reduced ? 0 : Math.sin(t * 1.15 + index * 0.7 + f * 3.2) * 0.22 * f;
        mesh.position.set(Math.cos(ang) * reach + wave, 0.42 - f * 0.22, Math.sin(ang) * reach * 0.62);
        mesh.scale.setScalar(0.2 * (1 - f * 0.62));
      });
      const last = chain[count - 1];
      const tip = tips.current[index];
      if (last && tip) tip.position.set(last.position.x, last.position.y + 0.28, last.position.z);
    });
  });
  return (
    <group>
      <group ref={head}>
        <mesh
          scale={[0.78, 0.62, 0.7]}
          material={toon("#6a445c")}
          onClick={(event) => {
            event.stopPropagation();
            openProject("personal", 0);
          }}
        >
          <sphereGeometry args={[0.7, 18, 14]} />
        </mesh>
        <mesh position={[0.18, 0.08, 0.42]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshBasicMaterial color="#f6f1e6" />
        </mesh>
        <mesh position={[-0.18, 0.08, 0.42]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshBasicMaterial color="#f6f1e6" />
        </mesh>
        <mesh position={[0.2, 0.08, 0.5]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#1a120e" />
        </mesh>
        <mesh position={[-0.16, 0.08, 0.5]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#1a120e" />
        </mesh>
      </group>
      {Array.from({ length: 8 }, (_, index) => (
        <group key={index}>
          {Array.from({ length: count }, (_, i) => (
            <mesh
              key={i}
              material={toon(i % 2 ? "#7a5168" : "#5c3b50")}
              ref={(node) => {
                segs.current[index][i] = node;
              }}
            >
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          ))}
          {index < personalTentacles.length && (
            <group
              ref={(node) => {
                tips.current[index] = node;
              }}
              onClick={(event) => {
                event.stopPropagation();
                openProject("personal", personalTentacles[index].slide);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                runtime.hover = "personal";
              }}
              onPointerOut={() => {
                if (runtime.hover === "personal") runtime.hover = "";
              }}
            >
              <Billboard>
                <FramedPrint url={personalTentacles[index].thumb} height={0.48} />
              </Billboard>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

function Crab() {
  const ref = useRef<Group>(null);
  const legs = useRef<Group>(null);
  const seen = useRef(0);
  const x = useRef(0);
  const target = useRef(0);
  const clicks = useRef<number[]>([]);
  const { notify } = useUI();
  useAnchor("crab", ref);
  useFrame(({ clock }, dt) => {
    if (runtime.crabHop !== seen.current) {
      seen.current = runtime.crabHop;
      target.current = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.3);
    }
    const drift = runtime.reduced ? 0.2 : 1;
    x.current += (target.current - x.current) * Math.min(1, dt * 2.6 * drift);
    if (!ref.current) return;
    ref.current.position.x = x.current;
    ref.current.rotation.y = x.current < target.current ? -0.7 : 0.7;
    if (legs.current) {
      const hurry = Math.min(1, Math.abs(target.current - x.current));
      legs.current.rotation.z = Math.sin(clock.elapsedTime * 14) * 0.35 * hurry;
    }
  });
  return (
    <group ref={ref}>
      <group
        onClick={(event) => {
          event.stopPropagation();
          const now = performance.now();
          clicks.current = clicks.current.filter((t) => now - t < 1500);
          clicks.current.push(now);
          runtime.crabHop += 1;
          if (clicks.current.length >= 3) {
            runtime.crabStealUntil = now + 4600;
            clicks.current = [];
            notify("The crab took the cursor. It will get bored.");
          }
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          runtime.hover = "crab";
        }}
        onPointerOut={() => {
          if (runtime.hover === "crab") runtime.hover = "";
        }}
      >
        <mesh position={[0, 0.18, 0]} scale={[0.42, 0.18, 0.32]} material={toon("#c4654a")}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, 0.28, 0]} scale={[0.28, 0.1, 0.22]} material={toon("#e08a6d")}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        <group ref={legs}>
          {[-1, 1].map((side) =>
            [0, 1, 2].map((i) => (
              <mesh key={`${side}-${i}`} position={[side * 0.28, 0.1, -0.12 + i * 0.12]} rotation={[0, 0, side * 0.8]} material={toon("#9a4636")}>
                <capsuleGeometry args={[0.025, 0.18, 2, 6]} />
              </mesh>
            )),
          )}
        </group>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.38, 0.16, 0.22]} rotation={[0.4, 0, side * -0.6]} material={toon("#a8523e")}>
            <sphereGeometry args={[0.08, 8, 6]} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 0]}>
          <planeGeometry args={[0.34, 0.16]} />
          <meshBasicMaterial color="#f3ead7" />
        </mesh>
        <mesh position={[0, 0.42, 0.01]}>
          <planeGeometry args={[0.28, 0.1]} />
          <meshBasicMaterial color="#1b2a32" />
        </mesh>
      </group>
    </group>
  );
}

function SkillObject({ id, index }: { id: string; index: number }) {
  const glyph = index === 4 ? "Aa" : "H";
  const letter = usePaintedTexture(letterTexture(glyph), glyph);
  if (id === "illustration") {
    return (
      <group>
        <Coral position={[0, 0, 0]} color="#e07a5f" scale={1.35} />
        <mesh>
          <sphereGeometry args={[0.55, 10, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  }
  if (id === "brand") {
    return (
      <mesh rotation={[0.6, 0.4, 0.8]} scale={1.8} material={toon("#f3ead7")}>
        <torusGeometry args={[0.22, 0.08, 8, 14, Math.PI * 1.4]} />
      </mesh>
    );
  }
  if (id === "print") {
    return (
      <group>
        <mesh position={[-0.08, 0.2, 0]} rotation={[0.1, -0.4, 0]} material={toon("#f4ecdc")}>
          <boxGeometry args={[0.42, 0.05, 0.55]} />
        </mesh>
        <mesh position={[0.1, 0.24, 0.02]} rotation={[0.1, 0.5, 0]} material={toon("#1d4e6b")}>
          <boxGeometry args={[0.42, 0.05, 0.55]} />
        </mesh>
      </group>
    );
  }
  if (id === "display") {
    return (
      <group scale={0.7}>
        <mesh position={[0, 0.35, 0]} material={toon("#202428")}>
          <boxGeometry args={[0.9, 0.08, 0.6]} />
        </mesh>
        <mesh position={[0, 0.18, 0]} material={toon("#c4473a")}>
          <boxGeometry args={[0.7, 0.28, 0.45]} />
        </mesh>
      </group>
    );
  }
  if (id === "type") {
    return (
      <mesh>
        <planeGeometry args={[0.7, 0.7]} />
        {letter ? (
          <meshBasicMaterial map={letter} transparent toneMapped={false} fog={false} />
        ) : (
          <meshBasicMaterial color="#f3ead7" toneMapped={false} />
        )}
      </mesh>
    );
  }
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} material={toon("#d7b48a")}>
        <cylinderGeometry args={[0.16, 0.16, 0.42, 10]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.24, 0, 0]} material={toon("#f3ead7")}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.24, 0, 0]} material={toon("#f3ead7")}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
      </mesh>
    </group>
  );
}

function Station() {
  const { openPanel } = useUI();
  return (
    <Anchor id="station" position={[0.2, -36.6, 0.2]} onClick={() => openPanel("contact")}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={toon("#121820")}>
        <circleGeometry args={[1.8, 18]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={toon("#24343f")}>
        <boxGeometry args={[1.1, 0.45, 0.7]} />
      </mesh>
      <mesh position={[0.7, 0.7, 0]} material={toon("#d7c4a4")}>
        <cylinderGeometry args={[0.03, 0.03, 1.1, 6]} />
      </mesh>
      <mesh position={[0.7, 1.25, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshBasicMaterial color="#b6ff6a" />
      </mesh>
      <pointLight position={[0.7, 1.25, 0.2]} color="#b6ff6a" intensity={4} distance={6} />
      {[-0.8, 0, 0.85].map((x, i) => (
        <group key={x} position={[x, 0, 0.9]}>
          <mesh
            position={[0, 0.18, 0]}
            onClick={(event) => {
              event.stopPropagation();
              openPanel("contact");
            }}
          >
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial
              color={i === 1 ? "#9dffe0" : i === 0 ? "#f0d78c" : "#e7b7f2"}
              emissive={i === 1 ? "#9dffe0" : i === 0 ? "#f0d78c" : "#e7b7f2"}
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]} material={toon("#1c3340")}>
            <coneGeometry args={[0.08, 0.16, 5]} />
          </mesh>
        </group>
      ))}
      {[-0.4, 0.3, 1.1, -1.2].map((x, i) => (
        <mesh key={x} position={[x, 0.12, -0.7 - (i % 2) * 0.3]}>
          <coneGeometry args={[0.08, 0.28, 5]} />
          <meshStandardMaterial color="#7dffa8" emissive="#7dffa8" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </Anchor>
  );
}

export function Places() {
  const { openProject, openPanel, notify } = useUI();
  const card = usePaintedTexture(diverCard, "diver");
  const glass = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#dff5f1",
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
        depthWrite: false,
      }),
    [],
  );
  const sjwd = projects[0];
  const imagine = projects[1];
  const frog = projects[2];
  const plush = projects[3];
  const personal = projects[4];

  return (
    <group>
      <Sand position={[0.2, -2.85, -1.4]} radius={2.35} color="#c6b89a" />
      <Sand position={[1.2, -7.45, -1.5]} radius={2.1} color="#a89878" />
      <Sand position={[-1.4, -12.35, -1.6]} radius={2} color="#8d8070" />
      <Sand position={[1.6, -16.85, -1.5]} radius={2.15} color="#7a7268" />
      <Sand position={[-0.8, -26.55, -1.7]} radius={2.3} color="#4e5558" />
      <Sand position={[0.4, -31.55, -1.6]} radius={2.2} color="#2c3a40" />
      <Sand position={[0.2, -37.35, -1.5]} radius={2.4} color="#141c22" />

      <Coral position={[-1.4, -2.5, -0.8]} color="#d4846a" />
      <Coral position={[2.4, -2.3, 0.4]} color="#e6c27a" scale={0.8} />
      <Coral position={[3.2, -7.1, -0.5]} color="#c46b5a" scale={1.1} />
      <Coral position={[-3.2, -12, 0.5]} color="#2f6f6a" />
      <Coral position={[2.8, -31.2, 0.2]} color="#7dffc2" scale={1.2} />
      <Coral position={[-2.2, -31.4, -0.4]} color="#d7a0ff" scale={0.9} />

      <Rock position={[-3.6, -2.35, 0.6]} scale={[1.2, 0.7, 1]} />
      <Rock position={[3.4, -7.05, 0.8]} scale={0.8} />
      <Rock position={[-3.8, -16.4, 0.2]} scale={[1.4, 0.6, 1.1]} color="#2c3840" />
      <Rock position={[3.1, -26.2, 0.5]} scale={0.9} color="#243038" />

      <Buoy />

      <Anchor id="bottle" position={[3.15, 1.35, 0.4]} bob={0.1} onClick={() => openPanel("bottle")}>
        <mesh material={glass} position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.11, 0.14, 0.48, 10]} />
        </mesh>
        <mesh position={[0, 0.42, 0]} material={toon("#6b442c")}>
          <cylinderGeometry args={[0.05, 0.06, 0.12, 8]} />
        </mesh>
        <mesh position={[0, 0.08, 0.02]}>
          <planeGeometry args={[0.1, 0.16]} />
          <meshBasicMaterial color="#f3ead7" />
        </mesh>
      </Anchor>

      <Anchor id={sjwd.id} position={[-2.15, sjwd.y, 0.15]} bob={0.04} scale={1.45} onClick={() => openProject(sjwd.id)}>
        <WaterTower />
        <group position={[0.85, 0.7, 0.15]} rotation={[0, -0.4, 0.04]}>
          <FramedPrint url="/media/thumbs/sjwd-welcome.webp" height={0.72} />
        </group>
        <group position={[1.15, 0.15, 0.45]} rotation={[-1.05, 0.2, 0.1]}>
          <FramedPrint url="/media/thumbs/sjwd-map.webp" height={0.7} />
        </group>
      </Anchor>

      <Anchor id={imagine.id} position={[1.85, imagine.y, 0]} bob={0.03} scale={1.4} onClick={() => openProject(imagine.id)}>
        <NestingTables />
        <group position={[-0.95, 0.85, 0.15]} rotation={[0, 0.45, 0]}>
          <FramedPrint url="/media/thumbs/imagine-11.webp" height={0.78} />
        </group>
      </Anchor>

      <Anchor id={frog.id} position={[-1.85, frog.y, 0.2]} bob={0.04} scale={1.4} onClick={() => openProject(frog.id)}>
        <Chest />
        <group position={[0.95, 0.7, 0]} rotation={[0, -0.5, 0]}>
          <FramedPrint url="/media/thumbs/frog-machine.webp" height={0.8} />
        </group>
      </Anchor>

      <Anchor id={plush.id} position={[1.7, plush.y, 0.1]} bob={0.06} scale={1.4} onClick={() => openProject(plush.id)}>
        <mesh position={[-0.28, 0.32, 0]} scale={[0.32, 0.36, 0.28]} material={toon("#3a4e98")}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh position={[0.32, 0.3, 0.08]} scale={[0.3, 0.34, 0.28]} material={toon("#6d8a58")}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <group position={[-0.15, 0.95, 0.15]}>
          <FramedPrint url="/media/thumbs/plush-juno.webp" height={0.62} />
        </group>
        <group position={[0.72, 0.55, 0.25]} rotation={[0, -0.3, 0.05]}>
          <FramedPrint url="/media/thumbs/plush-jamie.webp" height={0.55} />
        </group>
      </Anchor>

      <Anchor id={personal.id} position={[-0.15, personal.y, 0.3]} bob={0.05} scale={1.25} onClick={() => openProject(personal.id, 0)}>
        <Octopus />
      </Anchor>

      <Anchor id="portrait" position={[1.15, -24.7, 0.35]} bob={0.03} onClick={() => openProject("personal", 1)}>
        <group rotation={[0, -0.5, 0]}>
          <FramedPrint url="/media/thumbs/personal-02.webp" height={0.85} />
        </group>
      </Anchor>

      <Anchor id="diver" position={[-1.55, -25.55, 0.2]} onClick={() => openPanel("about", { relic: "clemson" })}>
        <Rock position={[0, -0.15, 0]} scale={[1.3, 0.55, 1]} color="#2a343c" />
        <mesh position={[0, 0.85, 0]}>
          <planeGeometry args={[1.15, 1.48]} />
          {card ? (
            <meshBasicMaterial map={card} toneMapped={false} fog={false} />
          ) : (
            <meshBasicMaterial color="#f3ead7" toneMapped={false} />
          )}
        </mesh>
      </Anchor>

      <group position={[1.35, -25.15, 0.85]}>
        <Crab />
      </group>

      {skills.map((skill, index) => {
        const ang = -1.15 + index * 0.46;
        const radius = 3.15;
        return (
          <Anchor
            key={skill.id}
            id={`skill-${skill.id}`}
            position={[Math.sin(ang) * radius, -30.55, Math.cos(ang) * 0.7]}
            bob={0.05}
            onClick={() => openPanel("skills", { skill: skill.id })}
          >
            <SkillObject id={skill.id} index={index} />
          </Anchor>
        );
      })}

      <Station />

      <Anchor
        id="rock"
        position={[3.25, -34.15, 0.35]}
        onClick={() => {
          notify("The rock has an eye in it.");
          openPanel("rock");
        }}
      >
        <mesh scale={[0.7, 0.5, 0.62]} material={toon("#2a3338")}>
          <icosahedronGeometry args={[0.7, 0]} />
        </mesh>
        <mesh position={[0.15, 0.12, 0.42]}>
          <circleGeometry args={[0.08, 12]} />
          <meshBasicMaterial color="#f3ead7" />
        </mesh>
        <mesh position={[0.15, 0.12, 0.45]}>
          <circleGeometry args={[0.035, 10]} />
          <meshBasicMaterial color="#1a120e" />
        </mesh>
      </Anchor>

      <Shell id={shellIds[0]} position={[2.7, 0.35, 0.7]} tint="#f3ead7" />
      <Shell id={shellIds[1]} position={[-3.55, -2.15, 0.85]} tint="#e7c3a4" />
      <Shell id={shellIds[2]} position={[-3.3, -11.7, 0.55]} tint="#f0d78c" />
      <Shell id={shellIds[3]} position={[0.55, -26.15, 0.9]} tint="#f3ead7" />
      <Shell id={shellIds[4]} position={[-2.7, -36.85, 0.5]} tint="#d7fff0" />
    </group>
  );
}
