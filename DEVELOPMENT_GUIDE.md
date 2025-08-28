# Development Workflow Guide

This repository is a small monorepo managed with npm workspaces:
- Frontend: `ecopath-frontend` (Next.js + TypeScript + Tailwind)
- Backend: `ecopath-backend` (Express + TypeScript)

The sections below define how we branch, commit, open PRs, and run CI.

## Branching strategy
- Create feature/fix branches from `main`:
  - `feat/<short-scope>` (new features)
  - `fix/<short-scope>` (bug fixes)
  - `chore/<short-scope>` (maintenance/tooling)
  - `ci/<short-scope>` (CI-only changes)
  - `docs/<short-scope>` (documentation)
- One logical change per branch (keep branches small and focused).
- If you already have an open PR for the same scope, keep committing to that branch instead of opening a new branch. Do not switch to another new branch until the current PR is merged or explicitly closed.
- Keep your branch up to date:
  - `git fetch origin && git rebase origin/main` (preferred) or `git merge origin/main`.

## Commit conventions
- Use Conventional Commits:
  - Format: `<type>(<scope>): <subject>`
  - Examples:
    - `feat(frontend): add SSR journey homepage`
    - `fix(backend): handle empty env in /api/environment`
    - `chore(workspaces): update root lockfile`
- Keep subjects short (≤ 72 chars) and imperative.

## Local hooks (Husky)
- `commit-msg`: commitlint enforces Conventional Commits.
- `pre-commit`: blocks direct commits to `main`.
- `pre-push`: blocks direct pushes to `main`.
- If hooks fail, fix issues locally before pushing (do not bypass).

## Pull Requests
- Always open a PR from your branch to `main`.
- Use the light PR template:
  - Summary: what & why
  - Changes: bullet list of notable changes
  - Verification: how to validate locally (commands, URLs)
  - Checklist: CI passes, follows Conventional Commits, no breaking changes
- One PR per change scope. Link related issues/tickets if any.
- Prefer Squash & Merge to keep a clean history.
- Required checks: All CI jobs must be green before merge (commitlint, frontend lint, backend lint).

## CI overview (GitHub Actions)
- Jobs:
  - `commitlint`: validates commit messages on PRs and pushes to `main`.
  - `frontend-lint`: installs deps in `ecopath-frontend` and runs ESLint.
  - `backend-lint`: installs deps in `ecopath-backend` and runs ESLint.
- Branch protection: do not merge if any job fails.

## Environment variables
- Do not commit secrets. Use the examples and copy locally:
  - Frontend: `ecopath-frontend/.env.example` → copy to `.env.local`
  - Backend: `ecopath-backend/.env.example` → copy to `.env`
- Common local dev defaults:
  - Frontend: `NEXT_PUBLIC_API_BASE_URL=http://localhost:5001`
  - Backend: `PORT=5001`, `NODE_ENV=development`

## Workspace commands (from repo root)
- Install (root and workspaces): `npm install --workspaces`
- Lint all workspaces: `npm run lint`
- Format all workspaces: `npm run format` / `npm run format:check`
- Dev servers:
  - Frontend: `npm run dev:front` (Next.js)
  - Backend: `npm run dev:back` (Express)

## Code quality & style
- TypeScript: strict settings in both apps.
- ESLint: enabled in both apps (backend has `@typescript-eslint`, frontend inherits Next.js config + Prettier).
- Prettier: enabled; run format before committing or rely on pre-commit formatting if configured.

## Reviews & merge policy
- Small PRs (< ~300 lines) are preferred; larger PRs must include thorough description and verification steps.
- At least one reviewer approval (adjust per team policy).
- No direct commits or pushes to `main`; use PRs only.

## Checklist before opening a PR
- [ ] Branch is up to date with `main` (rebased or merged).
- [ ] Commit messages follow Conventional Commits.
- [ ] Lint and format pass locally.
- [ ] PR description filled using the template (Summary/Changes/Verification/Checklist).
- [ ] No secrets committed; env files follow `.env.example` guidance.

---
For any clarifications or exceptions, discuss in the PR description and tag a reviewer early.

## Team Practices
- Environment consistency
  - Use the same major Node.js version across the team (consider adding `.nvmrc`).
  - Use a single package manager (npm) to avoid lockfile drift.
- Branch scope & size
  - One concern per branch; prefer PRs ≤ ~300 changed lines.
  - For large/uncertain work, open a Draft PR early for alignment.
- API contracts first
  - When adding/changing APIs, include request/response examples in the PR.
  - Use mocks or temporary endpoints to unblock parallel frontend/backend work.
- Ownership & reviewers
  - Tag the right reviewers: frontend for UI, backend for APIs, DevOps for CI/workflows.
  - Seek at least one approval; two for sensitive areas.
- Rollback-friendly changes
  - Prefer feature flags/config switches for risky changes.
  - Use Squash & Merge to simplify revert.
- Docs & comments
  - PRs should explain "why" and "how to verify"; not only code.
  - Add code comments for non-obvious logic focusing on the rationale.
- CI rules
  - Never merge on red; fix or justify and rerun.
  - If CI flakiness appears, prioritize stabilizing pipelines over disabling checks.
- Local checks before push
  - Run `npm run lint`, `npm run format:check`.
  - Optionally run builds: `npm --workspace ecopath-frontend run build`, `npm --workspace ecopath-backend run build`.
- Secrets & configuration
  - Never commit secrets; follow `.env.example` patterns.
  - Share non-sensitive defaults via examples, not real values.
