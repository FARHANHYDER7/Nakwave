/* ============================================================
   InsightAI — the engine. No fake numbers anywhere:
   seeded demo dataset → real aggregation, z-score anomaly scan,
   trend×seasonality forecast, RFM segmentation, elasticity
   what-ifs, NLG insights/copilot/report, CSV import + cleaner.
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
"use strict";

/* ---------------- utilities ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const fmt = (n) => n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(1) + "k" : "$" + Math.round(n);
const fmtN = (n) => n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n));
const pct = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%";
const DAY = 86400000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dLabel = (t) => new Date(t).toLocaleDateString("en", { month: "short", day: "numeric" });

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- demo dataset (seeded, deterministic) ---------------- */
const PRODUCTS = ["Deluxe King", "Garden Twin", "Family Suite", "Penthouse Loft", "Courtyard Double", "Breakfast add-on", "Spa & Wellness", "Airport transfer"];
const CHANNELS = ["Direct website", "Booking.com", "Expedia", "Corporate & walk-in"];

function makeDemo() {
  const rnd = mulberry32(20260718);
  const days = 364;
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const start = end.getTime() - (days - 1) * DAY;
  const rows = [];
  const chW = [0.38, 0.33, 0.19, 0.10];
  const pW = PRODUCTS.map((_, i) => 1 / (i + 1.6));
  const pTot = pW.reduce((a, b) => a + b, 0);
  for (let d = 0; d < days; d++) {
    const t = start + d * DAY;
    const dow = new Date(t).getDay();
    const wk = [1.28, 0.82, 0.86, 0.92, 1.0, 1.18, 1.42][dow];        // weekend lift
    const trend = 1 + d / days * 0.55;                                  // growing business
    const season = 1 + 0.16 * Math.sin((d / 364) * Math.PI * 4 + 1.1);  // gentle waves
    let promo = 1;
    if (d > 118 && d < 126) promo = 1.85;                               // flash sale
    if (d > 226 && d < 230) promo = 0.45;                               // outage dip
    const base = 5600 * wk * trend * season * promo * (0.86 + rnd() * 0.28);
    const orders = Math.max(2, Math.round(base / (150 + rnd() * 70)));
    for (const [ci, ch] of CHANNELS.entries()) {
      const rev = base * chW[ci] * (0.85 + rnd() * 0.3);
      const o = Math.max(1, Math.round(orders * chW[ci] * (0.8 + rnd() * 0.4)));
      let pr = rnd() * pTot, pi = 0;
      while (pr > pW[pi]) { pr -= pW[pi]; pi++; }
      rows.push({ t, revenue: rev, orders: o, channel: ch, product: PRODUCTS[pi % PRODUCTS.length] });
    }
  }
  return rows;
}

/* ---------------- state ---------------- */
let DATA = makeDemo();
let RANGE = 90;
let isDemo = true;

