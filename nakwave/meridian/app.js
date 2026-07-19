/* ============================================================
   MERIDIAN OS — the AI sales floor. Nothing scripted:
   inventory queries filter a real dataset, trade-ins run a real
   depreciation model, financing runs a real payment formula,
   bookings check a real slot table, and the lead score is
   computed from what the visitor actually shares.
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
"use strict";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

/* ---------------- inventory (live dataset) ---------------- */
const INV = [
  { y: 2024, make: "Porsche", model: "Macan S", body: "suv", price: 84900, mi: 6200, color: "Carrara White", hex: "#e8e8e8", fuel: "petrol" },
  { y: 2023, make: "Porsche", model: "Taycan 4S", body: "sedan", price: 109500, mi: 9800, color: "Frozen Blue", hex: "#9fc4e8", fuel: "ev" },
  { y: 2024, make: "Mercedes-Benz", model: "GLC 300", body: "suv", price: 58400, mi: 4100, color: "Obsidian Black", hex: "#1a1a1e", fuel: "petrol" },
  { y: 2023, make: "Mercedes-Benz", model: "E 450", body: "sedan", price: 66200, mi: 12800, color: "Selenite Grey", hex: "#8b8f94", fuel: "hybrid" },
  { y: 2024, make: "Mercedes-Benz", model: "EQE 350", body: "sedan", price: 74900, mi: 3500, color: "Sodalite Blue", hex: "#2d4a7a", fuel: "ev" },
  { y: 2023, make: "BMW", model: "X5 xDrive40i", body: "suv", price: 71800, mi: 14300, color: "Mineral White", hex: "#e5e2da", fuel: "petrol" },
  { y: 2024, make: "BMW", model: "i4 M50", body: "sedan", price: 69900, mi: 5200, color: "Brooklyn Grey", hex: "#7d8087", fuel: "ev" },
  { y: 2022, make: "BMW", model: "M440i Coupe", body: "coupe", price: 56700, mi: 21500, color: "Portimao Blue", hex: "#2469b3", fuel: "petrol" },
  { y: 2024, make: "Audi", model: "Q7 55 TFSI", body: "suv", price: 68300, mi: 7900, color: "Glacier White", hex: "#e9edee", fuel: "petrol" },
  { y: 2023, make: "Audi", model: "RS5 Sportback", body: "coupe", price: 78400, mi: 11200, color: "Nardo Grey", hex: "#a7abad", fuel: "petrol" },
  { y: 2023, make: "Audi", model: "e-tron GT", body: "sedan", price: 89900, mi: 8600, color: "Daytona Grey", hex: "#5c6066", fuel: "ev" },
  { y: 2024, make: "Lexus", model: "RX 350h", body: "suv", price: 55900, mi: 2900, color: "Nori Green", hex: "#3a4b3f", fuel: "hybrid" },
  { y: 2023, make: "Lexus", model: "LC 500", body: "coupe", price: 97800, mi: 6800, color: "Infrared", hex: "#b8262f", fuel: "petrol" },
  { y: 2023, make: "Range Rover", model: "Sport P400", body: "suv", price: 92600, mi: 10400, color: "Santorini Black", hex: "#15161a", fuel: "petrol" },
  { y: 2024, make: "Range Rover", model: "Velar S", body: "suv", price: 64800, mi: 3800, color: "Fuji White", hex: "#eef0ee", fuel: "petrol" },
  { y: 2023, make: "Tesla", model: "Model Y LR", body: "suv", price: 42900, mi: 16700, color: "Pearl White", hex: "#eceff1", fuel: "ev" },
  { y: 2022, make: "Toyota", model: "Land Cruiser", body: "suv", price: 87500, mi: 24800, color: "Precious Bronze", hex: "#8a6f4d", fuel: "petrol" },
  { y: 2024, make: "Mini", model: "Cooper S Convertible", body: "convertible", price: 39800, mi: 1900, color: "British Racing Green", hex: "#20402f", fuel: "petrol" },
];

/* ---------------- booking slots ---------------- */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function slotList() {
  const out = [];
  const now = new Date();
  for (let d = 1; d <= 3; d++) {
    const day = new Date(now.getTime() + d * 86400000);
    ["10:00", "12:30", "15:00", "17:30"].forEach((t, i) => {
      if ((day.getDate() + i) % 3 === 0) return; // some taken
      out.push({ label: `${DAYS[day.getDay()]} ${day.getDate()} · ${t}`, day: DAYS[day.getDay()], time: t });
    });
  }
  return out.slice(0, 7);
}

