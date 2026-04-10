## 1) Objective + target users

### MVP objective for phase 1 (one sentence)
Enable Dhaka citizens to report, prioritize, and track urban concerns in Bangla and English, so officials can respond transparently within 72 hours of submission.
### Primary user to optimize for first
- [x] Citizens
- [ ] Government officials
- [ ] Both equally

**Reason:** Citizens generate the signal; officials join in Phase 2 once volume and workflows are validated.
### Top 3 success outcomes for MVP
| Outcome | Metric | Target for MVP launch + 90 days |
| --- | --- | --- |
| 1. Citizen engagement | % of submissions that receive first status update ≤72h | ≥70% |
| 2. Resolution visibility | % of verified complaints with final status (Resolved/Rejected) | ≥40% |
| 3. Adoption | Monthly active verified citizens in Dhaka | ≥5,000 |

---

## 2) Core features + acceptance criteria
### Strictly in MVP scope: must-haves only
1. Citizen Concern Submission
2. Live Process Tracking
3. Bilingual UI (Bangla/English)
4. Basic Authentication (Phone OTP)
5. Concern Sorting & Upvoting

### Minimum “done” condition for each must-have
| Feature | Done when... | Out of scope for MVP |
| --- | --- | --- |
| 1. Citizen Concern Submission | A logged-in citizen can submit title, description, category, attach ≤3 photos and GPS pin, receive a tracking ID, and see initial status "Submitted" | Video upload, anonymous posts, edit after submit |
| 2. Live Process Tracking | Citizen can view their submission timeline with status changes: Submitted → Under Review → Resolved/Rejected, with timestamp and official note | Multi-official workflow, SLA timers, public map |
| 3. Bilingual UI | All user-facing strings, forms, emails, and errors render in Bangla and English via i18n files, with language toggle persisting | Auto-translation, RTL, other languages |
| 4. Basic Authentication | User can sign up/login with phone OTP using Better Auth; session persists; rate-limit 5 OTPs/hour | NID verification, gov document login, social login |
| 5. Concern Sorting & Upvoting | Citizens can upvote concerns once; list view sorts by upvotes and recency; spam protection via auth | Comment threading, downvotes, expert rating algorithm |

### Explicitly out of scope for MVP
- AI auto-categorization and prioritization
- Public leaderboards
- In-app chat between users
- Digital Co-Governance Ecosystem (multi-stakeholder workspaces)
- Constitution Rights Chatbot
- Local Gathering & Assembly Notifications
- Non-Government Event Accountability
- Secure Government Document Login

---
## 3) Tech stack + constraints
### Preferred stack
- [x] We have a preferred stack, listed below

| Layer    | Choice                                            | Reason or Constraint                                   |
| -------- | ------------------------------------------------- | ------------------------------------------------------ |
| Frontend | Next.js 16 + Tailwind + shadcn/ui + Framer Motion | SSR for SEO, mobile-first components, fast iteration   |
| Backend  | Node.js + Prisma ORM                              | Team expertise, type-safe DB access                    |
| Database | Supabase PostgreSQL                               | Row Level Security, JSONB for i18n, Better Auth adapter |
| Auth     | Better Auth (Phone OTP)                           | MVP verification without NID; framework-agnostic auth  |

### Deployment target
- [x] Vercel (frontend)
- [x] Supabase Cloud (DB/Storage)

**Notes:** Check data residency. For MVP, use Supabase Singapore region (closest). For production gov rollout, migrate to Bangladesh-hosted Postgres. Never expose service_role key; scan.env before deploy.
### Mandatory integrations for MVP
- [ ] NID verification API: No (Phase 2)
- [x] Maps: OpenStreetMap via Leaflet (free, no API key)
- [x] SMS gateway: Supabase/Twilio for OTP (Bangladesh routing via SSL Wireless in Phase 2)
- [x] Email: Supabase SMTP for notifications
- [ ] AI model/provider: None for MVP

---

## 4) Boundaries: Always / Ask first / Never
### Always do
1. Unit + integration tests before merge
2. All UI strings via i18n (Bangla + English reviewed)
3. WCAG 2.1 AA for forms
4. Use design system: shadcn/ui + Phosphor Ions + BaseUI; reuse components before creating new
5. Mobile test on 360px width before PR
6. Env scan: no secrets in client bundle

### Ask first
1. Database schema migrations
2. Adding new external API, SDK, or npm package
3. Any recurring cost >$20/month
4. Changes to auth or permissions model
### Never do
1. Store NID, passport, or raw gov docs unencrypted
2. Collect PII not required for submission or auth
3. Ship to production without mobile testing on real device
4. Use AI to auto-decide complaint validity without human review

---

## Notes
- Mobile responsive: every screen works at 360px and up.
- Bilingual from day one: no hardcoded English strings.
- Home page and auth pages use shadcn blocks: `npx shadcn@latest add login-04`, `npx shadcn@latest add signup-04`
- Keep acceptance criteria testable.