/* NAKWAVE — hero atmosphere.
   Fullscreen GLSL flow field behind the hero type:
   L1 page white · L2 film grain · L3 invisible simplex flow filaments ·
   L4 cursor bend (silk under glass) · L5 orange energy particles (#FF5A1F,
   ≤40, cursor-local, fading trails) · L6 heat-haze refraction.
   Transparent canvas — no borders, no start, no end. Three.js + custom shaders.
   Idle: nearly still. Cursor: wakes. Leave: settles back to invisible. */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("hero-field");
  const hero = canvas && canvas.closest(".hero");
  if (!canvas || !hero) return;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const MAXP = 40;
  const ACTIVE_MAX = coarse ? 22 : 40;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
  } catch (err) {
    return; // no WebGL — the page simply stays white
  }
  renderer.setClearColor(0x000000, 0);

  /* ---------------- shaders ---------------- */
  const vert = `
    void main() { gl_Position = vec4(position, 1.0); }
  `;

  const frag = `
    precision highp float;

    #define MAXP ${MAXP}

    uniform vec2  uRes;
    uniform float uTime;
    uniform vec2  uMouse;
    uniform float uPresence;
    uniform float uEnergy;
    uniform vec4  uParts[MAXP];  // x, y, easedLife, coreSize
    uniform vec2  uPrev[MAXP];   // trail tail position
    uniform int   uCount;

    /* simplex noise — Ian McEwan / Ashima Arts (MIT) */
    vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float sdSeg(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
      return length(pa - ba * h);
    }

    void main() {
      vec2 frag2 = gl_FragCoord.xy;

      /* cursor falloff — wide, soft, gaussian: no circles, no edges */
      float md = distance(frag2, uMouse);
      float sigma = 300.0;
      float fall = exp(-(md * md) / (2.0 * sigma * sigma)) * uPresence;

      /* L6 — heat-haze refraction: bend the sampling space near the cursor */
      vec2 haze = vec2(
        snoise(frag2 * 0.008 + vec2(uTime * 0.35, 0.0)),
        snoise(frag2 * 0.008 + vec2(0.0, -uTime * 0.30) + 17.0)
      ) * fall * 7.0;
      vec2 p = frag2 + haze;

      /* L3 + L4 — flow field filaments, domain bent away from the cursor */
      vec2 q = p * 0.0022;
      vec2 dir = (frag2 - uMouse) / max(md, 1.0);
      q += dir * fall * (0.22 + 0.55 * uEnergy);
      float t = uTime * 0.045;
      float f = 0.62 * snoise(q * 2.1 + vec2(t, -t * 0.62))
              + 0.38 * snoise(q * 4.3 + vec2(-t * 1.25, t * 0.9) + 5.2);
      float fil = 1.0 - smoothstep(0.0, 0.34, abs(f));
      fil = pow(fil, 2.6);
      /* idle: ~1% ink, a whisper. near cursor: gently wakes */
      float flowA = fil * (0.011 + 0.075 * fall * (0.35 + 0.65 * uEnergy));

      /* L2 — monochrome film grain, stepped like film frames */
      float gr = hash12(frag2 + floor(uTime * 12.0) * vec2(31.7, 17.3));
      float g2 = (gr - 0.5) * 0.022;
      float grainA = max(g2, 0.0) * 0.9 + max(-g2, 0.0) * 0.2;

      float ink = clamp(flowA + grainA, 0.0, 1.0);
      vec3 col = vec3(0.04);
      float alpha = ink;

      /* L5 — orange energy particles with fading capsule trails */
      vec3 orange = vec3(1.0, 0.353, 0.122); /* #FF5A1F */
      float glow = 0.0;
      if (md < 900.0) {
        for (int i = 0; i < MAXP; i++) {
          if (i >= uCount) break;
          vec4 pt = uParts[i];
          float d = sdSeg(frag2, uPrev[i], pt.xy);
          float core = exp(-(d * d) / (2.0 * pt.w * pt.w));
          float halo = exp(-(d * d) / (2.0 * (pt.w * 4.0) * (pt.w * 4.0))) * 0.22;
          glow += (core + halo) * pt.z;
        }
      }
      glow = min(glow, 1.0);
      col = mix(col, orange, clamp(glow * 1.3, 0.0, 1.0));
      alpha = clamp(alpha + glow * 0.85, 0.0, 1.0);

      /* seamless: dissolve at canvas top and bottom — no visible bounds */
      float edge = smoothstep(0.0, 90.0, frag2.y) * smoothstep(0.0, 90.0, uRes.y - frag2.y);
      alpha *= edge;

      gl_FragColor = vec4(col, alpha);
    }
  `;

  /* ---------------- uniforms ---------------- */
  const partsU = [];
  const prevU = [];
  for (let i = 0; i < MAXP; i++) {
    partsU.push(new THREE.Vector4(0, 0, 0, 1));
    prevU.push(new THREE.Vector2(0, 0));
  }
  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
    uPresence: { value: 0 },
    uEnergy: { value: 0 },
    uParts: { value: partsU },
    uPrev: { value: prevU },
    uCount: { value: 0 },
  };

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  /* ---------------- sizing ---------------- */
  function size() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5));
    renderer.setSize(w, h, false);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const dpr = renderer.getPixelRatio();
    uniforms.uRes.value.set(w * dpr, h * dpr);
  }
  size();
  addEventListener("resize", size);

  /* ---------------- cursor state ---------------- */
  let tx = -9999, ty = -9999;        // target (canvas px, y-up)
  let mx = -9999, my = -9999;        // smoothed
  let presenceT = 0;
  let energy = 0;
  let lastMX = 0, lastMY = 0;
  let speed = 0;

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    const dpr = renderer.getPixelRatio();
    return [
      (e.clientX - r.left) * dpr,
      (r.height - (e.clientY - r.top)) * dpr,
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top && e.clientY <= r.bottom,
    ];
  }

  addEventListener("pointermove", (e) => {
    const [x, y, inside] = toCanvas(e);
    tx = x; ty = y;
    presenceT = inside ? 1 : 0;
    if (mx < -9000) { mx = x; my = y; } // first entry: no teleport streak
  }, { passive: true });

  document.addEventListener("pointerleave", () => { presenceT = 0; });
  addEventListener("blur", () => { presenceT = 0; });

  /* ---------------- particles (JS sim, curl of value noise) ---------------- */
  function vhash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = vhash(xi, yi), b = vhash(xi + 1, yi);
    const c = vhash(xi, yi + 1), d = vhash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function curl(x, y, t) {
    const e = 0.6;
    const dy = (vnoise(x, y + e + t) - vnoise(x, y - e + t)) / (2 * e);
    const dx = (vnoise(x + e, y + t) - vnoise(x - e, y + t)) / (2 * e);
    return [dy, -dx];
  }

  const parts = [];
  let spawnBudget = 0;
  window.__hfParts = () => parts.length; // debug: live particle count

  function simulate(dt, time) {
    /* spawn only while the cursor is present and actually moving */
    if (presenceT > 0.5 && speed > 1.2) {
      spawnBudget += Math.min(speed * 0.022, 1.4);
      while (spawnBudget >= 1 && parts.length < ACTIVE_MAX) {
        spawnBudget -= 1;
        const a = Math.random() * Math.PI * 2;
        const rr = Math.random() * 30;
        parts.push({
          x: mx + Math.cos(a) * rr,
          y: my + Math.sin(a) * rr,
          life: 1,
          dur: 0.8 + Math.random() * 0.45,     // ~1s
          size: 1.4 + Math.random() * 1.6,
          ix: (tx - lastMX) * 0.22,
          iy: (ty - lastMY) * 0.22,
          hist: [],
        });
      }
    } else {
      spawnBudget = 0;
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt / p.dur;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const [cx, cy] = curl(p.x * 0.004, p.y * 0.004, time * 0.25);
      const drift = 30 + 70 * energy;
      p.ix *= 0.9; p.iy *= 0.9;
      p.x += (cx * drift + p.ix) * dt * 3.2;
      p.y += (cy * drift + p.iy) * dt * 3.2;
      p.hist.push(p.x, p.y);
      if (p.hist.length > 8) p.hist.splice(0, 2);
    }

    uniforms.uCount.value = parts.length;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const eased = p.life * p.life * (3 - 2 * p.life); // smooth in+out
      partsU[i].set(p.x, p.y, eased, p.size * renderer.getPixelRatio());
      prevU[i].set(p.hist[0], p.hist[1]);
    }
  }

  /* ---------------- loop (paused when hero off-screen) ---------------- */
  let running = false;
  let rafId = 0;
  let last = performance.now();

  function frameLoop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    /* smooth cursor — silk easing, everything settles slowly */
    const pmx = mx, pmy = my;
    if (mx > -9000) {
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
    }
    const frameSpeed = Math.hypot(mx - pmx, my - pmy);
    speed = speed * 0.85 + frameSpeed * 0.15;
    const energyT = Math.min(speed / 14, 1);
    energy += (energyT - energy) * (energyT > energy ? 0.10 : 0.025);
    uniforms.uEnergy.value = energy;
    uniforms.uPresence.value += (presenceT - uniforms.uPresence.value) * 0.035;
    uniforms.uMouse.value.set(mx, my);
    uniforms.uTime.value += dt;
    lastMX = tx; lastMY = ty;

    simulate(dt, uniforms.uTime.value);
    renderer.render(scene, cam);
    rafId = requestAnimationFrame(frameLoop);
  }

  const io = new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (vis && !running) {
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frameLoop);
    } else if (!vis && running) {
      running = false;
      cancelAnimationFrame(rafId);
    }
  });
  io.observe(hero);
})();