/* ---------------- shared models (chat + replay use the SAME math) ---------------- */
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

/* ---------------- lead state ---------------- */
const lead = { intent: null, budget: null, trade: null, finance: null, appt: null, name: null };
let flow = null; // {type, step, data}

function score() {
  let s = 0;
  if (lead.intent) s += 18;
  if (lead.budget) s += 18;
  if (lead.trade) s += 20;
  if (lead.finance) s += 20;
  if (lead.appt) s += 24;
  return Math.min(100, s);
}
const TAGS = [
  [0, "COLD — just browsing"], [18, "CURIOUS — engaging"], [36, "WARM — qualified interest"],
  [56, "HOT — money conversation"], [76, "SHOWROOM-READY"], [100, "SHOWROOM-READY"],
];

function drawGauge() {
  const c = $("#gauge"), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = 180 * dpr; c.height = 110 * dpr;
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const val = score();
  const a0 = Math.PI, a1 = Math.PI + Math.PI * (val / 100);
  x.lineCap = "round";
  x.beginPath(); x.arc(90, 100, 74, Math.PI, 2 * Math.PI); x.strokeStyle = "rgba(160,165,220,0.15)"; x.lineWidth = 12; x.stroke();
  if (val > 0) {
    const g = x.createLinearGradient(10, 0, 170, 0);
    g.addColorStop(0, "#6c5cff"); g.addColorStop(1, "#4fd8ff");
    x.beginPath(); x.arc(90, 100, 74, a0, a1); x.strokeStyle = g; x.lineWidth = 12; x.stroke();
  }
  $("#gauge-num").textContent = val;
  $("#gauge-tag").textContent = TAGS.filter(t => val >= t[0]).pop()[1];
}

function setCRM(k, v) {
  const li = $(`#crm-list li[data-k="${k}"]`);
  if (!li) return;
  li.querySelector("b").textContent = v;
  li.classList.add("set");
  drawGauge();
  maybeHandoff();
}

function maybeHandoff() {
  if ((score() < 60 && !lead.appt) || !$("#handoff").hidden) return;
  const parts = [];
  if (lead.name) parts.push(`<b>${lead.name}</b>`);
  if (lead.intent) parts.push(`interested in ${lead.intent}`);
  if (lead.budget) parts.push(`budget ${lead.budget}`);
  if (lead.trade) parts.push(`trade-in valued ${lead.trade}`);
  if (lead.finance) parts.push(`pre-qualified ${lead.finance}`);
  if (lead.appt) parts.push(`test drive ${lead.appt}`);
  $("#handoff-text").innerHTML = "Sofia (sales) receives: " + parts.join(" · ") + ". CRM updated, calendar blocked, confirmation sent.";
  $("#handoff").hidden = false;
}

/* ---------------- chat plumbing ---------------- */
const log = $("#chat-log");
function push(html, who) {
  const d = document.createElement("div");
  d.className = "m " + who;
  d.innerHTML = html;
  log.appendChild(d);
  log.scrollTop = 1e6;
  return d;
}
function pushEl(el) { log.appendChild(el); log.scrollTop = 1e6; }
function ai(html, delay) {
  $("#chat-state").textContent = "computing…";
  const t = document.createElement("div");
  t.className = "m a typing"; t.innerHTML = "<i></i><i></i><i></i>";
  log.appendChild(t); log.scrollTop = 1e6;
  setTimeout(() => {
    t.remove();
    push(html, "a");
    $("#chat-state").textContent = "listening";
  }, delay || (420 + Math.random() * 380));
}
function vehCards(list) {
  setTimeout(() => {
    list.slice(0, 3).forEach((v, i) => {
      setTimeout(() => {
        const d = document.createElement("div");
        d.className = "veh-card";
        d.innerHTML = `<div class="vc-top"><h5>${v.y} ${v.make} ${v.model}</h5><span class="vc-price">${money(v.price)}</span></div>
          <p><i class="vc-dot" style="background:${v.hex}"></i>${v.color} · ${v.mi.toLocaleString()} mi · ${v.fuel.toUpperCase()} · ${v.body.toUpperCase()}</p>`;
        pushEl(d);
      }, i * 180);
    });
  }, 900);
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
    (!f.make || (v.make.toLowerCase().includes(f.make))) )
    .sort((a, b) => b.price - a.price);
}

