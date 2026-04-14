# Supabase + Prisma Agent Guide

This guide captures the project-specific setup for connecting Prisma and Better Auth to Supabase safely.

## Goal

- Use Supabase Postgres on IPv4 (free tier) via Session Pooler.
- Keep secrets out of source control and public docs.
- Use Prisma 7-compatible configuration.

## Connection Strategy

- `DATABASE_URL`: Supabase Session Pooler URL (IPv4-friendly).
- `DIRECT_URL`: Same Session Pooler URL for this project's migration workflow on free tier IPv4.
- Do not hardcode URLs, usernames, or passwords in code.

Use environment variables only:

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres
```

## Prisma 7 Rules (Important)

- In `prisma/schema.prisma`, datasource must only define provider:
  - `provider = "postgresql"`
- Do not set `url` or `directUrl` in `schema.prisma` (unsupported in Prisma 7).
- Configure datasource URL in `prisma.config.ts`:
  - `datasource.url = env("DATABASE_URL")`
- `directUrl` is not a valid property in current Prisma config types.

## Prisma Client Setup

Use the Prisma Postgres adapter (Prisma 7 style):

- Dependencies:
  - `@prisma/adapter-pg`
  - `pg`
- In `lib/prisma.ts`, instantiate Prisma Client with adapter, not `datasourceUrl`.

## Better Auth Notes

- Better Auth uses Prisma adapter with provider `postgresql`.
- Ensure required env vars exist:
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
  - `DATABASE_URL`
  - `DIRECT_URL`

## Proxy & Session Management (Next.js 16+)

In Next.js 16, **\`middleware.ts\` is deprecated** in favor of **\`proxy.ts\`**. All route interception, authentications, and rate-limiting should be handled via `proxy.ts` at the root of the project.

- **Optimistic Auth**: Read standard paths by checking if the session cookie exists (`getSessionCookie(request)`).
- **Session Enforcement**: To enforce exact state values (like `/onboard` redirecting when `onboarded` is false), use `betterFetch('/api/auth/get-session', ...)` directly inside `proxy.ts`. Ensure paths are properly excluded via matcher or conditional checks to avoid infinite loops.
- **Custom Session Fields**: New user fields (e.g., `dob`, `education`, `onboarded`) are mapped directly in `lib/auth.ts` via `user.additionalFields`. Be sure to update the explicit `AuthUser` type exported from `components/auth-provider.tsx` to satisfy React context.

## Server-Side Auth Checks

Use the abstracted guards from `@/lib/auth-session`:
- `getServerSession()`: Safe fetch, returns session or null.
- `requireServerSession()`: Throws/redirects if unauthorized. Used for Server Components and Actions.

## Migration Workflow

From project root:

```bash
npx prisma validate
npx prisma migrate dev --name <migration_name>
npx prisma generate
npx prisma migrate status
```

Expected success state:

- `prisma validate` reports schema valid.
- `migrate dev` creates/applies a migration under `prisma/migrations/`.
- `migrate status` reports database schema is up to date.

## Security Checklist

- Never commit `.env`.
- Never paste raw credentials in issues, docs, PR descriptions, or chat logs.
- Keep `.env.example` placeholder-only.
- Rotate database password immediately if accidentally exposed.

## Troubleshooting

- Error: `directUrl does not exist in type ...`
  - Remove `directUrl` from `prisma.config.ts` datasource object.
- Error: datasource `url`/`directUrl` no longer supported in schema
  - Remove both from `prisma/schema.prisma`.
- Error: `P1001 Can't reach database server`
  - Verify host/port for IPv4 Session Pooler.
  - Confirm password is correct and project is active.
  - Check firewall/network restrictions.

## Agent Operating Rules

- Redact credentials in all outputs.
- Share only placeholder connection strings in documentation.
- Prefer non-destructive verification commands before migration changes.
