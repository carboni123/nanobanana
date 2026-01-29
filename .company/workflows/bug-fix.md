---
name: bug-fix
description: Quick bug fix workflow without architecture review
trigger: manual
---

# Bug Fix Workflow

Streamlined workflow for fixing bugs without full architecture review.

## Steps

### 1. Fix Implementation
**Agent:** tech-lead
**Action:** fix

Investigate and fix the bug:
- Reproduce the issue
- Identify root cause
- Implement fix
- Add regression test

**Skills:** /quality-gates, /commit
**Output:** Bug fix with regression test

---

### 2. Verification
**Agent:** qa
**Input:** Fix from Step 1

Verify the fix:
- Confirm bug is resolved
- Check for regressions
- Review test coverage

**Skills:** /quality-gates
**Output:** Verification report
