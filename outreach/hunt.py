#!/usr/bin/env python3
"""
Nakwave prospect hunter — audit a site AND find who to email.

  python3 hunt.py targets.txt out.json

targets.txt lines:  url,Business Name,category,area

For each business it:
  1. audits the homepage with prospect_tool.audit (real findings, nothing invented)
  2. crawls contact / about / reach-us pages looking for a real email address
  3. scores the prospect: more problems + a reachable email = higher score

Everything is read live off the site. No invented contacts, no invented findings.
"""
import json, re, sys, concurrent.futures as cf
from prospect_tool import audit, findings, get

CONTACT_PATHS = ["", "/contact", "/contact-us", "/contact.html", "/contactus",
                 "/about", "/about-us", "/reach-us", "/get-in-touch", "/enquiry",
                 "/contact-us.php", "/contact.php", "/pages/contact"]

EMAIL_RE = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
PHONE_RE = re.compile(r'(?:\+91[\s\-]?|0)?[6-9]\d{9}\b')

# junk that shows up in page source but is never a person
JUNK = ("sentry.io", "wixpress", "example.com", "@2x", "yourdomain", "domain.com",
        "@sentry", "gserviceaccount", "godaddy", "email.com", "abc@", "test@",
        "sentry-next", "wordpress.org", "w3.org", ".png", ".jpg", ".svg", ".webp",
        "@x2", "yoursite", "name@", "your@", "info@example", "u003e", "schema.org")


def clean_emails(raw):
    out = []
    for e in raw:
        el = e.lower().strip(".,;:'\"")
        if any(j in el for j in JUNK):
            continue
        if len(el) > 60 or el.count("@") != 1:
            continue
        if re.match(r'^[0-9a-f]{16,}@', el):      # hashed/tracking addresses
            continue
        if el not in out:
            out.append(el)
    return out


def clean_phones(raw):
    out = []
    for p in raw:
        d = re.sub(r'\D', '', p)[-10:]
        if len(d) == 10 and d[0] in "6789" and d not in out:
            out.append(d)
    return out[:3]


def contacts(url):
    root = "/".join(url.split("/")[:3])
    emails, phones, pages = [], [], 0
    for path in CONTACT_PATHS:
        _, html, _, _ = get(root + path, 10)
        if not html or "<html" not in html.lower():
            continue
        pages += 1
        emails += EMAIL_RE.findall(html)
        # mailto: links are the most reliable signal
        emails += re.findall(r'mailto:([^"\'?\s>]+)', html)
        phones += PHONE_RE.findall(re.sub(r'<[^>]+>', ' ', html))
        if clean_emails(emails):
            break                                  # found one, stop crawling
    return clean_emails(emails)[:3], clean_phones(phones), pages


def score(a, f, emails):
    """Higher = better prospect. Problems they have + how reachable they are."""
    big = sum(1 for x in f if x[0] == "BIG")
    med = sum(1 for x in f if x[0] == "MEDIUM")
    s = big * 10 + med * 4 + len(f)
    if emails:
        s += 25                                    # emailable is worth more than any finding
    if a and a["words"] > 900:
        s += 5                                     # they invest in the site => they'll invest in this
    return s


def one(line):
    p = [x.strip() for x in line.split(",")]
    url, name = p[0], p[1]
    cat = p[2] if len(p) > 2 else "business"
    area = p[3] if len(p) > 3 else "Bangalore"
    a = audit(url)
    if not a:
        return dict(name=name, url=url, cat=cat, area=area, ok=False)
    f = findings(a, cat, area)
    em, ph, pages = contacts(url)
    return dict(name=name, url=url, cat=cat, area=area, ok=True,
                audit=a, findings=f, emails=em, phones=ph, pages_crawled=pages,
                big=sum(1 for x in f if x[0] == "BIG"), total=len(f),
                score=score(a, f, em))


if __name__ == "__main__":
    lines = [l.strip() for l in open(sys.argv[1])
             if l.strip() and not l.startswith("#")]
    res = []
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        for r in ex.map(one, lines):
            res.append(r)
            tag = "DEAD" if not r["ok"] else f"{r['score']:3d}pts {r['big']}big/{r['total']}"
            mail = r.get("emails", [""])[0] if r.get("emails") else "— no email —"
            print(f"{tag:22} {r['name'][:34]:36} {mail}")
    res.sort(key=lambda r: -r.get("score", 0))
    json.dump(res, open(sys.argv[2], "w"), indent=1, default=str)
    live = [r for r in res if r["ok"]]
    print(f"\n{len(live)}/{len(res)} loaded · {sum(1 for r in live if r['emails'])} with a real email")
