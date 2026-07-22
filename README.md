# Karabiner Config

Personal Karabiner-Elements configuration written in TypeScript with `karabiner.ts`.

## Architecture

The config is split by responsibility:

- `src/core/` — low-level builders and shared primitives (`ActionSpec`, mods, conditions, scripts, tap-hold, mouse helpers, leader internals)
- `src/data/` — registries and constants (apps, folders, raycast, cleanshot, devices, paths, timings, UI labels)
- `src/definitions/` — data configs that express behaviours as `Binding[]` (the standardized surface) and hand them to the engine; this is the user edit surface
- `src/engine/` — rule generation; the only layer that constructs manipulators. `binding.ts` defines the `Binding`/`Case`/`Condition` schema and `defineBindings`, the single entry point every generator routes through
- `src/tests/` — unit + integration regression coverage
- `src/index.ts` — orchestrates the pipeline and writes the profile

Every behaviour is a `Binding` (or a typed config that an engine adapter translates into one) plus a single `defineBindings`/generator call. No definition file imports from `karabiner.ts` directly or iterates over its own mappings. All output events flow through one path: `ActionSpec` → `resolveActionToEvents` (in `src/engine/action-resolver.ts`) → karabiner.ts `ToEvent[]`.

> **Standardization in progress:** the `Binding` schema + `defineBindings` is the target definition surface. `home-end.ts` is migrated as the reference; the other definition files still use their legacy generator adapters (`generateTapHoldRules`, etc.), which are thin wrappers over `defineBindings`. See `docs/superpowers/specs/2026-07-21-engine-consolidation-design.md`.

## Upstream Integration

- Imports resolve from the installed `karabiner.ts` package, not from mirrored source paths.
- Local beta compatibility helpers live in `src/core/beta.ts`.
- `karabiner.ts-upstream/` and `docs/upstream/` are read-only reference and diff surfaces used by sync workflows.

See `docs/UPSTREAM_SYNC.md` for the sync workflow.

## Key Files

- `src/core/action-dsl.ts` — the `ActionSpec` union used for every output event
- `src/engine/binding.ts` — the standardized `Binding` schema and `defineBindings`, the single entry point every generator routes through
- `src/engine/action-resolver.ts` — single compiler from `ActionSpec` to Karabiner `ToEvent`s
- `src/core/leader/build.ts` — generic leader-layer compiler (used by the space leader, ready for additional leaders)
- `src/data/apps.ts`, `folders.ts`, `raycast.ts`, `cleanshot.ts` — registries referenced by definitions
- `src/index.ts` — orchestration entry point

## Common Commands

```bash
npm run typecheck
npm test
npm run build
npm run check
```

## Practical Rule

If a file answers "what should this key do?", it belongs in `src/definitions/`.

If a file answers "how do we turn that declaration into Karabiner JSON?", it belongs in `src/engine/`.

If a file is a low-level builder, a shared helper, or part of the leader runtime, it belongs in `src/core/`.

If a file is a plain registry or constant table consumed across layers, it belongs in `src/data/`.

## Documentation

- `docs/DECLARATIVE_CONFIG_PLAN.md` — current architecture, engine-function inventory, and the definition-file contract
- `docs/COMMAND_SERVER_GUIDE.md` — when to use the user command server vs shell commands, plus migration, performance, testing, and troubleshooting
- `docs/INTEGRATION_SUMMARY.md` — upstream integration strategy and ownership boundaries
- `docs/UPSTREAM_SYNC.md` — how to update the upstream mirror safely
- `docs/INSIGHTS.md` — Karabiner manipulator pattern notes (variable conditions, evaluation order, timing parameters)
- `docs/FUTURE_FEATURES.md` — tracked unimplemented Karabiner capabilities
- `docs/BETA_IMPLEMENTATION_SUMMARY.md` — historical snapshot of the v15.6–v15.9 beta features adoption
- `docs/superpowers/` — design specs and execution plans for in-flight or recently completed refactors
- `docs/karabiner_docs/` - Karabiner Elements documentation and examples
- `docs/karabiner_docs/complex-modifications-manipulator-definition/_index.md` - anatomy of a Karabiner JSON rule with links to definitions of each element.
