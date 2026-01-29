---
name: commit
description: Create git commits after completing tasks. Use this skill after quality gates pass successfully, when the user explicitly asks to commit, or when a significant coding task is complete and verified. Do NOT use during exploration, research, or when quality gates have failed.
---

# Git Commit Skill

Create a well-structured git commit for the current changes.

## Workflow

1. **Check status**: Run `git status` to see all changed files
2. **Review diff**: Run `git diff HEAD` to understand what changed
3. **Check recent history**: Run `git log --oneline -5` for commit message style
4. **Stage files**: Add relevant files with `git add` (prefer specific files over `git add -A`)
5. **Commit**: Create commit with a clear, conventional message

## Commit Message Format

```
<type>: <short description>

<optional body explaining why, not what>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Build, tooling, or maintenance

## Rules

- **Never** commit `.env`, credentials, or secrets
- **Never** use `git add -A` or `git add .` without checking for sensitive files first
- **Never** amend previous commits unless explicitly asked
- **Always** write commit messages that explain **why**, not just what changed
- **Always** check `git status` before staging to avoid committing unintended files
- Keep the subject line under 72 characters
- Use imperative mood ("Add feature" not "Added feature")

## Example

```bash
git status
git diff HEAD
git log --oneline -5
git add src/feature.ts src/feature.test.ts
git commit -m "feat: add user registration endpoint

Implements POST /auth/register with email validation
and duplicate detection per PRD section 3.1"
```
