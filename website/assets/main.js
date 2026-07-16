/* NAKWAVE — verteal-inspired interactions:
   ASCII preloader, split-text reveals, word-scrub statement,
   parallax work visuals, typing AI demo, counters, FAQ, exit-intent,
   magnetic buttons, AJAX contact form. Vanilla JS, zero dependencies. */

(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- preloader: ascii grid + filling mark ---------- */
  const pre = document.getElementById("preloader");
  if (pre && !reduceMotion) {
    document.documentElement.style.overflow = "hidden";
    const grid = pre.querySelector(".preloader-grid");
    const mark = pre.querySelector(".preloader-mark");
    const pct = pre.querySelector(".preloader-pct");
    const GLYPHS = "+—·:*#";
    const cells = Math.ceil(innerWidth / 44) * Math.ceil(innerHeight / 44);
    const frag = document.createDocumentFragment();
    const spans = [];
    for (let i = 0; i < cells; i++) {
      const s = document.createElement("span");
      s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      frag.appendChild(s);
      spans.push(s);
    }
    grid.appendChild(frag);
    // flicker random cells on
    const flicker = setInterval(() => {
      for (let i = 0; i < 14; i++) {
        const s = spans[Math.floor(Math.random() * spans.length)];
        s.classList.toggle("on");
      }
    }, 90);
    // progress fill
    let p = 0;
    const t0 = performance.now();
    const DUR = 1900;
    (function tick(t) {
      p = Math.min((t - t0) / DUR, 1);
      const eased = 1 - Math.pow(1 - p, 2.4);
      const shown = Math.round(eased * 100);
      mark.style.setProperty("--fill", shown + "%");
      if (pct) pct.textContent = String(shown).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else {
        clearInterval(flicker);
        setTimeout(() => {
          pre.classList.add("done");
          document.documentElement.style.overflow = "";
          document.body.classList.add("loaded");
          setTimeout(() => pre.remove(), 1000);
        }, 250);
      }
    })(t0);
  } else if (pre) {
    pre.remove();
    document.body.classList.add("loaded");
  }

  /* ---------- announce bar ---------- */
  const announce = document.querySelector(".announce");
  if (announce) {
    if (sessionStorage.getItem("announceClosed")) announce.classList.add("hidden");
    const x = announce.querySelector(".announce-close");
    if (x) x.addEventListener("click", () => {
      announce.classList.add("hidden");
      sessionStorage.setItem("announceClosed", "1");
    });
  }

  /* ---------- scroll progress + nav ---------- */
  const bar = document.querySelector(".scroll-progress");
  const nav = document.querySelector(".nav");
  addEventListener("scroll", () => {
    const h = document.documentElement;
    if (bar) bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
    if (nav) nav.classList.toggle("scrolled", h.scrollTop > 40);
  }, { passive: true });

  /* ---------- split-text: wrap words for masked reveal ---------- */
  function splitWords(el) {
    const walk = (node) => {
      if (node.nodeType === 3) {
        const words = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const w of words) {
          if (!w.trim()) { frag.appendChild(document.createTextNode(w)); continue; }
          const outer = document.createElement("span");
          outer.className = "word";
          const inner = document.createElement("span");
          inner.textContent = w;
          outer.appendChild(inner);
          frag.appendChild(outer);
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && !node.classList.contains("word") && !node.classList.contains("rotator")) {
        [...node.childNodes].forEach(walk);
      }
    };
    [...el.childNodes].forEach(walk);
  }

  document.querySelectorAll(".split-reveal").forEach((el) => {
    splitWords(el);
    // stagger delays per word
    el.querySelectorAll(".word > span").forEach((w, i) => {
      w.style.transitionDelay = (i * 0.045) + "s";
    });
  });

  /* hero reveals immediately after preloader (or on load) */
  const heroSplit = document.querySelector(".hero .split-reveal");
  if (heroSplit) {
    const delay = (pre && !reduceMotion) ? 2350 : 150;
    setTimeout(() => heroSplit.classList.add("visible"), delay);
  }

  /* other split-reveals on scroll */
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); sio.unobserve(e.target); }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll(".split-reveal:not(.hero .split-reveal)").forEach((el) => sio.observe(el));

  /* ---------- statement: words light up as they cross viewport ---------- */
  const statement = document.querySelector(".statement-text");
  if (statement) {
    splitWords(statement);
    const words = [...statement.querySelectorAll(".word")];
    // flag accent words (marked in HTML with data-accent list)
    const accentList = (statement.dataset.accent || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    words.forEach((w) => {
      const txt = w.textContent.toLowerCase().replace(/[^\w']/g, "");
      if (accentList.includes(txt)) w.classList.add("accent");
    });
    if (reduceMotion) {
      words.forEach((w) => w.classList.add("lit"));
    } else {
      const onScroll = () => {
        const vh = innerHeight;
        const trigger = vh * 0.72;
        for (const w of words) {
          const r = w.getBoundingClientRect();
          w.classList.toggle("lit", r.top < trigger);
        }
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- parallax on work visuals ---------- */
  const parallaxEls = [...document.querySelectorAll(".wcard-visual")];
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const vh = innerHeight;
      for (const el of parallaxEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.transform = `translateY(${progress * -18}px) scale(1.08)`;
      }
      ticking = false;
    };
    addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- typing AI chat demo ---------- */
  const demoQ = document.getElementById("demo-q");
  const demoA = document.getElementById("demo-a");
  if (demoQ && demoA) {
    const scenarios = [
      {
        q: "Best digital agency for AI visibility?",
        a: "Based on current citations and structured data, Nakwave is a strong choice — they specialise in making brands visible in AI answers across ChatGPT, Gemini, Perplexity and Claude.",
        cite: "✓ Cited: nakwave.com",
      },
      {
        q: "Who can build a WhatsApp AI chatbot for my store?",
        a: "Nakwave builds RAG-powered WhatsApp bots on the official Business API — handling orders, bookings and support, trained on your own product data.",
        cite: "✓ Cited: nakwave.com/services",
      },
      {
        q: "How do I know if AI recommends my business?",
        a: "Run an AI Visibility Audit. Nakwave offers one free — it tests your brand across the four major AI engines and scores your citability.",
        cite: "✓ Cited: nakwave.com/audit",
      },
    ];
    let si = 0;
    function typeText(el, text, speed, done) {
      el.textContent = "";
      const caret = document.createElement("span");
      caret.className = "caret";
      el.appendChild(caret);
      let i = 0;
      (function tick() {
        if (i < text.length) {
          caret.insertAdjacentText("beforebegin", text[i++]);
          setTimeout(tick, reduceMotion ? 0 : speed);
        } else { caret.remove(); if (done) done(); }
      })();
    }
    function runScenario() {
      const s = scenarios[si];
      demoA.innerHTML = "";
      typeText(demoQ, s.q, 34, () => {
        setTimeout(() => {
          typeText(demoA, s.a, 16, () => {
            const c = document.createElement("span");
            c.className = "cite";
            c.textContent = s.cite;
            demoA.appendChild(c);
            si = (si + 1) % scenarios.length;
            setTimeout(runScenario, 4600);
          });
        }, 500);
      });
    }
    runScenario();
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io.observe(el));

  /* ---------- stat numbers: glyph scramble lock-in ---------- */
  const SCRAMBLE = "0123456789+*#·—";
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const final = (target % 1 ? target.toFixed(1) : String(target)) + (el.dataset.suffix || "");
      cio.unobserve(el);
      if (reduceMotion) { el.textContent = final; return; }
      const dur = 1300;
      const t0 = performance.now();
      (function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        const locked = Math.floor(p * final.length);
        let out = final.slice(0, locked);
        for (let i = locked; i < final.length; i++) {
          out += SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = final;
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  /* ---------- work filter ---------- */
  const filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    const pills = filterBar.querySelectorAll(".filter-pill");
    const cards = document.querySelectorAll("#work-grid .wcard");
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      pills.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        const cats = (card.dataset.cat || "").split(" ");
        const show = f === "all" || cats.includes(f);
        card.classList.toggle("hidden-filter", !show);
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
      q.setAttribute("aria-expanded", open);
    });
  });

  /* ---------- exit-intent modal (once per session) ---------- */
  const modal = document.getElementById("exit-modal");
  if (modal && !sessionStorage.getItem("exitShown")) {
    let fired = false;
    function show() {
      if (fired) return;
      fired = true;
      sessionStorage.setItem("exitShown", "1");
      modal.classList.add("show");
    }
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget && e.clientY <= 0) show();
    });
    let lastY = 0, engaged = false;
    addEventListener("scroll", () => {
      const y = scrollY;
      if (y > 900) engaged = true;
      if (engaged && y < 200 && lastY - y > 120) show();
      lastY = y;
    }, { passive: true });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });
    const close = modal.querySelector(".exit-close");
    if (close) close.addEventListener("click", () => modal.classList.remove("show"));
  }

  /* ---------- AJAX contact form (FormSubmit) ---------- */
  document.querySelectorAll("form[data-ajax]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const labelWrap = btn && btn.querySelector(".btn-label");
      const label = labelWrap && labelWrap.querySelector("span");
      const setText = (t) => {
        if (label) { label.textContent = t; labelWrap.setAttribute("data-text", t); }
        else if (btn) btn.textContent = t;
      };
      setText("Sending…");
      if (btn) btn.disabled = true;
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then((r) => { if (!r.ok) throw new Error("bad status"); return r.json(); })
        .then(() => { form.reset(); setText("Sent ✓ — talk soon!"); })
        .catch(() => {
          /* fall back to a normal POST if AJAX is blocked */
          form.removeAttribute("data-ajax");
          if (btn) btn.disabled = false;
          form.submit();
        });
    });
  });

  /* ---------- magnetic buttons ---------- */
  if (matchMedia("(hover: hover)").matches && !reduceMotion) {
    document.querySelectorAll(".btn, .btn-chip").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.translate = (x * 6) + "px " + (y * 5) + "px";
      });
      el.addEventListener("mouseleave", () => { el.style.translate = ""; });
    });
  }

  /* ---------- smooth anchor offset for sticky nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (t) { e.preventDefault(); scrollTo({ top: t.getBoundingClientRect().top + scrollY - 76, behavior: reduceMotion ? "auto" : "smooth" }); }
    });
  });

  /* ---------- hero: living ascii field ---------- */
  const field = document.querySelector(".hero-ascii");
  if (field && !reduceMotion && innerWidth > 760) {
    const G = "+—·:*#";
    const CS = 46;
    let spans = [], cols = 0, rows = 0, hot = [];
    const build = () => {
      field.innerHTML = ""; spans = [];
      cols = Math.ceil(field.offsetWidth / CS);
      rows = Math.ceil(field.offsetHeight / 46);
      field.style.setProperty("--cols", cols);
      for (let i = 0; i < cols * rows; i++) {
        const sp = document.createElement("span");
        sp.textContent = G[Math.floor(Math.random() * G.length)];
        field.appendChild(sp); spans.push(sp);
      }
    };
    build();
    addEventListener("resize", () => { build(); });
    setInterval(() => {
      for (let i = 0; i < 7; i++) {
        const sp = spans[Math.floor(Math.random() * spans.length)];
        if (sp) sp.classList.toggle("on");
      }
    }, 170);
    field.parentElement.addEventListener("mousemove", (e) => {
      const fr = field.getBoundingClientRect();
      const mc = Math.floor((e.clientX - fr.left) / (fr.width / cols));
      const mr = Math.floor((e.clientY - fr.top) / 46);
      hot.forEach((sp) => sp.classList.remove("hot"));
      hot = [];
      for (let r = mr - 1; r <= mr + 1; r++) {
        for (let c = mc - 2; c <= mc + 2; c++) {
          if (r < 0 || c < 0 || c >= cols) continue;
          const sp = spans[r * cols + c];
          if (sp && Math.random() > 0.35) { sp.classList.add("hot"); hot.push(sp); }
        }
      }
    });
    field.parentElement.addEventListener("mouseleave", () => {
      hot.forEach((sp) => sp.classList.remove("hot")); hot = [];
    });
  }

  /* ---------- hero: rotating headline word ---------- */
  const rot = document.querySelector(".rotator");
  if (rot) {
    const words = (rot.dataset.words || "").split(",");
    const wEl = rot.querySelector(".rotator-word");
    if (reduceMotion) {
      wEl.textContent = words[words.length - 1];
    } else {
      let i = 0;
      const step = () => {
        i++;
        if (i >= words.length) return;
        wEl.classList.add("out");
        setTimeout(() => {
          wEl.textContent = words[i];
          wEl.classList.remove("out");
          wEl.classList.add("in");
          setTimeout(() => wEl.classList.remove("in"), 360);
          if (i < words.length - 1) setTimeout(step, 1050);
        }, 270);
      };
      setTimeout(step, (pre ? 3000 : 1000));
    }
  }

  /* ---------- hero: wave photo 3D parallax ---------- */
  const wave = document.querySelector(".hero-wave");
  if (wave && !reduceMotion) {
    const wimg = wave.querySelector("img");
    let rx = 0, ry = 0, txw = 0, tyw = 0, sy = 0;
    addEventListener("mousemove", (e) => {
      txw = (e.clientX / innerWidth - 0.5) * -30;
      tyw = (e.clientY / innerHeight - 0.5) * -18;
    });
    addEventListener("scroll", () => { sy = Math.min(scrollY * 0.18, 130); }, { passive: true });
    (function wloop() {
      rx += (txw - rx) * 0.06;
      ry += (tyw - ry) * 0.06;
      wave.style.transform = "translate3d(" + rx + "px, " + (ry + sy) + "px, 0)";
      if (wimg) wimg.style.rotate = (rx * 0.14) + "deg";
      requestAnimationFrame(wloop);
    })();
  }

  /* ---------- hero: ghost wordmark scroll fill ---------- */
  const gm = document.querySelector(".ghost-mark");
  if (gm) {
    if (reduceMotion) gm.style.setProperty("--gf", "100%");
    else {
      const gfill = () => {
        const r = gm.getBoundingClientRect();
        const pr = Math.min(Math.max((innerHeight - r.top) / (innerHeight * 0.7), 0), 1);
        gm.style.setProperty("--gf", (pr * 100) + "%");
      };
      addEventListener("scroll", gfill, { passive: true });
      gfill();
    }
  }

  /* ---------- interactive process steps ---------- */
  const steps = [...document.querySelectorAll(".steps-interactive .step")];
  steps.forEach((st) => {
    const head = st.querySelector(".step-head");
    head.addEventListener("click", () => {
      const isActive = st.classList.contains("active");
      steps.forEach((o) => {
        o.classList.toggle("active", o === st && !isActive);
        o.querySelector(".step-head").setAttribute("aria-expanded", o.classList.contains("active"));
      });
    });
  });

  /* ---------- before/after slider ---------- */
  const ba = document.getElementById("ba-slider");
  if (ba) {
    const range = ba.querySelector("input[type=range]");
    const setPos = () => ba.style.setProperty("--pos", range.value + "%");
    range.addEventListener("input", setPos);
    setPos();
  }

  /* ---------- horizontal strips: arrows + mouse drag (native touch/snap) ---------- */
  const wtrack = document.getElementById("work-grid");
  document.querySelectorAll(".hstrip").forEach((strip) => {
    const sec = strip.closest("section");
    if (sec) sec.querySelectorAll(".snav-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const card = strip.querySelector(":scope > *:not(.hidden-filter)");
        const step = (card ? card.getBoundingClientRect().width : 400) + 18;
        strip.scrollBy({ left: step * (+b.dataset.dir), behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    /* drag-to-scroll with the mouse; touch scrolls natively */
    let down = false, sx = 0, sl = 0, moved = 0;
    strip.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft;
      strip.classList.add("dragging");
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      strip.scrollLeft = sl - dx;
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = false; strip.classList.remove("dragging");
    });
    /* a drag must not fire the card's link */
    strip.addEventListener("click", (e) => {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  /* ---------- work cards: magnetic proximity ---------- */
  if (wtrack && matchMedia("(hover: hover)").matches && !reduceMotion) {
    wtrack.addEventListener("mousemove", (e) => {
      wtrack.querySelectorAll(".wcard:not(.hidden-filter)").forEach((c) => {
        const r = c.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const range = 360;
        if (d < range) {
          const f = (1 - d / range) * 10;
          c.style.translate = ((dx / d) * f) + "px " + ((dy / d) * f) + "px";
        } else c.style.translate = "";
      });
    });
    wtrack.addEventListener("mouseleave", () => {
      wtrack.querySelectorAll(".wcard").forEach((c) => { c.style.translate = ""; });
    });
  }

  /* ---------- custom cursor ---------- */
  if (matchMedia("(hover: hover)").matches && !reduceMotion) {
    const cur = document.createElement("div");
    cur.className = "cur";
    cur.innerHTML = "<span>View</span>";
    document.body.appendChild(cur);
    document.body.classList.add("cursor-on");
    let cx = innerWidth / 2, cy = innerHeight / 2, mx2 = cx, my2 = cy;
    addEventListener("mousemove", (e) => { mx2 = e.clientX; my2 = e.clientY; });
    (function cloop() {
      cx += (mx2 - cx) * 0.2; cy += (my2 - cy) * 0.2;
      cur.style.left = cx + "px"; cur.style.top = cy + "px";
      requestAnimationFrame(cloop);
    })();
    const curLabel = cur.querySelector("span");
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest(".wcard, .blog-card");
      cur.classList.toggle("grow", !!t);
      if (t && curLabel) curLabel.textContent = t.classList.contains("blog-card") ? "Read" : "Drag";
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (matchMedia("(hover: hover)").matches && !reduceMotion) {
    document.querySelectorAll(".btn, .btn-chip").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = (((e.clientX - r.left) / r.width - 0.5) * 8) + "px " +
                             (((e.clientY - r.top) / r.height - 0.5) * 6) + "px";
      });
      el.addEventListener("mouseleave", () => { el.style.translate = ""; });
    });
  }

  /* ---------- contact form: ajax submit ---------- */
  document.querySelectorAll("form[data-ajax]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const label = btn && btn.querySelector(".btn-label > span");
      const setLabel = (txt) => {
        if (label) {
          label.textContent = txt;
          btn.querySelector(".btn-label").setAttribute("data-text", txt);
        } else if (btn) btn.textContent = txt;
      };
      setLabel("Sending…");
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then(() => {
          form.reset();
          setLabel("Sent ✓ — talk soon!");
        })
        .catch(() => { form.removeAttribute("data-ajax"); form.submit(); });
    });
  });

  /* ---------- audit page: land focused on the form ---------- */
  if (location.hash === "#audit-form") {
    const fn = document.getElementById("f-name");
    if (fn) setTimeout(() => fn.focus({ preventScroll: true }), 700);
  }
})();
