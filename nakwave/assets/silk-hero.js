/* ============================================================
   NAKWAVE — "Living silk" cinematic hero (canvas).
   A seamless, procedural burgundy-silk field with floating gold
   zari threads, warm light, drifting dust and cursor-reactive
   attraction. No video file, no dependencies — pure canvas 2D,
   so it loops forever and weighs nothing. Respects reduced motion.
   Init: any element with class .silk-stage containing a <canvas>.
   ============================================================ */
(function () {
"use strict";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initStage(stage) {
  const canvas = stage.querySelector("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mouse = { x: -999, y: -999, active: false };
  const threads = [];
  const dust = [];
  const ripples = [];

  function resize() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    threads.length = 0; dust.length = 0;
    const nT = Math.round(Math.min(120, (W * H) / 12000));
    for (let i = 0; i < nT; i++) {
      threads.push({
        x: Math.random() * W, y: Math.random() * H,
        len: 18 + Math.random() * 46,
        ang: (Math.random() - 0.5) * 0.6,
        vx: 0.06 + Math.random() * 0.22, vy: (Math.random() - 0.5) * 0.12,
        a: 0.12 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2,
        w: 0.6 + Math.random() * 1.1,
      });
    }
    const nD = Math.round(Math.min(70, (W * H) / 24000));
    for (let i = 0; i < nD; i++) {
      dust.push({ x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.4, vy: -0.05 - Math.random() * 0.12, vx: (Math.random() - 0.5) * 0.08, a: 0.15 + Math.random() * 0.4, ph: Math.random() * 6.28 });
    }
  }

  /* flowing silk: layered translucent sine ribbons in burgundy */
  function drawSilk(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1c0308"); g.addColorStop(0.5, "#3d0a16"); g.addColorStop(1, "#12020a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const bands = 6;
    for (let b = 0; b < bands; b++) {
      const baseY = (H / (bands - 1)) * b;
      const amp = 16 + b * 6;
      const speed = 0.00022 + b * 0.00006;
      const hue = b % 2 ? "#5a1224" : "#7a1730";
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= W; x += 14) {
        const y = baseY + Math.sin(x * 0.006 + t * speed + b) * amp + Math.sin(x * 0.017 - t * speed * 1.7) * (amp * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, baseY + 120); ctx.lineTo(0, baseY + 120); ctx.closePath();
      const rg = ctx.createLinearGradient(0, baseY - amp, 0, baseY + 120);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(0.5, hue);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.5; ctx.fillStyle = rg; ctx.fill(); ctx.globalAlpha = 1;
    }

    /* moving specular sheen — the silk catching light */
    const sx = (Math.sin(t * 0.00013) * 0.5 + 0.5) * W;
    const sheen = ctx.createRadialGradient(sx, H * 0.35, 0, sx, H * 0.35, W * 0.5);
    sheen.addColorStop(0, "rgba(233,200,120,0.10)");
    sheen.addColorStop(0.4, "rgba(217,150,90,0.05)");
    sheen.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, W, H);
  }

  /* warm light shaft streaming from top-right */
  function drawLight(t) {
    const flick = 0.9 + Math.sin(t * 0.0008) * 0.1;
    const lg = ctx.createLinearGradient(W, 0, W * 0.3, H);
    lg.addColorStop(0, "rgba(255,224,150," + (0.16 * flick) + ")");
    lg.addColorStop(0.5, "rgba(255,210,140,0.05)");
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  }

  function drawThreads(t) {
    ctx.lineCap = "round";
    for (const p of threads) {
      // drift
      p.x += p.vx; p.y += p.vy + Math.sin(t * 0.0006 + p.ph) * 0.06;
      // gentle attraction to cursor
      if (mouse.active) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 26000) { const f = (1 - d2 / 26000) * 0.5; p.x += dx * 0.006 * f; p.y += dy * 0.006 * f; }
      }
      if (p.x > W + 60) { p.x = -40; p.y = Math.random() * H; }
      const shimmer = 0.6 + Math.sin(t * 0.0011 + p.ph) * 0.4;
      const ex = p.x + Math.cos(p.ang) * p.len, ey = p.y + Math.sin(p.ang) * p.len;
      const cx = (p.x + ex) / 2, cy = (p.y + ey) / 2 - 6;
      const grad = ctx.createLinearGradient(p.x, p.y, ex, ey);
      grad.addColorStop(0, "rgba(233,200,120,0)");
      grad.addColorStop(0.5, "rgba(245,215,140," + (p.a * shimmer) + ")");
      grad.addColorStop(1, "rgba(183,134,59,0)");
      ctx.strokeStyle = grad; ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    }
  }

  function drawDust(t) {
    for (const d of dust) {
      d.y += d.vy; d.x += d.vx;
      if (d.y < -6) { d.y = H + 6; d.x = Math.random() * W; }
      const a = d.a * (0.6 + Math.sin(t * 0.001 + d.ph) * 0.4);
      ctx.fillStyle = "rgba(255,230,170," + a + ")";
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    }
  }

  function drawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.rad += 2.4; r.a *= 0.94;
      if (r.a < 0.02) { ripples.splice(i, 1); continue; }
      ctx.strokeStyle = "rgba(233,200,120," + r.a + ")"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.rad, 0, 6.283); ctx.stroke();
    }
  }

  let raf = null, t0 = 0;
  function frame(ts) {
    if (!t0) t0 = ts;
    const t = ts - t0;
    ctx.clearRect(0, 0, W, H);
    drawSilk(t); drawThreads(t); drawDust(t); drawRipples(); drawLight(t);
    raf = requestAnimationFrame(frame);
  }

  function staticFrame() { ctx.clearRect(0, 0, W, H); drawSilk(9000); drawThreads(9000); drawLight(9000); }

  resize(); seed();
  window.addEventListener("resize", () => { resize(); seed(); if (reduceMotion) staticFrame(); });

  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    if (!reduceMotion && Math.random() < 0.12) ripples.push({ x: mouse.x, y: mouse.y, rad: 2, a: 0.5 });
  });
  stage.addEventListener("pointerleave", () => { mouse.active = false; mouse.x = -999; mouse.y = -999; });

  if (reduceMotion) { staticFrame(); return; }
  // pause when off-screen to save the battery
  const io = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (en.isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; t0 = 0; }
    });
  }, { threshold: 0.05 });
  io.observe(stage);
}

document.querySelectorAll(".silk-stage").forEach(initStage);
})();
