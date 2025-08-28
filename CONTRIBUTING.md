# Contributing

## Branch Protection
- Direct commits and pushes to `main` are blocked by local hooks.
- Please create feature branches from `main` and merge via Pull Request.

## Commit Message
- Use Conventional Commits: `type(scope): subject`
  - Examples: `chore(ci): setup husky and commitlint`

## Commit Template
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation changes
- `style`: formatting, missing semicolons, etc. (no code change)
- `refactor`: code refactoring (no behavior change)
- `perf`: performance improvements
- `test`: adding or updating tests
- `build`: build system or external dependencies
- `ci`: CI/CD or tooling changes
- `chore`: maintenance tasks
- `revert`: revert previous commit

### Scope (optional)
- `ci`: CI/CD related
- `feat`: feature related
- `fix`: bug fix related
- `docs`: documentation related
- `style`: code style related
- `refactor`: refactoring related
- `test`: testing related
- `build`: build system related

### Examples
```
feat(auth): add user login functionality
fix(api): resolve undefined response error
docs(readme): update installation instructions
style(components): format button component
refactor(utils): simplify date formatting logic
test(api): add user endpoint tests
build(deps): update React to v18
ci(workflow): add automated testing
chore(deps): update development dependencies
```

## Pull Request Template

### Title Format
```
<type>(<scope>): <description>
```

### Description Template
#### Summary
Briefly state what and why.

#### Changes
- Change 1
- Change 2

#### Verification
- Steps or results to confirm it works

#### Checklist
- [ ] CI passes
- [ ] Follows Conventional Commits
- [ ] No breaking changes

### PR Examples

#### Tools/CI Setup
- Title: `ci: add root husky hooks, commitlint, and GitHub Actions`
- Type: `ci`

#### Feature Development
- Title: `feat: add user authentication system`
- Type: `feat`

#### Bug Fix
- Title: `fix(api): resolve user data loading issue`
- Type: `fix`

#### Documentation
- Title: `docs: update API documentation and examples`
- Type: `docs`

## Hooks
- `commit-msg`: commitlint validates commit messages
- `pre-commit`: blocks direct commits to `main`
- `pre-push`: blocks direct pushes to `main`

## CI
- PR and push will run root-level tool CI (e.g., commitlint)
