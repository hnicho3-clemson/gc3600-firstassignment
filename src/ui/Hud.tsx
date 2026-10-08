import { useEffect, useMemo, useRef, useState } from "react";
import { depthForY, jellyNotes, projects, shellIds, skills, stops, WORLD } from "../data";
import { runtime, scrollToDepth } from "../runtime";
import { useUI } from "./state";

const shellTaps = new Map<string, number[]>();

function pokeShell(
  id: string,
  already: boolean,
  collect: (id: string) => void,
  notify: (message: string) => void,
) {
  const now = performance.now();
  const taps = (shellTaps.get(id) ?? []).filter((t) => now - t < 1100);
  taps.push(now);
  shellTaps.set(id, taps);
  if (!already) collect(id);
  if (taps.length >= 3 && !runtime.pearls.has(id)) {
    runtime.pearls.add(id);
    runtime.burstBubbles = 8;
    notify("A pearl. Unnecessary. Keep it.");
  }
}

type Marker = {
  id: string;
  kicker: string;
  label: string;
  quiet?: boolean;
  run: () => void;
};

export function Hud() {
  const ui = useUI();
  const { openProject, openPanel, collectShell, notify, shells } = ui;
  const markers = useMemo<Marker[]>(() => {
    const found = new Set(shells);
    return [
      ...projects.map((item) => ({
        id: item.id,
        kicker: `Discovery ${item.num}`,
        label: item.title,
        run: () => openProject(item.id),
      })),
      {
        id: "portrait",
        kicker: "Study",
        label: "Self portrait",
        run: () => openProject("personal", 1),
      },
      { id: "bottle", kicker: "Note", label: "Bottle", run: () => openPanel("bottle") },
      { id: "diver", kicker: "Log", label: "The diver", run: () => openPanel("about") },
      { id: "crab", kicker: "Sign", label: "Notes", run: () => openPanel("about") },
      ...skills.map((item) => ({
        id: `skill-${item.id}`,
        kicker: "Object",
        label: item.title,
        run: () => openPanel("skills", { skill: item.id }),
      })),
      { id: "station", kicker: "Abyss", label: "Signals", run: () => openPanel("contact") },
      { id: "rock", kicker: "??", label: "Strange rock", run: () => openPanel("rock") },
      ...jellyNotes.map((note, index) => ({
        id: `jelly-${index}`,
        kicker: note.title,
        label: "Touch",
        run: () => openPanel("jelly", { jelly: index }),
      })),
      ...shellIds.map((id, index) => ({
        id,
        kicker: found.has(id) ? "Found" : "Hidden",
        label: `Shell ${index + 1}`,
        quiet: true,
        run: () => pokeShell(id, found.has(id), collectShell, notify),
      })),
    ];
  }, [shells, openProject, openPanel, collectShell, notify]);

  return (
    <>
      <a className="skip" href="#index-open" onClick={(event) => { event.preventDefault(); ui.openPanel("index"); }}>
        Skip to index
      </a>
      <Hero />
      <div className="buoy-sign" data-shift="-170%" ref={(node) => {
        if (node) runtime.labelEls.set("buoy", node);
        else runtime.labelEls.delete("buoy");
      }}>
        <strong>Haley Nichols</strong>
        <span>Graphic communications</span>
        <em>Station HN-03 · Clemson Sound</em>
      </div>
      <DepthTape />
      <Compass />
      <ShellPips />
      <button id="index-open" type="button" className="index-open" onClick={() => ui.openPanel("index")}>
        Index
      </button>
      <button type="button" className="calm-btn" onClick={ui.toggleCalm} aria-pressed={ui.reduced}>
        {ui.reduced ? "Water is calm" : "Calm the water"}
      </button>
      <div className="tags" aria-hidden={false}>
        {markers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            className={`tag ${marker.quiet ? "quiet" : ""}`}
            ref={(node) => {
              if (node) runtime.labelEls.set(marker.id, node);
              else runtime.labelEls.delete(marker.id);
            }}
            onMouseEnter={() => {
              runtime.hover = marker.id;
            }}
            onMouseLeave={() => {
              if (runtime.hover === marker.id) runtime.hover = "";
            }}
            onClick={marker.run}
          >
            <span className="mono">{marker.kicker}</span>
            <strong>{marker.label}</strong>
          </button>
        ))}
      </div>
      <EdgeKelp />
      <Shoal />
      <Cursor />
      <ZoneLive />
      {ui.toast && (
        <p className="toast" role="status">
          {ui.toast}
        </p>
      )}
      {!ui.ready && <Loader />}
    </>
  );
}

function Hero() {
  const { openPanel } = useUI();
  return (
    <header className="hero">
      <p className="mono hero-site">Station HN-03 · 34.683° N</p>
      <h1>
        Haley
        <br />
        Nichols
      </h1>
      <p className="hero-role">Visual branding & illustration</p>
      <p className="script">things found, not filed.</p>
      <button type="button" className="descend" onClick={() => scrollToDepth(depthForY(-1.6))}>
        Descend
      </button>
      <button type="button" className="hero-note" onClick={() => openPanel("bottle")}>
        There’s a bottle off to the right.
      </button>
    </header>
  );
}

