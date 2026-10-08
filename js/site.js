(function () {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const vine = document.querySelector(".vine span");
  const follower = document.querySelector(".follower");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (nav) {
    const onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 8);
      if (vine && !reduce) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        vine.style.transform = "scaleY(" + progress + ")";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (follower && fine && !reduce) {
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", function (event) {
      follower.style.transform = "translate3d(" + event.clientX + "px," + event.clientY + "px,0)";
    }, { passive: true });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.12 });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  const dialog = document.querySelector(".lightbox");
  if (dialog) {
    const shot = dialog.querySelector("img");
    const caption = dialog.querySelector("figcaption");
    document.querySelectorAll(".shot-open").forEach(function (button) {
      button.addEventListener("click", function () {
        shot.src = button.dataset.full;
        shot.alt = button.dataset.alt || "";
        caption.textContent = button.dataset.caption || "";
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    const closer = dialog.querySelector(".lightbox-close");
    if (closer) closer.addEventListener("click", function () { dialog.close(); });
  }

  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const note = [
        "Name: " + data.get("name"),
        "Email: " + data.get("email"),
        "",
        data.get("message")
      ].join("\n");
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
})();
