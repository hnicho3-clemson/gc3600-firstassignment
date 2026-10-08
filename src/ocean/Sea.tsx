import { useEffect, useRef } from "react";
import { mountSea } from "./pixiSea";
import { useUI } from "../ui/state";

export function Sea() {
  const host = useRef<HTMLDivElement>(null);
  const ui = useUI();
  const uiRef = useRef(ui);
  uiRef.current = ui;

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let destroy = () => {};
    let cancel = false;
    mountSea(node, {
      openProject: (id, slide) => uiRef.current.openProject(id, slide),
      openPanel: (panel, extra) => uiRef.current.openPanel(panel, extra),
      notify: (message) => uiRef.current.notify(message),
      collectShell: (id) => uiRef.current.collectShell(id),
    })
      .then((done) => {
        if (cancel) done();
        else destroy = done;
      })
      .catch(() => {
        uiRef.current.setWebgl(false);
      });
    return () => {
      cancel = true;
      destroy();
    };
  }, []);

  return <div ref={host} />;
}