function DepthTape() {
  const { meters, zone } = useReadout();
  return (
    <nav className="tape" aria-label="Depth">
      <div className="tape-line" aria-hidden="true">
        <i style={{ top: "var(--depth-pct)" }} />
      </div>
      <p className="mono tape-read">
        <span>{zone}</span>
        {String(meters).padStart(3, "0")} m
      </p>
      <ul>
        {stops.map((stop) => (
          <li key={stop.id}>
            <button type="button" onClick={() => scrollToDepth(stop.depth)}>
              {stop.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Compass() {
  return (
    <div className="compass" aria-hidden="true">
      <i />
      <span>N</span>
    </div>
  );
}

function ShellPips() {
  const { shells, openPanel } = useUI();
  return (
    <button
      type="button"
      className="pips"
      onClick={() => shells.length === shellIds.length && openPanel("pearl")}
      aria-label={`${shells.length} of ${shellIds.length} shells found`}
    >
      {shellIds.map((id) => (
        <i key={id} className={shells.includes(id) ? "on" : ""} />
      ))}
    </button>
  );
}

function useReadout() {
  const [meters, setMeters] = useState(0);
  const [zone, setZone] = useState("Surface");
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const nextMeters = Math.round(runtime.depth * WORLD.meters);
      const nextZone = zoneFor(runtime.depth);
      setMeters((current) => (current === nextMeters ? current : nextMeters));
      setZone((current) => (current === nextZone ? current : nextZone));
      const pct = `${runtime.depth * 100}%`;
      document.documentElement.style.setProperty("--depth-pct", pct);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return { meters, zone };
}

function zoneFor(depth: number) {
  if (depth < 0.12) return "Surface";
  if (depth < 0.36) return "Reef";
  if (depth < 0.64) return "Open water";
  if (depth < 0.84) return "The drop";
  return "Abyss";
}

function ZoneLive() {
  const { zone } = useReadout();
  const [said, setSaid] = useState(zone);
  useEffect(() => {
    setSaid(zone);
  }, [zone]);
  return (
    <p className="sr" aria-live="polite">
      {said}
    </p>
  );
}

function Loader() {
  return (
    <div className="loader" role="status">
      <div className="angler" aria-hidden="true">
        <span />
      </div>
      <p>Diving in</p>
      <div className="loader-bar">
        <i />
      </div>
    </div>
  );
}

function EdgeKelp() {
  return (
    <svg className="edge left" viewBox="0 0 180 800" aria-hidden="true">
      <path d="M40 800 C70 640 20 520 60 400 C100 280 30 180 70 0" />
      <path d="M90 800 C50 600 120 480 70 320 C30 180 110 80 80 0" />
      <path d="M20 800 C60 700 10 560 40 460" />
    </svg>
  );
}

function Shoal() {
  return (
    <svg className="shoal" viewBox="0 0 1200 200" aria-hidden="true">
      <path d="M20 100 C50 70 80 70 100 100 C80 110 50 120 20 100 Z" />
      <path d="M140 80 C170 55 200 60 220 86 C190 96 160 100 140 80 Z" />
      <path d="M250 120 C280 95 320 100 340 128 C300 140 270 142 250 120 Z" />
    </svg>
  );
}

function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  useEffect(() => {
    if (!fine || !ref.current) return;
    const el = ref.current;
    let x = window.innerWidth * 0.5;
    let y = window.innerHeight * 0.4;
    let cx = x;
    let cy = y;
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      runtime.pointerOn = true;
      runtime.pointerNdc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
      document.documentElement.style.setProperty("--mx", String(x / window.innerWidth - 0.5));
      document.documentElement.style.setProperty("--my", String(y / window.innerHeight - 0.5));
    };
    window.addEventListener("pointermove", move);
    let frame = 0;
    const tick = () => {
      const stolen = performance.now() < runtime.crabStealUntil;
      const tx = stolen ? runtime.crabScreen.x : x;
      const ty = stolen ? runtime.crabScreen.y : y;
      cx += (tx - cx) * (stolen ? 0.16 : 0.42);
      cy += (ty - cy) * (stolen ? 0.16 : 0.42);
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      el.classList.toggle("hot", Boolean(runtime.hover));
      el.classList.toggle("stolen", stolen);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, [fine]);
  if (!fine || runtime.reduced) return null;
  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <i />
    </div>
  );
}

function useFinePointer() {
  const [fine, setFine] = useState(() => window.matchMedia("(pointer: fine)").matches && !runtime.reduced);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const onChange = () => setFine(mq.matches && !document.documentElement.classList.contains("calm"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return fine && !runtime.reduced;
}

export function FlatSea() {
  const ui = useUI();
  return (
    <main className="flat">
      <header>
        <p className="mono">Station HN-03</p>
        <h1>Haley Nichols</h1>
        <p>The dive needs WebGL. The work is still here, printed and in order.</p>
      </header>
      {projects.map((item) => (
        <article key={item.id}>
          <p className="mono">Discovery {item.num}</p>
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
          <img src={item.slides[0]?.src} alt={item.slides[0]?.alt ?? ""} />
          <button type="button" onClick={() => ui.openProject(item.id)}>
            Open discovery
          </button>
        </article>
      ))}
      <button type="button" onClick={() => ui.openPanel("contact")}>
        Signals
      </button>
    </main>
  );
}