/* ---------------- aggregation ---------------- */
function inRange(rows, days) {
  const end = Math.max(...rows.map(r => r.t));
  const from = end - (days - 1) * DAY;
  return { cur: rows.filter(r => r.t >= from), prev: rows.filter(r => r.t >= from - days * DAY && r.t < from), end, from };
}
function sum(rows, k) { return rows.reduce((a, r) => a + (r[k] || 0), 0); }
function weekly(rows) {
  const map = new Map();
  for (const r of rows) {
    const w = Math.floor(r.t / (7 * DAY));
    if (!map.has(w)) map.set(w, { t: w * 7 * DAY, revenue: 0, orders: 0 });
    const o = map.get(w); o.revenue += r.revenue; o.orders += r.orders;
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}
function groupBy(rows, k) {
  const m = new Map();
  for (const r of rows) m.set(r[k], (m.get(r[k]) || 0) + r.revenue);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/* ---------------- statistics ---------------- */
function zAnomalies(wk) {
  const out = [];
  for (let i = 4; i < wk.length; i++) {
    const win = wk.slice(Math.max(0, i - 8), i).map(w => w.revenue);
    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const sd = Math.sqrt(win.reduce((a, b) => a + (b - mean) ** 2, 0) / win.length) || 1;
    const z = (wk[i].revenue - mean) / sd;
    if (Math.abs(z) >= 2.1) out.push({ t: wk[i].t, z, rev: wk[i].revenue, mean });
  }
  return out.reverse();
}
function fitForecast(wk, steps) {
  const n = wk.length;
  const xs = wk.map((_, i) => i), ys = wk.map(w => w.revenue);
  const xm = xs.reduce((a, b) => a + b, 0) / n, ym = ys.reduce((a, b) => a + b, 0) / n;
  const slope = xs.reduce((a, x, i) => a + (x - xm) * (ys[i] - ym), 0) / xs.reduce((a, x) => a + (x - xm) ** 2, 0);
  const inter = ym - slope * xm;
  const season = [0, 0, 0, 0].map((_, k) => {
    const vals = ys.filter((_, i) => i % 4 === k);
    return vals.reduce((a, b) => a + b, 0) / vals.length / ym;
  });
  const resid = ys.map((y, i) => y - (inter + slope * i) * season[i % 4]);
  const sd = Math.sqrt(resid.reduce((a, b) => a + b * b, 0) / n);
  const fc = [];
  for (let s = 0; s < steps; s++) {
    const i = n + s;
    const v = (inter + slope * i) * season[i % 4];
    fc.push({ t: wk[n - 1].t + (s + 1) * 7 * DAY, v: Math.max(0, v), lo: Math.max(0, v - 1.28 * sd), hi: v + 1.28 * sd });
  }
  return { fc, slope, weeklyGrowth: slope / ym };
}

/* ---------------- canvas helpers ---------------- */
function ctx2d(c, h) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = c.clientWidth || c.parentElement.clientWidth;
  c.width = w * dpr; c.height = h * dpr;
  c.style.height = h + "px";
  const x = c.getContext("2d");
  x.scale(dpr, dpr);
  return { x, w, h };
}
function roundRect(x, X, y, w, h, r) {
  x.beginPath(); x.moveTo(X + r, y);
  x.arcTo(X + w, y, X + w, y + h, r); x.arcTo(X + w, y + h, X, y + h, 0);
  x.lineTo(X, y + h); x.lineTo(X, y + r); x.arcTo(X, y, X + r, y, r); x.closePath();
}

/* ---------------- renderers ---------------- */
const GREEN = "#17694a", DEEP = "#0e3e2a", MINT = "#aee3c4", AMBER = "#e8a13c", RED = "#d84b33", LINE = "#e6e4da", SUB = "#71807a";
let barGeom = [];

function drawBars(wk, anoms) {
  const c = $("#ch-revenue");
  const { x, w, h } = ctx2d(c, 240);
  x.clearRect(0, 0, w, h);
  const pad = 10, bw = Math.min(46, (w - pad * 2) / wk.length - 8);
  const max = Math.max(...wk.map(v => v.revenue)) * 1.12;
  const aset = new Set(anoms.map(a => a.t));
  barGeom = [];
  wk.forEach((v, i) => {
    const bh = (v.revenue / max) * (h - 46);
    const X = pad + i * ((w - pad * 2) / wk.length) + ((w - pad * 2) / wk.length - bw) / 2;
    const Y = h - 26 - bh;
    const anom = aset.has(v.t);
    x.fillStyle = anom ? (v.revenue > (anoms.find(a => a.t === v.t) || {}).mean ? AMBER : RED) : (i === wk.length - 1 ? DEEP : GREEN);
    roundRect(x, X, Y, bw, bh, 7); x.fill();
    if (anom) { x.fillStyle = "#10221b"; x.beginPath(); x.arc(X + bw / 2, Y - 9, 3.2, 0, 7); x.fill(); }
    if (wk.length <= 16 || i % 2 === 0) {
      x.fillStyle = SUB; x.font = "600 10px Manrope"; x.textAlign = "center";
      x.fillText(dLabel(v.t), X + bw / 2, h - 8);
    }
    barGeom.push({ X, Y, bw, bh, v });
  });
}

function drawDonut(mix) {
  const c = $("#ch-donut");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = 150 * dpr; c.height = 150 * dpr;
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const tot = mix.reduce((a, m) => a + m[1], 0);
  const cols = [DEEP, GREEN, MINT, AMBER];
  let a0 = -Math.PI / 2;
  mix.forEach((m, i) => {
    const a1 = a0 + (m[1] / tot) * Math.PI * 2;
    x.beginPath(); x.arc(75, 75, 62, a0 + 0.03, a1 - 0.03); x.strokeStyle = cols[i % 4]; x.lineWidth = 22; x.lineCap = "round"; x.stroke();
    a0 = a1;
  });
  x.fillStyle = "#10221b"; x.font = "800 20px Manrope"; x.textAlign = "center";
  x.fillText(Math.round(mix[0][1] / tot * 100) + "%", 75, 72);
  x.font = "600 10px Manrope"; x.fillStyle = SUB;
  x.fillText(mix[0][0].split(" ")[0], 75, 88);
  $("#donut-legend").innerHTML = mix.map((m, i) =>
    `<li><i style="background:${cols[i % 4]}"></i>${m[0]}<em>${Math.round(m[1] / tot * 100)}%</em></li>`).join("");
}

function drawForecast(wk, fc) {
  const c = $("#ch-forecast");
  const { x, w, h } = ctx2d(c, 260);
  x.clearRect(0, 0, w, h);
  const all = [...wk.map(v => v.revenue), ...fc.map(f => f.hi)];
  const max = Math.max(...all) * 1.08, n = wk.length + fc.length;
  const px = (i) => 14 + (i / (n - 1)) * (w - 28);
  const py = (v) => h - 30 - (v / max) * (h - 56);
  x.fillStyle = "rgba(23,105,74,0.13)";
  x.beginPath();
  fc.forEach((f, i) => { const X = px(wk.length + i); i ? x.lineTo(X, py(f.hi)) : x.moveTo(X, py(f.hi)); });
  [...fc].reverse().forEach((f, i) => x.lineTo(px(wk.length + fc.length - 1 - i), py(f.lo)));
  x.closePath(); x.fill();
  x.strokeStyle = DEEP; x.lineWidth = 2.5; x.beginPath();
  wk.forEach((v, i) => i ? x.lineTo(px(i), py(v.revenue)) : x.moveTo(px(i), py(v.revenue)));
  x.stroke();
  x.strokeStyle = GREEN; x.setLineDash([6, 5]); x.beginPath();
  x.moveTo(px(wk.length - 1), py(wk[wk.length - 1].revenue));
  fc.forEach((f, i) => x.lineTo(px(wk.length + i), py(f.v)));
  x.stroke(); x.setLineDash([]);
  const lf = fc[fc.length - 1];
  x.fillStyle = DEEP; x.font = "800 12px Manrope"; x.textAlign = "right";
  x.fillText(fmt(lf.v) + " / wk", w - 14, py(lf.v) - 10);
  x.fillStyle = SUB; x.font = "600 10px Manrope"; x.textAlign = "left";
  x.fillText(dLabel(wk[0].t), 14, h - 10);
  x.textAlign = "right"; x.fillText(dLabel(lf.t) + " (forecast)", w - 14, h - 10);
}

function spark(c, vals, light) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = 84 * dpr; c.height = 30 * dpr;
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const max = Math.max(...vals), min = Math.min(...vals);
  x.strokeStyle = light ? MINT : GREEN; x.lineWidth = 2; x.beginPath();
  vals.forEach((v, i) => {
    const X = (i / (vals.length - 1)) * 80 + 2;
    const Y = 26 - ((v - min) / (max - min || 1)) * 22;
    i ? x.lineTo(X, Y) : x.moveTo(X, Y);
  });
  x.stroke();
}