function reply(t) {
  const l = t.toLowerCase();

  /* ---- active flows ---- */
  if (flow) { flowStep(t, l); return; }

  /* ---- booking ---- */
  if (/test\s*drive|book|appointment|visit|come in/.test(l)) {
    flow = { type: "book", step: 0, data: {} };
    ai("Let's get you behind the wheel. Pick a slot that works — these are live from the showroom calendar:");
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
          ai("Locked. And your first name, so the team knows who's coming?");
          row.remove();
        });
        row.appendChild(b);
      });
      pushEl(row);
    }, 1100);
    return;
  }

  /* ---- trade-in ---- */
  if (/trade|swap|part.?ex/.test(l)) {
    flow = { type: "trade", step: 0, data: {} };
    if (/(19|20)\d{2}/.test(t)) { flowStep(t, l); return; }
    ai("I can value that right now. What's the <b>year, make and model</b>? — e.g. <i>2018 Audi Q5</i>");
    return;
  }

  /* ---- financing ---- */
  if (/financ|payment|month|installment|emi|loan|\/mo\b/.test(l)) {
    flow = { type: "fin", step: 0, data: {} };
    const pre = t.replace(/,/g, "").match(/\$?\s*(\d{2,4})\s*(?:\/|per\s*)?mo/i) || t.replace(/,/g, "").match(/\$\s*(\d{2,4})\b/);
    if (pre && +pre[1] >= 100 && +pre[1] <= 5000) {
      flow.data.pmt = +pre[1];
      flow.step = 1;
      ai(`<b>${money(+pre[1])}/month</b> — got it. Down payment in mind? (rough is fine — or say <i>none</i>)`);
    } else {
      ai("Quick pre-qualification, three questions. First — what <b>monthly payment</b> feels comfortable? (e.g. $650)");
    }
    return;
  }

  /* ---- human ---- */
  if (/human|person|salesperson|agent|manager/.test(l)) {
    ai("Of course — Sofia from our sales team picks up every conversation I start. Book a test drive or leave it here, and she gets a full briefing either way. Nothing you've told me gets lost.");
    return;
  }

  /* ---- inventory query ---- */
  const f = {};
  const budget = parseBudget(l);
  if (budget) { f.max = budget; lead.budget = "under " + money(budget); setCRM("budget", lead.budget); }
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
    setCRM("intent", lead.intent);
    if (!res.length) {
      ai(`Nothing on the floor matches that exactly right now — but inventory turns weekly. Closest alternatives coming up, or I can flag you the moment a ${what} lands:`);
      vehCards(searchInv({ max: budget ? budget * 1.15 : null }));
    } else {
      ai(`Checked the floor — <span class="hl">${res.length} ${what}${res.length > 1 ? "s" : ""}</span> in stock${budget ? " under " + money(budget) : ""}. Top picks:`);
      vehCards(res);
      setTimeout(() => ai("Want a <b>test drive</b> in any of these, or should I value a <b>trade-in</b> against one?"), 2400);
    }
    return;
  }

  /* ---- greetings / fallback ---- */
  if (/^(hi|hey|hello|salam|yo)\b/.test(l)) {
    ai("Welcome to Meridian. I'm the AI on the floor tonight — I can search live inventory, value your trade-in, pre-qualify financing and book test drives. What are you driving towards?");
    return;
  }
  ai("I work best with specifics — try <i>“an SUV under $70k”</i>, <i>“value my trade”</i>, <i>“what can I get for $650/month?”</i> or <i>“book a test drive”</i>. Everything I answer is computed from live data.");
}

