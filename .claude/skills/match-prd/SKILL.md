---
name: match-prd
description: |
  Validate implementation against a PRD by systematically mapping each requirement to code evidence. Use when:
  (1) User asks to "compare PRD to code", "audit PRD coverage", or "validate implementation"
  (2) User wants a gap analysis, coverage table, or compliance check
  (3) User needs to verify feature completeness before release
  (4) User asks "what's missing vs PRD" or "does the code match the spec"
  (5) After major implementation work to verify nothing was missed
  Produces: coverage matrix, gap analysis with severity, action items, and risk assessment.
---

# PRD ↔ Implementation Matcher

Systematically verify that implementation matches PRD requirements. Be strict: if behavior cannot be proven from code/config/tests, mark it as **not implemented**.

## Principles

1. **Evidence-based:** Every claim must link to specific files, functions, or tests
2. **Strict verification:** Ambiguous or partial implementations are flagged, not assumed complete
3. **Actionable output:** Every gap includes severity, impact, and suggested fix
4. **Efficient exploration:** Use targeted searches, not exhaustive file reads

---

## Stage 1: Load and Parse the PRD

### Locate the PRD

Search order:
1. `PRD.md` or `prd.md` at repo root
2. `docs/PRD.md` or `specs/PRD.md`
3. Feature-specific `{feature}/PRD.md`
4. Ask user if multiple exist or none found

If the PRD has a `FEATURE.md` companion, check its **state** field:
- `DRAFT`: Specs may be incomplete; note this in output
- `ACTIVE`: Specs are canonical; strict validation applies
- `STABLE`: Specs are frozen; flag any deviations

### Extract Requirements

Parse the PRD into a structured checklist. For each section, extract:

| PRD Section | Extract As |
|-------------|------------|
| Goals/Objectives | Success criteria (measurable) |
| Requirements/Features | Checkable functional requirements |
| User Stories | Acceptance criteria per story |
| API Contracts | Endpoints, methods, schemas |
| Data Models | Tables, fields, relationships |
| Non-Functional | Performance, security, observability requirements |
| Constraints | Hard limits, compliance rules |
| Non-Goals | Explicit exclusions (verify nothing implements these) |

**Output:** Numbered checklist of requirements with PRD section references.

---

## Stage 2: Evidence Mapping

For each requirement, search for implementing evidence across:

### Search Locations

| Layer | Look For |
|-------|----------|
| **Backend** | Routes (`api.py`), services, schemas, models, tasks |
| **Frontend** | Pages, components, stores, API hooks, forms |
| **Tests** | Unit tests, integration tests, e2e tests |
| **Config** | Environment variables, feature flags, settings |
| **Docs** | README, inline comments, OpenAPI spec |
| **CI/CD** | Workflows, scripts, Dockerfiles |

### Evidence Types (Strength Ranking)

1. **Test coverage:** Acceptance tests that verify the exact behavior (strongest)
2. **Working code:** Implementation with correct logic
3. **Partial code:** Implementation exists but missing edge cases
4. **Config/stub:** Feature flag or placeholder exists
5. **No evidence:** Cannot locate implementation (gap)

### Per-Requirement Output

For each requirement, document:

```markdown
### R{N}: {Requirement summary}

**PRD Reference:** Section X.Y
**Status:** Implemented | Partial | Not Implemented | Over-Implemented
**Confidence:** High | Medium | Low

**Evidence:**
- `backend/app/features/X/api.py:45` - `create_item()` endpoint
- `backend/app/features/X/service.py:78` - Business logic
- `tests/test_X.py:120` - Acceptance test covers happy path

**Behavior Verified:**
- [x] Creates item with required fields
- [x] Validates input schema
- [ ] Handles duplicate detection (not found)
- [ ] Returns correct error codes (missing test)

**Gaps:** Missing duplicate detection per PRD section 4.2
```

---

## Stage 3: Gap Analysis

### Categorize Gaps

| Category | Description | Severity |
|----------|-------------|----------|
| **Missing** | PRD requires it, no implementation | Critical/High |
| **Partial** | Implementation incomplete or untested | Medium/High |
| **Mismatch** | Implementation differs from PRD | Medium/High |
| **Over-scope** | Code exists that PRD doesn't mention | Low/Medium |
| **Untested** | Implementation exists but no test coverage | Medium |

### Severity Assessment

For each gap, assess:

1. **User Impact:** Does this affect core user flows?
2. **Data Integrity:** Could this cause data loss/corruption?
3. **Security:** Is this a security requirement?
4. **Compliance:** Is this a regulatory/contractual requirement?
5. **Dependency:** Do other features depend on this?

**Severity Levels:**
- **Critical:** Blocks release; core functionality broken
- **High:** Major feature gap; workaround may exist
- **Medium:** Notable gap; acceptable for initial release
- **Low:** Minor issue; can be deferred

---

## Stage 4: Script and Automation Audit

Inventory all runnable entry points and validate against PRD:

### Script Types to Check

| Source | Examples |
|--------|----------|
| `package.json` | `dev`, `build`, `test`, `lint` scripts |
| `Makefile` | Build, deploy, migrate targets |
| `scripts/` | Python, shell, utility scripts |
| `.github/workflows/` | CI/CD pipelines |
| `docker-compose.yml` | Service definitions |

### Per-Script Validation

