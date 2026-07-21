# NAKWAVE — PROJECT HANDOFF
*Continuation document for a new AI session. Read fully before acting. Last updated: 19 July 2026.*

---

## 1. WHO I'M WORKING WITH

**Farhan Hyder** — hyderfarhan96@gmail.com — founder of **Nakwave**, an SEO & AI-automation studio. GitHub: FARHANHYDER7. Beginner-to-intermediate technically (guide him through terminal/account steps click-by-click; he once saved a file by typing a path into a save dialog — macOS turned slashes into colons). Fast-moving, ambitious, gives layered multi-part requests, often interrupts and pivots. Appreciates being pushed back on when an idea is risky.

**Positioning (corrected twice — get this right):** TWO EQUAL CRAFTS.
1. **Search** — SEO + AEO/AI visibility (rank on Google, get cited by ChatGPT/Gemini/Perplexity/Claude)
2. **AI Automation** — chatbots, WhatsApp bots, agentic multi-agent workflows, analytics

Neither pillar may dominate any copy. First site draft was all-AI (he said "I'm an SEO expert, add that"); the fix over-rotated to SEO-first; he corrected again ("both should get the same attention"). Slogan: **"Get found everywhere. Automate everything."** Frame everything as "two crafts under one roof."

**Ethics guardrail (tested repeatedly):** He has asked to present fabricated client work as real (once: "find random websites and take their work as our work" — refused). The standing compromise he accepts: **"Showcase build" / "Interactive concept" labels** — full cinematic client-style presentation, honestly tagged, nothing a due-diligence check can catch. Keep resisting fake-client framing; steer to real products, teardowns of real sites (with analysis framing), and founding-client deals. The Mosaic House (hotel) and Meridian Motors (dealership) are FICTIONAL demo brands, labeled as such. Saim Surfaces (saimsurfaces.com) is a REAL business — the sample audit of it is a real analysis of public data.

---

## 2. THE WEBSITE (all in `nakwave/` folder, static, no build step)

**Design language (verteal.com-inspired, user-chosen):** white/#f4f4f2 sections alternating pure black #060606 · single vermilion accent #ff2d00 · Archivo (500 display, −0.03em) · hairlines #e4e4e0 · pill buttons + arrow chips with text-roll hover · ASCII-grid preloader (mark: NAKWAVE) · split-text word reveals · scroll word-scrub statement · double counter-marquee · custom cursor ("Drag"/"Read" states) · glyph-scramble stats · horizontal drag-rails for Work + Insights (arrows, snap, drag; NO vertical scroll-jacking — was removed for page length).