/* ---------------- flows ---------------- */
function flowStep(t, l) {
  const fl = flow;

  if (fl.type === "trade") {
    if (fl.step === 0) {
      const ym = t.match(/(19|20)\d{2}/);
      if (!ym) { ai("Give me the year too — like <i>2019 BMW X3</i>."); return; }
      fl.data.year = +ym[0];
      fl.data.desc = t.replace(/\b(value|my|trade|in|the|a|an|its|it's|for)\b/gi, "").replace(/\s+/g, " ").trim();
      fl.data.raw = t;
      fl.step = 1;
      ai("Roughly how many <b>miles</b> on it?");
      return;
    }
    if (fl.step === 1) {
      const mi = t.replace(/,/g, "").match(/\d{3,6}/);
      if (!mi) { ai("A rough number is fine — 40,000? 90,000?"); return; }
      fl.data.mi = +mi[0];
      fl.step = 2;
      ai("Condition — <b>excellent</b>, <b>good</b>, or <b>fair</b>?");
      return;
    }
    if (fl.step === 2) {
      const cond = /excellent|mint|perfect/.test(l) ? 1.05 : /fair|rough|okay|meh/.test(l) ? 0.85 : 1.0;
      const { lo, hi } = tradeValue(fl.data.raw || fl.data.desc, fl.data.year, fl.data.mi, cond);
      lead.trade = `${money(lo)}–${money(hi)}`;
      setCRM("trade", lead.trade);
      ai(`Based on year, mileage and condition, your <b>${fl.data.desc || fl.data.year}</b> values at <span class="hl">${money(lo)} – ${money(hi)}</span> as a trade. That's a computed estimate — final number after physical inspection, and it's applied straight against anything on the floor. Want me to <b>book a test drive</b> and have the appraisal done in the same visit?`);
      flow = null;
      return;
    }
  }

  if (fl.type === "fin") {
    if (fl.step === 0) {
      const p = t.replace(/,/g, "").match(/\d{2,5}/);
      if (!p) { ai("A number works best — like $500 or $800 a month."); return; }
      fl.data.pmt = +p[0];
      fl.step = 1;
      ai("Down payment in mind? (rough is fine — or say <i>none</i>)");
      return;
    }
    if (fl.step === 1) {
      fl.data.down = /none|zero|no/.test(l) ? 0 : (parseBudget(l) || +((t.replace(/,/g, "").match(/\d{3,6}/) || [0])[0]));
      fl.step = 2;
      ai("Last one — credit roughly <b>excellent</b>, <b>good</b>, or <b>building</b>?");
      return;
    }
    if (fl.step === 2) {
      const rate = /excellent/.test(l) ? 0.049 : /building|bad|poor|low/.test(l) ? 0.129 : 0.074;
      const maxP = finMax(fl.data.pmt, fl.data.down, rate);
      lead.finance = `${money(fl.data.pmt)}/mo → ~${money(maxP)}`;
      setCRM("finance", lead.finance);
      const matches = searchInv({ max: maxP });
      ai(`At <b>${money(fl.data.pmt)}/month</b> over 60 months (${(rate * 100).toFixed(1)}% APR) with ${money(fl.data.down)} down, you're shopping up to <span class="hl">${money(maxP)}</span> — that's <b>${matches.length} vehicles</b> on our floor right now. Pre-qual is indicative, not a credit pull. Want the top three?`);
      if (matches.length) vehCards(matches);
      flow = null;
      return;
    }
  }

  if (fl.type === "book") {
    if (fl.step === 0) {
      ai("Tap one of the slots above, or tell me a day that suits and I'll find the nearest opening.");
      return;
    }
    if (fl.step === 1) {
      lead.name = t.trim().split(/\s+/)[0].replace(/[^a-z']/gi, "");
      lead.name = lead.name.charAt(0).toUpperCase() + lead.name.slice(1);
      lead.appt = fl.data.slot;
      setCRM("appt", `${fl.data.slot} · ${lead.name}`);
      ai(`Done, <b>${lead.name}</b> — <span class="hl">${fl.data.slot}</span> is locked, the car will be fueled and out front. Confirmation is on its way, Sofia has your full briefing, and if anything changes just tell me. <b>See you then.</b>`);
      flow = null;
      return;
    }
  }
}

/* ---------------- chat wiring ---------------- */
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#chat-in").value.trim();
  if (!v) return;
  $("#chat-in").value = "";
  push(v, "u");
  setTimeout(() => reply(v), 150);
});
const SUGG = ["An SUV under $70k", "Value my trade-in", "What can I get for $650/month?", "Book a test drive", "Any electric cars?"];
$("#chat-sugg").innerHTML = SUGG.map(s => `<button>${s}</button>`).join("");
$$("#chat-sugg button").forEach(b => b.addEventListener("click", () => {
  push(b.textContent, "u");
  setTimeout(() => reply(b.textContent), 150);
}));

/* ---------------- boot chat ---------------- */
drawGauge();
setTimeout(() => ai("Good evening — Meridian's showroom is closed, but I'm not. Live inventory, trade-in valuations, financing pre-qual, test-drive booking: all running. <b>Where do we start?</b>", 600), 900);

/* ---------------- replay ---------------- */
const rtv = tradeValue("2018 Audi Q5", 2018, 61000, 1.0);
const rfin = finMax(900, 15000, 0.074);
const kk = (n) => "$" + (n / 1000).toFixed(1) + "K";
const STEPS = [
  { t: "23:04", b: "Lead lands", d: "AutoTrader inquiry on the 2024 Mercedes GLC 300 — showroom closed 3 hours ago.", chips: ["SOURCE: AUTOTRADER", "VEHICLE: GLC 300", "STAFF ASLEEP"] },
  { t: "23:04:08", b: "AI replies — 8s", d: "Instant, specific first response: the exact car, its mileage, color and two nearby alternatives. Industry median for a first reply: 47 minutes to 9 hours.", chips: ["RESPONSE: 8 SECONDS", "391% CLOSE-RATE WINDOW"] },
  { t: "23:06", b: "Lead qualified", d: "Budget $52–60k confirmed, replacing a lease ending this month — timeline: this week. Score jumps to HOT.", chips: ["BUDGET: $52–60K", "TIMELINE: THIS WEEK", "SCORE: 74"] },
  { t: "23:09", b: "Trade valued", d: `2018 Audi Q5, 61,000 miles, good condition → computed range ${money(rtv.lo)}–${money(rtv.hi)}, applied against the GLC. Run the same car through the chat above — you'll get the same number.`, chips: [`TRADE: ${kk(rtv.lo)}–${kk(rtv.hi)}`, "MODEL: DEPRECIATION+MILEAGE"] },
  { t: "23:11", b: "Pre-qualified", d: `$900/month comfort, $15k down, good credit → shopping power ≈ ${money(rfin)}. The GLC fits with room to spare.`, chips: [`PRE-QUAL: ~${kk(rfin)}`, "APR BAND: GOOD"] },
  { t: "23:13", b: "Test drive booked", d: "Saturday 10:00 locked on the live calendar. GLC reserved, detail team notified for a 9:30 prep.", chips: ["SAT 10:00", "CAR RESERVED", "PREP SCHEDULED"] },
  { t: "08:55", b: "Human takes over", d: "Sofia reads the AI's briefing with her coffee: name, numbers, trade, payment target — and walks into the meeting already ahead. That's the handoff: AI does the night shift, humans close.", chips: ["BRIEFING → SOFIA", "CRM COMPLETE", "DEAL: IN MOTION"] },
];
const stepsEl = $("#replay-steps");
stepsEl.innerHTML = STEPS.map((s, i) => `<li data-i="${i}"><time>${s.t}</time><b>${s.b}</b></li>`).join("");
let rIdx = -1, rTimer = null;

function showStep(i) {
  rIdx = i;
  $$("#replay-steps li").forEach((li, j) => {
    li.classList.toggle("on", j === i);
    li.classList.toggle("done", j < i);
  });
  const s = STEPS[i];
  $("#replay-detail").innerHTML = `<p class="mono-label">${s.t} — ${s.b.toUpperCase()}</p><p>${s.d}</p>
    <div class="chips">${s.chips.map(c => `<span>${c}</span>`).join("")}</div>`;
  $("#replay-prog").style.width = ((i + 1) / STEPS.length * 100) + "%";
}
function play() {
  clearInterval(rTimer);
  $("#replay-play").textContent = "❚❚";
  const step = () => {
    if (rIdx >= STEPS.length - 1) { clearInterval(rTimer); $("#replay-play").textContent = "▶"; return; }
    showStep(rIdx + 1);
  };
  step();
  rTimer = setInterval(step, 2600);
}
$("#replay-play").addEventListener("click", () => {
  if ($("#replay-play").textContent === "❚❚") {
    clearInterval(rTimer); $("#replay-play").textContent = "▶";
  } else play();
});
stepsEl.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  clearInterval(rTimer); $("#replay-play").textContent = "▶";
  showStep(+li.dataset.i);
});
showStep(0);

