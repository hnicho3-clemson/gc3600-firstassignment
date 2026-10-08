import { createRoot } from "react-dom/client";
import { App } from "./App";
import { runtime } from "./runtime";
import "./styles.css";

runtime.mobile = window.matchMedia("(max-width: 760px)").matches;
runtime.fine = window.matchMedia("(pointer: fine)").matches;
runtime.reduced = document.documentElement.classList.contains("calm");

createRoot(document.getElementById("root")!).render(<App />);