```markdown
| Script | Purpose | PRD Match | Issues |
|--------|---------|-----------|--------|
| `pnpm build` | Production build | Yes | - |
| `migrate.py` | DB migrations | Partial | Missing rollback per PRD 7.3 |
| `deploy.yml` | CI deploy | No | No canary deploy per PRD 8.1 |
```

---

## Stage 5: Synthesize Findings

### Coverage Summary

```markdown
## Coverage Summary

| Category | Total | Implemented | Partial | Missing | Coverage |
|----------|-------|-------------|---------|---------|----------|
| Functional | 25 | 20 | 3 | 2 | 80% |
| API Contracts | 12 | 12 | 0 | 0 | 100% |
| Non-Functional | 8 | 4 | 2 | 2 | 50% |
| **Total** | **45** | **36** | **5** | **4** | **80%** |
```

### Risk Matrix

```markdown
## Top Risks

| # | Requirement | Gap | Severity | Impact | Suggested Fix |
|---|-------------|-----|----------|--------|---------------|
| 1 | R15: Rate limiting | Not implemented | Critical | API abuse | Add middleware in `api.py` |
| 2 | R8: Audit logging | Partial | High | Compliance | Extend to cover deletes |
| 3 | R22: Retry logic | Untested | Medium | Reliability | Add test for timeout case |
```

---

## Output File

**IMPORTANT:** Always write the final report to a file.

### Output Location

1. If PRD is at `{feature}/PRD.md`, write report to `{feature}/PRD-REPORT.md`
2. If PRD is at repo root, write report to `docs/PRD-REPORT.md`
3. If user specifies a path, use that path

### File Naming

- Default: `PRD-REPORT.md` (in same directory as PRD)
- Alternative: `{feature-name}-PRD-REPORT.md` if multiple reports exist

After completing the analysis, use the Write tool to save the report file. Confirm the output path to the user.

---

## Output Template

Use this exact structure for the final report:

```markdown
# PRD Compliance Report: {Feature Name}

**PRD Source:** `{path/to/PRD.md}`
**PRD State:** {DRAFT|ACTIVE|STABLE}
**Analysis Date:** {YYYY-MM-DD}
**Coverage:** {X}% ({N} of {M} requirements verified)

---

## 1. PRD Checklist

- [x] R1: {Requirement} — Implemented
- [~] R2: {Requirement} — Partial (see Gap #1)
- [ ] R3: {Requirement} — Not Implemented (see Gap #2)

---

## 2. Coverage Matrix

| Req # | Requirement | Status | Evidence | Notes |
|-------|-------------|--------|----------|-------|
| R1 | User can create account | Implemented | `auth/api.py:45`, `test_auth.py:78` | Full coverage |
| R2 | Email verification | Partial | `auth/service.py:120` | No resend test |
| R3 | Password reset | Not Implemented | - | Endpoint missing |

---

## 3. Gap Analysis

### Gap #1: Email verification resend not tested
- **Requirement:** R2 (PRD Section 3.2)
- **PRD Expectation:** Users can request email resend up to 3 times
- **Current State:** Logic exists but no test coverage
- **Severity:** Medium
- **Impact:** Could break silently in refactor
- **Suggested Fix:** Add `test_email_resend_limit()` in `test_auth.py`

### Gap #2: Password reset not implemented
- **Requirement:** R3 (PRD Section 3.3)
- **PRD Expectation:** Full password reset flow with token
- **Current State:** No endpoint, no service, no model field
- **Severity:** High
- **Impact:** Users cannot recover accounts
- **Suggested Fix:** Implement `POST /auth/reset-password` with token table

---

## 4. Script Audit

| Script | Purpose | PRD Aligned | Issues |
|--------|---------|-------------|--------|
| `pnpm test` | Run tests | Yes | - |
| `pnpm build` | Production build | Yes | - |
| `deploy.sh` | Deploy to prod | Partial | Missing health check per PRD 9.1 |

---

## 5. Out-of-Scope Code

| File/Function | Behavior | Risk |
|---------------|----------|------|
| `api.py:admin_override()` | Bypasses validation | High - not in PRD, security concern |
| `utils.py:legacy_import()` | Old data format | Low - migration helper |

---

## 6. Recommendations

### Critical (Block Release)
1. Implement password reset (Gap #2)

### High Priority (Next Sprint)
1. Add email resend tests (Gap #1)
2. Review admin_override security

### Medium Priority (Backlog)
1. Add health check to deploy script

---

## 7. Appendix: Evidence Index

| File | Requirements Covered |
|------|---------------------|
| `auth/api.py` | R1, R2, R5 |
| `auth/service.py` | R1, R2 |
| `test_auth.py` | R1 |
```

---

## Execution Tips

### For Large Codebases

1. Start with API routes to understand feature boundaries
2. Use grep/glob for requirement keywords
3. Check test files first - they often document expected behavior
4. Use git blame to find related commits

### When Requirements Are Vague

1. Flag the requirement as "ambiguous in PRD"
2. Document what the code actually does
3. Suggest PRD clarification in recommendations

### When Code Exceeds PRD

1. Check if it's a reasonable enhancement (note as "bonus")
2. Check if it contradicts PRD intent (flag as risk)
3. Check if it introduces security/complexity (recommend removal or PRD update)

### Handling DRAFT PRDs

1. Note that specs are incomplete
2. Focus on what IS specified, not what might be added
3. Recommend promoting to ACTIVE after validation
