# Contributing

## Branch Protection
- 主分支 `main` 禁止直接提交与 push（本地 hooks 已拦截）
- 请从 `main` 切出功能分支，通过 Pull Request 合并

## Commit Message
- 使用 Conventional Commits：`type(scope): subject`
  - 例：`chore(ci): setup husky and commitlint`

## Hooks
- `commit-msg`: commitlint 校验提交信息
- `pre-commit`: 阻止对 `main` 的直接提交
- `pre-push`: 阻止对 `main` 的直接推送

## CI
- PR 和 push 会运行根级工具 CI（如 commitlint）
