(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const narrow = window.matchMedia("(max-width: 860px)").matches;
  const root = document.documentElement;
  const opener = document.querySelector(".opener");
  const bubble = document.querySelector(".bubble");
  const curtain = document.querySelector(".curtain");
  let bubbleTimer = 0;

  const skies = [
    { t: 0, top: "#f6c98a", mid: "#f4e2c2", low: "#9fbe86", sun: 1, moon: 0, x: 14, y: 11 },
    { t: 0.28, top: "#8ec4e0", mid: "#d7eef6", low: "#6ea36e", sun: 1, moon: 0, x: 78, y: 8 },
    { t: 0.58, top: "#e07a4a", mid: "#f2b56b", low: "#3e5c45", sun: 0.95, moon: 0, x: 88, y: 12 },
    { t: 1, top: "#0e1a2e", mid: "#1a3048", low: "#0c1612", sun: 0, moon: 1, x: 16, y: 9 }
  ];

  function mix(a, b, t) {
    const pa = [1, 3, 5].map(function (i) { return parseInt(a.slice(i, i + 2), 16); });
    const pb = [1, 3, 5].map(function (i) { return parseInt(b.slice(i, i + 2), 16); });
    const c = pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); });
    return "#" + c.map(function (v) { return v.toString(16).padStart(2, "0"); }).join("");
  }

  function skyAt(p) {
    let i = 0;
    while (i < skies.length - 2 && p > skies[i + 1].t) i += 1;
    const a = skies[i];
    const b = skies[i + 1];
    const t = (p - a.t) / (b.t - a.t || 1);
    root.style.setProperty("--sky-top", mix(a.top, b.top, t));
    root.style.setProperty("--sky-mid", mix(a.mid, b.mid, t));
    root.style.setProperty("--sky-low", mix(a.low, b.low, t));
    root.style.setProperty("--sun-o", String(a.sun + (b.sun - a.sun) * t));
    root.style.setProperty("--moon-o", String(a.moon + (b.moon - a.moon) * t));
    const sunP = Math.min(p, 0.58);
    let si = 0;
    while (si < skies.length - 2 && sunP > skies[si + 1].t) si += 1;
    const sa = skies[si];
    const sb = skies[si + 1];
    const st = (sunP - sa.t) / (sb.t - sa.t || 1);
    root.style.setProperty("--sun-x", (sa.x + (sb.x - sa.x) * st) + "%");
    root.style.setProperty("--sun-y", (sa.y + (sb.y - sa.y) * st) + "%");
    root.style.setProperty("--moon-x", "78%");
    root.style.setProperty("--moon-y", "8%");
  }

  function journey() {
    const anchor = window.innerHeight * 0.42;
    const nodes = ["#enter", "#clearing", "#grove", "#craft", "#night"].map(function (sel) {
      return document.querySelector(sel);
    }).filter(Boolean);
    const stops = [0, 0.28, 0.48, 0.66, 1];
    let p = 0;
    for (let i = 0; i < nodes.length; i++) {
      const top = nodes[i].getBoundingClientRect().top;
      if (top > anchor) break;
      const next = nodes[i + 1];
      if (!next) { p = stops[Math.min(i, stops.length - 1)]; break; }
      const span = next.getBoundingClientRect().top - top;
      const local = span > 0 ? Math.min(1, (anchor - top) / span) : 1;
      p = stops[i] + (stops[Math.min(i + 1, stops.length - 1)] - stops[i]) * local;
    }
    return p;
  }

  function onScroll() {
    if (!document.body.dataset.sky) skyAt(journey());
    if (opener && !reduce) {
      const rect = opener.getBoundingClientRect();
      const total = opener.offsetHeight - window.innerHeight;
      const dolly = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      opener.style.setProperty("--dolly", narrow ? "0" : String(dolly));
    }
    const nav = document.querySelector(".nav");
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 8);
  }
  const forced = document.body.dataset.sky;
  if (forced) skyAt(Number(forced));
  else onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const follower = document.querySelector(".follower");
  if (follower && fine && !reduce) {
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", function (event) {
      follower.style.transform = "translate3d(" + event.clientX + "px," + event.clientY + "px,0)";
    }, { passive: true });
    window.addEventListener("pointerdown", function (event) {
      burst(event.clientX, event.clientY);
    });
  }

  function burst(x, y) {
    if (reduce) return;
    for (let i = 0; i < 6; i++) {
      const bit = document.createElement("span");
      bit.className = "pollen";
      bit.style.left = x + "px";
      bit.style.top = y + "px";
      bit.style.animationDuration = (0.6 + Math.random()) + "s";
      document.body.appendChild(bit);
      setTimeout(function () { bit.remove(); }, 1200);
    }
  }

  function say(text, x, y) {
    if (!bubble) return;
    bubble.hidden = false;
    bubble.textContent = text;
    bubble.style.left = Math.min(x, window.innerWidth - 230) + "px";
    bubble.style.top = Math.max(12, y - 64) + "px";
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.hidden = true; }, 2600);
  }

  const mushroomLines = [
    "You found a mushroom.",
    "Why are you still clicking this?",
    "Fine. Grow, then."
  ];
  let mushClicks = 0;
  document.querySelectorAll(".spirit").forEach(function (spirit) {
    spirit.addEventListener("click", function (event) {
      const kind = spirit.dataset.spirit;
      const x = event.clientX || spirit.getBoundingClientRect().left;
      const y = event.clientY || spirit.getBoundingClientRect().top;
      if (kind === "mushroom") {
        mushClicks += 1;
        say(mushroomLines[Math.min(mushClicks - 1, 2)], x, y);
        if (mushClicks >= 3) spirit.classList.add("is-giant");
        return;
      }
      if (kind === "frog") {
        say(spirit.dataset.line || "The pond remembers the work.", x, y);
        return;
      }
      if (kind === "flower") {
        spirit.classList.toggle("bloom");
        say(spirit.classList.contains("bloom") ? spirit.dataset.line : "It closes again. Patient thing.", x, y);
        return;
      }
      if (kind === "cat") {
        spirit.classList.toggle("awake");
        say(spirit.classList.contains("awake") ? spirit.dataset.line : "Back to sleep.", x, y);
        return;
      }
      if (kind === "butterfly") {
        spirit.classList.add("away");
        say("Off it goes.", x, y);
        return;
      }
      if (kind === "tree") {
        say("The branches shake loose a few leaves.", x, y);
        dropLeaves();
        return;
      }
      if (kind === "deer") {
        say(spirit.dataset.line || "It watches, then steps back into the trees.", x, y);
        return;
      }
      if (kind === "squirrel") {
        spirit.classList.remove("run");
        void spirit.offsetWidth;
        spirit.classList.add("run");
        say("It bolts across the roots.", x, y);
        return;
      }
      if (kind === "firefly" && follower) {
        const on = follower.classList.toggle("is-firefly");
        say(on ? "It will follow you." : "It settles back into the dark.", x, y);
      }
    });
  });

  function dropLeaves() {
    if (reduce) return;
    for (let i = 0; i < 8; i++) {
      const leaf = document.createElement("span");
      leaf.className = "leaf-fall";
      leaf.style.left = (20 + Math.random() * 60) + "vw";
      leaf.style.top = "-10px";
      leaf.style.animationDuration = (2 + Math.random() * 2) + "s";
      document.body.appendChild(leaf);
      setTimeout(function () { leaf.remove(); }, 4000);
    }
  }

  document.querySelectorAll(".relic").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (reduce || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      link.classList.add("is-zoom");
      if (curtain) curtain.classList.add("is-on");
      try { sessionStorage.setItem("worldEnter", "1"); } catch (err) {}
      setTimeout(function () { window.location.href = link.href; }, 620);
    });
  });

  const explore = document.querySelector("[data-explore]");
  if (explore) {
    explore.addEventListener("click", function () {
      const on = document.body.classList.toggle("is-exploring");
      explore.setAttribute("aria-pressed", on ? "true" : "false");
      say(on ? "Explore is on. Poke the woods." : "Explore rests. The path is still here.", 24, window.innerHeight - 80);
    });
  }

  let audioCtx = null;
  let gain = null;
  const soundBtn = document.querySelector("[data-sound]");
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      const on = soundBtn.getAttribute("aria-pressed") !== "true";
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
        const seconds = 2;
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * seconds, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.2;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 380;
        gain = audioCtx.createGain();
        gain.gain.value = 0;
        source.connect(filter).connect(gain).connect(audioCtx.destination);
        source.start();
      }
      audioCtx.resume();
      gain.gain.setTargetAtTime(on ? 0.035 : 0, audioCtx.currentTime, 0.08);
    });
  }

  const plants = document.querySelectorAll(".plant");
  if (plants.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("is-grown");
      });
    }, { threshold: 0.4 });
    plants.forEach(function (plant) { io.observe(plant); });
  } else {
    plants.forEach(function (plant) { plant.classList.add("is-grown"); });
  }

  const bird = document.querySelector(".bird");
  function releaseBird() {
    if (!bird || reduce || narrow || document.hidden) return;
    bird.classList.remove("fly");
    void bird.offsetWidth;
    bird.classList.add("fly");
  }
  if (bird && !reduce && !narrow) {
    setTimeout(releaseBird, 4000);
    setInterval(releaseBird, 22000);
  }

  const squirrel = document.querySelector(".squirrel");
  function bolt() {
    if (!squirrel || reduce || narrow || document.hidden) return;
    squirrel.classList.remove("run");
    void squirrel.offsetWidth;
    squirrel.classList.add("run");
  }
  if (squirrel && !reduce && !narrow) setInterval(bolt, 26000);

  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const note = ["Name: " + data.get("name"), "Email: " + data.get("email"), "", data.get("message")].join("\n");
      const thanks = document.querySelector(".thanks");
      const mail = document.querySelector("#mail-link");
      if (mail) {
        mail.href = "mailto:?subject=" + encodeURIComponent("Note for Haley Nichols") + "&body=" + encodeURIComponent(note);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(note).catch(function () {});
      }
      form.hidden = true;
      if (thanks) thanks.hidden = false;
    });
  }

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  if (!reduce && !narrow) {
    const dust = document.querySelector(".dust");
    if (dust) {
      for (let i = 0; i < 10; i++) {
        const bit = document.createElement("span");
        bit.className = "pollen";
        bit.style.left = Math.random() * 100 + "vw";
        bit.style.top = Math.random() * 100 + "vh";
        bit.style.animationDelay = (-Math.random() * 12) + "s";
        bit.style.animationDuration = (9 + Math.random() * 8) + "s";
        dust.appendChild(bit);
      }
    }
  }
})();
