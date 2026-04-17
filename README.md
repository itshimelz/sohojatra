<p align="center">
  <img src="public/logo.png" alt="Sohojatra Logo" width="120" />
</p>

<h1 align="center">সহযাত্রা — Sohojatra</h1>

<p align="center">
  <em>Together, We Decide</em>
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img alt="Prisma 7" src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" />
  <img alt="Better Auth" src="https://img.shields.io/badge/Auth-Better_Auth-purple?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

**Sohojatra** is a forward-thinking digital platform designed to address the evolving needs of **smart governance, community engagement**, and **public accountability** in urban Bangladesh. It acts as a dynamic platform where governmental agencies, national and international organizations, universities, professionals, and expert groups can collaborate on solutions to urban problems.

> **MVP Objective:** Enable Dhaka citizens to report, prioritise, and track urban concerns in Bangla and English, so officials can respond transparently within 72 hours of submission.
>
> **Primary User for MVP:** Citizens — government officials will join in Phase 2 once volume and workflows are validated.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database & Persistence](#database--persistence)
- [API Reference](#api-reference)
- [Mobile App](#mobile-app)
- [Environment Variables](#environment-variables)
- [Scripts Reference](#scripts-reference)
- [Testing](#testing)
- [Keeping Your Code Updated](#keeping-your-code-updated)
- [Contributing](#contributing)
- [Team](#team)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 · Tailwind CSS 4 · shadcn/ui · Framer Motion |
| **Language** | TypeScript 5.9 |
| **ORM** | Prisma 7 (with `@prisma/adapter-pg`) |
| **Database** | Supabase PostgreSQL (Session Pooler, IPv4-friendly) |
| **Auth** | Better Auth (Phone OTP, email/password, role-based) |
| **Icons** | Phosphor Icons |
| **Maps** | OpenStreetMap via Leaflet |
| **Notifications** | Supabase SMTP · SMS · In-App |
| **Mobile** | React Native (Expo) scaffold |
| **Validation** | Zod 4 |
| **Linting** | OxLint · ESLint · Prettier |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & install

```bash
git clone <repo-url>
cd sohojatra
npm install
```

### 2. Configure environment

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# Git Bash / macOS / Linux
cp .env.example .env
```

Fill in the required values in `.env` — see [Environment Variables](#environment-variables) for details.

### 3. Seed local development data

```bash
npm run seed
```

This will:
- Create `.sohojatra-state.json` with mock civic data (concerns, proposals, research problems, moderation queue)
- Attempt to connect to Prisma for database seeding (gracefully falls back if DB is unavailable)

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
sohojatra/
├── app/
│   ├── (auth)/                # Auth pages (login, signup)
│   ├── (site)/
│   │   ├── (citizen)/         # Citizen-facing pages
│   │   │   ├── assembly/      # Town halls & events
│   │   │   ├── chatbot/       # AI chatbot interface
│   │   │   ├── collaboration/ # Collaborative workspace
│   │   │   ├── concerns/      # Issue reporting & tracking
│   │   │   ├── funding/       # Funding & disbursements
│   │   │   ├── leaderboard/   # University leaderboard
│   │   │   ├── profile/       # User profile management
│   │   │   ├── projects/      # Project tracker
│   │   │   └── research/      # Research problems
│   │   ├── (marketing)/       # Landing / marketing page
│   │   ├── onboard/           # Onboarding wizard
│   │   ├── open-data/         # Open Data Portal
│   │   ├── privacy/           # Privacy policy
│   │   ├── terms/             # Terms of service
│   │   └── unauthorized/      # 403 page
│   └── api/                   # 19 API route groups
│       ├── ai/                # AI inference & analysis
│       ├── auth/              # Better Auth handler
│       ├── authority/         # Authority feed
│       ├── awards/            # Awards & recognition
│       ├── badges/            # Badge system
│       ├── chatbot/           # Chatbot backend
│       ├── collaboration/     # Workspace threads
│       ├── concerns/          # Civic concerns CRUD
│       ├── dashboard/         # Dashboard KPIs
│       ├── fallback/          # USSD / SMS fallback
│       ├── funding/           # Grant disbursements
│       ├── leaderboard/       # University rankings
│       ├── moderation/        # Content moderation
│       ├── notifications/     # Multi-channel notifications
│       ├── open-data/         # CC-BY-4.0 data export
│       ├── proposals/         # Proposal forum
│       ├── research/          # Research matching
│       ├── security/          # Device trust scoring
│       └── verification/      # NID / Passport verification
├── components/                # Reusable React components
│   ├── ui/                    # shadcn/ui primitives
│   └── *.tsx                  # App-level components
├── lib/                       # Shared logic & utilities
│   ├── auth.ts                # Better Auth server config
│   ├── auth-client.ts         # Client-side auth helpers
│   ├── auth-session.ts        # Server-side session guards
│   ├── concerns/              # Concern state machine
│   ├── i18n/                  # Bangla/English translations
│   ├── prisma.ts              # Prisma client singleton
│   ├── seo.ts                 # SEO metadata helpers
│   ├── sohojatra/             # Domain-specific utilities
│   └── validation/            # Zod schemas
├── prisma/
│   ├── schema.prisma          # Database schema (16 models)
│   ├── seed.ts                # DB seed script
│   └── migrations/            # Prisma migrations
├── mobile/                    # React Native (Expo) scaffold
├── docs/                      # Project documentation
├── scripts/                   # Build & seed scripts
├── tests/                     # Test suite
├── proxy.ts                   # Route-level auth (replaces middleware.ts)
├── prisma.config.ts           # Prisma 7 datasource config
└── docker-compose.yml         # Local Postgres (optional)
```

---

## Features

### 🏛️ Civic Engagement
- **Concern Reporting** — Citizens submit geo-tagged concerns with photos, voice, and video
- **Proposal Forum** — Propose, discuss, and vote on civic solutions
- **Comments & Voting** — Full threaded comments with upvote/downvote scoring
- **Awards & Recognition** — Recognise outstanding proposals and community contributions

### 🛡️ Administration & Moderation
- **Moderation Queue** — Review, approve, escalate, or reject flagged content
- **Project Tracker** — Monitor ongoing civic infrastructure projects with progress & deadlines
- **Assembly Events** — Town halls, Q&A sessions, and public hearings
- **Dashboard** — KPI cards, top concerns, heatmap, moderation backlog, authority feed

### 🔬 Research & Innovation
- **Research Problems** — Universities list grants and open research problems
- **Research Matching** — AI-powered keyword matching between research and citizen concerns
- **Collaborative Workspace** — Cross-sector collaboration threads
- **University Leaderboard** — Ranked research contributions

### 💰 Funding & Grants
- **Grant Applications** — Researchers apply with scored proposals
- **Milestone Tracking** — Deliverables, payments, and progress monitoring
- **Citizen Funding View** — Public transparency into funding & disbursement

### 📊 Data & Transparency
- **Open Data Portal** — CC-BY-4.0 licensed dataset export (JSON download)
- **Statistics** — Real-time aggregation of concerns, proposals, and awards
- **Full REST API** — 19 API route groups powering every feature

### 🤖 AI & Intelligence
- **Urgency Scoring** — Deterministic AI urgency classification for concerns
- **Bangla NLP** — Sentiment analysis and category tagging for Bangla text
- **RAG Pipeline** — Retrieval-augmented generation for context-aware responses
- **Duplicate Detection** — Similarity matching to surface related concerns
- **Risk Analysis** — Graph-style mob detection and risk scoring
- **Drift Monitoring** — Model drift metrics and logging

### 👤 User & Access
- **Multi-Role Profiles** — Citizens, researchers, moderators with role-based permissions
- **Phone OTP Login** — Via Better Auth with NID & Passport verification
- **Onboarding Wizard** — Guided profile setup after registration
- **Anonymous Mode** — Verified-but-masked profile for sensitive reports
- **Device Trust Scoring** — Fingerprint-based risk classification
- **Bangla Support** — Full English / বাংলা UI with language toggle

### 📱 Multi-Channel Access
- **Web Application** — Full-featured Next.js progressive web app
- **Mobile App** — React Native (Expo) scaffold with offline sync
- **USSD & SMS Fallback** — Feature-phone access for underserved populations

---

## Database & Persistence

The application uses a **Prisma-first with file fallback** architecture:

| Layer | Technology | When Used |
|---|---|---|
| **Primary** | PostgreSQL via Prisma 7 | When database is available |
| **Fallback** | `.sohojatra-state.json` | Always available; local dev / offline |

### Schema Overview (16 models)

`User` · `Session` · `Account` · `Verification` · `Concern` · `ConcernVote` · `Proposal` · `Comment` · `Award` · `ResearchProblem` · `GrantApplication` · `Milestone` · `AssemblyEvent` · `Notification` · `ModerationFlag` · `AiAnalysisResult`

### Database Commands

```bash
# Validate schema
npx prisma validate

# Create & apply a new migration
npx prisma migrate dev --name <migration_name>

# Deploy pending migrations (CI/production)
npm run db:migrate

# Reset database and re-seed
npm run db:reset

# Regenerate Prisma Client
npx prisma generate

# Check migration status
npx prisma migrate status

# Bootstrap local state file (run after npm install)
npm run seed
```

---

## API Reference

### Concerns
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/concerns` | List all concerns |
| `GET` | `/api/concerns/[id]` | Get a specific concern |
| `POST` | `/api/concerns` | Create a new concern |
| `POST` | `/api/concerns/[id]/actions` | Vote, downvote, update status, detect duplicates |

### Proposals & Forum
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/proposals` | List proposals |
| `POST` | `/api/proposals` | Create a proposal |
| `POST` | `/api/proposals/[id]` | Vote/downvote a proposal |
| `POST` | `/api/proposals/[id]/comments` | Add comment, vote on comments |

### Moderation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/moderation/queue` | View moderation queue |
| `POST` | `/api/moderation/approve` | Approve / reject / escalate flag |

### Awards & Recognition
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/awards` | List all awards |
| `POST` | `/api/awards` | Create a new award |

### Research & Matching
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/research/problems` | List research problems |
| `GET` | `/api/research/match?researchId=[id]` | Get matching concerns |

### Open Data
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/open-data` | Full dataset (CC-BY-4.0) |
| `GET` | `/api/open-data?dataset=concerns` | Concerns only |
| `GET` | `/api/open-data?dataset=proposals` | Proposals only |
| `GET` | `/api/open-data?dataset=statistics` | Statistics only |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications?userId=[id]&channel=[email\|sms\|in-app]` | Get notifications |
| `POST` | `/api/notifications` | Send notification |

### AI & Analysis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/*` | AI scoring, RAG, NLP, drift endpoints |
| `GET` | `/api/dashboard` | Dashboard KPIs & heatmap |

### Security & Verification
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/verification/*` | NID / Passport verification |
| `POST` | `/api/security/*` | Device trust scoring |

---

## Mobile App

A React Native (Expo) scaffold lives in `mobile/`:

```bash
cd mobile
npm install
npx expo start
```

The mobile app includes an offline-sync demo that communicates with the Next.js backend APIs.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in these required values:

| Variable | Description |
|---|---|
| `BETTER_AUTH_URL` | App base URL (`http://localhost:3000` for dev) |
| `BETTER_AUTH_SECRET` | Random 32+ character secret for auth |
| `DATABASE_URL` | Supabase Session Pooler connection string |
| `DIRECT_URL` | Same Session Pooler URL (IPv4 free tier) |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

See `.env.example` for the full list of optional variables (AI services, SMS, S3, etc.).

> ⚠️ **Never commit `.env`** — rotate credentials immediately if exposed.

---

## Scripts Reference

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start dev server with Turbopack |
| `build` | `npm run build` | Production build |
| `start` | `npm run start` | Start production server |
| `seed` | `npm run seed` | Bootstrap `.sohojatra-state.json` |
| `test` | `npm test` | Run test suite |
| `lint` | `npm run lint` | Lint with OxLint |
| `format` | `npm run format` | Format with Prettier |
| `typecheck` | `npm run typecheck` | TypeScript type checking |
| `db:migrate` | `npm run db:migrate` | Deploy pending Prisma migrations |
| `db:reset` | `npm run db:reset` | Reset database and re-seed |

---

## Testing

```bash
# Run all tests
npm test

# Run a specific test file
node --test "tests/auth.test.mjs"
```

Tests use the Node.js built-in test runner. Test files live in `tests/`.

---

## Keeping Your Code Updated

```bash
# Get the latest main
git checkout main
git pull origin main
```

Working on a feature branch? Rebase onto latest main:

```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

If you prefer merge over rebase:

```bash
git checkout your-branch
git merge main
```

Handle uncommitted changes with stash:

```bash
git stash
git pull origin main
git stash pop
```

For the complete collaboration workflow (branching, PRs, and review checklist), see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our branching conventions, commit message format, and PR checklist.

Before opening a PR, run:

```bash
npm run typecheck
npm run lint
npm test
```

---

## Team

| Name | Contact |
|---|---|
| **Md Shahadat Hossain** | [mdsahadathossainemon@gmail.com](mailto:mdsahadathossainemon@gmail.com) |
| **Ahmad Jamil** | [ahmadjamilwork2001@gmail.com](mailto:ahmadjamilwork2001@gmail.com) |
| **Rahat Hossain Himel** | [himelhasan1215@gmail.com](mailto:himelhasan1215@gmail.com) |

---

<p align="center">
  <sub>Built with ❤️ for the citizens of Dhaka</sub>
</p>