**Pages/experiences:**
- `index.html` — homepage: WebGL hero (`assets/hero-field.js`: Three.js r128 CDN, transparent GLSL flow field, film grain, cursor-bent filaments, ≤40 orange #FF5A1F particles, heat-haze; idle looks plain white; degrades gracefully), rotating headline word (Google→ChatGPT→…→everywhere), ghost NAKWAVE wordmark scroll-fill, 7 services (featured dark "Agentic Workflows" card w/ agent-flow diagram), work rail (all presented as delivered/in-house, no Concept badges), featured case-study section (live InsightAI iframe), interactive process accordion, before/after AEO drag slider, founder strip (orange pulse dot, "SEO expert & AI engineer" scribble quote), FAQ (mirrored in JSON-LD), contact section
- `audit.html` — free AI Visibility Audit funnel; form → FormSubmit; links sample report
- `audit-sample.html` — REAL audit of saimsurfaces.com, scored 38/100 (real findings: no schema, no sitemap, broken robots.txt, no llms.txt, thin content)
- `insightai/` — **working BI product** (own identity: cream/deep-green, Manrope, Donezo-style). "The Mosaic House" hotel workspace: seeded 364-day dataset, canvas charts, z-score anomalies, trend×seasonality forecast, RFM guest segments, elasticity what-if, computed-answer copilot, ⌘K palette, NLG executive report, CSV import with cleaning log. Hash deep-links: `#forecast` `#customers` `#alerts`
- `work/insightai.html` — case study (brief → delivered → AI tools grid → LIVE scaled iframes of the product, not screenshots → "Test the working product" CTA). Tagged "Showcase build"
- `meridian/` — **the flagship**: quiet-luxury cinematic AI-dealership experience (v2 after full redesign brief). #080808, ONE accent #5b4dff indigo, Space Grotesk display + IBM Plex Mono timecodes, grain, mix-blend nav, NO cards/gradients/glow. Poster hero ("The AI Employee. / Built for luxury dealerships."), typographic live conversation + auto-filling ledger + 1px score line (engine: 18-unit inventory NLU, tradeValue() depreciation model, finMax() payment math, slot booking, lead scoring, Sofia briefing), 700vh pinned scroll-story of one night (23:47→08:56, typewriter, trade counter **computed by the same functions as the chat** — provably consistent), metro-line flow, editorial results, magnetic CTA. Full reduced-motion fallbacks
- `blog/` — 3 AEO articles + listing (CSS-drawn thumbs, no emojis)
- `llms.txt`, `robots.txt`, `sitemap.xml` — maintained; keep in sync when adding pages

**Conventions:** cache-bust with `?v=N` bumps on css/js when editing (browsers cache aggressively via python http.server); site tokens in `nakwave/assets/style.css` :root; interactions in `assets/main.js`; InsightAI and Meridian are self-contained (own css/js); commit style: descriptive body + `Co-Authored-By: Claude`; verify everything in the browser preview before claiming done; dev server via `.claude/launch.json` name "hyder-site" (python http.server, autoPort).

**Forms:** POST to `https://formsubmit.co/hyderfarhan96@gmail.com` (contact + audit; AJAX with plain-button fallback). ⚠️ NEEDS ONE-TIME ACTIVATION: first live submission emails a confirmation link — must be clicked or leads vanish.

---

## 3. DEPLOYMENT STATE (unfinished!)

- **Git:** local repo at `seo work/` root, clean, ~8 commits, no remote attached. `.gitignore`: .DS_Store, .claude/settings.local.json
- **GitHub:** repo `FARHANHYDER7/Nakwave` exists but is BROKEN — web-upload flattened folders (no assets/, no blog/). `gh` CLI installed but auth never completed (device-code flow kept failing; ~/.config ownership was fixed; token method suggested, never finished). Fix path: complete `gh auth login`, then force-push the correct local repo
- **Chosen plan:** Netlify drag-and-drop of `nakwave/` folder (he chose this over GitHub flow). May already be live on some netlify.app URL — ask him
- **Domain:** nakwave.com verified AVAILABLE (whois, July 2026), not yet purchased. Canonicals/schema already use https://nakwave.com/. Plan: buy after hosting works, then attach
- **other-projects/ayeshu-netlify/** — personal page, NOT part of the site, don't deploy

## 4. PENDING ROADMAP (agreed, not done)

1. **Critical infra:** GA4 + Search Console + form events (zero analytics now) · create `assets/og-cover.png` (referenced everywhere, 404s!) · privacy policy page · 404 page · FormSubmit activation test · sitemap lastmod refresh
2. **Conversion:** proof element above homepage fold · value-labeled CTAs · scarcity-line consistency
3. **Offers:** name deliverables, risk-reversal lines, timeframes; decide pricing signals; **add "AI Workflow Audit"** as automation-side mirror of the free search audit; rename toward "AI Employees" language
4. **Content:** one topic cluster per craft ("AEO for [industry]" ×5, "AI employee for [industry]" ×5); Article schema + author entity on blog posts
5. **Images:** delete unused `assets/img/wave.jpg` · founder photo (duotone) when he sends one · per-post OG images
6. **Trust:** founding-client deals (2–3 free/discounted for named case studies); real screenshots of Nakwa app (his real shipped app) when he provides
7. **Meridian:** being pitched to a REAL dealership client (no name/numbers yet — everything framed as projected/industry-cited until real data exists)

## 5. REAL INDUSTRY STATS IN USE (dealership pitch)
- Only 13.2% of dealerships respond to internet leads within 5 min; >75% take an hour+
- ~1 in 3 dealer leads never get any reply (2026 mystery-shop studies)
- 391% higher close rate when contact happens within 60s (Velocify, 3.5M-lead study)
- Response averages range 47 min (business hours) to 9 hrs (incl. after-hours)
*Primary sources not yet verified page-by-page — do that before client-facing citation by name.*

## 6. INSTALLED SKILLS (`.claude/skills/` — auto-load in new sessions in this folder)

- **marketingskills (Corey Haines):** copywriting, copy-editing, cro, ab-testing, offers, pricing, paywalls, popups, lead-magnets, free-tools, emails, cold-email, sms, prospecting, launch, ads, ad-creative, social, video, image, analytics, ai-seo, programmatic-seo, site-architecture, seo (comprehensive), content-strategy, customer-research, competitor-profiling, competitors, co-marketing, community-marketing, churn-prevention, onboarding, signup, referrals, revops, sales-enablement, public-relations, directory-submissions, marketing-plan, marketing-ideas, marketing-loops, marketing-psychology, marketing-council, product-marketing, schema
- **claude-seo (Agrici Daniel):** seo-audit, seo-technical, seo-plan, seo-page, seo-content, seo-content-brief, seo-cluster, seo-local, seo-geo, seo-schema, seo-sitemap, seo-backlinks, seo-hreflang, seo-competitor-pages, seo-programmatic, seo-drift, seo-google, seo-maps, seo-images, seo-image-gen, seo-sxo, seo-flow, seo-ecommerce + tool extensions (seo-ahrefs, seo-dataforseo, seo-firecrawl, seo-bing, seo-unlighthouse, seo-seranking, seo-profound — need API keys)
- **genjutsu (AThevon):** paint, cast + _jutsu library (threejs-r3f, canvas-generative, design-audit, ui-ux-pro-max, mobile/desktop principles)
- **geo-* suite:** geo, geo-audit, geo-citability, geo-crawlers, geo-llmstxt, geo-brand-mentions, geo-content, geo-technical, geo-schema, geo-platform-optimizer, geo-report, geo-report-pdf, geo-proposal, geo-prospect, geo-compare, geo-update (+ geo subagents)
- **flat .md (early installs):** frontend-design (Anthropic), ui-ux-pro-max, design, brand, ui-styling, design-system, banner-design, slides

## 7. HOW TO WORK WITH FARHAN (style notes)
- Build fast, verify in the live browser preview, show screenshots/results — he trusts demonstrated proof
- Push back plainly when an idea risks his credibility (fake clients, invented numbers) — offer the honest version that gets 95% of the effect
- He switches models mid-session and interrupts often; keep state in files/commits so nothing is lost
- Explain non-code steps (accounts, terminals, DNS) in numbered click-by-click form
- When he says "make it wow / max out," go genuinely maximal on craft but keep every displayed number computed or cited — no theater math
- Commit at milestones with real messages; bump `?v=` on asset edits

*Companion memory files (auto-loaded): `~/.claude/projects/-Users-farhanhyder-seo-work/memory/` — agency-service-pillars, hyder-site-design-language, farhan-seo-expert-positioning.*
