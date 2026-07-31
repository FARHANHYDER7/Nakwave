# NAKWAVE — PROJECT HANDOFF
*Upload this file at the start of a new session. Read it fully before acting.*
*Last updated: 30 July 2026 · latest commit `f25634d`*

---

## 1. WHO I'M WORKING WITH

**Farhan Hyder** — hyderfarhan96@gmail.com — +91 63615 06839 — founder of **Nakwave**, an SEO & AI-automation studio.
GitHub: `FARHANHYDER7`. Based in Karnataka, India; targets Bangalore for clients.

Beginner-to-intermediate technically — walk him through terminal/account steps click-by-click. Fast-moving, gives layered multi-part requests, interrupts and pivots often, switches models mid-session. **Appreciates being pushed back on when an idea is risky.** Keep state in files and commits so nothing is lost.

**Positioning — TWO EQUAL CRAFTS (corrected twice; get this right):**
1. **Search** — SEO + AEO/AI visibility (rank on Google, get cited by ChatGPT/Gemini/Perplexity/Claude)
2. **AI Automation** — chatbots, WhatsApp bots, agentic multi-agent workflows, analytics

Neither may dominate any copy. Slogan: **"Get found everywhere. Automate everything."**

**⚠️ ETHICS GUARDRAIL (tested repeatedly — hold this line):**
He has asked to present fabricated client work as real. He accepts this compromise: **honest labels** ("Showcase build", "Interactive concept") with full cinematic presentation. Never invent client names, testimonials, or ranking results. When he asked for a "#100 → top" story, the honest version shipped: a *measured* 16→91 visibility score plus a clearly-labelled "illustrative trajectory" chart. That framing works and he accepted it. **Fictional demo brands (all labelled):** Aarohi Silks (silk store), The Mosaic House (hotel), Meridian Motors (dealership). Saim Surfaces is a REAL business; the audit of it is real analysis of public data.

---

## 2. LIVE STATE — IT'S ALL SHIPPED

