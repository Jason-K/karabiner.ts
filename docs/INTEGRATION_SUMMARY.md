# Integration Summary: Upstream + Local Architecture

## Purpose

This project uses `karabiner.ts` APIs while keeping local behavior, mappings, and generation logic fully owned in this repo.

## Current Layout

```text
karabiner/
├── karabiner.ts/                 # local source of truth
│   ├── src/
│   │   ├── mappings/             # declarative intent data
│   │   ├── generators/           # reusable compilers/builders
│   │   ├── rules/                # stateful and exceptional adapters
│   │   ├── lib/                  # shared helper modules and leader internals
│   │   ├── tests/                # unit + output-level tests
│   │   └── index.ts              # top-level orchestration
│   └── docs/                     # local architecture and operations docs
└── karabiner.ts-upstream/        # upstream mirror for reference and type surface
```

## Ownership Boundaries

### Local-owned (do not overwrite from upstream)

- `src/index.ts`
- `src/mappings/**`
- `src/generators/**`
- `src/rules/**`
- `src/lib/**`
- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `docs/**` (except `docs/upstream/**` mirrors)

### Upstream reference

- `../karabiner.ts-upstream/**`
- `docs/upstream/**`
- `docs/upstream-examples/**`

## How Integration Works

1. Code imports from `karabiner.ts` APIs.
2. TypeScript path mapping resolves those imports to `../karabiner.ts-upstream/src`.
3. Local modules compose those APIs into project-specific mappings/generators/rules.
4. `src/index.ts` orchestrates assembly and output writes.

## Why This Structure

- Local behavior remains readable and versioned independently.
- Upstream evolution stays easy to inspect and adopt selectively.
- Declarative intent is separated from rule-construction mechanics.
- Device-specific and stateful logic remains isolated in thin rule adapters.

## Current Notable Extensions

- Declarative registries for apps, folders, Raycast, and CleanShot actions.
- Shared `ActionSpec` resolution in generator layer.
- Declarative mouse mapping pipeline with device-scoped compilation.
- Command server transport for low-latency layer-indicator/user-command dispatch.

## Maintenance Workflow

### Update upstream mirror

```bash
cd /Users/jason/Scripts/apps/karabiner/karabiner.ts-upstream
git fetch origin
git pull origin main
```

### Validate local compatibility

```bash
cd /Users/jason/Scripts/apps/karabiner/karabiner.ts
npm run typecheck
npm test
npm run build
```

### Review drift

```bash
cd /Users/jason/Scripts/apps/karabiner/karabiner.ts
./scripts/generate-conflict-report.sh
```

## Operational Principle

Treat `karabiner.ts-upstream/` as an API/reference mirror and `karabiner.ts/src` as the implementation surface.
Adopt upstream features intentionally, never by blanket overwrite of local modules.
