# Contributing to Sohojatra

This guide helps team members contribute safely and always stay up to date with the latest code.

## 1) One-time setup

```bash
git clone <repo-url>
cd sohojatra
npm install
npm run dev
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

or (Git Bash):

```bash
cp .env.example .env
```

## 2) Start new work from latest main

```bash
git checkout main
git pull origin main
git checkout -b feature/short-description
```

Use branch names like:
- `feature/login-validation`
- `fix/concern-submit-error`
- `docs/readme-update`

## 3) Commit your changes

```bash
git add .
git commit -m "feat: add login form validation"
```

## 4) Keep your branch updated while working

When teammates push new commits to `main`:

```bash
git checkout main
git pull origin main
git checkout feature/short-description
git rebase main
```

If your team prefers merge instead of rebase:

```bash
git checkout feature/short-description
git merge main
```

## 5) Handle common pull errors

If `git pull` says you have local changes, do one of these:

1. Commit first:

```bash
git add .
git commit -m "wip: save local progress"
git pull origin main
```

2. Or stash temporarily:

```bash
git stash
git pull origin main
git stash pop
```

If there are merge conflicts, resolve them in files, then continue:

```bash
git add .
# for rebase
git rebase --continue
# for merge
git commit
```

## 6) Push and open a pull request

```bash
git push -u origin feature/short-description
```

Then open a PR to `main`.

## 7) Before creating PR

Run checks locally:

```bash
npm run typecheck
npm run lint
npm test
```

## 8) After PR is merged

Sync your local `main` again:

```bash
git checkout main
git pull origin main
```
