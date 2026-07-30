#!/usr/bin/env python3
"""
Nakwave prospect tool — audit a business site, get a plain-English email.

  python3 prospect-tool.py https://example.com "Business Name" "dental clinic" "Koramangala"
  python3 prospect-tool.py --batch prospects.txt

Every finding is read from the live page. Nothing is invented.
No jargon in the output — findings are written so a shop owner understands them.
"""
import json, re, sys, ssl, urllib.request, time

CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
UA = {"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"}

def get(url, t=12):
    try:
        t0=time.time()
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t, context=CTX)
        data = r.read()
        return r.status, data.decode("utf-8","replace"), time.time()-t0, len(data)
    except Exception:
        return 0, "", 0, 0

def audit(url):
    st, h, secs, size = get(url)
    if not h: return None
    root = "/".join(url.split("/")[:3])
    body = re.sub(r'<(script|style|noscript|svg)[^>]*>.*?</\1>','',h,flags=re.S|re.I)
    words = len(re.sub(r'<[^>]+>',' ',body).split())
    types=set()
    for blk in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>',h,re.S):
        try:
            o=json.loads(blk.strip())
            for x in (o if isinstance(o,list) else [o]):
                if isinstance(x,dict):
                    v=x.get("@type")
                    for y in (v if isinstance(v,list) else [v]):
                        if y: types.add(str(y))
        except Exception: pass
    title=(re.search(r'<title[^>]*>(.*?)</title>',h,re.S) or [None,""])[1].strip()
    desc =(re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',h,re.S|re.I) or [None,""])[1].strip()
    h1s=re.findall(r'<h1[^>]*>(.*?)</h1>',h,re.S|re.I)
    imgs=re.findall(r'<img[^>]*>',h)
    noalt=[i for i in imgs if 'alt=' not in i or re.search(r'alt=(""|\'\')',i)]
    _,robots,_,_  = get(root+"/robots.txt",8)
    _,sitemap,_,_ = get(root+"/sitemap.xml",8)
    return dict(url=url,status=st,secs=round(secs,1),kb=round(size/1024),
        words=words,schema=sorted(types),
        title=title,title_len=len(title),desc=desc,desc_len=len(desc),has_desc=bool(desc),
        h1_count=len(h1s),imgs=len(imgs),imgs_noalt=len(noalt),
        has_schema=bool(types),
        has_entity=any(k in " ".join(types) for k in
          ("LocalBusiness","Dentist","MedicalOrganization","Restaurant","Store","RealEstate","Organization")),
        has_faq=any("FAQ" in t for t in types),
        has_reviews=any(k in " ".join(types) for k in ("AggregateRating","Review")),
        robots_ok=("user-agent" in robots.lower() and "<html" not in robots[:300].lower()),
        sitemap_ok=("<urlset" in sitemap.lower() or "<sitemapindex" in sitemap.lower()),
        https=url.startswith("https"),
        viewport=('name="viewport"' in h or "name='viewport'" in h))

def findings(a, cat="business", area="your area"):
    """(severity, what's wrong, what it costs them) — all plain English, no jargon."""
    f=[]
    if not a["viewport"]:
        f.append(("BIG","Your site isn't built for phones.",
          "Most people search on their phone. Google pushes non-mobile sites down the results."))
    if not a["has_schema"]:
        f.append(("BIG","Your website never actually tells Google what kind of business you are.",
          f"To Google it's just a page of words — not \"a {cat} in {area}\". That's why competitors "
          "show up with star ratings and opening hours in search and you don't."))
    elif not a["has_entity"]:
        f.append(("BIG","Google can see your pages but can't confirm you're a specific real business.",
          "It won't confidently recommend a business it can't identify."))
    if not a["robots_ok"]:
        f.append(("BIG","The file that tells Google how to read your site is missing or broken.",
          "Google is guessing its way around your site instead of being guided."))
    if not a["sitemap_ok"]:
        f.append(("BIG","There's no list of your pages for Google to follow.",
          "When you add a new page or service, it can take weeks to appear in search — or never."))
    if a["words"]<400:
        f.append(("BIG",f"Your homepage has only about {a['words']} words on it.",
          "Google ranks pages that answer questions. There isn't enough here to answer anything, "
          "so there's very little for it to rank you for."))
    if a["h1_count"]==0:
        f.append(("MEDIUM","Your page has no main headline.",
          "The headline is the strongest clue about what a page is for. Yours is missing, so Google has to guess."))
    elif a["h1_count"]>1:
        f.append(("MEDIUM",f"Your page has {a['h1_count']} competing main headlines.",
          "Google can't tell which one matters, so the page gets a muddled topic."))
    if not a["has_desc"]:
        f.append(("MEDIUM","You haven't written the summary that appears under your name in Google.",
          "So Google writes its own — usually a random sentence pulled off the page."))
    elif a["desc_len"]>165:
        f.append(("SMALL",f"Your Google summary is {a['desc_len']} characters, so it gets cut off mid-sentence.",
          "People decide whether to click from that line. Yours ends in \"...\"."))
    if a["title_len"]>60:
        f.append(("SMALL",f"Your page title is {a['title_len']} characters — too long for Google to show fully.",
          "The end gets chopped off in the results."))
    if a["imgs"] and a["imgs_noalt"]/a["imgs"]>0.3:
        f.append(("MEDIUM",f"{a['imgs_noalt']} of your {a['imgs']} photos have no description attached.",
          "Google can't actually see pictures — it reads the description. Yours are invisible to it, "
          "and to Google Images."))
    if not a["has_reviews"]:
        f.append(("MEDIUM","Your reviews aren't set up to show as stars in Google results.",
          "Star ratings in search are one of the biggest things that make people click you over the next listing."))
    if not a["has_faq"]:
        f.append(("SMALL","Common customer questions aren't marked up as questions and answers.",
          "Those are exactly what Google and ChatGPT pull answers from."))
    if a["secs"]>3:
        f.append(("MEDIUM",f"Your homepage took {a['secs']} seconds to load for me ({a['kb']}KB).",
          "Speed is a ranking factor, and most people leave before a slow page finishes loading."))
    if not a["https"]:
        f.append(("BIG","Your site isn't secure (no padlock).",
          "Browsers warn visitors, and Google ranks insecure sites lower."))
    return f

def email(name, a, cat="dental clinic", area="Koramangala", city="Bangalore"):
    f=findings(a,cat,area)
    top=[x for x in f if x[0]=="BIG"][:3] or f[:3]
    lines=[]
    for _,what,cost in top:
        lines.append(f"{what}\n   → {cost}")
    bullets="\n\n".join(f"{i}. {b}" for i,b in enumerate(lines,1))
    return f"""Subject: {name} — a few things stopping Google finding you

Hi {name} team,

I had a look at your website this morning. I fix this stuff for a living, and
yours came up while I was going through {cat}s in {area}.

I found a few things that are quietly costing you customers. In plain English:

{bullets}

None of this is about how the site looks — it looks good. It's about what
Google and ChatGPT can actually read when someone searches "{cat} in {area}".
Right now they're working with very little, so they recommend whoever they
can read instead.

Try it yourself: search "{cat} in {area}" and see who comes up before you.

I've written the full list — everything I found, what it's costing you, and
how to fix each one. Happy to send it over free, no strings. It's yours to
use whether you hire me or not.

Want me to send it?

Farhan Hyder
Nakwave — I make businesses easy to find on Google and AI
https://nakwave.services
+91 63615 06839
"""

def run(url,name,cat="dental clinic",area="Koramangala"):
    a=audit(url)
    if not a:
        print(f"\n{'='*70}\n{name} — couldn't load (blocks bots). Check by hand.\n"); return
    print(f"\n{'='*70}\n{name}  ·  {a['url']}")
    print(f"  {a['words']} words · loaded in {a['secs']}s · {a['kb']}KB")
    print(f"  Google can identify business type: {'YES — '+', '.join(a['schema']) if a['schema'] else 'NO'}")
    print(f"  {'-'*66}")
    for sev,what,cost in findings(a,cat,area):
        print(f"  [{sev:6}] {what}")
        print(f"           {cost}")
    print(f"  {'-'*66}")
    print(email(name,a,cat,area))

if __name__=="__main__":
    ar=sys.argv[1:]
    if not ar: print(__doc__); sys.exit(0)
    if ar[0]=="--batch":
        for l in open(ar[1]):
            l=l.strip()
            if not l or l.startswith("#"): continue
            p=[x.strip() for x in l.split(",")]
            run(p[0],p[1],p[2] if len(p)>2 else "dental clinic",p[3] if len(p)>3 else "Koramangala")
    else:
        run(ar[0],ar[1] if len(ar)>1 else "there",
            ar[2] if len(ar)>2 else "dental clinic", ar[3] if len(ar)>3 else "Koramangala")
