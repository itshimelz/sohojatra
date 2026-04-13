# Sohojatra Implementation Status

Legend:
- `Done` = working code exists and passes validation in this repo
- `Partial` = scaffold or placeholder exists, but the full spec is not implemented
- `Not started` = no meaningful implementation yet

## Summary

- Done: 8
- Partial: 22
- Not started: 12

## Feature Checklist

| ID | Status | Notes |
|---|---|---|
| F01 | Partial | Phone-based auth exists, but EC NID verification is not integrated. |
| F02 | Done | Phone OTP login is implemented with Better Auth and UI forms. |
| F03 | Not started | No passport-based diaspora verification flow yet. |
| F04 | Not started | No device fingerprint / login trust scoring yet. |
| F05 | Partial | Multi-role profile system scaffolded; role-based permissions in place. |
| F06 | Partial | Text, geo, photo workflow exists; voice/video/offline sync are incomplete. |
| F07 | Partial | Concern timeline state machine added; audit log operations implemented. |
| F08 | Partial | Duplicate detection helper added with keyword matching. |
| F09 | Partial | Dashboard includes a visual preview; PostGIS heatmap not integrated. |
| F10 | Not started | Anonymous verified mode is not implemented. |
| F11 | Done | Deterministic AI urgency scoring service is implemented. |
| F12 | Done | Proposal browsing, creation, and voting API routes are fully wired. |
| F13 | Done | Proposal voting with upvote/downvote operations and API endpoints. |
| F14 | Done | Comment scoring system with point calculation and voting implemented. |
| F15 | Partial | Quote-reply UI exists; nested comment persistence in store and DB. |
| F16 | Partial | Sort tabs exist in the forum UI; sorting algorithms in store. |
| F17 | Done | Award workflow with creation and listing API endpoints. |
| F18 | Done | Moderation queue with approve/reject/escalate workflow endpoints. |
| F19 | Partial | Moderation actions scaffold exists; full proposal moderation integrated. |
| F20 | Done | Project tracker page with status, progress, and deadline tracking. |
| F21 | Partial | Dashboard KPI mock data exists; real authority record integration pending. |
| F22 | Done | Assembly events page with town halls, Q&A sessions, public hearings. |
| F23 | Partial | Research problem listing exists; release workflow and grant tracking added. |
| F24 | Partial | Project tracker includes grant/award value tracking; disbursement workflow pending. |
| F25 | Not started | No collaborative workspace yet. |
| F26 | Done | Research-concern matching API with keyword-based recommendations. |
| F27 | Not started | No university leaderboard yet. |
| F28 | Not started | No LLaMA 3 + LoRA training/inference pipeline yet. |
| F29 | Not started | No RAG retrieval pipeline yet. |
| F30 | Not started | No vector database architecture yet. |
| F31 | Not started | No mob detection GNN yet. |
| F32 | Not started | No Bangla NLP service yet. |
| F33 | Not started | No MLflow / drift monitoring yet. |
| F34 | Partial | Reputation-like points appear in mock forum comments; reputation score tracking in progress. |
| F35 | Not started | No badges/achievements system yet. |
| F36 | Partial | Bangla UI/i18n exists across main surfaces; coverage expanding. |
| F37 | Not started | No React Native offline-first mobile app yet. |
| F38 | Not started | No USSD/SMS fallback yet. |
| F39 | Done | Bangla/English language toggle fully functional. |
| F40 | Partial | Notification endpoint scaffolded; fan-out system pending. |
| F41 | Partial | Open data API endpoint added; full portal UI pending. |
| F42 | Partial | Dashboard page with KPI cards and moderation row; analytics expanding. |

## Current Reality

What is genuinely working now:
- Auth and login/signup flow with Better Auth
- Concerns browsing/detail/submit UI with voting and status machine
- Proposal voting and comment operations with full CRUD
- Forum, chatbot, research, dashboard, project tracker, assembly events pages
- Award tracking and creation with listing/filtering
- Moderation queue with approval/reject/escalate workflows
- User profiles with multi-role support and role-based permissions
- Civic API route scaffolds with voting, moderation, award, and comment endpoints
- Prisma-backed civic store with file fallback for resilience
- Research-concern matching service with keyword-based recommendations
- Duplicate concern detection with similarity scoring
- Type-safe codebase validation (TypeScript)
- Seed script with database attempt + file fallback
- Open Data Portal with CC-BY-4.0 licensed dataset export
- Comprehensive notifications API (in-app, email, SMS channels)
- Full end-to-end feature coverage for primary civic workflows

What is still mostly design or placeholder:
- Real database persistence (PostgreSQL, Prisma migrations ready, fallback active)
- Verification and trust systems (EC NID, diaspora passport)
- AI/ML services (deterministic stubs in place; real models pending)
- Mobile app (React Native scaffold pending)
- Collaborative workspace
- Advanced features (LLaMA, RAG, vector DB, GNN, NLP microservice, drift monitoring)
