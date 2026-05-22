# Integration Summary: Upstream + Local Architecture

## Purpose

This project consumes `karabiner.ts` APIs while keeping all keyboard behaviour, data, and rule generation logic owned locally.

## Current Layout

```text
karabiner/
├── karabiner.ts/                 # local source of truth
│   ├── src/
│   │   ├── core/                 # low-level builders + shared primitives (action-dsl, mods, scripts, conditions, leader internals)
│   │   ├── data/                 # registries and constants (apps, folders, raycast, cleanshot, paths, devices, timings, ui labels)
│   │   ├── definitions/          # data configs + one engine call per behaviour (the user edit surface)
│   │   ├── engine/               # rule-generation functions; all manipulator construction lives here
│   │   ├── tests/                # unit + integration regression coverage
│   │   └── index.ts              # top-level orchestration: imports definitions, runs engine, writes profile
│   └── docs/                     # local architecture and operations docs
└── karabiner.ts-upstream/        # upstream mirror for reference, docs, and diffing
```

## Ownership Boundaries

### Local-owned (do not overwrite from upstream)

- `src/index.ts`
- `src/core/**`
- `src/data/**`
- `src/definitions/**`
- `src/engine/**`
- `src/tests/**`
- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `docs/**` (except `docs/upstream/**` mirrors)

### Upstream reference (read-only)

- `../karabiner.ts-upstream/**`
- `docs/upstream/**`
- `docs/upstream-examples/**`

## How Integration Works

1. Code imports from `karabiner.ts` APIs (npm package dependency, mirrored locally for IDE/typecheck).
2. Local beta shims in `src/core/beta.ts` provide project-specific compatibility where upstream removes or changes APIs.
3. `src/core/` and `src/engine/` compose those APIs into the project's rule-generation pipeline.
4. `src/definitions/` files declare *what* each key should do as data, and call exactly one engine function.
5. `src/index.ts` orchestrates assembly and writes the profile via `writeToProfile`.

## Why This Structure

- Behaviour data (`src/definitions/`) is separated from rule-construction mechanics (`src/engine/`).
- Every behaviour is a typed config object — search-friendly, refactor-friendly, and unit-testable in isolation.
- A single conversion path (`ActionSpec` → `resolveActionToEvents`) means JSON output is reviewable and the integration snapshot is the regression net.
- Upstream evolution stays easy to inspect: the mirror is read-only and diff-able.
- Device-specific simple modifications are handled post-write via `updateDeviceConfigurations`, keeping the rule pipeline pure.

## Notable Extensions

- `ActionSpec` DSL (`src/core/action-dsl.ts`) with one shared resolver (`src/engine/action-resolver.ts`) used by every engine function.
- Engine functions for every recurring pattern: simple remaps, app-scoped remaps, tap-hold, conditional tap-hold, multi-tap, double-tap guards, tap-alone-hold, modifier launchers, modifier chords, pointer remaps, mouse tap-hold/double-tap.
- Generic leader-layer compiler (`src/core/leader/`) wired by the space leader and ready for a second leader key without code changes.
- Simultaneous-chord framework (`src/engine/simultaneous-rules.ts`, `src/core/simultaneous.ts`) — tap, hold, double-tap, and double-tap-hold on multi-key chords, with full `simultaneous_options` exposure and conflict detection against single-key tap-hold rules.
- Command server transport for low-latency layer-indicator and user-command dispatch (see `docs/COMMAND_SERVER_GUIDE.md`).
- Device-scoped simple modifications applied as a post-write patch (`updateDeviceConfigurations`).

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

The conflict report is a temporary review artifact. Inspect it, decide what to adopt, then discard it; do not track it long-term.

## Operational Principle

Treat `karabiner.ts-upstream/` as an API and reference mirror, and `karabiner.ts/src/` as the implementation surface. Adopt upstream features intentionally — never by blanket overwrite of local modules.
