# Sohojatra

*Together, We decide*

**Sohojatra** is a forward-thinking digital platform designed to address the evolving needs of **smart governance, community engagement**, and **public accountability** in urban Bangladesh. It acts as a dynamic platform where governmental agencies, national and international organizations, universities, professionals, and expert groups can collaborate on solutions to urban problems.

## Objective
Enable Dhaka citizens to report, prioritize, and track urban concerns in Bangla and English, so officials can respond transparently within 72 hours of submission.

**Primary User for MVP**: Citizens. (Government officials will join in Phase 2 once volume and workflows are validated).


## Tech Stack
* **Frontend**: Next.js 16 + Tailwind CSS + shadcn/ui + Framer Motion
* **Backend**: Node.js + Prisma ORM
* **Database & Auth**: Supabase PostgreSQL & Better Auth
* **Integrations**: OpenStreetMap via Leaflet, Supabase SMTP for emails.

## Getting Started

First, install dependencies:

```bash
npm install
```

Initialize the local development state:

```bash
npm run seed
```

This command will:
- Create `.nagarik-state.json` with mock civic data (concerns, proposals, research, etc.)
- Attempt to connect to Prisma for database seeding (gracefully falls back if DB unavailable)

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## End-to-End Features

The platform now includes:

### Civic Engagement
- **Concerns / Issue Reporting**: Citizens can submit geo-tagged concerns with photos
- **Proposal Forum**: Public can propose and vote on solutions
- **Comments & Voting**: Full comment threads with upvote/downvote scoring
- **Awards & Recognition**: Track and display awards for excellent proposals

### Administration & Monitoring
- **Moderation Queue**: Review, approve, escalate, or reject content
- **Project Tracker**: Monitor ongoing civic infrastructure projects
- **Assembly Events**: Town halls, Q&A sessions, public hearings
- **Dashboard**: KPI cards, top concerns, moderation backlog

### Research & Innovation
- **Research Problems**: Universities can list grants and open problems
- **Research Matching**: AI-powered keyword matching between research and citizen concerns

### Data & Transparency
- **Open Data Portal**: CC-BY-4.0 licensed dataset export (JSON download)
- **Statistics**: Real-time aggregation of concerns, proposals, and awards
- **API Endpoints**: Full REST API for all civic operations

### User & Access
- **Multi-Role Profiles**: Citizens, researchers, moderators with role-based permissions
- **Bangla Support**: Full English/Bangla UI with language toggle
- **Authentication**: Phone-based OTP login via Better Auth

## Database & Persistence

The application uses a **Prisma-first with file fallback** architecture:
- **Primary**: PostgreSQL via Prisma (when database is available)
- **Fallback**: File-backed state at `.nagarik-state.json` (always available)

### Database Commands

```bash
# Deploy pending migrations
npm run db:migrate

# Reset database and re-seed
npm run db:reset

# Bootstrap local state (run after npm install)
npm run seed
```

## API Overview

### Concerns
- `GET /api/concerns` - List all concerns
- `GET /api/concerns/[id]` - Get specific concern
- `POST /api/concerns` - Create new concern
- `POST /api/concerns/[id]/actions` - Vote, downvote, update status, detect duplicates

### Proposals & Forum
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Create proposal
- `POST /api/proposals/[id]` - Vote/downvote proposal
- `POST /api/proposals/[id]/comments` - Add comment, vote on comments

### Moderation
- `GET /api/moderation/queue` - View moderation queue
- `POST /api/moderation/approve` - Approve/reject/escalate flag

### Awards & Recognition
- `GET /api/awards` - List all awards
- `POST /api/awards` - Create new award

### Research & Matching
- `GET /api/research/problems` - List research problems
- `GET /api/research/match?researchId=[id]` - Get matching concerns

### Open Data
- `GET /api/open-data` - Full dataset (CC-BY-4.0)
- `GET /api/open-data?dataset=concerns` - Concerns only
- `GET /api/open-data?dataset=proposals` - Proposals only
- `GET /api/open-data?dataset=statistics` - Statistics only

### Notifications
- `GET /api/notifications?userId=[id]&channel=[email|sms|in-app]` - Get notifications
- `POST /api/notifications` - Send notification

## Keep Your Local Code Updated

If someone else pushes changes, use this flow to get the latest code:

```bash
git checkout main
git pull origin main
```

If you are working on your own feature branch and want the latest `main` updates:

```bash
git checkout main
git pull origin main
git checkout your-branch-name
git rebase main
```

If rebase feels risky for your team, use merge instead:

```bash
git checkout your-branch-name
git merge main
```

If `git pull` fails because of uncommitted work, either commit first or temporarily stash changes:

```bash
git add .
git commit -m "wip: save local changes"
# or
git stash
git pull origin main
git stash pop
```

For the full collaboration workflow (branching, pulling, rebasing/merging, PR checklist), see `CONTRIBUTING.md`.

## Team
- [Md Shahadat Hossain](mailto:mdsahadathossainemon@gmail.com)
- [Ahmad Jamil](mailto:ahmadjamilwork2001@gmail.com)
- [Rahat Hossain Himel](mailto:himelhasan1215@gmail.com)
