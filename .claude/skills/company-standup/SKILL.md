---
name: company-standup
description: |
  Run a virtual company standup meeting. Each agent (CEO, CTO, Tech Lead, QA) reports their status,
  blockers, and plans. Use this skill daily to coordinate the team and track progress.
---

# Company Standup

Run a daily standup meeting for NanoBanana virtual company.

## Usage

```
/company-standup
```

## What It Does

1. **Gather Reports** - Each agent writes their standup to `reports/{role}.md`
2. **Identify Blockers** - Surface any blocking issues
3. **Coordinate Handoffs** - Ensure work flows smoothly between agents
4. **Generate Summary** - Create executive summary for review

## Standup Format

Each agent reports:

### 1. Yesterday
- What was completed?
- Any commits or deliverables?

### 2. Today
- What will be worked on?
- Any dependencies on other agents?

### 3. Blockers
- What's preventing progress?
- What help is needed?

## Agent Order

1. **Tech Lead** - Implementation progress
2. **QA** - Quality status, bugs found
3. **CTO** - Backlog/sprint status
4. **CEO** - Business updates, priorities

## Output

Creates/updates:
- `reports/standup/{date}/tech-lead.md`
- `reports/standup/{date}/qa.md`
- `reports/standup/{date}/cto.md`
- `reports/standup/{date}/ceo.md`
- `reports/standup/{date}/SUMMARY.md`

## Summary Format

```markdown
# Daily Standup - [Date]

## Team Status
| Agent | Status | Focus |
|-------|--------|-------|
| Tech Lead | On Track | {current task} |
| QA | Blocked | {blocker} |
| CTO | On Track | {current focus} |
| CEO | On Track | {strategic focus} |

## Key Updates
- {important update 1}
- {important update 2}

## Blockers
- [ ] {blocker 1} - Owner: {agent}
- [ ] {blocker 2} - Owner: {agent}

## Handoffs Needed
- {agent A} → {agent B}: {what}

## Action Items
- [ ] {action} - @{agent}
```

## Post-Standup Actions

After standup:
1. Sync changes to git: `git add reports/ && git commit -m "Daily standup [date]" && git push`
2. Address blockers immediately
3. Update sprint board if needed