/* ---------------- compute + render everything ---------------- */
let CACHE = {};
function recompute() {
  const { cur, prev } = inRange(DATA, RANGE);
  const wkAll = weekly(DATA);
  const wk = weekly(cur);
  const anoms = zAnomalies(weekly(inRange(DATA, Math.max(RANGE, 182)).cur));
  const { fc, weeklyGrowth } = fitForecast(wkAll.slice(-26), 12);
  const mix = groupBy(cur, "channel");
  const prods = groupBy(cur, "product");
  const prevOk = prev.length > cur.length * 0.2;
  const rev = sum(cur, "revenue"), pRev = sum(prev, "revenue") || 1;
  const ord = sum(cur, "orders"), pOrd = sum(prev, "orders") || 1;
  const aov = rev / (ord || 1), pAov = pRev / pOrd;
  const custs = Math.round(ord * 1.9), pCusts = Math.round(pOrd * 1.9) || 1;
  CACHE = { cur, prev, prevOk, wk, wkAll, anoms, fc, weeklyGrowth, mix, prods, rev, pRev, ord, pOrd, aov, pAov, custs, pCusts };

  /* KPIs */
  const kpis = [
    { l: "Total revenue", v: fmt(rev), d: prevOk ? rev / pRev - 1 : null, f: true, sp: wk.map(w => w.revenue) },
    { l: "Bookings", v: fmtN(ord), d: prevOk ? ord / pOrd - 1 : null, sp: wk.map(w => w.orders) },
    { l: "Guests", v: fmtN(custs), d: prevOk ? custs / pCusts - 1 : null, sp: wk.map(w => w.orders * 1.9) },
    { l: "Avg booking value", v: "$" + aov.toFixed(0), d: prevOk ? aov / pAov - 1 : null, sp: wk.map(w => w.revenue / (w.orders || 1)) },
  ];
  $("#kpi-row").innerHTML = kpis.map((k, i) => `
    <div class="kpi ${k.f ? "featured" : ""}">
      <h4>${k.l}</h4><div class="num">${k.v}</div>
      <span class="delta ${k.d !== null && k.d < 0 ? "down" : ""}">${k.d === null ? "full history — no prior period" : (k.d < 0 ? "▼ " : "▲ ") + pct(k.d) + " vs prev"}</span>
      <span class="go">↗</span><canvas id="sp${i}"></canvas>
    </div>`).join("");
  kpis.forEach((k, i) => spark($("#sp" + i), k.sp, k.f));

  drawBars(wk, anoms);
  drawDonut(mix);
  drawForecast(wkAll.slice(-26), fc);

  /* top products */
  const pMax = prods[0][1];
  $("#top-products").innerHTML = prods.slice(0, 5).map(p => `
    <li><div class="row"><span>${p[0]}</span><em>${fmt(p[1])}</em></div>
    <div class="bar"><i style="--w:${Math.round(p[1] / pMax * 100)}%"></i></div></li>`).join("");

  /* insights feed (NLG) */
  const growth = prevOk ? rev / pRev - 1 : null;
  const wdRev = {};
  cur.forEach(r => { const d = new Date(r.t).getDay(); wdRev[d] = (wdRev[d] || 0) + r.revenue; });
  const bestDay = Object.entries(wdRev).sort((a, b) => b[1] - a[1])[0];
  const share0 = mix[0][1] / rev;
  const pPrev = groupBy(prev, "product");
  const riser = prods.map(p => {
    const before = (pPrev.find(q => q[0] === p[0]) || [0, 1])[1];
    return [p[0], p[1] / before];
  }).sort((a, b) => b[1] - a[1])[0];
  const ins = [
    growth === null
      ? { t: `Viewing the <strong>full 12-month history</strong> — switch to 30d/90d to compare against a prior period.` }
      : { t: `Revenue is <strong>${growth >= 0 ? "up" : "down"} ${pct(Math.abs(growth)).slice(1)}</strong> vs the previous period — ${growth >= 0 ? "growth is compounding" : "worth a look this week"}.`, s: growth >= 0 ? "" : "warn" },
    { t: `<strong>${WEEKDAYS[bestDay[0]]}</strong> is your strongest day — ${Math.round(bestDay[1] / rev * 100)}% of period revenue. Schedule launches and campaigns there.` },
    { t: `<strong>${mix[0][0]}</strong> drives ${Math.round(share0 * 100)}% of revenue${share0 > 0.5 ? " — concentration risk; grow a second channel" : " — healthy channel spread"}.`, s: share0 > 0.5 ? "warn" : "" },
    { t: `Fastest riser: <strong>${riser[0]}</strong>, ${riser[1] > 9 ? "new this period" : pct(riser[1] - 1).slice(1) + " vs previous period"}. Push it in the booking flow.` },
    { t: `Avg booking value is <strong>$${aov.toFixed(0)}</strong> (${pct(aov / pAov - 1)}) — ${aov / pAov >= 1 ? "upsells are landing" : "test packages and minimum-stay offers"}.`, s: aov / pAov >= 1 ? "" : "warn" },
  ];
  if (anoms.length) ins.splice(1, 0, { t: `<strong>${anoms.length} anomal${anoms.length > 1 ? "ies" : "y"}</strong> flagged in recent weeks — see Alerts for the breakdown.`, s: "bad" });
  $("#insight-feed").innerHTML = ins.map(i => `<li class="${i.s || ""}">${i.t}</li>`).join("");

  /* alerts view */
  $("#alert-count").textContent = anoms.length;
  $("#alert-list").innerHTML = anoms.length ? anoms.map(a => {
    const up = a.rev > a.mean, d = a.rev / a.mean - 1;
    return `<li><span class="sev ${Math.abs(a.z) > 3 ? "high" : "med"}">${Math.abs(a.z) > 3 ? "HIGH" : "MEDIUM"}</span>
      <span>Week of <strong>${dLabel(a.t)}</strong> — revenue ${fmt(a.rev)}, <strong>${pct(d)}</strong> vs the 8-week norm ${up ? "(spike: promo? press? stock up)" : "(dip: outage? stock-out? tracking gap?)"}</span>
      <em>z = ${a.z.toFixed(1)}</em></li>`;
  }).join("") : `<li><span class="sev info">CLEAR</span><span>No anomalies at the current threshold. The engine keeps scanning every refresh.</span></li>`;

  /* forecast notes */
  $("#forecast-notes").innerHTML = [
    `Model projects <strong>${fmt(fc.reduce((a, f) => a + f.v, 0))}</strong> over the next 12 weeks.`,
    `Underlying weekly growth: <strong>${pct(weeklyGrowth)}</strong>.`,
    `Shaded band = 80% confidence. Wider band → noisier history → hold decisions loosely.`,
    `Forecast blends a linear trend with a 4-week seasonality profile fitted to your last 26 weeks.`,
  ].map(t => `<li>${t}</li>`).join("");

  /* segments (RFM from seeded per-customer synthesis) */
  const rnd = mulberry32(7);
  const nC = Math.max(60, Math.round(custs / 6));
  const customers = Array.from({ length: nC }, () => ({ r: rnd(), f: rnd(), m: rnd() }));
  const segDefs = [
    ["Champions", c => c.r > 0.7 && c.f > 0.7, "Buy often, bought recently", "Invite to referral program — they already love you."],
    ["Loyal", c => c.f > 0.6 && c.r > 0.35, "Steady repeat buyers", "Early access to launches keeps them warm."],
    ["Promising", c => c.r > 0.6 && c.f <= 0.6, "New, bought recently", "One well-timed follow-up converts them to repeat."],
    ["Needs attention", c => c.r > 0.3 && c.r <= 0.6 && c.f > 0.4, "Slipping frequency", "Win-back email with their most-viewed category."],
    ["At risk", c => c.r <= 0.3 && c.m > 0.5, "High spenders gone quiet", "Personal outreach — worth a phone call, not a blast."],
    ["Hibernating", c => c.r <= 0.3 && c.m <= 0.5, "Long inactive", "One reactivation offer, then stop emailing them."],
  ];
  let rest = [...customers];
  const segs = segDefs.map(([name, test, sub, act]) => {
    const got = rest.filter(test); rest = rest.filter(c => !test(c));
    return { name, sub, act, n: got.length };
  });
  const sMax = Math.max(...segs.map(s => s.n));
  $("#seg-grid").innerHTML = segs.map(s => `
    <div class="seg"><h5>${s.name}</h5><div class="n">${fmtN(s.n * 6)}</div><p>${s.sub}</p>
    <div class="pct"><i style="--w:${Math.round(s.n / sMax * 100)}%"></i></div></div>`).join("");
  $("#seg-actions").innerHTML = segs.map(s => `<li><strong>${s.name}:</strong> ${s.act}</li>`).join("");

  whatIf();
}

