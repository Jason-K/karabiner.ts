# Upstream Sync Guide

This document explains how to update from the upstream `karabiner.ts` project while preserving local extensions.

## Architecture

```text
karabiner/
├── karabiner.ts/              # THIS PROJECT (local extensions)
│   ├── src/
│   │   ├── index.ts          # Your main config (DO NOT merge upstream)
│   │   ├── core/             # Low-level builders + shared primitives (DO NOT merge)
│   │   │   ├── action-dsl.ts # ActionSpec union
│   │   │   ├── beta.ts       # Project-specific upstream beta shims
│   │   │   ├── conditions.ts # Condition helpers (expressions, frontmost-app, variables)
│   │   │   ├── mods.ts       # HYPER / SUPER / MEH modifier sets
│   │   │   ├── scripts.ts    # userCommand, layerIndicatorCommand, showNotification, focusApp…
│   │   │   ├── tap-hold.ts   # Generic tap-hold / varTapTapHold builders
│   │   │   ├── mouse.ts      # Mouse alias resolution and tap-hold helpers
│   │   │   ├── text.ts       # Text manipulation helpers
│   │   │   └── leader/       # Generic leader-layer rule builder
│   │   │       ├── build.ts
│   │   │       ├── runtime.ts
│   │   │       ├── types.ts
│   │   │       └── index.ts
│   │   ├── data/             # Registries and constants (DO NOT merge)
│   │   ├── definitions/      # Data configs + engine calls (DO NOT merge)
│   │   ├── engine/           # Rule-generation functions (DO NOT merge)
│   │   └── tests/            # Local tests (DO NOT merge)
│   ├── tsconfig.json         # Local TS config (DO NOT merge)
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
cd /Users/jason/Scripts/apps/karabiner/karabiner.ts-upstream
git fetch origin
git pull origin main
```

### 2. Generate Conflict Report

```bash
cd /Users/jason/Scripts/apps/karabiner/karabiner.ts
./scripts/generate-conflict-report.sh
```

This writes a diff snapshot to `docs/INTEGRATION_CONFLICTS.md`. It is a **temporary review artifact** — inspect it, then discard it. Do not commit or track it long-term.

### 3. Review Changes

Check the conflict report for:

- New upstream APIs you want to adopt
- Breaking changes that need local code updates
- Documentation improvements worth copying

### 4. Selectively Adopt Changes

**If upstream adds new exports (e.g., new rule builders):**

- Your code can import them via `karabiner.ts` once the dependency is updated.
- Run `npm update karabiner.ts` and re-run typecheck/tests.

**If upstream changes existing APIs:**

- Check whether `src/core/` wrappers need updates.
- Update type imports in `src/core/mods.ts`, `src/core/scripts.ts`, etc. if needed.
- Re-run typecheck: `npm run typecheck`.

**If upstream docs are useful:**

- Copy to `docs/upstream/` for reference.
- Link from your README if relevant.

### 5. Commit Upstream Updates

```bash
# In the parent repo
cd /Users/jason/Scripts/apps/karabiner
git add karabiner.ts-upstream
git commit -m "chore: sync karabiner.ts-upstream to v1.XX.X"
git push
```

## Files That Should NEVER Be Merged

These files are yours and must never be overwritten by upstream:

### Core configuration

- `src/index.ts` — Your complete Karabiner config
- `src/core/**` — Low-level builders, shared primitives, leader internals
- `src/data/**` — Registries and constants
- `src/definitions/**` — Behaviour data + engine calls
- `src/engine/**` — Rule-generation functions
- `src/tests/**` — Local regression coverage

### Project files

- `package.json` — Your build scripts and dependencies
- `tsconfig.json` — Your local compile settings
- `eslint.config.mjs` — Your lint rules
- `README.md` — Your documentation (but copy useful sections from upstream)

### GitHub Actions

- `.github/workflows/ci.yml` — Your CI workflow
- `.github/upstream-workflows/` — Safe copies of upstream workflows (reference only)

## Safe-to-Adopt Files

These can be updated from upstream:

### Documentation (reference)

- `docs/upstream/docs/**` — Upstream API documentation
- `docs/upstream-examples/**` — Example configurations

### Tooling (optional)

- Upstream linter configs (review before adopting)
- Upstream test scaffolding (if you add tests)

## Handling Breaking Changes

If upstream makes breaking changes:

1. **Check imports.** Your `src/core/` files import upstream types.

   ```typescript
   import type { Modifier } from "karabiner.ts"; // This might break
   ```

2. **Run typecheck.**

   ```bash
   npm run typecheck
   ```

3. **Fix type mismatches.** Update your wrappers to match the new upstream types. The integration snapshot test (`src/tests/integration.test.ts`) will surface any unintended JSON-output drift after a successful build.

4. **Test locally.**

   ```bash
   npm run build
   # Inspect karabiner-output.json for sanity
   ```

## Adding New Upstream Features

Example: upstream adds a new `duoLayer()` function.

1. **Import it.**

   ```typescript
   // In src/core/leader/build.ts or a new engine function
   import { duoLayer } from "karabiner.ts";
   ```

2. **Use it.** Wrap it in an engine function under `src/engine/` if you want to expose it as a config-driven behaviour, then call that engine function from a new file in `src/definitions/`.

3. **Document it.** Add the engine function to the inventory in `docs/DECLARATIVE_CONFIG_PLAN.md`.

## Conflict Resolution Philosophy

**Upstream is the library; your project is the consumer.**

- Upstream changes should be **additive** to you.
- Your local `src/core/` files **wrap and extend** upstream.
- Package versioning keeps upstream adoption explicit and reviewable.
- Conflict reports help you **decide** what to adopt, not force merges.

## Automation (future enhancement)

Consider adding a GitHub Action:

```yaml
# .github/workflows/upstream-check.yml
name: Upstream Sync Check
on:
  schedule:
    - cron: "0 9 * * 1" # Weekly Monday 9am
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

## Questions

- **Should I merge upstream's `package.json`?** No — yours is for a build tool, theirs is for a library.
- **Should I merge upstream's `tsconfig`?** No — yours is project-specific.
- **Can I use upstream's CI?** No, but you can copy ideas into your CI.
- **What if upstream removes an API I use?** Check the conflict report, find a replacement, and update the wrapper in `src/core/`.
- **Do I need to credit upstream?** Yes — see `LICENSE` and README acknowledgments.

## Summary

1. Pull upstream updates into the mirror.
2. Generate a conflict report.
3. Review and selectively adopt.
4. Never merge core config files.
5. Test with `npm run typecheck && npm test && npm run build`.

Your local extensions stay safe. Upstream provides the foundation.
