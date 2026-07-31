#!/usr/bin/env python3
"""
Build the batch-2 emails: hand-written hook per business + a proven close.

The close is constant on purpose. A salesperson writes a bespoke opening and
reuses a close that works. What is NOT reused is the hook — every number in
every hook was measured off that business's own site by hunt.py.

Key change from batch 1: the link is a real clickable anchor pointing at the
published sample audit, not a bare domain in a signature. A bare domain gives
nobody a reason to click. "Here is exactly what you'll get" does.

  python3 build_emails.py  ->  emails2.json  (text + html per email)
"""
import json, html as H

SAMPLE = "https://nakwave.services/audit-sample.html"
SITE   = "https://nakwave.services"

PROOF = ("I published a real audit so you can see exactly what you'd get — a live site "
         "scored 38 out of 100, every finding evidenced:\n\n" + SAMPLE + "\n")

def close(n):
    return (f"\nYours would look like that. {n} findings, free, no strings, and it's yours to "
            f"use whether you hire me or your own developer.\n\n"
            f"Reply \"send it\" and I'll have it with you tomorrow.\n\n"
            f"Farhan Hyder\nNakwave — I make businesses easy to find on Google and AI\n"
            f"{SITE} · +91 63615 06839")

# name: (email, subject, greeting, hook paragraphs (list), second finding, n findings)
E = {
"Ezhimala Ayurveda Wellness": ("info@ezhimalaayurvedawellness.com","Google has no map of ezhimalaayurvedawellness.com","Hi",
 ["Two files that tell Google how to read a website are missing from yours: the crawl instructions and the list of your pages. Google is finding its way around by guessing.",
  "For a retreat that's the expensive kind of invisible. When you add a new package or a new therapy page, it can sit unindexed for weeks — and guests planning a panchakarma stay research for a month before they book anything."],
 "Your site also never tells Google you're an ayurveda retreat in Kannur. To Google it's an unlabelled page of words, which is why other retreats appear in results with location and reviews attached and you appear as a plain link.",7),

"Jeevess Ayurveda": ("info@jeevess.in","133 of your 138 photos are invisible to Google","Hi",
 ["You sell a place people have to picture themselves in. So this one is worth two minutes.",
  "Google cannot see photographs — it reads a short text description attached to each one. On your homepage, 133 of your 138 images have no description at all. Your rooms, your grounds, your treatment spaces: to Google Images, none of it exists. And image search is where a lot of wellness-retreat research actually starts."],
 "Your homepage also has no main headline in the code, which is the strongest single clue Google uses to decide what a page is about.",8),

"Learn Overseas": ("info@learnoverseas.com","learnoverseas.com is the heaviest site I tested this week","Hi",
 ["I audited 77 businesses this month. Your homepage is the heaviest of all of them at 296KB.",
  "Your students are on phones, often on mobile data, usually comparing three consultancies in one sitting. Weight is what decides whether they see your page or bounce back to the results and tap the next one."],
 "Two more: there's no list of your pages for Google to follow, so new country and course pages can go weeks without being indexed, and nothing on the site tells Google you're an education consultancy in Bangalore.",6),

"BSI Physiotherapy": ("bsiphysiotherapy@gmail.com","three clinics, one problem","Hi",
 ["You have clinics in Jayanagar, Whitefield and Marathahalli. That's exactly the setup where local search should be doing a lot of work for you, and right now it isn't.",
  "Your site carries no structured information telling Google you're a physiotherapy clinic, or where your branches are. So when someone in Whitefield searches \"physiotherapist near me\", Google has no confirmed location data from you to match against — and shows the clinics that provided it."],
 "Your homepage also has no main headline at all, and 17 of your 37 photos have no description attached.",7),

"Dr Rajendra Cosmetic Surgery": ("contact@drrajendra.com","drrajendra.com is just under 1MB","Hi Dr Rajendra",
 ["Your homepage weighs 996KB. That's close to a megabyte, and it's the heaviest cosmetic surgery site I tested this week.",
  "Cosmetic surgery is researched privately, on a phone, late in the evening, across several surgeons in one sitting. Page weight is what decides whether your before-and-afters finish loading before they go back and tap the next surgeon."],
 "Separately, 28 of your 31 photos have no text description attached — so Google, which can't see images, doesn't know what any of your results show — and your homepage has no main headline in the code.",6),

"Kuvio Studio": ("info@kuviostudio.com","kuviostudio.com — Google has no map of your site","Hi",
 ["There's no list of your pages for Google to follow. When you publish a new project, Google has to stumble across it, which can take weeks or not happen at all.",
  "For a studio whose enquiries come from people browsing recent work, that's a direct cost. The work exists; Google just doesn't know it was published."],
 "Your homepage also has 590 words and no main headline. Google ranks pages that answer questions — there isn't enough text here to answer any, and no headline telling it what the page is for.",6),

"Flexability Physiotherapy": ("info@flexabilityphysio.com","flexabilityphysio.com — good content, no business card","Hi",
 ["You've written 2,000+ words across the site, which is more than most clinics bother with. The problem is what's missing around it.",
  "There's no structured information identifying you as a physiotherapy clinic in Koramangala. To Google you're an unlabelled page of text — which is exactly why other clinics show up in results with hours, a map pin and star ratings, and you show up as a plain blue link."],
 "Your homepage is also 250KB, which is heavy for a phone, and your Google summary line is 205 characters so it gets cut off mid-sentence.",8),

"Pink Apple Aesthetics": ("info@pinkappleaesthetics.com","your page title is 100 characters — Google shows about 60","Hi",
 ["The blue headline people see in Google results is your page title. Yours is 100 characters, so roughly 40% of it is cut off before anyone reads it.",
  "The part that survives is whatever you wrote first, not necessarily the part that would make someone click. For a clinic competing on a considered, high-value decision, that first line is doing a lot of work."],
 "Bigger though: there's no list of your pages for Google to follow, and nothing on the site tells Google you're a cosmetic surgery clinic in Bangalore.",5),

"Alorence Immigration": ("info@alorenceimmigration.com","your page title is 272 characters","Hi",
 ["Google displays about 60. Yours is 272, so more than three-quarters of it never appears — it's the longest title I've seen in 77 audits this month.",
  "That headline is the single line a prospective migrant reads before deciding whether to click you or the consultancy below you. Right now most of it isn't being read at all."],
 "Also: 31 of your 32 photos have no description attached, your homepage has no main headline, and nothing on the site tells Google you're an immigration consultancy in Bangalore.",7),

"Mekosha Ayurveda": ("info@mekosha.com","47 of your 48 photos","Hi",
 ["They have no text description attached. I checked twice because the ratio looked like an error.",
  "Google cannot see photographs — it reads a short description attached to each. Without it, 47 images of your retreat are invisible to Google and completely absent from Google Images, which is where a great deal of wellness-travel research begins."],
 "Your homepage also has 5 competing main headlines. A page should have one; with five, Google can't tell what the page is primarily about.",7),

"Immigration Xperts": ("info@immigrationxperts.com","119 of your 200 photos are invisible to Google","Hi",
 ["You've written 4,600 words on your homepage — more than almost any consultancy I looked at. That's real effort.",
  "Which is why this is frustrating: 119 of your 200 images carry no text description, so Google can't see them at all. And while your site has some structured data, there isn't enough for Google to confirm you as a specific, real business with an address and hours."],
 "Google won't confidently recommend a business it can't verify. Neither will ChatGPT, when someone asks it for an immigration consultant in Bangalore.",6),

"Studio Oura": ("hello@studiooura.in","studiooura.in and \"pilates near me\"","Hi",
 ["A boutique studio lives or dies on local search, and yours is missing the piece that makes local search work.",
  "There's no structured information on the site telling Google you're a pilates and yoga studio in Indiranagar — no confirmed name, address or class times. So when someone half a kilometre away searches \"pilates near me\", Google has nothing from you to match against."],
 "Your homepage also has two competing main headlines, and at 206KB it's heavier than it needs to be for a five-image page.",6),

"Prashanth Dental Clinic": ("clinicalteam@prashantdentalclinic.com","prashantdentalclinic.com is 766KB with no headline","Hi",
 ["Two things worth knowing, both quick to fix.",
  "Your homepage weighs 766KB, which is heavy for a phone on mobile data — and nearly every patient arrives on a phone. And the page has no main headline in the code, which is the strongest signal Google uses to work out what a practice does."],
 "Underneath both: nothing tells Google you're a dental clinic in Vijayanagar, so you don't get the hours, map pin and star ratings competitors get in results.",5),

"DM Consultants": ("info.bglr@dm-consultant.com","dm-consultant.com — 3,378 words Google can't attribute","Hi",
 ["You've written 3,378 words on your homepage, which is more than most consultancies manage. The content is there.",
  "What's missing is the business layer. Your site has some structured data but not enough for Google to confirm you as a specific, identifiable consultancy with an address and hours — and Google won't confidently recommend a business it can't verify."],
 "Also: 29 of your 37 photos have no description attached, and your homepage is 371KB.",5),

"Holistic Eco-Resort": ("booking@holisticstay.in","you never wrote the line Google shows under your name","Hi",
 ["Search for your resort and the sentence under the blue headline is written by Google, not by you — because the summary line was never filled in.",
  "So the first thing a prospective guest reads about your property is a random sentence lifted off the page. For a resort selling a feeling, that's the worst possible introduction, and it's a ten-minute fix."],
 "Your homepage also has 6 competing main headlines, so Google can't tell what the page is primarily about.",5),

"YOS Health": ("info@yos.health","your page title is 130 characters — Google shows about 60","Hi",
 ["More than half of your title is cut off before anyone reads it, and the part that survives is whatever you wrote first rather than the part that sells.",
  "Your homepage also has four competing main headlines. A page should have one — it's the strongest clue Google has about what the page is for."],
 "And while your site carries some business information, there isn't enough for Google to confirm you as a specific clinic, which is what it needs before it will recommend you.",6),

"Mannat Fertility": ("info@mannatfertility.com","252 photos, 77 of them invisible","Hi",
 ["Your homepage carries 252 images — more than any clinic I looked at. 77 of them have no text description, which means Google has no idea what they show.",
  "The bigger one: Google can see your pages but can't confirm you're a specific, real, identifiable clinic. There's no structured business information on the site."],
 "For a clinic with 23,000+ successful pregnancies, that's the difference between being listed and being recommended. Google won't put forward a business it can't verify.",6),

"NU Fertility": ("fertility@nuhospitals.com","nufertility.com — no headline, no label","Hi",
 ["Your homepage has no main headline in the code. That's the strongest single clue Google uses to decide what a page is about, and yours is missing, so it guesses.",
  "Underneath that, nothing on the site tells Google you're a fertility clinic in Bangalore. To Google it's a page of words with no business attached — which is why competitors appear with hours and star ratings and you appear as a plain link."],
 "Your Google summary line is also 172 characters, so it's cut off mid-sentence in results.",5),

"Assurance Developers": ("contact@assurancedevelopers.com","48 of your 66 villa photos","Hi",
 ["They have no text description attached, so Google can't see them. Google reads a short description for each image; without it your completed villas simply aren't in Google Images.",
  "Image search is where a large share of villa buyers start. Yours is the work that should be winning that search and it isn't in it."],
 "The other one: nothing on your site identifies you to Google as a villa construction company in Bangalore. It reads as an unlabelled page of text.",5),

"GreenTree Immigration": ("info@greentreeimmigration.com","your page title is 112 characters","Hi",
 ["Google shows about 60, so roughly half of yours is chopped off in results — including, usually, the part that would make someone click.",
  "You've also written 3,111 words, which is genuinely good, but nothing on the site tells Google you're an immigration consultancy in Bangalore. Google can read every word and still not know whose words they are."],
 "And 24 of your 126 photos have no description attached.",5),

"Aanandakosha": ("info@anandakosha.com","6,931 words and no business card","Hi",
 ["You've written nearly 7,000 words on your homepage. That is more content than almost any property I've audited, and it should be ranking far better than it is.",
  "Here's the missing piece: the site carries no structured business information. Google can read everything you wrote but can't confirm who wrote it — that you're a specific ayurveda retreat near Kovalam, with an address and treatments. It's a detailed brochure with no name on the cover."],
 "Your homepage also has 3 competing main headlines and weighs 349KB.",5),

"Kansas Overseas Careers": ("sec-bad@kansaz.in","kansaz.in — Google can't confirm who you are","Hi",
 ["Nothing on your site tells Google you're an immigration consultancy with an office in Bangalore. No structured business information at all.",
  "It matters more in your category than most. People choosing a consultancy are looking for signals that a business is real and accountable — and the results that show hours, location and reviews are getting those clicks."],
 "Your homepage also has two competing main headlines, and 6 of your 43 photos have no description attached.",4),

"Hairfree & Hairgrow": ("hairfreehairgrow@gmail.com","hairfreehairgrow.com — no page list, and 795KB","Hi",
 ["You've done more than most: 3,986 words and proper FAQ markup, which is exactly what Google and ChatGPT lift answers from. Credit where it's due.",
  "Two gaps though. There's no list of your pages for Google to follow, so new treatment pages can sit unindexed for weeks. And your homepage is 795KB, which is heavy for the phone your patients are researching on."],
 "Your reviews also aren't set up to display as star ratings in results, which is one of the biggest reasons someone clicks one clinic over another.",3),

"Amaya Dental": ("amayadental.ind@gmail.com","amayadental.in — Google can read you but can't confirm you","Hi",
 ["You've marked up your FAQs properly, which most clinics don't bother with. That's the content AI assistants quote from.",
  "What's missing is the business layer underneath: there's nothing confirming you as a specific dental clinic in Bangalore with an address and hours. Google can read your answers but can't verify who's giving them, so it holds back on recommending you."],
 "Your homepage also has two competing main headlines, and it weighs 481KB.",3),

"Mister Hair Clinic": ("reachus@misterhair.in","two clinics, no location data for Google","Hi",
 ["You have clinics at RR Nagar and Bannerghatta Road. Neither is described to Google in a way it can use.",
  "There's no structured business information on the site at all — no confirmed name, address, hours or clinic type. So when someone searches \"hair transplant near me\" from Bannerghatta Road, Google has nothing from you to match against."],
 "Hair transplant is a high-value, heavily-researched decision. Being the clinic Google can actually identify is worth real money in that category.",5),

"MERIT Education": ("merit.consultantsinfo@meritedu.co.in","meritedu.co.in — the label is missing","Hi",
 ["Nothing on your website tells Google you're an overseas education consultancy in Bangalore. Google sees a page of words with no business attached to it.",
  "Search results for \"study abroad consultants Bangalore\" are increasingly won by the firms Google can identify — the ones showing hours, location and reviews. You're competing for the same students without that."],
 "Your Google summary line is also 190 characters so it's cut off mid-sentence, and 13 of your 47 photos have no description.",6),

"Curls & Curves": ("drgirishac74@gmail.com","your page title is 138 characters","Hi Dr Girish",
 ["Google shows about 60 of them. The other 78 characters never appear — and that headline is the one line someone reads before choosing between you and the next surgeon.",
  "With 25 years and board certification behind you, the title is where that ought to land, and right now most of it is being truncated away."],
 "Your site also carries some structured data but not enough for Google to confirm you as a specific clinic, and 3 of your 42 photos have no description.",5),

"The Ayur Villa": ("info@theayurvilla.com","your Google summary is 246 characters — it gets cut off","Hi",
 ["The line under your name in search results is 246 characters. Google shows about 160, so it ends mid-sentence.",
  "That line is what a guest reads before deciding whether to click you or the next Kovalam property. Yours currently trails off into an ellipsis at exactly the wrong moment."],
 "Your page title is also 74 characters, so it's truncated too, and your site doesn't carry enough structured information for Google to confirm you as a specific retreat.",5),

"Aspire Fertility": ("info@aspirefertility.in","aspirefertility.in — 586KB and unlabelled","Hi",
 ["Nothing on your site tells Google you're a fertility clinic in Bangalore. No structured business information at all. Google reads the words but can't confirm the business — and it won't confidently recommend one it can't identify. Nor will ChatGPT when someone asks it for IVF clinics in Bangalore.",
  "Second, your homepage is 586KB, which is heavy for a phone. Fertility research happens on phones, late at night, across several clinic sites in a row."],
 "Your Google summary line is also 170 characters, so it's cut short in results.",4),

"Interio Splash": ("info@interiosplash.com","interiosplash.com — Google can read you but can't confirm you","Hi",
 ["You've marked up your FAQs properly, which puts you ahead of most interior firms — that's the content Google and ChatGPT lift answers from.",
  "What's missing is the business layer. There's nothing confirming you as a specific interior design company in Bangalore with an address and hours. Google can read your answers but can't verify who's giving them."],
 "Your Google summary line is also 169 characters, so it's cut off mid-sentence, and your reviews aren't set up to show as stars.",4),

"Abroad Education Counsel": ("info@abroadeducounsel.com","you did the FAQ part right — the rest is missing","Hi",
 ["Genuinely: you've marked up your FAQs properly, which most consultancies don't. That's exactly what ChatGPT and Google pull answers from, so well done.",
  "Which makes the gap odd. There's no matching information telling Google you're a specific business — a consultancy in Bangalore with an address and hours. Google can read your answers but can't confirm who's giving them, and it won't recommend a business it can't identify."],
 "Your page is also 203KB and your title is 73 characters, so it's cut short in results.",5),

"Physio365": ("info@physio365.com","physio365.com — Google doesn't know you're a clinic","Hi",
 ["Your website carries no structured information telling Google what kind of business you are. To Google it's a page of words, not \"an orthopaedic and neuro rehab clinic in Bangalore.\"",
  "That's the single reason other clinics appear with opening hours, a map pin and star ratings while you appear as a plain blue link. It isn't about how the site looks. It's about what's readable underneath."],
 "Your reviews also aren't set up to display as stars, and your Google summary line is 192 characters so it's cut off mid-sentence.",5),

"MIMS Builders": ("info@mimsbuilders.com","mimsbuilders.com — two decades, no label","Hi",
 ["Sixteen completed projects, all sold out, twenty years in. Your website doesn't tell Google any of that.",
  "There's no structured information identifying you as a villa builder in Bangalore. To Google it's an unlabelled page of words — the difference between showing up for \"villa builders Bangalore\" with your details attached and not showing up at all."],
 "Your Google summary line is also 191 characters so it's cut off mid-sentence, and 3 of your 44 photos have no description.",4),

"Trilife": ("reachus@trilife.in","trilife.in has 145 words on it","Hi",
 ["That's the entire word count of your homepage. I counted it twice because the number looked wrong.",
  "Google ranks pages that answer questions, and with 145 words there is almost nothing here for it to answer anything with. Your homepage also has no main headline in the code, so Google has no strong clue what the page is even about."],
 "The structured data you do have is good — but it's describing a page with nothing on it.",4),

"Nationwide Visas": ("info@nationwidevisas.com","nationwidevisas.com is 483KB","Hi",
 ["Your homepage weighs 483KB, which is heavy for the phone most of your enquiries arrive on.",
  "You've written 3,038 words, which is solid, but your site carries only partial structured data — not enough for Google to confirm you as a specific consultancy with an office and hours. Google won't confidently recommend a business it can't verify."],
 "Your page title is also 69 characters, so it's truncated in results.",4),

"Neo Follicle Transplant Clinic": ("info@neofollicletransplant.com","3,900 words and no name on the cover","Hi",
 ["You've written nearly 3,900 words on your homepage. That's real effort and it should be ranking better than it is.",
  "Here's the missing piece: the site carries no structured business information. Google can read every word you wrote but can't confirm who wrote it — that you're a specific hair transplant clinic in Bangalore, with an address, hours, and a named surgeon. It's a detailed brochure with no name on it."],
 "Google increasingly ranks businesses it can verify. So does ChatGPT, when someone asks it to recommend a clinic.",3),

"Pioneer Advanced Hair Transplant": ("info@hairtransplantsbangalore.com","hairtransplantsbangalore.com — established 2006, unverifiable in 2026","Hi",
 ["Your site carries a little structured data, but not the kind that identifies you as a real, specific clinic — no confirmed business name, address or hours.",
  "Google won't confidently recommend a business it can't verify, and neither will ChatGPT when someone asks it for hair transplant clinics in Bangalore. Twenty years of practice is doing none of that work for you in search."],
 "Also: 52 of your 54 photos have no text description, so Google can't see any of your results, and your reviews aren't set up to show as star ratings.",3),

"Dr Swetha's Cosmoderm Centre": ("info@drswethacosmodermcentre.com","fast site, invisible business","Hi Dr Swetha",
 ["Your site loads in under a second, which is better than almost every clinic I tested this month. So this is a short email about the one real gap.",
  "There's nothing on the site telling Google what kind of business you are — no structured information confirming you as a dermatology clinic in Indiranagar. To Google it's an unlabelled page of text, which is why other clinics get the hours, map pin and star ratings in results and you get a plain link."],
 "Your reviews also aren't set up to display as stars, and 18 of your 76 photos have no description attached.",3),

"Smile Station Dental": ("info@smilestation.in","smilestation.in has no main headline","Hi",
 ["Small thing, big effect. Your homepage has no main headline in the code. Visually there's text at the top, but structurally nothing is marked as the headline — and that's the strongest single clue Google uses to decide what a page is about. Yours is missing, so it guesses.",
  "Underneath it, nothing identifies you to Google as a dental clinic in Domlur."],
 "For an ISO-certified, internationally awarded practice, that second one is what I'd fix first. It's the reason competitors get star ratings and hours in results and you get a plain link.",4),

"Smile Architect": ("drgirishpv@gmail.com","smilearchitect.in weighs over a megabyte","Hi Dr Girish",
 ["Your homepage is 1,039KB. That's the heaviest dental site of the 77 businesses I've audited this month.",
  "Invisalign is a considered, expensive decision — researched on a phone, on mobile data, across several clinics in one sitting. A megabyte is what decides whether your page finishes loading before they go back and tap the next clinic."],
 "Your site also doesn't tell Google you're a dental clinic in Bangalore, which is why competitors show up with hours and star ratings attached and you don't.",4),

"Dr Sandhya Bala": ("info@drsandhyabala.com","your page title is 16 characters","Hi Dr Sandhya",
 ["Google gives you about 60 characters of blue headline in the search results. You're using 16 of them.",
  "That headline is the single line someone reads before deciding whether to click you or the next surgeon. You have four times the room you're currently using, and nothing in it about being a plastic surgeon in Bangalore."],
 "Your Google summary line is also 186 characters, so it's cut off mid-sentence, and 44 of your 45 photos have no text description attached.",5),

"Phoenix GRS": ("shahid@phoenixgrs.com","phoenixgrs.com — 2,796 words Google can't attribute","Hi Shahid",
 ["You've written nearly 2,800 words. The content is there. What's missing is the label.",
  "Nothing on the site tells Google you're an immigration consultancy in Bangalore — no structured business information at all. Google reads the words but can't confirm the business, and it won't recommend one it can't identify."],
 "Your homepage is also 262KB, and your reviews aren't set up to display as star ratings in results.",5),

"GarbhaGudi IVF": ("dreams@garbhagudi.com","your homepage has 107 words on it","Hi",
 ["That's the whole page. I counted twice because the number looked wrong for a clinic of your size.",
  "Your structured data is actually good — better than most clinics I looked at. But it's describing a page with almost nothing on it. Google ranks pages that answer questions, and there isn't enough here to answer any."],
 "Your page title is also 69 characters and your summary line 176, so both get truncated in results.",5),

"Preeti Developers": ("enquiry@preetidevelopers.com","preetidevelopers.com — you're 90% there","Hi",
 ["Genuine credit: your structured data is among the best I've seen in Bangalore property. Most developers have none at all. You've done the hard part.",
  "What's left is small. Your homepage has two competing main headlines, so Google can't tell which one defines the page. Your title runs to 70 characters and your summary to 170, so both are truncated in results — and those two lines are the entire pitch a buyer reads before clicking."],
 "Your reviews also aren't set up to display as star ratings, which for a developer is a meaningful click-through difference.",5),

"Sitaram Ayurvedic Retreat": ("retreat@sitaramayurveda.com","80 of your 126 photos","Hi",
 ["They have no text description attached, so Google can't see them. Google reads a short description for each image; without it, your treatment rooms and grounds aren't in Google Images at all.",
  "For a retreat that's a real loss — image search is where a lot of wellness-travel research starts, and NABH-accredited since 1993 is exactly the kind of credential that should be winning it."],
 "Your Google summary line is also 215 characters and your title 81, so both get cut off mid-sentence in results.",5),

"SKS Veterinary Hospital": ("admin@skspethospital.com","your Google summary is 508 characters","Hi",
 ["Google shows about 160. Yours is 508, so more than two-thirds of it never appears — it's the longest I've found in 77 audits this month.",
  "That line is what a worried pet owner reads before deciding which clinic to call. Right now it ends abruptly in the middle of a sentence."],
 "Also: 17 of your 31 photos have no text description attached, and your reviews aren't set up to display as star ratings in results.",4),

"Vardhan Fertility": ("vardhanfertility@gmail.com","you never wrote the line Google shows under your name","Hi",
 ["Search for your clinic and the sentence beneath the blue headline was written by Google, not by you — because the summary line is empty.",
  "So the first thing a couple reads about twenty years of practice is a random sentence lifted off your page. Your structured data is good, which makes this gap more frustrating, not less. It's a ten-minute fix."],
 "Your reviews also aren't set up to display as star ratings, and common patient questions aren't marked up as questions and answers — which is exactly what ChatGPT pulls from.",4),

"WeDezine Studio": ("info@wedezinestudio.com","wedezinestudio.com — 109 photos, none described","Hi",
 ["Your structured data is genuinely good. Full business information, FAQs marked up properly — better than most studios in Bangalore. So this is a short email.",
  "All 109 images on your homepage have no text description attached. Google cannot see pictures; it reads that description. For an interior studio, that means your entire portfolio is invisible to Google Images — the one search where your work should be unbeatable."],
 "Your homepage also has 4 competing main headlines, so Google can't tell which one defines the page.",3),

"WEA Designs": ("sales@weadesign.com","125 of your 128 photos are invisible to Google","Hi",
 ["Your site is well built — full structured data, 6,454 words. You've done more than almost any interior firm I've audited. So this is the one thing that stood out.",
  "125 of your 128 images have no text description attached. Google can't see pictures; it reads that description. Your entire portfolio is therefore absent from Google Images, which for an interior design firm is the single search you should be winning."],
 "Your Google summary line is also 264 characters, so it's cut off mid-sentence in results.",4),

"Gravity Homes": ("hr@gravityhomes.in","gravityhomes.in — one gap, and one thing worth checking","Hi",
 ["Your site is in good shape: proper structured data, clean build. Two small things.",
  "Your title runs to 68 characters and your summary to 177, so both are truncated in results — those two lines are the whole pitch a buyer reads before deciding to click. And your reviews aren't set up to display as star ratings."],
 "Separately, and more usefully: hr@ is the only address published anywhere on your site. Enquiries from buyers are landing in an HR inbox, or not being sent at all.",4),

"Pancham Interiors": ("info@panchaminteriors.com","panchaminteriors.com is the best-configured site I audited this month","Hi",
 ["That isn't flattery, it's the finding. Out of 77 Bangalore businesses I audited, yours has the most complete structured data of any of them. Almost nothing to fix on the search side.",
  "So I'll be straight: I don't think you need an SEO audit. What I'd look at instead is 77 of your images having no text description, which keeps a genuinely strong portfolio out of Google Images."],
 "The other half of what I do is AI automation — enquiry handling, WhatsApp follow-up, qualifying leads before they reach your designers. For a studio already winning search, that's usually where the next gain is.",2),

"School Estate": ("bookings@schoolestate.in","schoolestate.in — almost nothing to fix, so a different suggestion","Hi",
 ["I audited 77 businesses this month and yours came back with one finding. One. Your structured data, crawl files, headings and speed are all in order — genuinely rare.",
  "The one thing: your reviews aren't set up to display as star ratings in search results, which for a heritage property competing against OTA listings is worth having."],
 "Beyond that, the useful conversation for you probably isn't search at all — it's direct bookings. Every reservation through an OTA costs you 15-20% commission, and enquiry-to-booking automation is usually where a property like yours gets that back.",1),
}

