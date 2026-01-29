---
name: code-review
description: Code review only workflow for external PRs or quick checks
trigger: manual
---

# Code Review Workflow

Simple workflow for reviewing code without implementation steps.

## Steps

### 1. Review
**Agent:** qa
**Action:** review

Review the code changes:
- Check code quality and conventions
- Identify security issues
- Verify test coverage
- Provide feedback

**Skills:** /quality-gates, /story-review
**Output:** Review report with findings
