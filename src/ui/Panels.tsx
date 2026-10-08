import { depthForY, jellyNotes, projects, relics, shellIds, skills, socials, stops } from "../data";
import { scrollToDepth } from "../runtime";
import { useDialog } from "./dialog";
import { useUI, type Panel } from "./state";

export function Panels() {
  const ui = useUI();
  const open = ui.panel !== null && !ui.project;
  const ref = useDialog(open, ui.closePanel);
  if (!open || !ui.panel) return null;
  return (
    <div className="glass" ref={ref} role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <div className={`glass-card panel-${ui.panel}`}>
        <button type="button" className="text-btn" onClick={ui.closePanel}>
          Close
        </button>
        <PanelBody panel={ui.panel} />
      </div>
    </div>
  );
}

function PanelBody({ panel }: { panel: Panel }) {
  if (panel === "about") return <About />;
  if (panel === "skills") return <Skills />;
  if (panel === "contact") return <Contact />;
  if (panel === "bottle") return <Bottle />;
  if (panel === "pearl") return <Pearl />;
  if (panel === "rock") return <RockNote />;
  if (panel === "jelly") return <Jelly />;
  return <Index />;
}

function About() {
  const { relic } = useUI();
  return (
    <>
      <p className="kicker light">Field notes</p>
      <h2 id="panel-title">The diver keeps a log.</h2>
      <p>
        Haley Nichols works between illustration, identity, and objects that have to leave the screen — a poster, a
        plush, a display that has to survive a store. Graphic communications at Clemson, minor in Digital Production
        Arts.
      </p>
      <ul className="relics">
        {relics.map((item) => (
          <li key={item.id} className={relic === item.id ? "on" : ""}>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function Skills() {
  const { skill } = useUI();
  return (
    <>
      <p className="kicker light">What the water is holding</p>
      <h2 id="panel-title">No bars. Just objects.</h2>
      <ul className="relics">
        {skills.map((item) => (
          <li key={item.id} className={skill === item.id ? "on" : ""}>
            <h3>{item.title}</h3>
            <p className="object-line">{item.object}</p>
            <p>{item.note}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function Contact() {
  return (
    <>
      <p className="kicker light">Depth {240} m</p>
      <h2 id="panel-title">You’ve reached the abyss.</h2>
      <p>The water stops getting darker. These are the signals already on the old portfolio.</p>
      <ul className="signals">
        {socials.map((item) => (
          <li key={item.href}>
            <a href={item.href} target="_blank" rel="noreferrer">
              <span>{item.label}</span>
              <strong>{item.handle}</strong>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function Bottle() {
  return (
    <>
      <p className="kicker light">Found note</p>
      <h2 id="panel-title">If you found this, you were looking.</h2>
      <p>Haley Nichols. Graphic communications at Clemson, with a minor in Digital Production Arts.</p>
      <p>Started at SJWD Water District in June 2026 as a visual communications intern. Still there — now a specialist.</p>
      <p>The drawings also live at @BiggoDoodle. The rest of the station is further down.</p>
    </>
  );
}

function Pearl() {
  return (
    <>
      <p className="kicker light">Unlocked</p>
      <h2 id="panel-title">The pearl chamber.</h2>
      <p>Five shells. You actually looked.</p>
      <p>
        This part isn’t a case study. It’s the practice with a shop attached: original characters with names — Jamie
        Blackwood, Juno Hornet, Tillian Bloom, Marz Thorne — and commissions for people who play long games.
      </p>
      <ul className="signals">
        {socials.slice(0, 3).map((item) => (
          <li key={item.href}>
            <a href={item.href} target="_blank" rel="noreferrer">
              <span>{item.label}</span>
              <strong>{item.handle}</strong>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function RockNote() {
  const { openProject } = useUI();
  return (
    <>
      <p className="kicker light">Secret</p>
      <h2 id="panel-title">The rock blinked.</h2>
      <p>Inside is a party of investigators, 2025. Her caption keeps the campaign’s spelling: “Call of Cthuluhu.”</p>
      <button type="button" className="solid" onClick={() => openProject("personal", 0)}>
        Open the picture
      </button>
    </>
  );
}

function Jelly() {
  const { jelly } = useUI();
  const note = jellyNotes[jelly] ?? jellyNotes[0];
  return (
    <>
      <p className="kicker light">{note.title}</p>
      <h2 id="panel-title">A bell, briefly.</h2>
      <p>{note.body}</p>
    </>
  );
}

function Index() {
  const { openProject, openPanel, closePanel, shells } = useUI();
  return (
    <>
      <p className="kicker light">Index of the sound</p>
      <h2 id="panel-title">Everything that can be found.</h2>
      <ul className="index-list">
        {projects.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                scrollToDepth(depthForY(item.y));
                openProject(item.id);
              }}
            >
              <span className="mono">Discovery {item.num}</span>
              <strong>{item.title}</strong>
              <em>{item.year}</em>
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => openPanel("about")}>
            <span className="mono">Log</span>
            <strong>Field notes</strong>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => openPanel("skills")}>
            <span className="mono">Objects</span>
            <strong>Skills</strong>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => openPanel("contact")}>
            <span className="mono">Abyss</span>
            <strong>Signals</strong>
          </button>
        </li>
      </ul>
      <div className="index-dive">
        {stops.map((stop) => (
          <button key={stop.id} type="button" onClick={() => { closePanel(); scrollToDepth(stop.depth); }}>
            {stop.label}
          </button>
        ))}
      </div>
      <p className="fine">
        Shells {shells.length}/{shellIds.length}. Arrows dive when nothing is focused. Escape closes a panel. Keys 1–5
        open discoveries.
      </p>
    </>
  );
}
