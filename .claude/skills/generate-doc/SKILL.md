---
name: generate-doc
description: |
  Generate or update documentation for features following specification-captured design. Use this skill when:
  (1) User asks to document a feature (PRD, README, STORIES, FEATURE.md, CONTRACTS, RULES, STATE)
  (2) User wants to audit documentation freshness
  (3) User mentions "generate docs", "update docs", "document this", "PRD", "README", or "stories"
  (4) After completing a feature implementation to capture specifications
  (5) Before a release to ensure docs match code
  Consolidates: prd, readme, prd-stories, spec-stories, doc-sync capabilities.
---

# Generate Documentation

Unified documentation generator following specification-captured design principles. Works for both **backend** (FastAPI/Python) and **frontend** (React/TypeScript) features.

## Quick Reference

| Command | Description |
|---------|-------------|
| `/generate-doc [feature]` | Generate all docs (FEATURE, PRD, README) |
| `/generate-doc [feature] --prd` | Generate PRD.md only |
| `/generate-doc [feature] --readme` | Generate README.md only |
| `/generate-doc [feature] --stories` | Generate STORIES.md only |
| `/generate-doc [feature] --contracts` | Generate CONTRACTS.md only |
| `/generate-doc [feature] --rules` | Generate RULES.md only |
| `/generate-doc [feature] --state` | Generate STATE.md only |
| `/generate-doc [feature] --audit` | Check doc freshness, report drift |
| `/generate-doc [feature] --sync` | Update all stale docs |

---

## Backend vs Frontend Detection

**CRITICAL**: Before generating documentation, determine if the feature is backend or frontend.

### Step 1: Locate Feature Directory

```
Backend: backend/app/features/{feature}/
Frontend: frontend/src/features/{feature}/
```

### Step 2: Use Appropriate Reference Files

| Target | Reference Directory |
|--------|---------------------|
| Backend (FastAPI/Python) | `references/*.md` (root references) |
| Frontend (React/TypeScript) | `references/frontend/*.md` |

### Step 3: Apply Context-Specific Templates

The feature location determines which templates and code analysis patterns to use.

---

## Document Types Reference

Each document type has **two versions**: backend and frontend.

### Backend Reference Files

| Document | Reference | Purpose |
|----------|-----------|---------|
| FEATURE.md | [references/feature-md.md](references/feature-md.md) | Entry point, API endpoints |
| PRD.md | [references/prd-md.md](references/prd-md.md) | Business requirements |
| README.md | [references/readme-md.md](references/readme-md.md) | Service layer guide |
| STORIES.md | [references/stories-md.md](references/stories-md.md) | QA acceptance criteria |
| CONTRACTS.md | [references/contracts-md.md](references/contracts-md.md) | REST API specification |
| RULES.md | [references/rules-md.md](references/rules-md.md) | Business rules, invariants |
| STATE.md | [references/state-md.md](references/state-md.md) | Entity state machines |

### Frontend Reference Files

| Document | Reference | Purpose |
|----------|-----------|---------|
| FEATURE.md | [references/frontend/feature-md.md](references/frontend/feature-md.md) | Entry point, public components/hooks |
| PRD.md | [references/frontend/prd-md.md](references/frontend/prd-md.md) | UI/UX requirements |
| README.md | [references/frontend/readme-md.md](references/frontend/readme-md.md) | Component/hook usage guide |
| STORIES.md | [references/frontend/stories-md.md](references/frontend/stories-md.md) | UI acceptance criteria |
| CONTRACTS.md | [references/frontend/contracts-md.md](references/frontend/contracts-md.md) | Component/hook interfaces |
| RULES.md | [references/frontend/rules-md.md](references/frontend/rules-md.md) | Validation, permissions |
| STATE.md | [references/frontend/state-md.md](references/frontend/state-md.md) | UI state machines |

**IMPORTANT**: Always read the appropriate reference file before generating each document type.

---

## Critical: PRD vs STORIES

**This is the most common source of confusion:**

| PRD.md User Stories | STORIES.md Acceptance Criteria |
|---------------------|-------------------------------|
| HIGH-LEVEL: "what the feature does" | DETAILED: "how to verify it works" |
| Format: Table with brief criteria | Format: Given/When/Then + checklist |
| ID: `{FEATURE}-001` (e.g., AKD-001) | ID: `ST-xxx` (e.g., ST-101) |
| 1 story per capability | Multiple stories per capability |

See the appropriate stories reference file for detailed guidance.

---

## Workflow

### Step 1: Locate Feature

```
1. Parse feature name (normalize to match directory)
2. Locate feature directory:
   - Backend: backend/app/features/{feature}/
   - Frontend: frontend/src/features/{feature}/
3. Determine target (backend or frontend)
4. Check if FEATURE.md exists to determine state
```

### Step 2: Check Feature State

| State | Behavior |
|-------|----------|
| No FEATURE.md | New feature, set state to DRAFT |
| DRAFT | Generate freely |
| ACTIVE | Update alongside code changes |
| STABLE | Warn, require --force |
| DEPRECATED | Refuse updates |

### Step 3: Analyze Code

**For Backend features** (analyze these files):

