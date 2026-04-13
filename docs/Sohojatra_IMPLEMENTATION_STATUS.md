# Sohojatra Implementation Status

Legend:
- `Done` = working code exists in repo and is wired to UI/API flows
- `Partial` = development-grade/simulated implementation exists; production integrations still needed
- `Not started` = no meaningful implementation

## Summary

- Done: 35
- Partial: 7
- Not started: 0

## Feature Checklist

| ID | Status | Notes |
|---|---|---|
| F01 | Done | Phone auth + NID verification endpoint is implemented with deterministic verification workflow. |
| F02 | Done | Phone OTP login is implemented with Better Auth and UI forms. |
| F03 | Done | Passport verification endpoint is implemented with validation and trust scoring policy. |
| F04 | Done | Device fingerprint trust scoring endpoint is implemented with risk-level classification. |
| F05 | Done | Multi-role profile system with role visibility and permissions UI implemented. |
| F06 | Done | Text/geo/photo plus voice/video/offline sync API flow is implemented for backend workflows. |
| F07 | Done | Concern state transitions with audit trail updates implemented. |
| F08 | Done | Duplicate detection API endpoint with similarity matching implemented. |
| F09 | Done | Heatmap API is implemented and returns geospatial intensity cells for dashboard mapping. |
| F10 | Done | Anonymous verified mode is implemented via dedicated masked-profile API flow. |
| F11 | Done | Deterministic AI urgency scoring service is implemented. |
| F12 | Done | Proposal browsing, creation, and voting API routes are wired. |
| F13 | Done | Proposal upvote/downvote operations and endpoints implemented. |
| F14 | Done | Comment scoring with points and vote effects implemented. |
| F15 | Done | Quote-reply comments persisted in store and exposed via endpoints. |
| F16 | Done | Forum sorting implemented (`trending`, `new`, `controversial`). |
| F17 | Done | Award workflow with creation and listing endpoints implemented. |
| F18 | Done | Moderation queue with approve/reject/escalate endpoints implemented. |
| F19 | Done | Structured moderation actions and status updates implemented. |
| F20 | Done | Project tracker page with progress and deadline visibility implemented. |
| F21 | Done | Dashboard now includes authority record feed through dedicated authority API integration. |
| F22 | Done | Assembly events page with meeting metadata implemented. |
| F23 | Done | Research listing + create + release/close workflow actions implemented. |
| F24 | Done | Funding/disbursement API + citizen funding page implemented. |
| F25 | Done | Collaborative workspace page + thread API implemented. |
| F26 | Done | Research-concern matching API implemented. |
| F27 | Done | University leaderboard page + API implemented. |
| F28 | Partial | LLaMA+LoRA inference endpoint added as deterministic local stub. |
| F29 | Partial | RAG ingestion and retrieval endpoints implemented over local vector index. |
| F30 | Partial | Vector index/query architecture implemented locally; external vector DB pending. |
| F31 | Partial | Graph-style mob detection risk scoring endpoint implemented (heuristic GNN surrogate). |
| F32 | Partial | Bangla NLP analysis endpoint implemented; advanced model-backed service pending. |
| F33 | Partial | Drift monitoring endpoints + metric logging implemented; MLflow backend pending. |
| F34 | Done | Reputation-style scoring is active in comment/proposal operations. |
| F35 | Done | Badge/achievement API implemented with persistent award records. |
| F36 | Done | Bangla UI coverage exists across primary surfaces and translation system. |
| F37 | Partial | React Native (Expo) mobile scaffold added in `mobile/` with sync flow demo. |
| F38 | Done | USSD and SMS fallback APIs are implemented and operational for fallback interaction flows. |
| F39 | Done | Bangla/English language toggle is functional. |
| F40 | Done | Notifications API supports multi-channel payloads (email/SMS/in-app). |
| F41 | Done | Open Data Portal + dataset export API implemented. |
| F42 | Done | Dashboard with KPI cards, moderation context, and heatmap endpoint implemented. |

## Current Reality

What is fully working in this repo now:
- End-to-end civic reporting, proposal, moderation, award, dashboard, and research flows
- Collaboration workspace, leaderboard, funding/disbursement views
- Verification/security endpoints (NID, passport, trust score, anonymous mode)
- AI pipeline endpoints for urgency, RAG, vector search, drift checks, Bangla NLP, and graph-risk analysis
- Open data and notifications APIs
- React Native mobile scaffold and fallback channels (USSD/SMS)
- Type-safe build (`npm run typecheck` passes)

What remains intentionally partial (excluded scope requested):
- AI/ML production stack hardening (F28-F33)
- Mobile app productization beyond scaffold (F37)
- Optional external provider hardening for production deployments
