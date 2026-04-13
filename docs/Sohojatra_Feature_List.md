# Complete feature list for Sohojatra platform

Integrating features from Sohojatra design document, 100 Days Nepal analysis, and new AI/ML specifications.

_Legend:_
- **Sohojatra**: from Sohojatra SDD
- **100DN**: from 100 Days Nepal
- **New**: new requirement from current spec

## Identity & verification

| Feature | Source | Description |
|---|---|---|
| **NID verification (EC API)** | Sohojatra | Real-time NID validation against Bangladesh Election Commission. Name, DOB, photo cross-check. Mandatory for govt/expert roles. |
| **Phone OTP (2 options)** | New | SMS OTP via SSL Wireless / Robi / GP. Second factor or standalone. USSD fallback for feature phones. |
| **Passport (diaspora)** | 100DN, New | Overseas Bangladeshis verify via passport + NID. Full participation rights for diaspora submissions and votes. |
| **Device fingerprint + login fraud score** | New | Device ID, IP reputation, login velocity, entropy score → login trust score. Suspicious sessions flagged. |
| **Multi-role profiles** | Sohojatra | One account, multiple roles (Citizen / Expert / GovtAuth / NGO / Admin). Role-based UI. JWT + OAuth 2.0 PKCE. |

## Concern hub

| Feature | Source | Description |
|---|---|---|
| **Multimodal submission** | Sohojatra | Text, Bangla voice (Whisper STT fine-tune), photo/video, auto-geolocation pin (Google Maps API). Offline-first mobile sync. |
| **Status lifecycle (state machine)** | Sohojatra | OPEN → UNDER_REVIEW → IN_PROGRESS → RESOLVED → RATED. Full audit trail. Citizen notified at each transition. |
| **AI duplicate clustering** | New | LaBSE embedding cosine similarity >0.82 clusters nearby concerns. Citizens co-sign merged concern. |
| **Geographic heatmap** | Sohojatra | PostGIS heatmap by division/district/upazila/ward. Filter by category and status. Real-time updates. |
| **Anonymous verified mode** | New | Identity hidden publicly. NID/phone still verified backend. Shown as "Verified Citizen". Prevents abuse. |
| **AI urgency scoring** | Sohojatra, New | LLaMA 3 + LoRA urgency adapter scores 0–100 from text severity, zone risk, weather API, cluster frequency. |

## Voice forum — Reddit/quote style

| Feature | Source | Description |
|---|---|---|
| **Proposal submission** | 100DN | Citizens post proposals (text/voice). Moderation queue before publish. English and Bangla. Diaspora included. |
| **Upvote / downvote** | 100DN | 1 vote per verified user per proposal (cookie + NID check). Score = upvotes − downvotes. No double voting. |
| **AI-prioritized comments + points** | New | Each comment scored on specificity, evidence, tone, actionability, author trust. High scores pinned. Points awarded to author. |
| **Quote-reply threading** | New | Quote any comment/proposal (Reddit/Twitter style). Nested 3 levels. Collapse long threads. Parent quote shown inline. |
| **Ranked sort algorithms** | 100DN, New | Hot (Wilson + recency), Best (AI score), Top (net votes), New, Controversial. Default: Hot discovery, Best governance. |
| **Live voice counter** | 100DN | "132 voices added. Make yours count." Live count of submitted proposals as social proof. |
| **Community awards** | New | "Expert Take", "Most Actionable", "Best Cited" peer awards add to comment AI score and author reputation. |
| **Human content moderation** | 100DN | Approve/reject/edit/request-changes. Appeal process. Published content is permanent public record. |

## Co-governance workflow

| Feature | Source | Description |
|---|---|---|
| **Solution proposal pipeline** | Sohojatra | Expert submits structured proposal (tech docs, budget, timeline). Govt reviews → approves → assigns dept → funds. Full digital trail. |
| **Ongoing project tracker** | Sohojatra, New | Live milestones, deliverable status, budget burn, photo/video updates. Citizens can follow and comment. |
| **Authority accountability KPIs** | New | Avg resolution time, open/resolved ratio, citizen satisfaction. Public-facing. Per ministry/department. |
| **Assembly events** | Sohojatra | Govt or NGO schedules town halls (physical/virtual). RSVP, agenda, live Q&A, auto-generated minutes. |
| **AI-prioritized concern list** | Sohojatra | Government dashboard shows AI-ranked priority feed. Expert can filter by specialisation domain. |

## Research lab & university collaboration

| Feature | Source | Description |
|---|---|---|
| **Open problem release** | New | Govt/platform releases a real civic problem as open challenge. Universities/professors/groups apply to solve it. |
| **Grant disbursement (bKash/bank)** | New | Problem carries grant. Expert panel scores applications. Phased funding released at verified milestones via bKash/bank transfer. |
| **Collaborative workspace** | New | Shared docs, progress log, govt liaison access, peer review panel for accepted research teams. |
| **AI research matcher** | New | Embedding similarity + citation graph matches open problems to university departments and professors. |
| **University contribution board** | New | Public leaderboard of institutions by solved problems, citizen impact score, and research quality. |

## AI / ML features

| Feature | Source | Description |
|---|---|---|
| **LLaMA 3 + LoRA fine-tune** | New | Fine-tuned adapters: urgency scorer, category tagger, constructiveness scorer, constitutional Q&A. Hot-swappable at inference. |
| **RAG constitutional chatbot** | Sohojatra, New | LangChain RetrievalQA over ChromaDB/Qdrant. BD Constitution + laws + circulars. Multi-turn session memory. |
| **Vector database (ChromaDB/Qdrant)** | New | LaBSE embeddings for concern dedup, RAG retrieval, research matching. 768-dim cosine index. |
| **Mob + crime detection (GNN)** | New | Graph neural net on 14+ behavioural signals. Real-time trust score. Shadow-ban below threshold 40. |
| **Bangla NLP (XLM-RoBERTa + BNLP)** | Sohojatra, New | Sentiment, NER, topic classification, STT (Whisper fine-tune). Handles Dhaka/Chittagong/Sylheti accents. |
| **MLflow model registry** | New | All LoRA adapters versioned. A/B testing. Auto-rollback on drift. Monthly retrain on new labelled data. |

## Reputation, accessibility & notifications

| Feature | Source | Description |
|---|---|---|
| **Civic reputation + badges** | Sohojatra | Points for: concern submission, resolution, quality comments, awards, events. Badges unlock features. Reputation-weighted votes. |
| **Full Bangla UI + Bangla STT** | Sohojatra | Complete Bangla interface (Unicode). Voice submission. All AI pipelines support Bangla natively. |
| **Offline-first mobile (React Native)** | New | Drafts cached offline. Syncs on connectivity. Works on 2G. Lightweight APK for low-end Android (90%+ BD market). |
| **USSD / SMS fallback** | New | Feature phone users submit via USSD menu (*XXX#) or SMS shortcode. Status updates via SMS. |
| **Multi-channel notifications** | Sohojatra | Push (FCM), SMS (SSL gateway), email (SES). RabbitMQ fan-out. Real-time status change alerts. |
| **Open data portal** | 100DN, New | Public datasets export (CSV/JSON/API). Concern resolution rates, geographic analytics, anonymised civic data. GDPR/PDPO compliant. |
