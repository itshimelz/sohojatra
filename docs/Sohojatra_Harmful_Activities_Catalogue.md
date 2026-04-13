# Complete catalogue of criminal and harmful activities

Detectable from user behaviour on the Sohojatra platform, categorised by type with detection signals for each.

> **Note:** All detection is probabilistic. Flagged activity is queued for human moderator review before any action. No automatic law enforcement referral without admin authorisation and legal review. Applicable Bangladesh laws cited per category.

## 1. Platform integrity crimes

### Vote manipulation / astroturfing
Coordinated fake accounts mass-upvoting a proposal to artificially inflate priority ranking.
- **Law:** Violates Digital Security Act 2018 s.26.
- **Signals:** registration burst · voting velocity spike · star topology graph · copy-paste comments

### Identity fraud / impersonation
Using another person's NID or phone number to register. Creating a fake government official profile to gain authority trust badge.
- **Signals:** NID collision · device mismatch · profile anomaly · name/DOB inconsistency with EC API response

### Sockpuppet network operation
Running multiple accounts to amplify one political viewpoint or suppress opposition concerns by mass-downvoting.
- **Signals:** dense mutual-vote cluster · writing style similarity >0.87 · same device fingerprint family

### AI-generated fake submissions
Flooding the concern hub with LLM-generated fake civic complaints to overwhelm moderators or manipulate the priority list.
- **Signals:** low perplexity score · repetitive semantic patterns · submission velocity anomaly · no geolocation variance

## 2. Corruption and governance crimes

### Bribery signal in concern text
Citizen report describing a public official demanding payment for service. NLP flags "ঘুষ" (bribe), money amounts, official title in same context.
- **Signals:** Bangla NER detects bribery keywords + official entity + monetary amount co-occurring

### Contractor / tender fraud
Concerns mentioning inflated project costs, ghost workers, or infrastructure delivered below spec — cross-referenced with govt project tracker.
- **Signals:** location-tagged concern + project status "resolved" + citizen rating very low + budget anomaly flag

### Fund misappropriation (research grants)
Research team receiving grant milestone payment but failing to deliver verifiable output. Detected through milestone verification gap.
- **Signals:** milestone overdue >30d · no deliverable uploaded · payment disbursed · supervisor/liaison not responding

### Collusion between official and contractor
Same expert submits proposals for concerns raised in their own family member's neighbourhood, and same govt authority always approves only their proposals.
- **Signals:** graph edge between expert account and authority account · geographic overlap · approval rate anomaly

## 3. Hate speech and incitement (Bangladesh-specific)

### Communal incitement
Content targeting Hindu/Buddhist/Christian minorities or framing civic issues along religious lines to incite violence.
- **Law:** DSA 2018 s.28/29.
- **Signals:** religious group entity + negative sentiment + call-to-action language · geographic clustering during communal event calendar

### Ethnic/regional discrimination
Content targeting Chakma, Marma, Rohingya, or Terai Muslim communities with discriminatory language in concern submissions or comments.
- **Signals:** ethnic entity NER + hate lexicon match + high downvote from community members

### Political violence incitement
Comments calling for physical harm against a political opponent or government official. Escalation from hartal-related concerns.
- **Signals:** violence verb + named target entity + time reference (hartal/election date) co-occurring

### Defamation of public officials
False factual claims against named govt officials without evidence, submitted as concern or comment to damage reputation.
- **Signals:** named person entity (govt role) + negative factual claim + low evidence score + no corroborating concerns

## 4. Cybercrime and digital abuse

### Doxxing / privacy violation
Posting another user's personal information (address, phone, workplace) in a comment or concern to facilitate harassment.
- **Law:** DSA 2018 s.29.
- **Signals:** NER detects phone/address/ID patterns in comment text · account trust score of target drops after post

### Sexual harassment / image-based abuse
Uploading non-consensual intimate images as "evidence" in a concern, or sending sexually threatening messages through the platform.
- **Signals:** image NSFW classifier (CLIP-based) · sexual threat keywords in message · target is female + account age <7d

### Phishing / scam via platform
Fake "government official" profiles sending citizens links to fraudulent payment portals claiming to "process" their concern.
- **Signals:** external URL in message · impersonation badge mismatch · click-through reporting from multiple recipients

### DDoS / API abuse
Automated scripts hammering the concern submission API to exhaust server capacity during elections or protests.
- **Signals:** request rate >50/min per IP · headless browser fingerprint · no human interaction pattern

## 5. Real-world crime reporting (citizen-flagged)

### Child safety / trafficking signal
Concern or comment describing child labour, trafficking routes, or missing children. Platform flags for immediate escalation to BNWLA/999.
- **Signals:** child entity + trafficking keyword set (Bangla/English) + location entity · high urgency score auto-escalate

### Drug trafficking/manufacture
Geo-tagged concern about suspected Yaba/Phensidyl production locations or distribution networks. Cross-referenced with police station zone.
- **Signals:** drug entity (BNLP lexicon) + location + multiple independent citizen reports in same grid cell

### Environmental crime
Industrial discharge, illegal tannery waste, deforestation. Citizen uploads photo + geo. AI classifies image + cross-references DoE complaint portal.
- **Signals:** image classifier (pollution/deforestation) + geo near industrial zone + multiple reports + no resolved status

### Land grabbing / illegal construction
Concern about khas land encroachment, illegal structure on wetland, or demolition of heritage site without permit.
- **Signals:** land/property entity + location in protected zone (GIS overlay) + supporting photo attachment

## 6. Behavioural warning indicators (pre-crime)

### Escalating harassment pattern
User progressively targeting the same citizen or official across multiple threads with increasingly hostile language.
- **Signals:** same target entity across 3+ comments · sentiment slope negative over time · report count from target

### Radicalisation signal
Shift from civic language to extremist framing over time — tracked per account as embedding drift toward known radical text cluster.
- **Signals:** embedding drift toward extremist centroid in vector space · keyword escalation timeline · external link to banned content

### Concern suppression campaign
Organised downvoting of a legitimate high-urgency concern (e.g. about a specific factory or official) to bury it from the priority list.
- **Signals:** sudden downvote cluster on one concern · downvoters have mob trust score <40 · concern had been rising in rank.