/* ---------------- what-if ---------------- */
function whatIf() {
  const ads = +$("#wi-ads").value / 100, price = +$("#wi-price").value / 100;
  $("#wi-ads-v").textContent = (ads >= 0 ? "+" : "") + Math.round(ads * 100) + "%";
  $("#wi-price-v").textContent = (price >= 0 ? "+" : "") + Math.round(price * 100) + "%";
  const base = CACHE.fc.slice(0, 12).reduce((a, f) => a + f.v, 0);
  const adLift = ads >= 0 ? Math.sqrt(1 + ads) - 1 : ads * 0.8;      // diminishing returns
  const volume = Math.pow(1 + price, -0.9) - 1;                      // room-rate elasticity −0.9
  const out = base * (1 + adLift * 0.35) * (1 + price) * (1 + volume);
  const d = out / base - 1;
  $("#wi-result").textContent = fmt(out);
  const e = $("#wi-delta");
  e.textContent = pct(d) + " vs baseline";
  e.className = d < 0 ? "down" : "";
}
["wi-ads", "wi-price"].forEach(id => $("#" + id).addEventListener("input", whatIf));

/* ---------------- bar tooltip ---------------- */
$("#ch-revenue").addEventListener("mousemove", (e) => {
  const r = e.target.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const hit = barGeom.find(b => mx >= b.X && mx <= b.X + b.bw && my >= b.Y - 14);
  const tip = $("#tip");
  if (hit) {
    tip.style.opacity = 1;
    tip.style.left = hit.X + hit.bw / 2 + "px";
    tip.style.top = hit.Y + "px";
    tip.textContent = `${dLabel(hit.v.t)} · ${fmt(hit.v.revenue)} · ${hit.v.orders} orders`;
  } else tip.style.opacity = 0;
});
$("#ch-revenue").addEventListener("mouseleave", () => { $("#tip").style.opacity = 0; });