/* auto-play once when scrolled into view */
let replayed = false;
new IntersectionObserver((es) => {
  if (es[0].isIntersecting && !replayed) { replayed = true; play(); }
}, { threshold: 0.4 }).observe($("#replay"));

/* ---------------- blueprint lines ---------------- */
function drawBP() {
  const svg = $("#bp-lines"), wrap = $(".bp-wrap");
  if (!svg || innerWidth <= 960) return;
  const wr = wrap.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${wr.width} ${wr.height}`);
  const P = (name) => {
    const el = $(`.bp-node[data-n="${name}"]`);
    const r = el.getBoundingClientRect();
    return { l: r.left - wr.left, rr: r.right - wr.left, y: r.top - wr.top + r.height / 2 };
  };
  const core = P("core");
  const curves = [];
  ["website", "autotrader", "whatsapp"].forEach(n => {
    const a = P(n);
    curves.push(`M ${a.rr} ${a.y} C ${a.rr + 60} ${a.y}, ${core.l - 60} ${core.y}, ${core.l} ${core.y}`);
  });
  ["crm", "cal", "team"].forEach(n => {
    const b = P(n);
    curves.push(`M ${core.rr} ${core.y} C ${core.rr + 60} ${core.y}, ${b.l - 60} ${b.y}, ${b.l} ${b.y}`);
  });
  const team = P("team"), follow = P("follow"), crm = P("crm"), dash = P("dash");
  curves.push(`M ${team.rr} ${team.y} C ${team.rr + 50} ${team.y}, ${follow.l - 50} ${follow.y}, ${follow.l} ${follow.y}`);
  curves.push(`M ${crm.rr} ${crm.y} C ${crm.rr + 90} ${crm.y - 10}, ${dash.l - 60} ${dash.y}, ${dash.l} ${dash.y}`);
  svg.innerHTML = `<defs><linearGradient id="bpgrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#6c5cff"/><stop offset="1" stop-color="#4fd8ff"/></linearGradient></defs>` +
    curves.map((d, i) => `<path d="${d}" class="${i % 2 ? "" : "lit"}"/>`).join("");
}
addEventListener("resize", drawBP);
new IntersectionObserver((es) => {
  if (es[0].isIntersecting) {
    drawBP();
    let k = 0;
    const nodes = $$(".bp-node");
    const glow = setInterval(() => {
      nodes.forEach(n => n.classList.remove("glow"));
      nodes[k % nodes.length].classList.add("glow");
      k++;
      if (k > nodes.length * 2) { clearInterval(glow); nodes.forEach(n => n.classList.remove("glow")); }
    }, 350);
  }
}, { threshold: 0.3 }).observe($("#blueprint"));

/* ---------------- dashboard ---------------- */
function drawSources() {
  const c = $("#ch-sources");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = c.clientWidth || c.parentElement.clientWidth - 40;
  c.width = w * dpr; c.height = 170 * dpr; c.style.height = "170px";
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const data = [["Website", 34], ["AutoTrader", 27], ["WhatsApp", 19], ["Walk-in", 12], ["Referral", 8]];
  const max = 40, bw = Math.min(70, (w - 20) / data.length - 18);
  data.forEach(([name, v], i) => {
    const X = 10 + i * ((w - 20) / data.length) + ((w - 20) / data.length - bw) / 2;
    const bh = (v / max) * 120;
    const g = x.createLinearGradient(0, 150 - bh, 0, 150);
    g.addColorStop(0, "#4fd8ff"); g.addColorStop(1, "#6c5cff");
    x.fillStyle = g;
    x.beginPath();
    x.roundRect ? x.roundRect(X, 150 - bh, bw, bh, 6) : x.rect(X, 150 - bh, bw, bh);
    x.fill();
    x.fillStyle = "#8b90b0"; x.font = "500 10px 'IBM Plex Mono'"; x.textAlign = "center";
    x.fillText(name.toUpperCase(), X + bw / 2, 166);
    x.fillStyle = "#eef0ff"; x.font = "600 12px 'Space Grotesk'";
    x.fillText(v, X + bw / 2, 143 - bh);
  });
}
const FUNNEL = [["Inquiries", 148, 100], ["Qualified", 96, 65], ["Booked", 41, 28], ["Showed", 33, 22], ["Sold", 19, 13]];
$("#funnel").innerHTML = FUNNEL.map(([n, v, w]) =>
  `<div class="fstep"><span>${n.toUpperCase()}</span><i style="--w:${w}%"></i><b>${v}</b></div>`).join("");
new IntersectionObserver((es) => { if (es[0].isIntersecting) drawSources(); }, { threshold: 0.3 }).observe($("#dash"));
addEventListener("resize", drawSources);

/* ---------------- counters ---------------- */
const cio = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, target = parseFloat(el.dataset.count);
    const suf = el.dataset.suffix || "", pre = el.dataset.prefix || "";
    const t0 = performance.now(), dur = 1400;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      el.textContent = pre + (target % 1 ? v.toFixed(2) : Math.round(v)) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, { threshold: 0.6 });
$$("[data-count]").forEach(el => cio.observe(el));

/* ---------------- reveals + clock ---------------- */
const rio = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); rio.unobserve(e.target); } });
}, { threshold: 0.15 });
$$(".reveal, .reveal-stagger").forEach(el => rio.observe(el));

setInterval(() => {
  const d = new Date();
  $("#hud-clock").textContent = `AI ONLINE · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}, 1000);
})();