| File | Extract |
|------|---------|
| `api.py` | Endpoints, HTTP methods, status codes, auth |
| `schemas.py` | DTOs, field constraints, types |
| `service.py` | Business logic, validation rules, dependencies |
| `exceptions.py` | Domain exceptions, HTTP mappings |
| `repository.py` | Query patterns |
| `models/*.py` | Database schema |
| `__tests__/` | Test scenarios |

**For Frontend features** (analyze these files):

| File | Extract |
|------|---------|
| `index.ts` | Public exports |
| `pages/*.tsx` | Route components, page structure |
| `components/*.tsx` | Component props, UI patterns |
| `hooks/*.ts` | Query/mutation hooks, return types |
| `api/*.ts` | API functions, query keys |
| `schemas/*.ts` | Zod validation rules |
| `store/*.ts` | Zustand store shape |
| `types.ts` | TypeScript interfaces |
| `external.ts` | Cross-feature dependencies |
| `__tests__/` | Test scenarios |

### Step 4: Generate Documents

**For each document to generate:**

1. **Determine target** (backend or frontend)
2. **Read the appropriate reference file** for that document type
3. **Analyze relevant code** as specified in reference
4. **Apply the template** from the reference
5. **Run the quality checklist** from the reference

### Step 5: Report

```markdown
## Documentation Generated

| Document | Status | Notes |
|----------|--------|-------|
| FEATURE.md | Created | State: DRAFT |
| PRD.md | Created | 8 user stories |
| README.md | Created | 6 components documented |

## Next Steps

1. Review generated docs for accuracy
2. Set FEATURE.md state to ACTIVE when validated
3. Consider adding STORIES.md for QA coverage
```

---

## Generation Order

When generating all docs (default), follow this order:

1. **FEATURE.md** - Entry point, establishes structure
2. **PRD.md** - Business requirements
3. **README.md** - Developer guide

Optional (generate with specific flags):

4. **STORIES.md** - QA acceptance criteria
5. **CONTRACTS.md** - API/component contracts
6. **RULES.md** - Business/validation rules
7. **STATE.md** - State machines

---

## Audit Mode (`--audit`)

Check documentation freshness without making changes:

**Backend audit checks:**
- Compare PRD endpoints vs actual api.py
- Compare README structure vs actual files
- Check for schema drift

**Frontend audit checks:**
- Compare PRD routes vs actual pages
- Compare README exports vs actual index.ts
- Check for component/hook interface drift

```markdown
## Doc Audit Report: {feature}

| Document | Status | Issues |
|----------|--------|--------|
| FEATURE.md | CURRENT | 0 |
| PRD.md | STALE | 2 missing endpoints |
| README.md | CURRENT | 0 |

### Recommendations
- Run `/generate-doc {feature} --sync` to update
```

---

## Sync Mode (`--sync`)

Update stale documentation:

1. Run audit to identify drift
2. For each stale document:
   - Preserve sections marked with `<!-- MANUAL -->` comments
   - Regenerate from code
   - Merge preserved sections
3. Report changes made

---

## Common Scenarios

### New Backend Feature

```
/generate-doc deals
→ Detects backend/app/features/deals/
→ Reads backend reference files
→ Creates FEATURE.md, PRD.md, README.md
→ Sets state to DRAFT
```

### New Frontend Feature

```
/generate-doc deals
→ Detects frontend/src/features/deals/
→ Reads frontend reference files
→ Creates FEATURE.md, PRD.md, README.md
→ Sets state to DRAFT
```

### Explicit Target

```
/generate-doc frontend:deals
→ Forces frontend detection
→ Uses frontend/src/features/deals/

/generate-doc backend:deals
→ Forces backend detection
→ Uses backend/app/features/deals/
```

### Add QA Coverage

```
/generate-doc my-feature --stories
→ Read appropriate stories reference file
→ Generate STORIES.md with Given/When/Then
```

### Post-Code Changes

```
/generate-doc my-feature --sync
→ Audit for drift
→ Update stale docs
→ Preserve manual sections
```

### Pre-Release Check

```
/generate-doc my-feature --audit
→ Report documentation health
→ No changes made
```

---

## Feature-Specific Guidance

### Backend Features

Backend features focus on:
- REST API endpoints and HTTP methods
- Service layer business logic
- SQLAlchemy models and schemas
- Domain exceptions and error handling
- Multi-tenancy and permissions

**Key patterns:**
- Async/sync dual services for FastAPI + Celery
- Repository pattern for data access
- Pydantic schemas for validation

### Frontend Features

Frontend features focus on:
- React components and their props
- TanStack Query hooks for data fetching
- Zustand stores for UI state
- Zod schemas for form validation
- Route components and navigation

**Key patterns:**
- Feature-sliced design (pages → components → hooks → api)
- Query key factories for cache management
- Optimistic updates for mutations
- Form state management with react-hook-form

---

## Quality Gates

Before marking documentation as complete:

### Backend Checklist
- [ ] All API endpoints documented
- [ ] Request/response schemas accurate
- [ ] Exception handling documented
- [ ] Service methods explained
- [ ] Test coverage noted

### Frontend Checklist
- [ ] All public exports documented
- [ ] Component props typed and explained
- [ ] Hook signatures with return types
- [ ] Store shape documented
- [ ] Query keys explained
- [ ] Loading/error states covered
