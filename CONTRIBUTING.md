# Contributing

## Branch Protection
- Direct commits and pushes to `main` are blocked by local hooks.
- Please create feature branches from `main` and merge via Pull Request.

## Commit Message
- Use Conventional Commits: `type(scope): subject`
  - Examples: `chore(ci): setup husky and commitlint`

## Hooks
- `commit-msg`: commitlint validates commit messages
- `pre-commit`: blocks direct commits to `main`
- `pre-push`: blocks direct pushes to `main`

## CI
- PR and push will run root-level tool CI (e.g., commitlint)
