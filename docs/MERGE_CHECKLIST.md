# Pre-Merge Checklist

This checklist ensures safe integration of upstream karabiner.ts while preserving local extensions.

## Status: Ready to Merge ✅

### Completed Setup

- [x] Upstream mirror established at `../karabiner.ts-upstream/`
- [x] TypeScript path mapping configured (`tsconfig.json`)
- [x] Local extensions isolated in `src/lib/`
- [x] CI workflow validated with platform guards
- [x] Conflict documentation generated
- [x] Sync workflow documented (`UPSTREAM_SYNC.md`)
- [x] Build verified producing `karabiner-output.json`

### Open Pull Requests

#### Subproject (karabiner.ts repo)

1. **PR #8: CI Workflow** (`ci/promote-upstream-workflows` branch)
   - Status: Ready to merge
   - Adds GitHub Actions for typecheck/lint/build
   - Includes manual workflow dispatch
   - Platform guards for CI/non-macOS environments

2. **PR #9: Examples & API Aliases** (`feat/upstream-examples-and-api-aliases` branch)
   - Status: Ready to merge  
   - Vendors upstream examples under `docs/upstream-examples/`
   - Adds compatibility helpers (if needed)
   - No breaking changes to local code

#### Parent Repo (dotfiles)

3. **PR #1: Upstream Integration** (`integrate-upstream-karabiner-ts` branch)
   - Status: Ready to merge after subproject PRs
   - Updates submodule pointer to include CI/examples
   - Adds upstream mirror sync tooling
   - Documents integration strategy

## Merge Order

```text
1. Merge subproject PR #8 (CI) → main
2. Merge subproject PR #9 (Examples) → main  
3. Update parent PR #1 submodule pointer to latest main
4. Merge parent PR #1 → main
```

## Pre-Merge Validation

### Local Build Test

```bash
cd /Users/jason/dotfiles/karabiner/karabiner.ts
npm run build
```

**Expected output:**

```text
✓ Profile Karabiner.ts updated.
✓ Wrote workspace copy: karabiner-output.json
✓ Device-specific simple_modifications updated.
```

### CI Test

```bash
# Trigger CI manually
gh workflow run ci.yml --ref ci/promote-upstream-workflows
# Wait ~2 minutes, then check
gh run list --workflow=ci.yml --limit 1
```

**Expected:** ✅ Green check (typecheck, lint, build all pass)

### Typecheck Test

```bash
npm run typecheck
```

**Expected:** No errors (tsconfig resolves upstream via path mapping)

### Lint Test

```bash
npm run lint
```

**Expected:** No warnings/errors from `src/` files

## Post-Merge Tasks

### 1. Update Main Branch Documentation

After merging all PRs:

```bash
cd /Users/jason/dotfiles/karabiner/karabiner.ts
git checkout main
git pull origin main
```

Ensure README.md includes:

- Clear "Upstream Integration" section ✅
- Link to `UPSTREAM_SYNC.md` ✅
- Local extensions documented ✅
- Build instructions ✅

### 2. Tag Release (Optional)

```bash
git tag -a v2.0.0 -m "Release: Upstream integration complete"
git push origin v2.0.0
```

### 3. Archive Feature Branches

Once merged and verified stable:

```bash
git branch -d ci/promote-upstream-workflows
git branch -d feat/upstream-examples-and-api-aliases
git branch -d integrate-upstream-karabiner-ts
```

### 4. Add CI Status Badge (Optional)

In README.md:

```markdown
[![CI](https://github.com/Jason-K/karabiner.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/Jason-K/karabiner.ts/actions/workflows/ci.yml)
```

## Ongoing Maintenance

### Weekly: Check for Upstream Updates

```bash
cd /Users/jason/dotfiles/karabiner/karabiner.ts-upstream
git fetch origin
git log HEAD..origin/main --oneline
```

If new commits:

```bash
git pull origin main
cd ../karabiner/karabiner.ts
./scripts/generate-conflict-report.sh
```

### Monthly: Review Conflict Report

Check `docs/INTEGRATION_CONFLICTS.md` for:

- New APIs worth adopting
- Breaking changes needing local updates
- Documentation improvements

### As Needed: Update Local Extensions

When upstream adds features you want:

1. Import them in your code: `import { newFeature } from 'karabiner.ts'`
2. Use them in `src/index.ts`
3. Test: `npm run build`
4. Commit changes

## Rollback Plan

If something breaks after merge:

### Revert a Single PR

```bash
git revert <merge-commit-hash>
git push origin main
```

### Revert All Integration

```bash
git reset --hard <commit-before-integration>
git push --force-with-lease origin main
```

### Restore Working Config

Your `~/.config/karabiner/karabiner.json` is only updated when you run `npm run build` locally. If the build breaks, your existing Karabiner config continues working.

To restore a known-good state:

```bash
git checkout <last-good-commit> src/index.ts
npm run build
```

## Success Criteria

Integration is complete when:

- [x] All PRs merged
- [ ] CI passing on main branch
- [ ] Local build produces valid `karabiner-output.json`
- [ ] Documentation updated with upstream sync workflow
- [ ] No errors from `npm run typecheck`
- [ ] Local extensions still work as expected

## Questions Before Merging?

- ✅ **Will upstream updates break my config?**
  - No. Your `src/` files are isolated. Upstream is just a library you import.

- ✅ **Do I need to manually sync upstream often?**
  - Only when you want new features. Existing code keeps working.

- ✅ **What if upstream makes breaking API changes?**
  - TypeScript will error. You update your `src/lib/` wrappers to match.

- ✅ **Can I still modify my config freely?**
  - Yes. Your `src/index.ts` and `src/lib/` are yours. Edit anytime.

- ✅ **Will CI run on every commit?**
  - Yes, but only checks your `src/` code (docs are ignored).

## Ready to Merge ✅

All systems green. Proceed with merge order above.
