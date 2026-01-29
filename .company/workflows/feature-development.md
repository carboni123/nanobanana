---
name: feature-development
description: End-to-end feature development with architecture review
trigger: manual
default: true
---

# Feature Development Workflow

Standard workflow for implementing new features with proper architecture review and quality assurance.

## Steps

### 1. Architecture & Planning
**Agent:** cto
**Action:** architect

Analyze the feature request and create a technical design:
- Review requirements and constraints
- Design high-level architecture
- Break down into implementation tasks
- Identify risks and dependencies

**Skills:** Analysis, planning (no code changes)
**Output:** Architecture document and task breakdown

---

### 2. Implementation
**Agent:** tech-lead
**Parallel:** true
**Input:** Architecture from Step 1

Implement the feature according to the design:
- Write code following project conventions
- Create unit tests for new functionality
- Run quality gates before committing

**Skills:** /full-stack-feature, /quality-gates, /commit
**Output:** Working implementation with tests

---

### 3. Quality Assurance
**Agent:** qa
**Parallel:** true
**Input:** Implementation from Step 2

Review the implementation for quality:
- Verify code follows architecture
- Check for security issues
- Ensure tests pass and coverage is adequate
- Verify acceptance criteria met

**Skills:** /quality-gates, /story-review
**Output:** Review report with approval/feedback

## Error Handling

- **Step 2 failure:** Retry up to 2 times, then escalate to CTO
- **Step 3 rejection:** Return to Step 2 with feedback