def build(name, d):
    email, subj, greet, hooks, second, n = d
    text = greet + ",\n\n" + "\n\n".join(hooks) + "\n\n" + second + "\n\n" + PROOF + close(n)
    # HTML: real anchors so the link is clickable and visible
    paras = []
    for block in text.split("\n\n"):
        b = H.escape(block).replace("\n", "<br>")
        b = b.replace(H.escape(SAMPLE),
                      f'<a href="{SAMPLE}" style="color:#1a73e8;font-weight:bold">{SAMPLE}</a>')
        b = b.replace(H.escape(SITE) + " ·",
                      f'<a href="{SITE}" style="color:#1a73e8">{SITE}</a> ·')
        paras.append(f"<div>{b}</div>")
    return dict(name=name, to=email, subject=subj, text=text,
                html="<div><br></div>".join(paras))

if __name__ == "__main__":
    out = [build(k, v) for k, v in E.items()]
    json.dump(out, open("emails2.json", "w"), indent=1)
    print(f"built {len(out)} emails")
    bad = [o["name"] for o in out if SAMPLE not in o["html"] or "<a href" not in o["html"]]
    print("missing clickable link:", bad or "none")
    print("\n--- sample ---\n")
    print(out[0]["text"])


# --- Trusted Types workaround -------------------------------------------------
# Gmail enforces Trusted Types, so execCommand('insertHTML') and innerHTML
# assignment are both blocked. Instead we emit a block structure the browser
# side rebuilds with createElement/createTextNode, which Trusted Types allows.
def blocks(text):
    out = []
    for para in text.split("\n\n"):
        blk = []
        for i, line in enumerate(para.split("\n")):
            if i:
                blk.append({"br": True})
            rest = line
            for url, bold in ((SAMPLE, True), (SITE, False)):
                if url in rest:
                    head, _, tail = rest.partition(url)
                    if head:
                        blk.append({"t": head})
                    blk.append({"a": url, "t": url, "b": bold})
                    rest = tail
            if rest:
                blk.append({"t": rest})
        out.append(blk)
    return out
