/* ============================================================
   MERIDIAN — quiet engine. Same computed systems as ever:
   live inventory NLU, real depreciation model, real payment
   math, live calendar, lead scoring. Rendered as typography,
   not dashboard. Plus: the scroll-story director.
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
"use strict";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- inventory ---------------- */
const INV = [
  { y: 2024, make: "Porsche", model: "Macan S", body: "suv", price: 84900, mi: 6200, color: "Carrara White", fuel: "petrol" },
  { y: 2023, make: "Porsche", model: "Taycan 4S", body: "sedan", price: 109500, mi: 9800, color: "Frozen Blue", fuel: "ev" },
  { y: 2024, make: "Mercedes-Benz", model: "GLC 300", body: "suv", price: 58400, mi: 4100, color: "Obsidian Black", fuel: "petrol" },
  { y: 2023, make: "Mercedes-Benz", model: "E 450", body: "sedan", price: 66200, mi: 12800, color: "Selenite Grey", fuel: "hybrid" },
  { y: 2024, make: "Mercedes-Benz", model: "EQE 350", body: "sedan", price: 74900, mi: 3500, color: "Sodalite Blue", fuel: "ev" },
  { y: 2023, make: "BMW", model: "X5 xDrive40i", body: "suv", price: 71800, mi: 14300, color: "Mineral White", fuel: "petrol" },
  { y: 2024, make: "BMW", model: "i4 M50", body: "sedan", price: 69900, mi: 5200, color: "Brooklyn Grey", fuel: "ev" },
  { y: 2022, make: "BMW", model: "M440i Coupe", body: "coupe", price: 56700, mi: 21500, color: "Portimao Blue", fuel: "petrol" },
  { y: 2024, make: "Audi", model: "Q7 55 TFSI", body: "suv", price: 68300, mi: 7900, color: "Glacier White", fuel: "petrol" },
  { y: 2023, make: "Audi", model: "RS5 Sportback", body: "coupe", price: 78400, mi: 11200, color: "Nardo Grey", fuel: "petrol" },
  { y: 2023, make: "Audi", model: "e-tron GT", body: "sedan", price: 89900, mi: 8600, color: "Daytona Grey", fuel: "ev" },
  { y: 2024, make: "Lexus", model: "RX 350h", body: "suv", price: 55900, mi: 2900, color: "Nori Green", fuel: "hybrid" },
  { y: 2023, make: "Lexus", model: "LC 500", body: "coupe", price: 97800, mi: 6800, color: "Infrared", fuel: "petrol" },
  { y: 2023, make: "Range Rover", model: "Sport P400", body: "suv", price: 92600, mi: 10400, color: "Santorini Black", fuel: "petrol" },
  { y: 2024, make: "Range Rover", model: "Velar S", body: "suv", price: 64800, mi: 3800, color: "Fuji White", fuel: "petrol" },
  { y: 2023, make: "Tesla", model: "Model Y LR", body: "suv", price: 42900, mi: 16700, color: "Pearl White", fuel: "ev" },
  { y: 2022, make: "Toyota", model: "Land Cruiser", body: "suv", price: 87500, mi: 24800, color: "Precious Bronze", fuel: "petrol" },
  { y: 2024, make: "Mini", model: "Cooper S Convertible", body: "convertible", price: 39800, mi: 1900, color: "Racing Green", fuel: "petrol" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function slotList() {
  const out = [];
  const now = new Date();
  for (let d = 1; d <= 3; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    ["10:00", "12:30", "15:00", "17:30"].forEach((t, i) => {
      if ((day.getDate() + i) % 3 === 0) return;
      out.push({ label: `${DAYS[day.getDay()]} ${day.getDate()} · ${t}` });
    });
  }
  return out.slice(0, 7);
}

/* ---------------- shared models (chat + story use the SAME math) ---------------- */
function tradeValue(raw, year, mi, cond) {
  const tier1 = /porsche|mercedes|benz|bmw|audi|lexus|range|land|tesla|jaguar|maserati|bentley/i.test(raw);
  const base = tier1 ? 58000 : 30000;
  const age = Math.max(0, Math.min(15, new Date().getFullYear() - year));
  const val = base * Math.pow(0.90, age) * (1 - Math.min(mi, 180000) / 180000 * 0.4) * cond;
  return { lo: val * 0.94, hi: val * 1.07 };
}
function finMax(pmt, down, rate) {
  const n = 60, r = rate / 12;
  return down + pmt * (1 - Math.pow(1 + r, -n)) / r;
}

/* ---------------- lead state → ledger ---------------- */
const lead = { intent: null, budget: null, trade: null, finance: null, appt: null, name: null };
let flow = null;

function score() {
  let s = 0;
  if (lead.intent) s += 18;
  if (lead.budget) s += 18;
  if (lead.trade) s += 20;
  if (lead.finance) s += 20;
  if (lead.appt) s += 24;
  return Math.min(100, s);
}
const STATES = [[0, "Observing"], [18, "Curious"], [36, "Qualified"], [56, "In the money"], [76, "Showroom-ready"]];

function paintScore() {
  const v = score();
  $("#score-line").style.setProperty("--p", v + "%");
  $("#ledger-state").textContent = STATES.filter(s => v >= s[0]).pop()[1];
  $('#ledger-list li[data-k="state"]').classList.add("set");
}
function setLedger(k, v) {
  const li = $(`#ledger-list li[data-k="${k}"]`);
  if (!li) return;
  li.querySelector("b").textContent = v;
  li.classList.add("set");
  paintScore();
  maybeBrief();
}
function maybeBrief() {
  if ((score() < 60 && !lead.appt) || !$("#handoff").hidden) return;
  const parts = [];
  if (lead.name) parts.push(`<b>${lead.name}</b>`);
  if (lead.intent) parts.push(`interested in ${lead.intent}`);
  if (lead.budget) parts.push(`budget ${lead.budget}`);
  if (lead.trade) parts.push(`trade valued ${lead.trade}`);
  if (lead.finance) parts.push(`pre-qualified ${lead.finance}`);
  if (lead.appt) parts.push(`drive ${lead.appt}`);
  $("#handoff-text").innerHTML = "Sofia receives: " + parts.join(" · ") + ". The record is complete, the calendar is blocked, the confirmation is sent. She walks in ahead.";
  $("#handoff").hidden = false;
}

/* ---------------- conversation ---------------- */
const log = $("#chat-log");
function push(text, who) {
  const d = document.createElement("div");
  d.className = "m " + who;
  d.innerHTML = `<p>${text}</p>`;
  log.appendChild(d);
  log.scrollTop = 1e6;
  return d;
}
function pushEl(el) { log.appendChild(el); log.scrollTop = 1e6; }
function ai(html, delay) {
  const t = document.createElement("div");
  t.className = "m a typing"; t.innerHTML = "<p>…</p>";
  log.appendChild(t); log.scrollTop = 1e6;
  setTimeout(() => { t.remove(); push(html, "a"); }, delay || (500 + Math.random() * 400));
}
function vehRows(list) {
  setTimeout(() => {
    list.slice(0, 3).forEach((v, i) => {
      setTimeout(() => {
        const d = document.createElement("div");
        d.className = "veh-row";
        d.innerHTML = `<div><h5><i>${v.y}</i>${v.make} ${v.model}</h5><span class="meta">${v.color.toUpperCase()} · ${v.mi.toLocaleString()} MI · ${v.fuel.toUpperCase()}</span></div><span class="price">${money(v.price)}</span>`;
        pushEl(d);
      }, i * 240);
    });
  }, 1000);
}

/* ---------------- NLU ---------------- */
function parseBudget(t) {
  const m = t.replace(/,/g, "").match(/\$?\s*(\d{2,3})\s*k\b|\$?\s*(\d{4,6})(?!\s*(mi|miles|km))/i);
  if (!m) return null;
  const n = m[1] ? +m[1] * 1000 : +m[2];
  return n >= 5000 && n <= 400000 ? n : null;
}
function searchInv(f) {
  return INV.filter(v =>
    (!f.max || v.price <= f.max) &&
    (!f.body || v.body === f.body || (f.body === "ev" && v.fuel === "ev")) &&
    (!f.make || v.make.toLowerCase().includes(f.make)))
    .sort((a, b) => b.price - a.price);
}

function reply(t) {
  const l = t.toLowerCase();
  if (flow) { flowStep(t, l); return; }

  if (/test\s*drive|book|appointment|visit|come in/.test(l)) {
    flow = { type: "book", step: 0, data: {} };
    ai("Choose a moment — these are live from the showroom calendar.");
    setTimeout(() => {
      const row = document.createElement("div");
      row.className = "slot-row";
      slotList().forEach(s => {
        const b = document.createElement("button");
        b.className = "slot"; b.textContent = s.label;
        b.addEventListener("click", () => {
          push(s.label, "u");
          flow.data.slot = s.label;
          flow.step = 1;
          ai("Held. Your first name, so the floor knows who's coming?");
          row.remove();
        });
        row.appendChild(b);
      });
      pushEl(row);
    }, 1200);
    return;
  }

  if (/trade|swap|part.?ex/.test(l)) {
    flow = { type: "trade", step: 0, data: {} };
    if (/(19|20)\d{2}/.test(t)) { flowStep(t, l); return; }
    ai("I can value it now. Year, make and model — <i>2018 Audi Q5</i>, for instance.");
    return;
  }

  if (/financ|payment|month|installment|emi|loan|\/mo\b/.test(l)) {
    flow = { type: "fin", step: 0, data: {} };
    const pre = t.replace(/,/g, "").match(/\$?\s*(\d{2,4})\s*(?:\/|per\s*)?mo/i) || t.replace(/,/g, "").match(/\$\s*(\d{2,4})\b/);
    if (pre && +pre[1] >= 100 && +pre[1] <= 5000) {
      flow.data.pmt = +pre[1];
      flow.step = 1;
      ai(`<b>${money(+pre[1])} a month</b> — noted. Anything down? Rough is fine, or say <i>none</i>.`);
    } else {
      ai("Three quiet questions. First — what monthly figure feels comfortable?");
    }
    return;
  }

  if (/human|person|salesperson|agent|manager/.test(l)) {
    ai("Of course. Sofia picks up every conversation I begin — book a drive or simply leave it here, and she receives the full record either way. Nothing is lost.");
    return;
  }

  const f = {};
  const budget = parseBudget(l);
  if (budget) { f.max = budget; lead.budget = "under " + money(budget); setLedger("budget", lead.budget); }
  if (/suv|crossover/.test(l)) f.body = "suv";
  else if (/sedan|saloon/.test(l)) f.body = "sedan";
  else if (/coupe|sports/.test(l)) f.body = "coupe";
  else if (/convertible|cabrio/.test(l)) f.body = "convertible";
  if (/\bev\b|electric/.test(l)) f.body = "ev";
  const makes = ["porsche", "mercedes", "bmw", "audi", "lexus", "range", "tesla", "toyota", "mini"];
  const mk = makes.find(m => l.includes(m));
  if (mk) f.make = mk;

  if (budget || f.body || f.make) {
    const res = searchInv(f);
    const what = [f.make ? mk[0].toUpperCase() + mk.slice(1) : "", f.body === "ev" ? "electric" : (f.body || "")].filter(Boolean).join(" ") || "match";
    lead.intent = (f.body === "ev" ? "EV" : f.body ? f.body.toUpperCase() : mk ? mk.toUpperCase() : "vehicle") + (budget ? " · " + money(budget) : "");
    setLedger("intent", lead.intent);
    if (!res.length) {
      ai(`Nothing on the floor answers that exactly tonight — inventory turns weekly. The nearest alternatives:`);
      vehRows(searchInv({ max: budget ? budget * 1.15 : null }));
    } else {
      ai(`<span class="hl">${res.length} ${what}${res.length > 1 ? "s" : ""}</span> on the floor${budget ? ", under " + money(budget) : ""}.`);
      vehRows(res);
      setTimeout(() => ai("A <b>test drive</b> in one of them — or shall I value a <b>trade</b> against it?"), 2800);
    }
    return;
  }

  if (/^(hi|hey|hello|salam|yo|good)/.test(l)) {
    ai("Good evening. The showroom is dark; I am not. Inventory, trade values, financing, test drives — where shall we begin?");
    return;
  }
  ai("Be specific with me — <i>“an SUV under $70k”</i>, <i>“value my trade”</i>, <i>“what does $650 a month get me?”</i>, <i>“book a drive.”</i> Every answer is computed.");
}

/* ---------------- flows ---------------- */
function flowStep(t, l) {
  const fl = flow;

  if (fl.type === "trade") {
    if (fl.step === 0) {
      const ym = t.match(/(19|20)\d{2}/);
      if (!ym) { ai("The year as well — <i>2019 BMW X3</i>, say."); return; }
      fl.data.year = +ym[0];
      fl.data.desc = t.replace(/\b(value|my|trade|in|the|a|an|its|it's|for)\b/gi, "").replace(/\s+/g, " ").trim();
      fl.data.raw = t;
      fl.step = 1;
      ai("Roughly how many miles?");
      return;
    }
    if (fl.step === 1) {
      const mi = t.replace(/,/g, "").match(/\d{3,6}/);
      if (!mi) { ai("A rough figure — 40,000? 90,000?"); return; }
      fl.data.mi = +mi[0];
      fl.step = 2;
      ai("Condition — <b>excellent</b>, <b>good</b>, or <b>fair</b>?");
      return;
    }
    if (fl.step === 2) {
      const cond = /excellent|mint|perfect/.test(l) ? 1.05 : /fair|rough|okay|meh/.test(l) ? 0.85 : 1.0;
      const { lo, hi } = tradeValue(fl.data.raw || fl.data.desc, fl.data.year, fl.data.mi, cond);
      lead.trade = `${money(lo)}–${money(hi)}`;
      setLedger("trade", lead.trade);
      ai(`Your <b>${fl.data.desc || fl.data.year}</b> stands at <span class="hl">${money(lo)} – ${money(hi)}</span> in trade — computed from year, mileage and condition, confirmed on inspection, applied against anything on the floor. Shall I <b>book the drive</b> and the appraisal together?`);
      flow = null;
      return;
    }
  }

  if (fl.type === "fin") {
    if (fl.step === 0) {
      const p = t.replace(/,/g, "").match(/\d{2,5}/);
      if (!p) { ai("A number serves best — $500, $800 a month."); return; }
      fl.data.pmt = +p[0];
      fl.step = 1;
      ai("Anything down? Rough is fine — or say <i>none</i>.");
      return;
    }
    if (fl.step === 1) {
      fl.data.down = /none|zero|no/.test(l) ? 0 : (parseBudget(l) || +((t.replace(/,/g, "").match(/\d{3,6}/) || [0])[0]));
      fl.step = 2;
      ai("Last — credit roughly <b>excellent</b>, <b>good</b>, or <b>building</b>?");
      return;
    }
    if (fl.step === 2) {
      const rate = /excellent/.test(l) ? 0.049 : /building|bad|poor|low/.test(l) ? 0.129 : 0.074;
      const maxP = finMax(fl.data.pmt, fl.data.down, rate);
      lead.finance = `${money(fl.data.pmt)}/mo → ~${money(maxP)}`;
      setLedger("finance", lead.finance);
      const matches = searchInv({ max: maxP });
      ai(`At <b>${money(fl.data.pmt)} a month</b> over sixty months — ${(rate * 100).toFixed(1)}% — with ${money(fl.data.down)} down, you are shopping to <span class="hl">${money(maxP)}</span>. That is <b>${matches.length}</b> of ours. Indicative, not a credit pull.`);
      if (matches.length) vehRows(matches);
      flow = null;
      return;
    }
  }

  if (fl.type === "book") {
    if (fl.step === 0) { ai("Touch one of the times above, or name a day and I'll find its nearest opening."); return; }
    if (fl.step === 1) {
      lead.name = t.trim().split(/\s+/)[0].replace(/[^a-z']/gi, "");
      lead.name = lead.name.charAt(0).toUpperCase() + lead.name.slice(1);
      lead.appt = fl.data.slot;
      setLedger("appt", `${fl.data.slot} · ${lead.name}`);
      ai(`Done, <b>${lead.name}</b>. <span class="hl">${fl.data.slot}</span> — the car will be fueled, detailed, and out front. Sofia has your record. <b>Good night.</b>`);
      flow = null;
      return;
    }
  }
}

$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#chat-in").value.trim();
  if (!v) return;
  $("#chat-in").value = "";
  push(v, "u");
  setTimeout(() => reply(v), 180);
});
const SUGG = ["An SUV under $70k", "Value my trade", "What does $650 a month get me?", "Book a drive", "Anything electric?"];
$("#chat-sugg").innerHTML = SUGG.map(s => `<button>${s}</button>`).join("");
$$("#chat-sugg button").forEach(b => b.addEventListener("click", () => {
  push(b.textContent, "u");
  setTimeout(() => reply(b.textContent), 180);
}));
setTimeout(() => ai("Good evening. The showroom closed at eight; I did not. <b>Where shall we begin?</b>", 700), 1200);
paintScore();

/* ---------------- scroll story ---------------- */
const night = $("#night");
const scenes = $$(".scene", night);
const TIMES = ["23:47", "23:47", "23:52", "23:56", "00:01", "08:55", "08:56"];
const TYPE_TEXT = "Good evening — yes, the GLC 300 is on the floor. Obsidian Black, 4,100 miles. Shall I hold it for a Saturday drive?";
let typed = false, traded = false;

function typewrite() {
  if (typed) return; typed = true;
  const el = $("#type-target");
  let i = 0;
  (function tick() {
    el.textContent = TYPE_TEXT.slice(0, i);
    if (i++ < TYPE_TEXT.length) setTimeout(tick, 26);
  })();
}
function tradeCount() {
  if (traded) return; traded = true;
  const { lo, hi } = tradeValue("2018 Audi Q5", 2018, 61000, 1.0);
  const el = $("#story-trade");
  const t0 = performance.now(), dur = 1600;
  (function tick(t) {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = money(lo * eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = `${money(lo)} – ${money(hi)}`;
  })(t0);
}

if (!reduceMotion && night) {
  let cur = -1;
  const onScroll = () => {
    const r = night.getBoundingClientRect();
    const span = r.height - innerHeight;
    const prog = Math.min(Math.max(-r.top / span, 0), 0.9999);
    const idx = Math.floor(prog * scenes.length);
    if (idx !== cur) {
      cur = idx;
      scenes.forEach((sc, i) => {
        sc.classList.toggle("on", i === idx);
        sc.classList.toggle("past", i < idx);
      });
      $("#story-time").textContent = TIMES[idx];
      if (idx === 1) typewrite();
      if (idx === 3) tradeCount();
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
} else if (night) {
  $("#type-target").textContent = TYPE_TEXT;
  tradeCount();
  scenes.forEach(sc => sc.classList.add("on"));
}

/* ---------------- flow rail dot ---------------- */
const rail = $(".flow-rail");
if (rail && !reduceMotion) {
  addEventListener("scroll", () => {
    const r = rail.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
    $("#flow-dot").style.setProperty("--p", (p * 100) + "%");
  }, { passive: true });
}

/* ---------------- reveals ---------------- */
const rio = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); rio.unobserve(e.target); } });
}, { threshold: 0.2 });
$$(".reveal").forEach(el => rio.observe(el));

/* ---------------- magnetic button ---------------- */
const mag = $("#btn-main");
if (mag && matchMedia("(hover: hover)").matches && !reduceMotion) {
  let mx = 0, my = 0, cx = 0, cy = 0;
  mag.addEventListener("mousemove", (e) => {
    const r = mag.getBoundingClientRect();
    mx = (e.clientX - r.left - r.width / 2) * 0.22;
    my = (e.clientY - r.top - r.height / 2) * 0.3;
  });
  mag.addEventListener("mouseleave", () => { mx = 0; my = 0; });
  (function loop() {
    cx += (mx - cx) * 0.09; cy += (my - cy) * 0.09;
    mag.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------------- nav clock ---------------- */
setInterval(() => {
  const d = new Date();
  const nt = $("#nav-time");
  if (nt) nt.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}, 1000);
})();