| Thing | Status |
|---|---|
| **Domain** | **nakwave.services** — live, HTTPS (Let's Encrypt, expires Oct 2026) |
| **Host** | Netlify. GoDaddy DNS → A record `75.2.60.5`, CNAME www → `willowy-eclair-4e952b.netlify.app` |
| **GitHub** | `FARHANHYDER7/Nakwave` — fixed (was flattened by web-upload), force-pushed, in sync |
| **Auto-deploy** | Root `netlify.toml` ready with `publish = "nakwave"`. **User may still need to link the repo in the Netlify UI** — confirm this first |
| **Google Search Console** | Verified (Domain property). Sitemap **Success, 15 pages**. Homepage indexed + ranking |
| **FormSubmit** | ✅ **ACTIVATED** — leads reach his inbox |
| **Analytics** | ❌ Still none. No GA4. Biggest remaining infra gap |

**Already ranking** for "nakwave services": homepage, `/audit.html`, `/work/silk-rebuild.html`.

---

## 3. THE WEBSITE — `nakwave/` (static, no build step)

**25 pages, ~16,600 words.** Design: verteal-inspired — white/#f4f4f2 alternating pure black #060606 · vermilion #ff2d00 · Archivo · hairlines #e4e4e0 · pill buttons · custom cursor · horizontal drag-rails.

**Brand mark:** the **naked wave** (his pick). `assets/logo-wave.svg` in nav; same wave on an ink square for favicon/profile contexts (`favicon.svg`, `icon-192/512`, `apple-touch-icon`). `Organization.logo` → `icon-512.png`.

### Pages
- `index.html` — hero: **"While you're sleeping, [ChatGPT/Perplexity/Claude/Gemini/Google AI] is recommending someone. We make sure it's you."** (word rotates continuously, `main.js`). WebGL hero field, featured-builds rail **before** the work rail, 7 services, process accordion, FAQ, contact with WhatsApp link
- `services/` — **hub + 6 pages** (AEO is the flagship; 780–1,100 words each; Service + FAQPage + Breadcrumb schema)
- `about.html` · `contact.html` · `terms.html` · `privacy.html` · `404.html`
- `audit.html` (FormSubmit funnel) · `audit-sample.html` (real Saim Surfaces audit, 38/100)
- `work/silk-rebuild.html` — **Aarohi Silks case study.** Cinematic canvas silk hero (`assets/silk-hero.js` — flowing burgundy silk, gold threads, cursor-reactive), measured **16→91**, illustrative ranking-climb chart, 20 bugs→fixes table
- `work/insightai.html` · `work/meridian.html` — case studies
- `blog/` — 6 articles (3 older + 3 research-backed: zero-click data, local AI search, agentic search) with generated header images in `assets/blog/`
- `demos/silk-before/` — the deliberately-broken "before" store (the "after" was deleted; the case study is self-contained now)
- `insightai/` · `meridian/` — self-contained working products, own CSS/JS

### Conventions
- **Asset versions unified at `?v=15`** — bump ALL together when editing css/js (they once drifted across v=1–13 and served stale CSS to returning visitors)
- Titles ≤60 chars, meta descriptions 130–165. **All 25 currently pass**
- Zero heading-level skips, zero broken links, 40 JSON-LD blocks all valid — *re-verify after edits*
- Dev server: `.claude/launch.json` name `hyder-site` (python http.server, serves `nakwave/`)
- Commit style: descriptive body + `Co-Authored-By: Claude`

---

## 4. DEPLOY

**Two configs, keep in sync:**
- `netlify.toml` (repo root) — for **Git deploys**, sets `publish = "nakwave"`
- `nakwave/netlify.toml` — for **manual zip drops**, where the zip root is the site root

Both carry the same headers (HSTS, nosniff, frame options, cache rules, `llms.txt` as text/plain) and redirects (www→apex, `/scan.html`→`/audit.html`). `pretty_urls` deliberately **off** — it would 301 `/audit.html`→`/audit` while every canonical uses `.html`.

**Manual deploy:** rebuild the zip, drag onto Netlify → Deploys.
```bash
cd "nakwave" && find . -name '.DS_Store' -delete && rm -f ../nakwave-netlify.zip && zip -rq ../nakwave-netlify.zip . -x '*.DS_Store'
```

---

## 5. OUTREACH KIT — `outreach/`

Built to find clients. **Drafts only — Farhan sends, never me.**

- **`prospect-tool.py`** — audits any business site (schema, crawl files, content depth, headings, alt text, load speed, HTTPS, mobile) and drafts a **plain-English** cold email.
  `python3 prospect-tool.py URL "Name" "category" "area"` or `--batch prospects.txt`
- **`OUTREACH-BRIEF.md`** — 6 real Bangalore dental clinics audited live, ranked by problem count, with emails/phones and draft emails
- **`tracker.csv`** · **`prospects.txt`** · **`contacts.json`**

**Language rule he insisted on:** no jargon. "no schema" → *"your website never tells Google what kind of business you are."* Lead with **Google**, mention AI second.

**Top targets:** Reginolds Dental (20 problems, no email published — WhatsApp +919886067262), Chisel Dental (16, chiseldentalclinics@gmail.com). Skip The Dental Venue — they've already done it right.

**The pitch loop:** audit a prospect → screenshot ChatGPT naming a competitor instead → email the 3 findings in plain English → deliver the free audit when they reply → *then* ask "want me to fix these, or your developer?"

---

## 6. WHAT'S STILL MISSING (ranked)

1. **Zero social proof** — no testimonials, no client logos, no founder photo. Biggest credibility gap. Fix via **founding-client deals**: 2–3 free/discounted engagements for a named testimonial + permission to publish a real before/after.
2. **No pricing page** — he explicitly deferred this. Blocks Clutch/GoodFirms listings.
3. **No LocalBusiness schema / address** — needs his real business address; **do not invent one.** Highest-leverage remaining SEO item for local ranking.
4. **No backlinks** — Google Business Profile is the fastest win (not done yet). Then directories (Clutch, DesignRush, GoodFirms, JustDial, IndiaMART, Sulekha), then guest posts.
5. **No GA4/analytics.**
6. **The 12 work cards on the homepage** still read as unnamed client engagements ("delivered for a property agency"). Flagged to him as his biggest credibility risk; he hasn't acted. Relabel as capability builds, or name them.
7. Minor: unused `assets/logo-square.svg`; blog posts are 550–780 words (thin for competitive terms).

---

## 7. HOW TO WORK WITH HIM

- **Verify in the browser before claiming done.** He trusts demonstrated proof — screenshots, real numbers.
- **Push back plainly** when something risks his credibility. Offer the honest version that gets 95% of the effect.
- **Do the work rather than instruct him** when you have the tools — he explicitly said *"go through my chrome and do it for me"* and was right to.
- **Never send emails/messages on his behalf.** Draft, hand over, let him send.
- **Numbers must be computed or cited** — no theatre math. He'll ask for "wow"; give real craft.
- Explain non-code steps (accounts, DNS, dashboards) in numbered click-by-click form.
- Git identity is configured (`Farhan Hyder <hyderfarhan96@gmail.com>`).

---

## 8. INSTALLED SKILLS (`.claude/skills/`, 82 total, auto-load)

- **marketingskills (Corey Haines):** copywriting, cro, offers, pricing, cold-email, prospecting, directory-submissions, ads, analytics, ai-seo, programmatic-seo, competitors, content-strategy, marketing-council, schema, **+ attribution and influencer-marketing (added this session)** …
- **claude-seo (Agrici Daniel):** seo-audit, seo-technical, seo-plan, seo-page, seo-content, seo-cluster, seo-local, seo-geo, seo-schema, seo-backlinks, seo-programmatic …
- **geo-\* suite:** geo, geo-audit, geo-citability, geo-crawlers, geo-llmstxt, geo-report, geo-proposal, geo-prospect …
- **genjutsu:** paint, cast · **flat .md:** frontend-design, ui-ux-pro-max, brand, design-system

*Companion memory: `~/.claude/projects/-Users-farhanhyder-seo-work/memory/`*