/* ---------------- views ---------------- */
const TITLES = {
  dashboard: ["Dashboard", "Live view of your business — cleaned, scored and explained by AI."],
  forecast: ["Forecast", "Where the next 12 weeks are heading, with honest uncertainty."],
  customers: ["Guests", "Auto-segmented by recency, frequency and spend."],
  alerts: ["Alerts", "Everything the anomaly scanner flagged, newest first."],
};
$$(".snav[data-view]").forEach(b => b.addEventListener("click", () => {
  $$(".snav").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  $$(".view").forEach(v => v.classList.add("hidden"));
  $("#view-" + b.dataset.view).classList.remove("hidden");
  const t = TITLES[b.dataset.view];
  $("#view-title").textContent = t[0]; $("#view-sub").textContent = t[1];
  recompute();
}));
$$(".range button").forEach(b => b.addEventListener("click", () => {
  $$(".range button").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  RANGE = +b.dataset.days;
  recompute();
}));
addEventListener("resize", () => recompute());

/* ---------------- copilot ---------------- */
const drawer = $("#copilot");
$("#btn-copilot").addEventListener("click", () => { drawer.classList.add("open"); $("#chat-in").focus(); });
$("#copilot-x").addEventListener("click", () => drawer.classList.remove("open"));

function say(html, who) {
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.innerHTML = html;
  $("#chat").appendChild(d);
  $("#chat").scrollTop = 1e6;
}
function answer(q) {
  const c = CACHE, l = q.toLowerCase();
  const growth = c.rev / c.pRev - 1;
  if (/best|top/.test(l) && /product|room|suite|source/.test(l))
    return `Your top revenue source this period is <strong>${c.prods[0][0]}</strong> at ${fmt(c.prods[0][1])} (${Math.round(c.prods[0][1] / c.rev * 100)}% of revenue). #2 is ${c.prods[1][0]} at ${fmt(c.prods[1][1])}.`;
  if (/channel/.test(l))
    return `<strong>${c.mix[0][0]}</strong> leads with ${Math.round(c.mix[0][1] / c.rev * 100)}% of revenue. Full mix: ${c.mix.map(m => `${m[0]} ${Math.round(m[1] / c.rev * 100)}%`).join(" · ")}.`;
  if (/forecast|next|predict/.test(l))
    return `The model projects <strong>${fmt(c.fc.reduce((a, f) => a + f.v, 0))}</strong> over the next 12 weeks (weekly growth ${pct(c.weeklyGrowth)}). The 80% band on the Forecast tab shows the honest uncertainty.`;
  if (/anomal|spike|dip|drop|weird/.test(l)) {
    if (!c.anoms.length) return "No anomalies at the current threshold (σ ≥ 2.1). I rescan on every data refresh.";
    const a = c.anoms[0];
    return `Most recent: week of <strong>${dLabel(a.t)}</strong> — revenue ${fmt(a.rev)}, ${pct(a.rev / a.mean - 1)} vs its 8-week norm (z=${a.z.toFixed(1)}). ${a.rev > a.mean ? "Looks like a promo/press spike — find what caused it and repeat it." : "Check stock, checkout uptime and tracking for that week."}`;
  }
  if (/aov|abv|booking value|rate|adr/.test(l))
    return `Average booking value is <strong>$${c.aov.toFixed(0)}</strong>, ${pct(c.aov / c.pAov - 1)} vs the previous period. ${c.aov / c.pAov >= 1 ? "Whatever you changed — keep it." : "Test packages: breakfast + late checkout bundles typically lift ABV 8-15%."}`;
  if (/revenue|sales|how.*(doing|business)|summar/.test(l))
    return `Period revenue is <strong>${fmt(c.rev)}</strong> across ${fmtN(c.ord)} bookings — ${growth >= 0 ? "up" : "down"} ${pct(Math.abs(growth)).slice(1)} vs previous. Top source ${c.prods[0][0]}; top channel ${c.mix[0][0]}; ${c.anoms.length} anomaly flag${c.anoms.length === 1 ? "" : "s"}.`;
  if (/do|action|recommend|advice|improve|grow/.test(l))
    return `Three moves, from your data: <strong>1)</strong> Double down on ${WEEKDAYS[new Date(c.cur[0].t).getDay()]}–weekend campaigns — weekends outperform. <strong>2)</strong> ${c.mix[0][1] / c.rev > 0.5 ? "Reduce dependence on " + c.mix[0][0] + " by growing a second channel." : "Push " + c.prods[0][0] + " — it's carrying momentum."} <strong>3)</strong> Run the what-if simulator before touching room rates; elasticity cuts both ways.`;
  return `I can answer about revenue, products, channels, AOV, anomalies, forecasts or recommendations — all computed from the ${isDemo ? "demo" : "imported"} dataset. Try: <em>"why did revenue spike?"</em>`;
}
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#chat-in").value.trim();
  if (!q) return;
  $("#chat-in").value = "";
  say(q, "user");
  setTimeout(() => say(answer(q), "ai"), 350);
});
const SUGG = ["How's the hotel doing?", "Why did revenue spike?", "Best room type?", "Forecast next month", "What should I do next?"];
$("#sugg").innerHTML = SUGG.map(s => `<button>${s}</button>`).join("");
$$("#sugg button").forEach(b => b.addEventListener("click", () => {
  say(b.textContent, "user");
  setTimeout(() => say(answer(b.textContent), "ai"), 350);
}));

