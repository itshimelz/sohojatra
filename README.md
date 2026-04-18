<p align="center">
  <img src="public/logo.svg" alt="Sohojatra Logo" width="160" />
</p>

<h1 align="center">সহযাত্রা — Sohojatra</h1>

<p align="center">
  <strong>Together, We Decide</strong><br />
  <em>The definitive digital ecosystem for smart governance and urban accountability in Dhaka.</em>
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

## 🌏 Project Vision

**Sohojatra** is a forward-thinking digital platform designed to address the evolving needs of smart governance, community engagement, and public accountability in urban Bangladesh. 

By bridging the gap between citizens and authorities, Sohojatra provides a dynamic space where governmental agencies, international organizations, universities, and expert groups can collaborate on tangible urban solutions.

> [!IMPORTANT]
> **MVP Focus:** Enable Dhaka citizens to report, prioritise, and track urban concerns in Bangla and English.
> **Transparency Target:** Officials aim to respond transparently within **72 hours** of submission.

---

## 📊 Implementation Pulse

| Metric | Status | Features |
|---|---|---|
| **Fully Operational** | ✅ Done | **35** |
| **Simulated / Dev** | 🚧 Partial | **7** |
| **Not Started** | ❌ Todo | **0** |

---

## 🏗️ Architectural Core

The project adheres to a specific high-performance stack optimized for reliability and scale.

### 🛡️ Middleware & Auth
- **Middleware Proxy:** Replaces standard `middleware.ts` with a high-performance `proxy.ts` at the root for optimistic auth and route interception.
- **Better Auth:** Implements Phone OTP, NID verification, and role-based access control.

### 💾 Data & ORM
- **Prisma 7:** Configured with `@prisma/adapter-pg` driver for seamless Supabase integration.
- **Supabase Pooler:** Uses IPv4-friendly Session Pooler for all database connections.

### 🤖 AI Stack
- **Llama 3 + RAG:** Retrieval-Augmented Generation over laws, circulars, and the BD Constitution.
- **Bangla NLP:** Native support for sentiment analysis and multi-accent speech-to-text.

---

## 📦 Key Feature Modules

### 👤 Identity & Trust
- **NID & Passport Verification** — Real-time validation against govt APIs.
- **Device Fingerprinting** — Login trust scoring to prevent fraud.
- **Anonymous-but-Verified** — Protected identity for sensitive reporting.
- **Multi-Role System** — Tailored UI for Citizens, Experts, and Govt Officials.

### 📍 Concern Hub
- **Multimodal Submission** — Text, audio, photo, and video with GPS pinning.
- **AI Duplicate Detection** — Cosine similarity clustering to prevent redundant reports.
- **Geospatial Heatmap** — Real-time density mapping of urban concerns.
- **Urgency Scorer** — Automated priority ranking (0–100) using Llama fine-tuning.

### 🏛️ Forum & Co-Governance
- **Reddit-style Discussions** — Quote-reply threading with reputation-weighted voting.
- **Quadratic Voting** — Enhanced democratic prioritisation for civic proposals.
- **Audit Trails** — Full transparency into resolution state transitions.
- **Assembly Events** — Town halls with digital minutes and RSVP management.

### 🔬 Research & Innovation
- **University Matching** — AI-powered link between research problems and academic experts.
- **Grant Disbursement** — Milestone-based funding via bKash/Bank integration.
- **Leaderboard** — Competitive ranking for contributing academic institutions.
- **Open Data Portal** — CC-BY-4.0 compliant datasets for policy makers.

---

## 📂 Project Structure

```
sohojatra/
├── app/
│   ├── (auth)/                # Better Auth UI flows
│   ├── (site)/                # Core domain pages (Citizen, Onboarding, Privacy)
│   └── api/                   # 19 API groups (AI, Auth, Research, Moderation)
├── components/                # shadcn/ui primitives & domain-specific React components
├── lib/                       # Singletons (Prisma, Auth), i18n, and state machines
├── prisma/                    # Schema (16 models) and migrations
├── mobile/                    # React Native (Expo) scaffold
├── docs/                      # Deep-dive documentation and feature lists
├── proxy.ts                   # Centralised auth proxy (Next.js 16 core)
└── prisma.config.ts           # Prisma 7 connection logic
```

---

## 🛠️ Developer Experience

### Quick Start

```bash
# 1. Clone & Install
git clone <repo-url>
cd sohojatra
npm install

# 2. Setup Environment
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL and BETTER_AUTH_SECRET in .env

# 3. Initialize Boilerplate
npm run seed

# 4. Launch Development
npm run dev
```

### 📜 Documentation Deep-Dives

| Resource | Description |
|---|---|
| [**Feature List**](docs/Sohojatra_Feature_List.md) | Exhaustive list of all 42 platform features. |
| [**Status Report**](docs/Sohojatra_IMPLEMENTATION_STATUS.md) | Itemised checklist of functional modules. |
| [**Implementation Summary**](docs/END_TO_END_IMPLEMENTATION_SUMMARY.md) | High-level architectural walkthrough. |
| [**AI/ML Spec**](docs/Sohojatra_AI_ML_Stack_Specification.md) | RAG and GNN implementation details. |

---

## 📊 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Session Pooler connection string |
| `DIRECT_URL` | Migration URL (Required for Prisma 7 + Supabase) |
| `BETTER_AUTH_SECRET` | 32-character random string |
| `NEXT_PUBLIC_APP_URL` | Public base URL (e.g., http://localhost:3000) |

---

## 🛠️ Scripts Reference

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Dev server with Turbopack |
| `seed` | `npm run seed` | Bootstrap local state file and DB |
| `db:migrate` | `npm run db:migrate` | Deploy pending Prisma migrations |
| `lint` | `npm run lint` | Fast static analysis via OxLint |
| `test` | `npm test` | Run internal test suite |

---

## 👥 Meet the Team

| Name | Role | Contact |
|---|---|---|
| **Md Shahadat Hossain** | Lead Architect | [Email](mailto:mdsahadathossainemon@gmail.com) |
| **Ahmad Jamil** | Core Developer | [Email](mailto:ahmadjamilwork2001@gmail.com) |
| **Rahat Hossain Himel** | UI/UX Developer | [Email](mailto:himelhasan1215@gmail.com) |

---

<p align="center">
  <sub>Built with ❤️ for the citizens of Dhaka</sub>
</p>
