#!/usr/bin/env python3
"""
Nakwave prospect tool — audit any business site, get a drafted outreach email.

  python3 prospect-tool.py https://example.com "Business Name"
  python3 prospect-tool.py --batch urls.txt        (one "url,Name" per line)

Every finding is read from the live page. Nothing is invented.
Sites behind Cloudflare/Shopify bot protection will fail — check those by hand.
"""
import json, re, sys, ssl, urllib.request, csv, os

CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
UA = {"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"}

def get(url, t=12):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t, context=CTX)
        return r.status, r.read().decode("utf-8", "replace")
    except Exception:
        return 0, ""

def audit(url):
    st, h = get(url)
    if not h:
        return None
    root = "/".join(url.split("/")[:3])
    body = re.sub(r'<(script|style|noscript|svg)[^>]*>.*?</\1>', '', h, flags=re.S|re.I)
    words = len(re.sub(r'<[^>]+>', ' ', body).split())
    types = set()
    for blk in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', h, re.S):
        try:
            o = json.loads(blk.strip())
            for x in (o if isinstance(o, list) else [o]):
                if isinstance(x, dict):
                    t_ = x.get("@type")
                    for v in (t_ if isinstance(t_, list) else [t_]):
                        if v: types.add(str(v))
        except Exception:
            pass
    title = (re.search(r'<title[^>]*>(.*?)</title>', h, re.S) or [None, ""])[1].strip()
    desc  = (re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', h, re.S|re.I) or [None, ""])[1].strip()
    h1s   = re.findall(r'<h1[^>]*>(.*?)</h1>', h, re.S|re.I)
    imgs  = re.findall(r'<img[^>]*>', h)
    noalt = [i for i in imgs if 'alt=' not in i or re.search(r'alt=(""|\'\')', i)]
    _, robots  = get(root + "/robots.txt", 8)
    _, sitemap = get(root + "/sitemap.xml", 8)
    sl, llms   = get(root + "/llms.txt", 8)
    return dict(
        url=url, status=st, words=words, schema=sorted(types),
        title=title, title_len=len(title), desc_len=len(desc), has_desc=bool(desc),
        h1_count=len(h1s), imgs=len(imgs), imgs_noalt=len(noalt),
        has_schema=bool(types),
        has_entity=any(k in " ".join(types) for k in
            ("LocalBusiness","Dentist","MedicalOrganization","Restaurant","Store","RealEstate","Organization")),
        has_faq=any("FAQ" in t for t in types),
        robots_ok=("user-agent" in robots.lower() and "<html" not in robots[:300].lower()),
        sitemap_ok=("<urlset" in sitemap.lower() or "<sitemapindex" in sitemap.lower()),
        llms_ok=(sl == 200 and "<html" not in llms[:200].lower() and len(llms) > 20),
        viewport=('name="viewport"' in h or "name='viewport'" in h),
    )

def findings(a):
    """Ordered by how much it hurts them. Returns (severity, plain-English finding)."""
    f = []
    if not a["has_schema"]:
        f.append(("CRITICAL", "no structured data (schema) anywhere on the site — AI engines have nothing to confirm who you are or what you do"))
    elif not a["has_entity"]:
        f.append(("HIGH", "no LocalBusiness/Organization schema — engines can't place you as a specific real business"))
    if not a["robots_ok"]:
        f.append(("HIGH", "robots.txt is missing or returns an error page instead of crawler instructions"))
    if not a["sitemap_ok"]:
        f.append(("HIGH", "no XML sitemap — new pages can go undiscovered for weeks"))
    if a["words"] < 400:
        f.append(("HIGH", f"only about {a['words']} words on the homepage — too thin for an AI engine to quote"))
    if a["h1_count"] == 0:
        f.append(("MEDIUM", "no H1 heading at all — the single strongest on-page topic signal is missing"))
    elif a["h1_count"] > 1:
        f.append(("MEDIUM", f"{a['h1_count']} H1 headings — engines can't tell what the page is actually about"))
    if not a["has_desc"]:
        f.append(("MEDIUM", "no meta description — Google writes its own snippet for you"))
    elif a["desc_len"] > 165:
        f.append(("LOW", f"meta description is {a['desc_len']} characters, so it gets cut off in results (~160 max)"))
    if a["title_len"] > 60:
        f.append(("LOW", f"page title is {a['title_len']} characters — truncated in search results (~60 max)"))
    if a["imgs"] and a["imgs_noalt"] / a["imgs"] > 0.3:
        f.append(("MEDIUM", f"{a['imgs_noalt']} of {a['imgs']} images have no alt text — invisible to search and to screen readers"))
    if not a["has_faq"]:
        f.append(("LOW", "no FAQ schema — the questions your customers ask AI aren't marked up as answers"))
    if not a["llms_ok"]:
        f.append(("LOW", "no llms.txt — nothing tells ChatGPT/Perplexity how to summarise your business"))
    if not a["viewport"]:
        f.append(("CRITICAL", "no mobile viewport tag — the site isn't mobile-ready, a hard demotion in Google"))
    return f

def email(name, a, city="Bangalore", category="business"):
    f = findings(a)
    top = [x for x in f if x[0] in ("CRITICAL", "HIGH")][:3] or f[:3]
    bullets = "\n".join(f"• {t}" for _, t in top)
    subj = f"{name} — {top[0][1].split('—')[0].strip()[:48]}" if top else f"{name} — quick SEO note"
    body = f"""Subject: {subj}

Hi {name} team,

I ran a quick technical check on {a['url']} this morning — I do this for a
living and yours came up while I was looking at {category}s in {city}.

Three things stood out:

{bullets}

None of this is about how the site looks — it looks fine. It's about whether
Google and AI assistants like ChatGPT can actually read and recommend you.
Right now they're working with very little.

I've written the full breakdown (every issue, ranked, with the fix for each).
Happy to send it over — free, no strings, and it's yours whether or not we
ever work together.

Want it?

Farhan Hyder
Nakwave — SEO & AI visibility
https://nakwave.services
+91 63615 06839
"""
    return body

def run(url, name, city="Bangalore", category="business"):
    a = audit(url)
    if not a:
        print(f"\n{'='*66}\n{name} — UNREACHABLE (bot protection or site down). Check manually.\n")
        return None
    print(f"\n{'='*66}\n{name}  ·  {a['url']}")
    print(f"  {a['words']} words | schema: {', '.join(a['schema']) if a['schema'] else 'NONE'}")
    print(f"  {'-'*62}")
    for sev, t in findings(a):
        print(f"  [{sev:8}] {t}")
    print(f"  {'-'*62}")
    print(email(name, a, city, category))
    return a

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(0)
    if args[0] == "--batch":
        rows = [l.strip().split(",", 1) for l in open(args[1]) if l.strip() and not l.startswith("#")]
        for url, nm in rows:
            run(url.strip(), nm.strip())
    else:
        run(args[0], args[1] if len(args) > 1 else "there")