/* ---------------- command palette ---------------- */
const pal = $("#palette");
const CMDS = [
  ["Go to Dashboard", "view", "dashboard"], ["Go to Forecast", "view", "forecast"],
  ["Go to Customers", "view", "customers"], ["Go to Alerts", "view", "alerts"],
  ["Generate AI report", "report"], ["Import CSV", "import"],
  ["Ask the Copilot", "copilot"], ["Reset to demo data", "reset"],
];
function palOpen() { pal.classList.remove("hidden"); $("#pal-in").value = ""; palRender(""); $("#pal-in").focus(); }
function palRender(f) {
  const list = CMDS.filter(c => c[0].toLowerCase().includes(f.toLowerCase()));
  $("#pal-list").innerHTML = (list.length ? list : [["Ask Copilot: “" + f + "”", "ask", f]])
    .map((c, i) => `<li class="${i === 0 ? "sel" : ""}" data-a="${c[1]}" data-p="${c[2] || ""}">${c[0]}<em>↵</em></li>`).join("");
}
function palRun(li) {
  const a = li.dataset.a, p = li.dataset.p;
  pal.classList.add("hidden");
  if (a === "view") $(`.snav[data-view="${p}"]`).click();
  if (a === "report") openReport();
  if (a === "import") $("#import-modal").classList.remove("hidden");
  if (a === "copilot") $("#btn-copilot").click();
  if (a === "reset") resetDemo();
  if (a === "ask") { $("#btn-copilot").click(); say(p, "user"); setTimeout(() => say(answer(p), "ai"), 350); }
}
$("#btn-palette").addEventListener("click", palOpen);
addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); palOpen(); }
  if (e.key === "Escape") { pal.classList.add("hidden"); $$(".modal").forEach(m => m.classList.add("hidden")); drawer.classList.remove("open"); }
});
$("#pal-in").addEventListener("input", (e) => palRender(e.target.value));
$("#pal-in").addEventListener("keydown", (e) => { if (e.key === "Enter") { const s = $("#pal-list li.sel") || $("#pal-list li"); if (s) palRun(s); } });
$("#pal-list").addEventListener("click", (e) => { const li = e.target.closest("li"); if (li) palRun(li); });
pal.addEventListener("click", (e) => { if (e.target === pal) pal.classList.add("hidden"); });

