# API Security Fixes — Implementation Summary

All critical vulnerabilities identified in the [security audit](file:///C:/Users/Himel/.gemini/antigravity/brain/372009a3-35c8-4db9-ba78-d18f5c404fa0/api_security_report.md) have been patched. Here is a complete breakdown of the changes.

---

## New Files Created

### [lib/api-guard.ts](file:///d:/WebProjects/Sohojatra/lib/api-guard.ts)
Central security module providing three guard functions:

| Function | Purpose |
|---|---|
| `requireSession(request)` | Returns `VerifiedSession` or a `401 Response`. Every mutating route calls this. |
| `requireRole(request, roles[])` | Extends `requireSession` with RBAC. Returns `403` if the user's role isn't in the allowed list. |
| `optionalSession()` | Returns session or `null`. For routes where auth is optional (public GETs). |

---

## Updated Files

### [proxy.ts](file:///d:/WebProjects/Sohojatra/proxy.ts) — Middleware Rate Limiting
- **Before:** Only `/api/auth` POST routes were rate-limited.
- **After:** ALL `/api/*` routes are rate-limited:
  - `POST /api/*` → 30 requests/minute per IP
  - `GET /api/*` → 120 requests/minute per IP
  - `POST /api/auth/send-otp` → 5 per 10 minutes
  - `POST /api/auth/verify` → 20 per 10 minutes

### API Route Security Matrix

| Route | GET | POST | Auth Level | Identity Source |
|---|---|---|---|---|
| `/api/concerns` | 🌐 Public | 🔒 Session | citizen+ | `session.userName` |
| `/api/concerns/[id]` | 🌐 Public | — | — | — |
| `/api/concerns/[id]/actions` | 🌐 Public | 🔒 Session/RBAC | citizen+ (vote), moderator+ (status) | session |
| `/api/concerns/[id]/comments` | 🌐 Public | 🔒 Session | citizen+ | `session.userName`, `session.userId` |
| `/api/concerns/sync` | — | 🔒 Session | citizen+ | session |
| `/api/votes` | 🔒 Optional | 🔒 Session | citizen+ | `session.userId` (not body!) |
| `/api/proposals/[id]` | 🌐 Public | 🔒 Session | citizen+ | session |
| `/api/proposals/[id]/comments` | 🌐 Public | 🔒 Session | citizen+ | `session.userName` |
| `/api/forum/proposals` | 🌐 Public | 🔒 Session | citizen+ | `session.userName` |
| `/api/forum/proposals/[id]/comments` | — | 🔒 Session | citizen+ | `session.userName` |
| `/api/collaboration/threads` | 🌐 Public | 🔒 Session | citizen+ | `session.userName` |
| `/api/solution-plans` | 🌐 Public | 🔒 Session | citizen+ | `session.userName` |
| `/api/solution-plans/[id]` | 🌐 Public | 🔒 RBAC | admin+ | `session.userName` |
| `/api/moderation/approve` | 🔒 RBAC | 🔒 RBAC | moderator+ | `session.userName` |
| `/api/awards` | 🌐 Public | 🔒 RBAC | admin+ | — |
| `/api/badges` | 🌐 Public | 🔒 RBAC | admin+ | — |
| `/api/reputation` | 🔒 Session | 🔒 RBAC | auth (GET), admin+ (POST) | `session.userId` |
| `/api/notifications` | 🔒 Session | 🔒 RBAC | auth (GET), admin+ (POST) | `session.userId` |
| `/api/projects` | 🌐 Public | 🔒 RBAC | admin+ | `session.userName` |
| `/api/projects/[id]/actions` | — | 🔒 Session/RBAC | citizen+ (follow/comment), admin+ (milestone/update) | session |
| `/api/assembly/events` | 🌐 Public | 🔒 RBAC | admin+ | `session.userName` |
| `/api/assembly/events/[id]/actions` | — | 🔒 Session/RBAC | citizen+ (rsvp), admin+ (minutes) | session |
| `/api/research/problems` | 🌐 Public | 🔒 RBAC | admin+ | — |
| `/api/research/match` | 🌐 Public | 🔒 RBAC | admin+ | — |
| `/api/funding/disbursements` | 🌐 Public | 🔒 RBAC | admin+ | — |
| `/api/verification/nid` | — | 🔒 Session | citizen+ | session |
| `/api/verification/passport` | — | 🔒 Session | citizen+ | session |
| `/api/security/trust-score` | — | 🔒 Session | citizen+ | session |
| `/api/auth/anonymous-verified` | — | 🔒 Session | citizen+ | `session.userId` |
| `/api/dashboard` | 🌐 Public | — | — | — |
| `/api/open-data` | 🌐 Public | — | — | — |
| `/api/chatbot` | — | 🌐 Public | none (read-only) | — |
| `/api/fallback/sms` | — | 🌐 Public | none (telecom gateway) | — |
| `/api/fallback/ussd` | — | 🌐 Public | none (telecom gateway) | — |
| `/api/ai/*` (13 routes) | 🔒 RBAC | 🔒 RBAC | moderator+ or admin+ | session |

---

## Key Design Decisions

1. **Identity always from session** — No API route trusts `userId`, `authorName`, or `reviewedBy` from the JSON body. All identity data is extracted from the verified Better Auth session on the server.

2. **Public GETs for transparency** — Civic data (concerns, proposals, projects, solution plans, events, open data) remains publicly readable. This aligns with Sohojatra's government transparency mission.

3. **Intentionally public POST routes** — Three POST endpoints remain unauthenticated by design:
   - `/api/chatbot` — Read-only Q&A, no data mutation
   - `/api/fallback/sms` and `/api/fallback/ussd` — Telecom gateway endpoints for feature phones

4. **RBAC hierarchy** — `citizen < moderator < admin < superadmin`

> [!IMPORTANT]
> **Total files modified: 33** (1 new `lib/api-guard.ts` + 1 updated `proxy.ts` + 31 API `route.ts` files)
