# Handoff Prompt — Resume Engine Consolidation

> Paste everything below this line into a fresh Claude Code session to resume with clean context.

---

## You are resuming work on a Karabiner config refactor

**Repo:** `/Users/jason/Scripts/apps/karabiner/karabiner.ts` (branch `refactor_engine`, git). A personal Karabiner-Elements config written in TypeScript with `karabiner.ts`.

**Read these first (in order) before doing anything:**
1. `docs/DECLARATIVE_CONFIG_PLAN.md` — the architecture (layers, `Binding` schema, engine inventory, definition-file inventory).
2. `docs/superpowers/specs/2026-07-21-engine-consolidation-design.md` — the design for the standardization (especially §3 the `Binding` model, §3.5 builders, §3.6 why delayed-action isn't exposed, §5 specials, §7 scope).
3. `docs/superpowers/plans/2026-07-21-engine-consolidation.md` — the task-by-task plan that was executed.
4. `.superpowers/sdd/progress.md` — durable record of what was done (commits, deviations, deferred findings).

## Where the work stands (completed, green)

The engine consolidation **round 1 is done and the branch is green** (typecheck 0, lint 0, `npm test` 0 fail on committed code). What landed:

- **`src/engine/binding.ts`** (new) — the standardized `Binding` / `Case` / `Condition` / `Trigger` / `Phase` schema + **`defineBindings`**, the single entry point. Routes to 3 builders (`remap` / `tapHold` / `multiTap`) over the existing core primitives (`map`, `tapHold`, `varTapTapHold`, `mapSimultaneous`). Three patterns stay specialized: `modifierChord` (caps-lock), `guard` (cmd-q), `reset` (escape).
- **9 generators converted to thin adapters** over `defineBindings` (signatures frozen, definitions untouched): `simple-rules`, `tap-hold-rules`, `tap-alone-hold-rules`, `multi-tap-rules`, `simultaneous-rules`, `launcher-rules`, `pointer-remap-rules`, `conditional-action-rules`, `conditional-tap-hold-rules`. Dead code (`rule-factory-base.ts`, `variant-types.ts`) deleted.
- **`{ type: "noop" }`** added to `ActionSpec` (swallow = omit `to`).
- **`home-end.ts` migrated to `Binding[]` + `defineBindings`** (the proof/reference).
- **WIP breakage fixed** (the leader-layer WIP that was blocking merge): `isModifierToken` no longer treats symbol-keys (escape, home, arrows) as modifiers; stale right-option refs removed; `commands.ts` lint cleaned; mouse/hyper tests aligned with restructured data; mouse description regex relaxed.
- Output is **byte-identical to pre-refactor except one intentional normalization** (ctrl-escape manipulator `description` key dropped — spec §8.1).

The `generate*` adapters are **transitional**: they translate bespoke config → `Binding[]` → `defineBindings`. They exist so definitions can migrate one file at a time.

## The two goals for this resume

### Goal 1 — Address the "out of scope" items (spec §7)

1. **Migrate the remaining keyboard definition files to `Binding[]` + `defineBindings`.** `home-end.ts` is the only migrated one. Remaining (see `docs/DECLARATIVE_CONFIG_PLAN.md` inventory): `apps/antinote`, `apps/onepiece`, `apps/skim`, `apps/word`, `apps/zen`, `enter-equals`, `escape`, `hyper`, `left-command`, `right-option`, `shift`, `simultaneous`, `single-key`, `system`. Each becomes a `Binding[]` + `defineBindings` (one file per commit, byte-identical gate). `caps-lock` (modifierChord), `escape`-reset, and `cmd-q` (guard) stay specialized.
2. **Unify the mouse engine under `Binding`.** `mouse-rules.ts` / `core/mouse.ts` are a parallel universe (device-scoping, wheel guards, override conditions). The `Trigger.pointer` form is reserved in `binding.ts` for this. This is the biggest/riskiest item — device-scoping and wheel-guard logic need to fit the `Binding` model (or a `kind: "mouse"` specialization, like modifierChord). **Recommend brainstorming this as its own sub-project before implementing.**
3. **Delete dead generators.** Once all definitions migrate off them, the `generate*` adapter files become unused — delete them and their tests.

### Goal 2 — Harmonize the rules in `src/definitions/` (after the refactor)

Once every definition speaks `Binding[]`, standardize them for consistency:
- Description computation: always via `formatRuleDescription` (no hardcoded literal descriptions — `home-end.ts` had these and it caused a bug).
- Consistent condition usage (`{ app }` / `{ var, equals }`), timing (`timing: { aloneMs, heldThresholdMs }`), and `Case` structure across files.
- Consistent file layout (data export + `build*` wrapper).
- Decide and document conventions (e.g., when to use `noop` vs `vk_none`; how `tapCount` + `phase` express multi-tap; how variants/conditions group into bindings).

This is a design/consistency pass — invoke `superpowers:brainstorming` to establish the conventions, then migrate file-by-file.

## Hard constraints (carry forward from round 1)

- **Behavior-preserving.** Round 1 held byte-identity (`git diff karabiner-output.json` empty) as the gate. For migrations, keep that gate: regenerate with `CI=true npx tsx src/index.ts` (NOT `npm run build` — that writes the live Karabiner profile + reloads Hammerspoon), then `git diff --stat karabiner-output.json` must be empty per file. Mouse unification may legitimately change output — if so, get explicit user sign-off on the diff first.
- **Tests gate.** `npm run typecheck && npm run lint && npm test` must stay green. The integration snapshot + per-factory tests are the regression net.
- **Commits are unsigned** in this environment (`git -c commit.gpgsign=false commit`) — the repo signs via 1Password, unreachable non-interactively. The user re-signs or accepts unsigned on the feature branch.
- **`Binding` is the source of truth.** New behaviours and migrations go through `defineBindings`. Don't add new bespoke generator patterns.

## Suggested first steps

1. Read the four docs above. Skim `src/engine/binding.ts` and `src/definitions/home-end.ts` (the reference migration).
2. Run `npm run typecheck && npm test` to confirm the green baseline.
3. For Goal 1, start with the **simplest unmigrated definition** (e.g. `shift.ts` or `simultaneous.ts`) to re-establish the migration pattern, then proceed file-by-file. Treat mouse unification (1.2) and the dead-generator cleanup (1.3) as follow-ons after the keyboard definitions are migrated.
4. For each migration: invoke `superpowers:subagent-driven-development` with the byte-identical gate, one file per task, mirroring the round-1 plan.
5. For Goal 2 (harmonize) and mouse unification: invoke `superpowers:brainstorming` first — these are design decisions, not mechanical migrations.

## Pointers

- Schema + entry point: `src/engine/binding.ts`
- Reference migrated definition: `src/definitions/home-end.ts`
- Action vocabulary: `src/core/action-dsl.ts` (`ActionSpec`, incl. `noop`)
- Description rendering: `src/core/rule-descriptions.ts` (`formatRuleDescription`, `isModifierToken`)
- Orchestration: `src/index.ts`
- Progress ledger (what's done): `.superpowers/sdd/progress.md`
- Design spec: `docs/superpowers/specs/2026-07-21-engine-consolidation-design.md`
- Executed plan: `docs/superpowers/plans/2026-07-21-engine-consolidation.md`