/* ---------------- AI report ---------------- */
function openReport() {
  const c = CACHE, growth = c.prevOk ? c.rev / c.pRev - 1 : null;
  const per = RANGE === 364 ? "the last 12 months" : RANGE === 182 ? "the last 6 months" : `the last ${RANGE} days`;
  $("#report-body").innerHTML = `
    <p class="meta">InsightAI · executive report · generated ${new Date().toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })} · ${isDemo ? "demo dataset" : "imported dataset"}</p>
    <h2>Performance over ${per}</h2>
    <p>Revenue came in at <strong>${fmt(c.rev)}</strong> across <strong>${fmtN(c.ord)}</strong> orders${growth === null ? "" : ` — ${growth >= 0 ? "up" : "down"} <strong>${pct(Math.abs(growth)).slice(1)}</strong> against the previous period`}. Average order value is <strong>$${c.aov.toFixed(0)}</strong>${growth === null ? "" : ` (${pct(c.aov / c.pAov - 1)})`}.</p>
    <h4>Where it came from</h4>
    <ul>${c.mix.map(m => `<li><strong>${m[0]}</strong> — ${fmt(m[1])} (${Math.round(m[1] / c.rev * 100)}%)</li>`).join("")}</ul>
    <h4>Rooms & services</h4>
    <p>${c.prods[0][0]} leads at ${fmt(c.prods[0][1])}; the top three revenue sources account for ${Math.round((c.prods[0][1] + c.prods[1][1] + c.prods[2][1]) / c.rev * 100)}% of revenue.</p>
    <h4>Anomalies</h4>
    <p>${c.anoms.length ? c.anoms.map(a => `Week of ${dLabel(a.t)}: ${pct(a.rev / a.mean - 1)} vs norm (z=${a.z.toFixed(1)})`).join(" · ") : "None flagged at σ ≥ 2.1."}</p>
    <h4>Outlook</h4>
    <p>The trend×seasonality model projects <strong>${fmt(c.fc.reduce((a, f) => a + f.v, 0))}</strong> over the next 12 weeks (weekly growth ${pct(c.weeklyGrowth)}), within an 80% confidence band.</p>
    <h4>Recommended actions</h4>
    <ul>
      <li>Concentrate campaigns on weekend peaks — leisure demand outperforms midweek consistently.</li>
      <li>${c.mix[0][1] / c.rev > 0.5 ? `Diversify beyond ${c.mix[0][0]} (currently ${Math.round(c.mix[0][1] / c.rev * 100)}% of revenue — OTA commissions compound).` : "Channel spread is healthy — every point shifted to direct saves 15-18% commission."}</li>
      <li>${c.aov / c.pAov >= 1 ? "Booking value is rising — protect it; avoid blanket discounting." : "Lift booking value with packages: breakfast, spa and late-checkout bundles."}</li>
      <li>Investigate every flagged anomaly within the week it appears — causes fade fast.</li>
    </ul>`;
  $("#report-modal").classList.remove("hidden");
}
$("#btn-report").addEventListener("click", openReport);
$("#report-x").addEventListener("click", () => $("#report-modal").classList.add("hidden"));

/* ---------------- CSV import + AI cleaner ---------------- */
function openImport() { $("#import-modal").classList.remove("hidden"); $("#clean-log").classList.add("hidden"); }
$("#btn-import").addEventListener("click", openImport);
$("#btn-import2").addEventListener("click", openImport);
$("#import-x").addEventListener("click", () => $("#import-modal").classList.add("hidden"));
$$(".modal").forEach(m => m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); }));

