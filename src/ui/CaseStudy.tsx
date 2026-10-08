import { useCallback, useEffect, useRef, useState } from "react";
import { nextProject, projectById } from "../data";
import { useDialog } from "./dialog";
import { useUI } from "./state";

export function CaseStudy() {
  const { project, closeProject, openProject, reduced } = useUI();
  const data = project ? projectById(project.id) : null;
  const [zoom, setZoom] = useState<number | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const requestClose = useCallback(() => {
    if (zoomRef.current !== null) setZoom(null);
    else closeProject();
  }, [closeProject]);
  const ref = useDialog(Boolean(data), requestClose);

  useEffect(() => {
    if (!data || !project) return;
    const node = ref.current?.querySelector<HTMLElement>(`[data-slide="${project.slide}"]`);
    node?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }, [data, project, reduced, ref]);

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (!data) return;
      if (event.key === "ArrowRight") setZoom((value) => (value === null ? value : (value + 1) % data.slides.length));
      if (event.key === "ArrowLeft")
        setZoom((value) => (value === null ? value : (value - 1 + data.slides.length) % data.slides.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, data]);

  if (!data || !project) return null;
  const upcoming = nextProject(data.id);
  const slide = zoom !== null ? data.slides[zoom] : null;

  return (
    <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-labelledby="study-title">
      <article className="paper">
        <header className="paper-bar">
          <button type="button" className="text-btn" onClick={closeProject}>
            Rise
          </button>
          <p className="mono">Discovery {data.num}</p>
        </header>
        <p className="watermark" aria-hidden="true">
          {data.num}
        </p>
        <p className="kicker">{data.kicker}</p>
        <h2 id="study-title">{data.title}</h2>
        <p className="lede">{data.summary}</p>
        <dl className="meta">
          <div>
            <dt>Category</dt>
            <dd>{data.category}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{data.year}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{data.role}</dd>
          </div>
          <div>
            <dt>Practice</dt>
            <dd>{data.practice}</dd>
          </div>
        </dl>
        <div className="slides">
          {data.slides.map((item, index) => (
            <figure key={item.src} data-slide={index} id={`${data.id}-${index}`}>
              <button type="button" className="shot" onClick={() => setZoom(index)}>
                <img src={item.src} alt={item.alt} loading={index < 2 ? "eager" : "lazy"} />
              </button>
              <figcaption>
                <span className="mono">{String(index + 1).padStart(2, "0")}</span>
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <footer className="next">
          <p className="mono">Next discovery</p>
          <button type="button" className="next-title" onClick={() => openProject(upcoming.id)}>
            {upcoming.num} — {upcoming.title}
          </button>
        </footer>
      </article>
      {slide && zoom !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={slide.alt}>
          <button type="button" className="text-btn light-close" onClick={() => setZoom(null)}>
            Close
          </button>
          <button
            type="button"
            className="light-nav prev"
            onClick={() => setZoom((zoom - 1 + data.slides.length) % data.slides.length)}
            aria-label="Previous image"
          >
            ←
          </button>
          <figure>
            <img src={slide.src} alt={slide.alt} />
            <figcaption>{slide.caption}</figcaption>
          </figure>
          <button
            type="button"
            className="light-nav next"
            onClick={() => setZoom((zoom + 1) % data.slides.length)}
            aria-label="Next image"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
