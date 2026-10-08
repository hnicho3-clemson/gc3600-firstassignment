import { Component, useEffect, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { depthForY, projects } from "./data";
import { Ocean } from "./ocean/Ocean";
import { runtime, scrollToDepth } from "./runtime";
import { CaseStudy } from "./ui/CaseStudy";
import { FlatSea, Hud } from "./ui/Hud";
import { Panels } from "./ui/Panels";
import { UIProvider, useUI } from "./ui/state";

class Boundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function App() {
  return (
    <UIProvider>
      <Experience />
    </UIProvider>
  );
}

function Experience() {
  const { markReady, reduced, openProject, openPanel, setWebgl, webgl } = useUI();
  const [gl] = useState(hasWebGL);

  useEffect(() => {
    document.getElementById("boot")?.remove();
  }, []);

  useEffect(() => {
    if (!gl) setWebgl(false);
  }, [gl, setWebgl]);

  useEffect(() => {
    let frames = 0;
    let min = false;
    let fonts = false;
    const finish = () => {
      if ((frames > 2 && min && fonts) || frames > 150) markReady();
    };
    runtime.onFrame = () => {
      frames += 1;
      if (frames === 3 || frames === 150) finish();
    };
    void document.fonts.ready.then(() => {
      fonts = true;
      finish();
    });
    const minTimer = window.setTimeout(() => {
      min = true;
      finish();
    }, 1000);
    const maxTimer = window.setTimeout(() => markReady(), 4200);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
      runtime.onFrame = null;
    };
  }, [markReady]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      runtime.scroll = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    document.documentElement.classList.toggle("has-cursor", fine && !reduced);
    runtime.reduced = reduced;
  }, [reduced]);

  useEffect(() => {
    const onResize = () => {
      runtime.mobile = window.matchMedia("(max-width: 760px)").matches;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".sheet, .glass, .lightbox, .flat")) return;
      if (runtime.locked) return;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      window.scrollBy(0, event.deltaY * scale);
      event.preventDefault();
    };
    let lastY = 0;
    const onStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? 0;
    };
    const onMove = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".sheet, .glass, .lightbox")) return;
      if (runtime.locked) return;
      const y = event.touches[0]?.clientY ?? lastY;
      window.scrollBy(0, lastY - y);
      lastY = y;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (typing) return;
      if (event.key >= "1" && event.key <= "5" && !runtime.locked) {
        const project = projects[Number(event.key) - 1];
        if (project) {
          scrollToDepth(depthForY(project.y));
          openProject(project.id);
        }
      }
      const atRoot = !target || target === document.body || target === document.documentElement || target.tagName === "CANVAS";
      if (!runtime.locked && atRoot && (event.key === "ArrowDown" || event.key === "PageDown")) {
        event.preventDefault();
        window.scrollBy({ top: window.innerHeight * 0.72, behavior: reduced ? "auto" : "smooth" });
      }
      if (!runtime.locked && atRoot && (event.key === "ArrowUp" || event.key === "PageUp")) {
        event.preventDefault();
        window.scrollBy({ top: -window.innerHeight * 0.72, behavior: reduced ? "auto" : "smooth" });
      }
      if (event.key.toLowerCase() === "i" && !event.metaKey && !event.ctrlKey) openPanel("index");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openProject, openPanel, reduced]);

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (projects.some((item) => item.id === id)) openProject(id);
  }, [openProject]);

  if (!gl || !webgl) {
    return (
      <>
        <FlatSea />
        <CaseStudy />
        <Panels />
      </>
    );
  }

  return (
    <>
      <div className="spacer" />
      <Boundary onFail={() => setWebgl(false)}>
        <Canvas
          className="sea"
          dpr={runtime.mobile ? [1, 1.2] : [1, 1.5]}
          gl={{ antialias: !runtime.mobile, alpha: false, powerPreference: "high-performance" }}
          camera={{ fov: runtime.mobile ? 50 : 38, near: 0.1, far: 90, position: [0, 6.4, 6.15] }}
          onPointerMissed={() => {
            runtime.wantsRipple = true;
          }}
        >
          <Ocean />
        </Canvas>
      </Boundary>
      <div className="veil" />
      <div className="grain" />
      <Hud />
      <CaseStudy />
      <Panels />
    </>
  );
}