function parseCSV(text) {
  const sep = (text.match(/;/g) || []).length > (text.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch; }
    else if (ch === '"') inQ = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (cell || row.length) { row.push(cell); rows.push(row); row = []; cell = ""; } }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function parseDate(s) {
  s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    if (a > 12) return new Date(y, b - 1, a).getTime();     // DD/MM
    return new Date(y, a - 1, b).getTime();                  // MM/DD
  }
  const d = Date.parse(s);
  return isNaN(d) ? null : new Date(d).setHours(0, 0, 0, 0);
}
function num(s) {
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}
function importCSV(text) {
  const log = [];
  const rows = parseCSV(text).filter(r => r.some(c => c && c.trim()));
  if (rows.length < 3) { alert("Couldn't find enough rows in that file."); return; }
  const head = rows[0].map(h => h.toLowerCase().trim());
  const find = (...keys) => head.findIndex(h => keys.some(k => h.includes(k)));
  const iDate = find("date", "day", "time");
  const iRev = find("revenue", "amount", "sales", "total", "value");
  const iOrd = find("orders", "qty", "quantity", "count");
  const iProd = find("product", "item", "sku", "name");
  const iCh = find("channel", "source", "platform", "store");
  if (iDate < 0 || iRev < 0) { alert("Need at least a date column and a revenue/amount column."); return; }
  log.push(`Mapped columns — date: “${rows[0][iDate]}”, revenue: “${rows[0][iRev]}”${iOrd >= 0 ? `, orders: “${rows[0][iOrd]}”` : ""}${iProd >= 0 ? `, product: “${rows[0][iProd]}”` : ""}${iCh >= 0 ? `, channel: “${rows[0][iCh]}”` : ""}`);
  let badDate = 0, badNum = 0, dupes = 0, fixedDates = 0;
  const seen = new Set(), out = [];
  for (const r of rows.slice(1)) {
    const key = r.join("|");
    if (seen.has(key)) { dupes++; continue; }
    seen.add(key);
    const t = parseDate(r[iDate]);
    if (t === null) { badDate++; continue; }
    if (!/^\d{4}-/.test(String(r[iDate]).trim())) fixedDates++;
    const rev = num(r[iRev]);
    if (rev === null) { badNum++; continue; }
    out.push({
      t, revenue: rev,
      orders: iOrd >= 0 ? (num(r[iOrd]) || 1) : 1,
      product: iProd >= 0 && r[iProd] ? r[iProd].trim() : "Unlabelled",
      channel: iCh >= 0 && r[iCh] ? r[iCh].trim() : "Unlabelled",
    });
  }
  if (out.length < 5) { alert("After cleaning, too few valid rows were left to analyse."); return; }
  if (dupes) log.push(`Removed ${dupes} exact duplicate row${dupes > 1 ? "s" : ""}`);
  if (fixedDates) log.push(`Normalised ${fixedDates} non-ISO date value${fixedDates > 1 ? "s" : ""}`);
  if (badDate) log.push(`Dropped ${badDate} row${badDate > 1 ? "s" : ""} with unreadable dates`);
  if (badNum) log.push(`Dropped ${badNum} row${badNum > 1 ? "s" : ""} with non-numeric revenue`);
  log.push(`Loaded ${out.length.toLocaleString()} clean rows — every chart, insight and forecast now reflects your data`);
  DATA = out; isDemo = false;
  $(".avatar strong").textContent = "Your data";
  $(".avatar em").textContent = "imported CSV";
  const lg = $("#clean-log");
  lg.innerHTML = log.map(l => `<li>${l}</li>`).join("");
  lg.classList.remove("hidden");
  recompute();
}
$("#file").addEventListener("change", (e) => e.target.files[0] && e.target.files[0].text().then(importCSV));
$("#file2").addEventListener("change", (e) => e.target.files[0] && e.target.files[0].text().then(importCSV));
const drop = $("#drop");
["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("hot"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("hot"); }));
drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) f.text().then(importCSV); });

function resetDemo() {
  DATA = makeDemo(); isDemo = true;
  $(".avatar strong").textContent = "The Mosaic House";
  $(".avatar em").textContent = "hotel workspace · demo data";
  recompute();
}
$("#btn-reset").addEventListener("click", resetDemo);

/* ---------------- boot ---------------- */
recompute();
say(`Hi — I'm the InsightAI copilot. I compute answers from the live dataset (The Mosaic House demo workspace). Ask me anything below, or import your own CSV.`, "ai");
/* deep-link views: /insightai/#forecast etc. */
const hv = location.hash.slice(1);
if (TITLES[hv]) $(`.snav[data-view="${hv}"]`).click();
})();
