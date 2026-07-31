#!/usr/bin/env python3
"""
Rebuild the 12 Tier A emails already sitting in Gmail drafts, in the new
format: same measured hooks, but with the published sample audit as a real
clickable anchor instead of a bare unlinked domain in the signature.

  python3 build_tiera.py  ->  emails_tiera2.json
"""
import json
from build_emails import build, SAMPLE

E = {
"Hundredhands": ("touch@hundredhands.com","hundredhands.com on a phone","Hi",
 ["I design and fix websites for a living. Yours came up while I was looking at architecture studios in Bangalore, and something didn't add up, so I checked properly.",
  "Your homepage has 92 words on it. That's the whole page. And the site carries no instruction telling a phone how to display it — so on mobile it renders at desktop width and people pinch and zoom.",
  "For a studio whose work is this good, that's a strange gap. Google has almost nothing to read about you, so when someone searches \"architects in Bangalore\" it recommends firms it can actually read instead."],
 "Both of your images also have no text description attached, and the page has no main headline in the code.",9),

"Ministry of Skin": ("info@ministryofskin.in","what Google can actually read about Ministry of Skin","Hi",
 ["I had a proper look at your site this morning — I fix this for a living and you came up while I was going through skin clinics in Jayanagar.",
  "Your website never tells Google what kind of business you are. To Google it's a page of words, not \"a dermatology clinic in Jayanagar.\" That's why other clinics show up with hours and star ratings and you don't.",
  "There's also no list of your pages for Google to follow, so new treatment pages can take weeks to appear — or never."],
 "And you haven't written the summary line that appears under your name in search results, so Google writes its own by grabbing a random sentence off your page.",9),

"Modular Kitchen Company": ("info@modularkitchencompany.com","31 of your 38 kitchen photos are invisible to Google","Hi",
 ["You sell kitchens on how they look. So this one bothered me enough to email you.",
  "Google cannot see pictures. It reads a short text description attached to each one. On your homepage, 31 of your 38 photos have no description attached — so to Google and to Google Images, your best work simply isn't there. Someone searching \"modular kitchen designs Jayanagar\" in the image tab will never find you."],
 "Two more: your page title is 112 characters so Google chops it off halfway, and your site never actually tells Google you're a kitchen company in Jayanagar.",10),

"Overseas Educational Services": ("admin@oesedu.com","55 of your 56 photos are invisible to Google","Hi",
 ["You've been doing this since 1991 and helped 20,000+ students. Your website isn't carrying that.",
  "Google cannot see pictures — it reads a short text description attached to each one. On your homepage, 55 of your 56 photos have no description at all. Your campus shots, your student photos, your office: to Google, none of it exists.",
  "Second: I loaded your homepage three times and it took between 4 and 6 seconds every time. Most people leave before 3."],
 "Third: there's no list of your pages for Google to follow, and nothing on the site tells Google you're an education consultancy in Bangalore.",9),

"Khosla Associates": ("amaresh@khoslaassociates.com","52 words","Hi Amaresh",
 ["That's how many words are on your homepage. I counted, because the number seemed wrong for a studio with your publication record.",
  "On top of that, 11 of your 12 images have no text description attached — which means Google, which cannot see pictures, has almost nothing to go on. For a practice whose entire value is visual, your portfolio is effectively invisible to search.",
  "None of this is about how the site looks. It looks beautiful. It's about what Google and ChatGPT can read when someone searches for architects in Bangalore — right now, close to nothing."],
 "Your homepage also has no main headline in the code, and no summary line written for search results.",8),

"Khushi Fertility": ("msakhushivf@gmail.com","khushifertility.com — the content is there, the labels aren't","Hi",
 ["You've written 3,300 words on your homepage. That's more than almost any clinic I looked at, and it's genuinely useful content. The problem is what's wrapped around it.",
  "Your page has 8 different main headlines competing with each other. A page is supposed to have one — it's the strongest clue Google has about what the page is for. With eight, Google can't tell what it's about, so it ranks the page for nothing in particular."],
 "Your site also never tells Google you're a fertility clinic in Bangalore, and there's no list of your pages for it to follow. You've done the hard part already — this is the labelling.",8),

"SPARC Physio": ("info@sparcphysio.com","28 of your 29 clinic photos","Hi",
 ["They have no text description attached. I checked twice because the ratio looked like an error.",
  "Google cannot see pictures — it reads a short description attached to each one. Without it, 28 photos of your clinic, your equipment and your team are invisible to Google and absent from Google Images entirely.",
  "The second one matters more. Your site carries some structured information, but not enough for Google to confirm you as a specific, real clinic — a name, an address, hours, a named physiotherapist. Google won't confidently recommend a business it can't verify, and neither will ChatGPT."],
 "Your homepage also took several seconds to load on every attempt, which loses people on a phone.",7),

"My Phyzio": ("info@myphyzio.com","113 of your 117 photos","Hi",
 ["That's how many images on your site have no text description attached. I checked because the number looked like a mistake.",
  "Google cannot see pictures — it reads a short description attached to each one. Yours don't have it, so 113 photos of your clinic, your team and your equipment are invisible to Google and completely absent from Google Images. That's a lot of work sitting in the dark."],
 "The other one worth knowing: your reviews aren't set up to show as star ratings in search results. Stars are one of the biggest reasons someone clicks you instead of the clinic listed above you.",4),

"Elements Kitchens": ("info@elements4kitchens.com","elements4kitchens.com — Google has no map of your site","Hi",
 ["Quick one, from someone who does this for a living.",
  "Your site has no list of pages for Google to follow, and the file that tells Google how to crawl you is missing. Google is finding its way around by guessing. When you add a new kitchen or a new page, it can take weeks to appear in search — or not appear at all."],
 "Your homepage also has four competing main headlines. A page should have one — it's the strongest clue Google has about what the page is for. With four, Google can't tell what it's actually about.",9),

"Global Developers": ("sales@globaldevelopers.co.in","globaldevelopers.co.in — Google can't tell what you build","Hi",
 ["You've been building villas since 2005. Your website doesn't tell Google that.",
  "There's nothing on the site identifying you as a property developer in Bangalore — to Google it's an unlabelled page of words. That's the difference between showing up for \"villa builders Bangalore\" with your details attached, and not showing up at all."],
 "Your homepage also has no main headline, and there's no list of your pages for Google to follow — so a new project page can sit unindexed for weeks. Villa buyers research for months before they call anyone; being findable during those months is the whole game.",7),

"Neeta Shankar Photography": ("info@neetashankar.com","you wrote 7,671 words and Google is picking a sentence at random","Hi Neeta",
 ["I've audited 77 Bangalore businesses this month and yours has the most content of any of them — 7,671 words on the homepage. Almost nobody does that.",
  "Which is why this is frustrating: you never wrote the one-line summary that appears under your name in Google results. So Google grabs a sentence off the page at random and shows that instead. After all that writing, the first line a bride reads about you is chosen by an algorithm."],
 "Your site also doesn't tell Google you're a wedding photography studio in Bangalore, and 36 of your 160 photos have no description — invisible to Google Images, where a lot of wedding research starts.",5),

"The Wedding Fellas": ("hello@theweddingfellas.com","222 words","Hi",
 ["That's the entire word count of your homepage. I counted it while going through wedding photographers in Bangalore.",
  "Here's why it matters more for you than for most businesses: Google ranks pages that answer questions, and it can't see photographs at all. It reads text. With 222 words and 8 of your 10 images carrying no description, there is almost nothing on your homepage Google can actually read. A couple searching \"candid wedding photographer Bangalore\" gets shown studios that wrote more, not studios that shoot better."],
 "The page is also 236KB, which on mobile data means your first photo arrives slower than the studio listed above you.",7),
}

if __name__ == "__main__":
    out = [build(k, v) for k, v in E.items()]
    json.dump(out, open("emails_tiera2.json", "w"), indent=1)
    print(f"rebuilt {len(out)} Tier A emails")
    print("missing link:", [o["name"] for o in out if SAMPLE not in o["html"]] or "none")
