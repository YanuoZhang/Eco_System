# Contributing

## Branching

- Do not commit directly to `main`.
- Create a feature branch from `main` and open a Pull Request.

## Commit messages

- Follow Conventional Commits: `type(scope): subject`
  - Examples: `feat(journey): add start button`, `fix(ci): correct node version`

## Git hooks (Husky)

- `commit-msg`: commitlint validates commit messages
- `pre-commit`: blocks direct commits to `main`, runs lint-staged (Prettier), ESLint, TypeScript type-check
- `pre-push`: blocks pushes to `main`, runs ESLint, type-check, and tests

## Commands

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run format` / `npm run format:check`

## CI

- GitHub Actions runs lint and Prettier checks on PRs and pushes to `main`.
