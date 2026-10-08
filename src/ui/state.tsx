import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { shellIds } from "../data";
import { runtime } from "../runtime";

export type Panel = "about" | "skills" | "contact" | "bottle" | "pearl" | "rock" | "index" | "jelly";

type UI = {
  project: { id: string; slide: number } | null;
  panel: Panel | null;
  jelly: number;
  skill: string | null;
  relic: string | null;
  shells: string[];
  toast: string;
  reduced: boolean;
  ready: boolean;
  webgl: boolean;
  openProject: (id: string, slide?: number) => void;
  closeProject: () => void;
  openPanel: (panel: Panel, extra?: { skill?: string; relic?: string; jelly?: number }) => void;
  closePanel: () => void;
  toggleCalm: () => void;
  collectShell: (id: string) => void;
  markReady: () => void;
  notify: (message: string) => void;
  setWebgl: (value: boolean) => void;
};

const Ctx = createContext<UI | null>(null);

function readCalm() {
  try {
    const stored = localStorage.getItem("hn-calm");
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* private mode */
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<UI["project"]>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [jelly, setJelly] = useState(0);
  const [skill, setSkill] = useState<string | null>(null);
  const [relic, setRelic] = useState<string | null>(null);
  const [shells, setShells] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem("hn-shells");
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return parsed.filter((id) => shellIds.includes(id));
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState("");
  const [reduced, setReduced] = useState(readCalm);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [pearlOpened, setPearlOpened] = useState(false);

  useEffect(() => {
    runtime.reduced = reduced;
    document.documentElement.classList.toggle("calm", reduced);
  }, [reduced]);

  useEffect(() => {
    runtime.locked = Boolean(project || panel);
  }, [project, panel]);

  useEffect(() => {
    document.body.style.overflow = project || panel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project, panel]);

  const notify = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const openProject = useCallback((id: string, slide = 0) => {
    setPanel(null);
    setProject({ id, slide });
    history.replaceState(null, "", `#${id}`);
  }, []);

  const closeProject = useCallback(() => {
    setProject(null);
    if (location.hash) history.replaceState(null, "", location.pathname);
  }, []);

  const openPanel = useCallback((next: Panel, extra?: { skill?: string; relic?: string; jelly?: number }) => {
    setProject(null);
    setPanel(next);
    if (extra?.skill) setSkill(extra.skill);
    if (extra?.relic) setRelic(extra.relic);
    if (typeof extra?.jelly === "number") setJelly(extra.jelly);
  }, []);

  const closePanel = useCallback(() => setPanel(null), []);

  const toggleCalm = useCallback(() => {
    setReduced((value) => {
      const next = !value;
      try {
        localStorage.setItem("hn-calm", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const collectShell = useCallback((id: string) => {
    setShells((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        sessionStorage.setItem("hn-shells", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (shells.length === shellIds.length && !pearlOpened) {
      setPearlOpened(true);
      setPanel("pearl");
      setToast("Five shells. The chamber opened.");
    }
  }, [shells, pearlOpened]);

  const markReady = useCallback(() => setReady(true), []);

  const value = useMemo<UI>(
    () => ({
      project,
      panel,
      jelly,
      skill,
      relic,
      shells,
      toast,
      reduced,
      ready,
      webgl,
      openProject,
      closeProject,
      openPanel,
      closePanel,
      toggleCalm,
      collectShell,
      markReady,
      notify,
      setWebgl,
    }),
    [
      project,
      panel,
      jelly,
      skill,
      relic,
      shells,
      toast,
      reduced,
      ready,
      webgl,
      openProject,
      closeProject,
      openPanel,
      closePanel,
      toggleCalm,
      collectShell,
      markReady,
      notify,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUI outside provider");
  return ctx;
}
