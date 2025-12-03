# Upstream Sync Guide

This document explains how to update from the upstream karabiner.ts project while preserving local extensions.

## Architecture

```
karabiner/
├── karabiner.ts/              # THIS PROJECT (local extensions)
│   ├── src/
│   │   ├── index.ts          # Your main config (DO NOT merge upstream)
│   │   └── lib/              # Your extensions (DO NOT merge upstream)
│   │       ├── builders.ts   # Local tap-hold, cmd(), openApp() helpers
│   │       ├── functions.ts  # Space layer generators
│   │       ├── mods.ts       # Custom HYPER/SUPER/MEH definitions
│   │       ├── consumer.ts   # Consumer key helpers
│   │       └── text.ts       # Text manipulation helpers
│   ├── tsconfig.json         # Path mapping to upstream (DO NOT merge)
│   ├── package.json          # Local deps (DO NOT merge)
│   └── eslint.config.mjs     # Local lint rules (DO NOT merge)
│
└── karabiner.ts-upstream/     # UPSTREAM MIRROR (read-only reference)
    └── src/                   # Upstream library source
        ├── config/           # Upstream rule builders
        ├── utils/            # Upstream utilities
        └── karabiner/        # Upstream type definitions
```

## Sync Workflow

### 1. Update Upstream Mirror

```bash
cd /Users/jason/dotfiles/karabiner/karabiner.ts-upstream
git fetch origin
git pull origin main
```

### 2. Generate Conflict Report

```bash
cd /Users/jason/dotfiles/karabiner/karabiner.ts
./scripts/generate-conflict-report.sh
```

This creates/updates `docs/INTEGRATION_CONFLICTS.md` with diffs.

### 3. Review Changes

Check the conflict report for:
- New upstream APIs you want to adopt
- Breaking changes that need local code updates
- Documentation improvements worth copying

### 4. Selectively Adopt Changes

**If upstream adds new exports (e.g., new rule builders):**
- Your code can import them immediately via `karabiner.ts`
- No changes needed thanks to path mapping

**If upstream changes existing APIs:**
- Check if your `src/lib/` wrappers need updates
- Update type imports in `src/lib/mods.ts` if needed
- Re-run typecheck: `npm run typecheck`

**If upstream docs are useful:**
- Copy to `docs/upstream/` for reference
- Link from your README if relevant

### 5. Commit Upstream Updates

```bash
# In parent repo
cd /Users/jason/dotfiles/karabiner
git add karabiner.ts-upstream
git commit -m "chore: sync karabiner.ts-upstream to v1.XX.X"
git push
```

## Files That Should NEVER Be Merged

These files are yours and must never be overwritten by upstream:

### Core Configuration
- `src/index.ts` - Your complete Karabiner config
- `src/lib/*.ts` - All your extensions
- `src/inputRules.json` - Your original rules

### Project Files
- `package.json` - Your build scripts and dependencies
- `tsconfig.json` - Your path mapping configuration
- `eslint.config.mjs` - Your lint rules
- `README.md` - Your documentation (but copy useful sections from upstream)

### GitHub Actions
- `.github/workflows/ci.yml` - Your CI workflow
- `.github/upstream-workflows/` - Safe copies of upstream workflows (reference only)

## Safe-to-Adopt Files

These can be updated from upstream if you want:

### Documentation (reference)
- `docs/upstream/docs/**` - Upstream API documentation
- `docs/upstream-examples/**` - Example configurations

### Tooling (optional)
- Upstream linter configs (review before adopting)
- Upstream test structure (if you add tests)

## Handling Breaking Changes

If upstream makes breaking changes:

1. **Check imports**: Your `src/lib/` files import upstream types
   ```typescript
   import type { Modifier } from 'karabiner.ts';  // This might break
   ```

2. **Run typecheck**: 
   ```bash
   npm run typecheck
   ```

3. **Fix type mismatches**: Update your wrappers to match new upstream types

4. **Test locally**:
   ```bash
   npm run build
   # Verify karabiner-output.json is valid
   ```

## Adding New Upstream Features

Example: Upstream adds a new `duoLayer()` function

1. **Import it**:
   ```typescript
   // In src/index.ts or src/lib/builders.ts
   import { duoLayer } from 'karabiner.ts';
   ```

2. **Use it**:
   ```typescript
   rule('Duo layer example').manipulators(
     duoLayer('a', 's').manipulators([
       map('j').to(toKey('left_arrow'))
     ])
   )
   ```

3. **Document it**: Add example to your README or a new section

## Conflict Resolution Philosophy

**Upstream is the library, your project is the consumer.**

- Upstream changes should be **additive** to you
- Your local `src/lib/` files **wrap and extend** upstream
- TypeScript path mapping lets you import upstream seamlessly
- Conflict reports help you **decide** what to adopt, not force merges

## Automation (Future Enhancement)

Consider adding a GitHub Action:

```yaml
# .github/workflows/upstream-check.yml
name: Upstream Sync Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9am
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      - name: Update upstream
        run: |
          cd karabiner.ts-upstream
          git fetch origin
          LATEST=$(git rev-parse origin/main)
          CURRENT=$(git rev-parse HEAD)
          if [ "$LATEST" != "$CURRENT" ]; then
            echo "::warning::Upstream has new commits"
          fi
```

## Questions?

- **"Should I merge upstream's package.json?"** → No, yours is different (build tool vs library)
- **"Should I merge upstream's tsconfig?"** → No, yours has path mapping
- **"Can I use upstream's CI?"** → No, but you can copy ideas into your CI
- **"What if upstream removes an API I use?"** → Check conflict report, find replacement, update wrappers
- **"Do I need to credit upstream?"** → Yes, see LICENSE and README acknowledgments

## Summary

1. Pull upstream updates into mirror
2. Generate conflict report
3. Review and selectively adopt
4. Never merge core config files
5. Test with `npm run typecheck && npm run build`

Your local extensions stay safe. Upstream provides the foundation.
