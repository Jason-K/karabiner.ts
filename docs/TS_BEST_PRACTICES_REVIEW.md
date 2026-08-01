# TypeScript Best-Practices Review

Date: 2026-08-01
Scope: full tree (`src/`, `scripts/`, config), ~12.3k LOC TypeScript.
Baseline measured at review time: `typecheck` clean · `lint` clean · **`test` 185 pass / 5 fail / 5 skipped**.

This document has two parts:

- **Part 1** — the TS practices that actually apply to *this* kind of project (a compiler from a hand-authored DSL to a foreign JSON schema).
- **Part 2** — a top-to-bottom review mapping each practice to concrete sites in this repo, ordered by the three areas you called out: conflict detection, authoring friction, and extensibility.

Everything marked **[verified]** was reproduced by running code, not inferred from reading.

---

# Part 1 — Which TS practices apply here

This project is not a typical app. It is a **compiler**:

```
Binding[] (hand-authored DSL)  →  resolve*  →  Manipulator[]  →  karabiner.json
     ^ source language              ^ passes      ^ target IR       ^ codegen
```

Compilers have a specific set of TS practices that pay off far more than the generic "use strict mode" advice:

### P1. The target schema is a contract you don't own — model it exactly and validate at the boundary

Karabiner's JSON schema is defined by someone else and changes between releases. Two rules follow:

- **Never `any` inside the target AST.** An `any` in `ToEvent` means a Karabiner schema change produces silently-wrong JSON instead of a type error.
- **Validate the emitted JSON before writing it**, because the only other feedback channel is Karabiner silently refusing to load a rule. A structural check (or a JSON Schema / zod parse) at the end of the pipeline is worth more than type-checking the middle.

### P2. Make the IR *illegal-state-unrepresentable*, then use discriminated unions with exhaustiveness checks everywhere it's consumed

Your DSL union (`ActionSpec`, `Condition`, `Trigger`) is consumed in at least four passes (resolve, describe, group, validate). The compiler-idiomatic guarantee is: **adding a union member breaks the build in every place that must handle it.** That is `switch` + `const _: never = x`. Any consumer that uses a `Set<string>`, a `default:` fallback, or `"key" in obj` duck-typing instead is a place where a new action type fails silently.

### P3. Derive, never duplicate

Anywhere the same fact is written twice (a union and a `Set` of its tags; a builder's parameter list and the spec it produces), one copy will drift. In TS, derive the second from the first: `keyof`, `Extract`, `satisfies`, `as const`. `satisfies` in particular lets a registry keep its literal types *and* be checked against a shape — you already use it well in `KE_VARS` and `VMOD`; the pattern should be universal.

### P4. Correctness properties belong in the compiler, not in tests over the config

For a personal keymap, "does rule X exist" is *data*, and data changes weekly. What deserves a test is the *compiler invariant*: "no two rules can ever claim the same physical input under overlapping conditions". Encode invariants as pipeline passes that throw, and reserve tests for the passes.

### P5. Overlap analysis, not equality

Conflict detection between rules is a **set-intersection problem** over (input event × modifier set × condition predicate), not a string-equality problem. Two rules conflict when their input domains intersect *and* their condition predicates can both be true. Equality of a signature string catches only the trivial case and produces false positives on the deliberate mutually-exclusive pairs you rely on.

### P6. One canonical name per concept; barrels are an API, not a dumping ground

A 138-symbol `export *` barrel with three different functions named `map` in scope is an authoring hazard. Barrels should be curated re-exports (`export { x, y } from`), which also makes ambiguous re-exports a compile error instead of a silent drop.

### P7. Side effects at the edge; the pipeline is pure

`src/index.ts` is the only file allowed to touch the filesystem or the clock. Everything else is `input → output`. This is what makes the compiler testable without mocking, and it is *almost* true here.

### P8. Writes to user-owned config files are atomic, backed up, and fail loudly

`~/.config/karabiner/karabiner.json` is a file the user also edits through a GUI. Clobbering it is the worst failure mode this project has. Temp-file + `rename()` is the minimum; a timestamped backup and a non-zero exit on failure are the rest.

### P9. Compiler strictness beyond `strict`

`strict: true` is table stakes. For a compiler that does a lot of array indexing and optional-property merging, the two that matter are `noUncheckedIndexedAccess` (you already write `!` everywhere as if it were on — it isn't) and `exactOptionalPropertyTypes` (you build objects with `...(x ? {k:x} : {})` specifically to avoid `undefined`-valued keys; the compiler should enforce that).

### P10. Lint should enforce the above, not be switched off

`no-explicit-any: off` in a project whose core value proposition is type safety over raw JSON is self-defeating.

---

# Part 2 — Top-to-bottom review

## A. Rule conflicts and collisions

### A1. Collision detection covers ~40% of the rule set, and misses a real live bug **[verified]**

[src/index.ts:49](src/index.ts:49) runs `assertUniqueTriggers` on `tapHoldBindings` only. `guardBindings`, `mouseBindings`, `capsLockBindings`, and `disabledHotkeys` are compiled and concatenated without any cross-set check.

Running the same signature check across all five sets finds three collisions:

| Trigger | Set A | Set B | Verdict |
|---|---|---|---|
| `left` (mouse button 1) | mouse, `var right_button_pressed == 1` | mouse, `var right_button_pressed != 1` | **benign** — conditions are mutually exclusive by construction |
| `⌘H` | tapHold, `if app == Skim` | disabled, *unconditional* | **shadowing** — works only because tapHold rules are ordered first |
| `⌘D` | guards, `if app == Antinote` | disabled, `if app == Antinote` | **dead rule** — identical trigger *and* identical conditions |

The `⌘D` case is a genuine silent bug: [src/definitions/guards.ts:18](src/definitions/guards.ts:18) and [src/definitions/disable-hotkeys.ts:13](src/definitions/disable-hotkeys.ts:13) both claim ⌘D in Antinote. `guardBindings` is spliced into `rules` before `disabledHotkeys` ([src/index.ts:64](src/index.ts:64) vs [:74](src/index.ts:74)), so Karabiner's first-match-wins evaluation makes the `disable-hotkeys` entry unreachable. Nothing in the build reports this.

The mouse `left` row is equally important: it shows why the current check *can't* simply be widened to all bindings. Signature equality would reject a pattern you deliberately depend on.

**What to do:** replace `assertUniqueTriggers` with an overlap analyzer that runs over the complete `Binding[]` set, in the order they will be emitted, and classifies each pair:

```ts
type Overlap =
  | { kind: 'duplicate' }    // same input domain, same condition predicate  → error
  | { kind: 'shadowed' }     // A's domain ⊇ B's and A is unconditional      → error (B unreachable)
  | { kind: 'narrowing' }    // A's domain ⊂ B's, A ordered first            → ok, report at -v
  | { kind: 'disjoint' };    // conditions provably cannot both hold         → ok
```

The condition-disjointness test only needs three cases to cover everything in the repo today:
- same `var`, different `equals` → disjoint
- same `var`+`equals`, one with `unless: true` → disjoint
- `app: X` vs `app: X, unless: true` → disjoint

Everything else conservatively counts as "may both hold". That is enough to clear the mouse pair and still flag ⌘D.

**Priority: highest.** This is the single change with the most leverage in the repo.

### A2. Input-domain overlap ignores modifiers-as-subsets **[verified by inspection]**

[`ioSignature`](src/engine/utils/input-devices.ts:13) treats `{keys:[s], mandatory:[]}` and `{keys:[s], mandatory:[shift]}` as unrelated strings. In Karabiner they overlap: [src/definitions/single-key.ts:51-52](src/definitions/single-key.ts:51) defines bare `s` and `⇧s` as separate bindings, and bare `s` compiles to `modifiers: { optional: [] }` — which matches only *no* modifiers, so this specific pair is actually fine. But the pattern is fragile: any binding that emits `optional: ["any"]` (every simultaneous trigger does — [trigger-to-from.ts:50](src/engine/resolve-trigger/trigger-to-from.ts:50)) matches *every* modifier combination on those keys, and would silently swallow every modified variant.

The overlap function should compare modifier sets as sets with `any` as top:

```ts
function modifiersOverlap(a: ResolvedMods, b: ResolvedMods): boolean {
  if (a.optional.includes('any') || b.optional.includes('any')) return true;
  return setEquals(a.mandatory, b.mandatory);
}
```

### A3. Simultaneous-chord validation is asymmetric and location-bound

[`validateMappings`](src/engine/resolve-trigger/simultaneous-rules.ts:84) is good work — it checks duplicate chords and chord-vs-bare-tap-hold overlap. But it lives inside the simultaneous generator, only sees `tapHoldBindings`, and its "bare keys only" filter (line 123-130) means a chord `[s, w]` will not be flagged against `⇧s`, even though Karabiner will match the chord regardless of shift because the chord's `from.modifiers.optional` is `["any"]`.

Fold these checks into the single analyzer from A1 so every rule is validated against every other rule, once, in one place.

### A4. No validation of the *emitted* JSON

Nothing between `buildManipulators` and `writeFileSync` checks the result. The pipeline can emit a manipulator with an empty `to`, a `key_code` that Karabiner doesn't recognize, a `set_variable` referencing a variable no rule ever sets, or a `variable_if` on a variable no rule ever writes — all of which fail silently at runtime.

Cheap, high-value output-stage passes:
- every `key_code` / `consumer_key_code` string is in a known-codes table
- every `variable_if`/`variable_unless` name is written by at least one `set_variable` somewhere in the config
- no manipulator has all of `to`, `to_if_alone`, `to_if_held_down`, `to_after_key_up` empty (a no-op rule)
- `to_delayed_action` is present only when a delay parameter is set

### A5. `karabiner-output.json` is written but never diffed

[src/index.ts:169-180](src/index.ts:169) writes the generated rules to the workspace for inspection. That artifact is a ready-made **golden file**: committing it and failing CI when it changes unexpectedly turns every engine refactor into a reviewable diff. Right now it is generated and ignored.

---

## B. Authoring friction

### B1. Three different functions named `map` are reachable from definition files **[verified]**

- `map(ref: MapSpec)` — the action wrapper ([to-action-wrappers.ts:238](src/engine/to-action-wrappers.ts:238)), exported from `../engine`
- `map(fromParam)` — the manipulator builder ([karabiner-helpers.ts:355](src/engine/karabiner-helpers.ts:355))
- `map` — also exported from the `../data` barrel (from `registries/combos`)

Definition files import `map` from `../engine` and get the first. [src/index.ts:18](src/index.ts:18) imports the *second* from `./engine/karabiner-helpers` and never uses it. The engine barrel exports 138 symbols via `export *` across 14 modules; there are also two `ifApp`/`ifDevice`/`ifVar` families with different return types (high-level `Condition` in [condition-wrappers.ts](src/engine/condition-wrappers.ts) vs `ConditionBuilder` in [karabiner-helpers.ts](src/engine/karabiner-helpers.ts:205)).

**Fix:** rename by layer (`hotkey()` for the action, `manipulator()` for the builder), and convert `src/engine/index.ts` to explicit `export { … } from` lists so any future ambiguity is a compile error.

### B2. Duplicate module paths — `utils.ts` beside `utils/`, `binding.ts` beside `binding/` **[verified]**

- [src/engine/utils.ts](src/engine/utils.ts) and [src/engine/utils/index.ts](src/engine/utils/index.ts) have **byte-identical bodies** (three `export *` lines).
- [src/engine/emit-manipulators/binding.ts](src/engine/emit-manipulators/binding.ts) is a real module; [src/engine/emit-manipulators/binding/index.ts](src/engine/emit-manipulators/binding/index.ts) is a different one.

`import … from "../utils"` and `from "./binding"` resolve to the `.ts` file (file beats directory), so the directory `index.ts` is dead in the first case and *shadowed* in the second — `emit-manipulators/index.ts` line 1 re-exports `binding.ts`, so nothing outside ever sees `binding/index.ts` except via the explicit `./binding/index` import at [binding.ts:21](src/engine/emit-manipulators/binding.ts:21). Delete `src/engine/utils.ts`; rename `binding.ts` → `binding/compile.ts` (or the directory → `builders/`).

### B3. `bind()` decides what each argument *is* by duck-typing at runtime

[`bind`](src/engine/binding-wrappers.ts:70) accepts a 6-member union and dispatches on `"do" in val`, `"app" in val || "var" in val || "device" in val`, `Array.isArray`, and `"kind" in arg`. Consequences:

- The `BindArg` union's last member is `BindingOptionsSpec` — a fully-optional object type — so *any* object literal type-checks. A typo'd option name (`timings:` for `timing:`) is accepted and silently dropped into `mergedOptions`.
- `isCondition` ([:43](src/engine/binding-wrappers.ts:43)) enumerates the `Condition` union's discriminant keys by hand. Adding a condition type without editing this function makes it fall through to "options".
- An array is classified by inspecting only `arg[0]` ([:100](src/engine/binding-wrappers.ts:100)) — a mixed array is silently mis-bucketed.

The wrapper types (`ToWrapper`, `WhenWrapper`, `OptionsWrapper`) already carry a `kind` discriminant and are handled correctly. **Make `kind` mandatory for every argument** — i.e. drop the bare `Case | Condition | BindingOptionsSpec` members from `BindArg` and require `to(...)`, `when(...)`, `options(...)`. The definition files already use the wrapper form almost everywhere; this is a small edit that converts runtime guessing into compile-time dispatch.

### B4. `CaseBuilder` uses `declare` + `delete this.x` to fake optional fields

[to-action-wrappers.ts:22-49](src/engine/to-action-wrappers.ts:22) declares seven fields then `delete`s them in the constructor so `assert.deepEqual` sees absent keys. This is a workaround for tests comparing builder instances to object literals (see D1) and it defeats V8's hidden-class optimization for no benefit. If the tests stop asserting on definition data, this whole dance can go — plain `?:` fields, no `declare`, no `delete`.

### B5. Two aliases per builder method, uncommented

`withTapCount`/`taps`, `delayedAction`/`withDelayed`, `desc`/`describe`, `suppressFallback`/`withSuppress`, plus `condVar`/`ifVar`/`ifUserVar` and `condNotVar`/`unlessVar`/`unlessUserVar` in [condition-wrappers.ts:104-107](src/engine/condition-wrappers.ts:104). Definition files use both spellings interchangeably. Pick one per concept and delete the rest — autocomplete quality is a real ergonomics factor here.

### B6. Authoring surface is TS-only, with no scaffolding or discoverability

`src/definitions/simultaneous.ts` is a commented-out template, which is the right instinct but the wrong mechanism. Two cheap upgrades:

1. **A `--explain` mode**: `npm run build -- --explain q` prints every rule that can fire for a given key, in evaluation order, with conditions. This is the fastest possible answer to "why isn't my binding working" and reuses the overlap machinery from A1.
2. **Publish `KeyCode` completions from a generated table.** `StandardKeyCode` ([keys.ts:43](src/data/constants/keys.ts:43)) is a hand-maintained list closed with `| (string & {})`, so `from("retrun_or_enter")` type-checks. Generating the union from Karabiner's own key-code table and dropping the `(string & {})` escape hatch (or keeping it behind an explicit `rawKey()` wrapper) converts every keycode typo into a compile error.

### B7. README describes an architecture that no longer exists **[verified]**

[README.md](README.md) references `src/core/`, `src/core/action-dsl.ts`, `src/core/beta.ts`, `src/core/scripts.ts`, `src/engine/binding.ts`, `src/engine/action-resolver.ts`, `home-end.ts`, and imports resolving "from the installed `karabiner.ts` package". None of these exist post-severance. `docs/FUTURE_FEATURES.md` has the same problem (`src/core/leader/build.ts`). For a config whose whole point is being readable six months later, the top-level map being wrong is a real cost. Also stale: the comment at [src/index.ts:73](src/index.ts:73) claims `CMD+M` is disabled — only `⌘⌥M` is.

---

## C. Extending the engine for new Karabiner features

### C1. Adding one `toAction` requires edits in 4 files; only 2 are compiler-enforced **[verified]**

To add, say, `set_notification_message`:

| # | File | Enforced? |
|---|---|---|
| 1 | `ActionSpec` union — [data/primitives/actions.ts](src/data/primitives/actions.ts:22) | source of truth |
| 2 | `resolveActionToEventsRaw` switch — [resolve-to-action/index.ts:89](src/engine/resolve-to-action/index.ts:89) | ❌ has `default:` → silently routes to `resolveShellCommand` → returns `[]` |
| 3 | `describeAction` switch — [description-synthesizer.ts:22](src/engine/resolve-description/description-synthesizer.ts:22) | ✅ `const _exhaustive: never` at [:92](src/engine/resolve-description/description-synthesizer.ts:92) |
| 4 | `ACTION_SPEC_TYPES` Set — [description-synthesizer.ts:125](src/engine/resolve-description/description-synthesizer.ts:125) | ❌ hand-maintained duplicate of the union's tags |
| 5 | Builder fn — [to-action-wrappers.ts](src/engine/to-action-wrappers.ts) | ❌ optional, no link |

Steps 2 and 4 are the dangerous ones. Miss #4 and the new action is classified as a raw `ToEvent` by `isActionSpec` ([:148](src/engine/resolve-description/description-synthesizer.ts:148)) and described as `"Raw event"` — no error, just a wrong description. The Set and the union are currently in sync (20 entries each); nothing keeps them that way.

**Two fixes, both small:**

```ts
// (a) derive the Set from the union — one line, zero drift
const ACTION_SPEC_TYPES = new Set<ActionSpec['type']>([...]);
//    ^ now a missing tag is still legal; better:
const ACTION_HANDLERS = { app: …, key: … } satisfies Record<ActionSpec['type'], Handler>;
const ACTION_SPEC_TYPES = new Set(Object.keys(ACTION_HANDLERS));
//    ^ `satisfies Record<ActionSpec['type'], …>` makes a missing tag a compile error

// (b) make resolveActionToEventsRaw exhaustive
default: { const _: never = action; return []; }
```

The **registry-of-handlers** shape in (a) is the structural answer to "make it easy to add new toActions". One object literal, keyed by action tag, each value `{ toEvents, describe, shellCommand? }`, `satisfies Record<ActionSpec['type'], ActionHandler>`. Adding an action then means: add the union member, add one entry. The compiler names the file and the key if you forget.

### C2. Adding one condition type requires 5 edits; 3 are unchecked

| # | Site | Enforced? |
|---|---|---|
| 1 | `Condition` union — [data/primitives/bindings.ts:23](src/data/primitives/bindings.ts:23) | source of truth |
| 2 | `resolveCondition` — [resolve-condition.ts:10](src/engine/resolve-conditions/resolve-condition.ts:10) | ❌ `if ("app" in c) … if ("var" in c) … // device` — new type falls into the device branch and throws at runtime |
| 3 | `describeConditionGroup` — [description-synthesizer.ts:172](src/engine/resolve-description/description-synthesizer.ts:172) | ❌ same fallthrough-to-device shape ([:180](src/engine/resolve-description/description-synthesizer.ts:180)) |
| 4 | `isCondition` duck-check — [binding-wrappers.ts:43](src/engine/binding-wrappers.ts:43) | ❌ hand-listed keys |
| 5 | Wrapper fn — [condition-wrappers.ts](src/engine/condition-wrappers.ts) | ❌ |

Karabiner already ships condition types this DSL cannot express: `keyboard_type_if`, `input_source_if`, `expression_if`, `event_changed_if`, `device_exists_if`. They're all typed in [types/karabiner.ts:155-184](src/types/karabiner.ts:155) but unreachable from `Binding`. Give `Condition` an explicit discriminant (`kind: 'app' | 'var' | 'device' | …`) instead of relying on which key is present, and the same handler-registry pattern applies.

### C3. `ToEvent` uses `any` for exactly the features you want to adopt next **[verified]**

[types/karabiner.ts:109-124](src/types/karabiner.ts:109):

```ts
| { select_input_source: any }
| { software_function: any }
| { send_user_command: any }
```

`docs/FUTURE_FEATURES.md` tracks `send_user_command` as adopted and `software_function` variants as candidates — and the docs for all four `software_function` members are already mirrored under `docs/karabiner_docs/…/to/software_function/`. These three `any`s are the highest-value types to write in the whole repo, because they cover the exact surface you're extending into. Also missing entirely from `ToEvent`: `set_notification_message` is present but `to_if_other_key_pressed` is typed as bare `ToEvent` ([:131](src/types/karabiner.ts:131)) when Karabiner's schema has it as a distinct shape.

### C4. Two definitions of `SimultaneousOptions`, one with a wrong field name **[verified]**

- [types/karabiner.ts:47](src/types/karabiner.ts:47) declares `detect_key_down_unbroken_sequence`.
- Karabiner's actual field is `detect_key_down_uninterruptedly` — confirmed in your own mirrored docs at `docs/karabiner_docs/complex-modifications-manipulator-definition/from/simultaneous-options/index.md`.
- The engine emits the *correct* name in three places ([simultaneous-core.ts:19](src/engine/resolve-trigger/simultaneous-core.ts:19), [trigger-to-from.ts:46](src/engine/resolve-trigger/trigger-to-from.ts:46), [simultaneous-rules.ts:39](src/engine/resolve-trigger/simultaneous-rules.ts:39)) — each behind an `as any` / `Record<string, unknown>` cast that exists *because* the type is wrong.
- A second, separately-declared `SimultaneousOptions` lives in [simultaneous-rules.ts:6](src/engine/resolve-trigger/simultaneous-rules.ts:6) with the right field name and is what definition authors see.

This is P1 and P3 failing together: the target-schema type is wrong, and the casts that work around it hide the error. Fix the field name in `types/karabiner.ts`, delete the duplicate type, and the three casts can go.

### C5. `BasicParameters` has a typo'd key that can never match **[verified]**

[types/karabiner.ts:200](src/types/karabiner.ts:200):

```ts
'basic.simultaneous_threshold_milliseconds?'?: number;   // note the ? inside the string
```

A stray `?` from a `?:` that ended up inside the quotes. Harmless today (nothing sets it) but it is exactly the kind of thing `no-explicit-any: off` + no schema validation lets survive.

---

## D. Cross-cutting: tests, build, and toolchain

### D1. 5 failing tests, all asserting on personal config data rather than engine behavior **[verified]**

```
not ok  99 — generated output includes all critical rule categories   ("Missing CAPS rule")
not ok 110 — disabled shortcut mappings stay declarative              (expects modifiers ['L.opt'], config has ['L.cmd','L.opt'])
not ok 113 — passwords quick fill mapping stays declarative
not ok 130 — word privileges factory keeps single guarded manipulator (TypeError: binding lookup returned undefined)
not ok 131 — password quick-fill factory keeps secure/non-secure manipulators
```

Every one is a test that deep-equals a *definition* against a literal. They broke because you edited your keymap, not because anything regressed. This is P4 inverted: the volatile layer is pinned by tests and the stable layer (the compiler) has weaker coverage. A red suite that is red for non-reasons also means the suite has stopped being a signal — note that `npm run check` currently fails, so nothing in the workflow is gated on it.

Recommended split:
- **Compiler tests** (keep, expand): given a synthetic `Binding`, assert the emitted `Manipulator[]`. Use fixtures defined *in the test*, never imported from `src/definitions/`.
- **Config tests** (replace): drop the deep-equals. Replace with the invariant passes from A1/A4, which hold no matter how the keymap changes.
- **Golden file** (add): snapshot `karabiner-output.json` (A5).

### D2. `npm test` glob doesn't match where the tests are

`"test": "tsx --test src/*.test.ts src/**/*.test.ts"` — no test files live at `src/*.test.ts`; they are all in `src/tests/`. The first pattern is dead. Harmless but misleading; `tsx --test 'src/**/*.test.ts'` (quoted, so the shell doesn't pre-expand) is enough.

### D3. ESLint disables the four rules that matter most here

[eslint.config.mjs:18-24](eslint.config.mjs:18):

```js
'@typescript-eslint/no-explicit-any': 'off',
'@typescript-eslint/no-unused-vars': 'off',
'no-unused-vars': 'off',
'prefer-const': 'off',
```

There are **134 `any` occurrences** in non-test source. Suggested path: turn `no-explicit-any` to `'warn'`, run `--max-warnings` at the current count, and ratchet down. Turn `no-unused-vars` on with `argsIgnorePattern: '^_'` (the codebase already uses `_unless`, `_m`, `_exhaustive`). Also worth adding: `@typescript-eslint/switch-exhaustiveness-check` and `consistent-type-imports` — the former directly enforces P2, and the config is already type-aware-ready.

Separately, the `ignores` key is inside the same object as `rules` ([:11](eslint.config.mjs:11)). In flat config, `ignores` is only global when it's the sole key of its config object; here it acts as a per-config filter, so `docs/**` may not be globally ignored as intended. The `lint` script passes `--ignore-pattern docs` explicitly, which suggests this was already noticed and worked around.

### D4. tsconfig is missing the two strictness flags this codebase is already written for

[tsconfig.json](tsconfig.json) has `strict: true` (plus redundant `strictNullChecks`/`strictFunctionTypes`). Not set:

- **`noUncheckedIndexedAccess`** — the code is *already* littered with `keys[0]!`, `groups[i]!`, `cases[i]!` as if it were on. Turning it on makes those assertions meaningful instead of decorative, and will surface the places where the `!` is a lie.
- **`exactOptionalPropertyTypes`** — the entire codebase builds objects with `...(x ? { k: x } : {})` to avoid emitting `k: undefined` into Karabiner JSON. That is an unenforced convention today.
- `verbatimModuleSyntax` / `isolatedModules` — cheap, catches type-only import mistakes.
- `noEmit: true` with `allowImportingTsExtensions` and `"jsx": "react-jsx"` — the JSX setting is a leftover from the upstream docs site and can go.

Expect a meaningful error count on the first run of the first two; that count *is* the finding.

### D5. `writeToProfile` is non-atomic, non-backing-up, and silent on failure **[verified]**

[profile-writer.ts:70](src/engine/profile-writer.ts:70) does a bare `writeFileSync(jsonPath, …)` on `~/.config/karabiner/karabiner.json`. An interrupt mid-write leaves the user's entire Karabiner config truncated. Two other writers in the same run — [`updateGlobalSettings`](src/index.ts:136) and [`updateDeviceConfigurations`](src/engine/resolve-trigger/device-config.ts:152) — *do* use temp-file + `rename`. The one that writes the most data doesn't.

Three problems in one function:
1. Not atomic (fix: `.tmp` + `renameSync`, matching the other two).
2. No backup. Your own global convention is `<project>/backups/<filename>.bak_YYYYMMDD_HHMMSS` — nothing here writes one.
3. The `catch` at [:72](src/engine/profile-writer.ts:72) logs and returns. A missing profile at [:44](src/engine/profile-writer.ts:44) warns and returns. `npm run build` exits 0 and reloads Hammerspoon in both cases, so a total write failure looks like success.

### D6. Three sequential read-modify-write passes over the same file, sequenced by `setTimeout` **[verified]**

[src/index.ts](src/index.ts) does, in order: `updateGlobalSettings` (sync read+write), `writeToProfile` (sync read+write), then `setTimeout(1000)` → `updateDeviceConfigurations` (async `import()` chain, read+write). Two issues:

- The `setTimeout` is load-bearing sequencing. `writeToProfile` is fully synchronous, so the delay isn't needed for *it* — but `updateDeviceConfigurations` uses dynamic `import()` and resolves asynchronously, so the ordering is genuinely timing-dependent, and the 1s is a guess. Also note `updateGlobalSettings` writes with 2-space indent and `updateDeviceConfigurations` with 4-space — each run rewrites the whole file in the other's style.
- Three separate parses of a possibly-large JSON file, each of which can fail independently and leave a partial state.

**Fix:** one read → build the complete new config object in memory → one atomic write. Make the dynamic `import()`s static top-level imports (there is no reason for them here — `node:fs`/`node:path` are already imported statically at [index.ts:20](src/index.ts:20)).

### D7. `src/index.ts` is doing pipeline work that belongs in the engine (P7)

- `let rules: any[]` at [:57](src/index.ts:57) — the one place the whole config is assembled is untyped. `const rules: Rule[]`.
- `activeProfile.simpleModifications as any[]` at [:157](src/index.ts:157) — the cast is needed because `ProfileSpec.simpleModifications` is typed `readonly SimpleModificationPair[] | any[]` ([primitives/profiles.ts](src/data/primitives/profiles.ts)); the `| any[]` makes the whole union `any[]`. Drop the `| any[]` and the cast together.
- `resolveTargetProfileName` ([:95](src/index.ts:95)) reads and parses `karabiner.json` a fourth time, and its `catch` at [:124](src/index.ts:124) silently falls back to `DEFAULT_PROFILE` — so a malformed config writes rules into the *wrong profile* with no warning.
- No `process.exitCode = 1` anywhere. The build cannot fail.

### D8. `expandModifiers` is imported from `resolve-to-action` by the description layer

[description-synthesizer.ts:5](src/engine/resolve-description/description-synthesizer.ts:5) imports from `../resolve-to-action`, and `resolve-to-action/index.ts` imports the description synthesizer transitively via `builders.ts`. Not currently a cycle that breaks, but the layering (`resolve-*` passes should not depend on each other) is worth restoring by moving `expandModifiers` into `engine/utils/modifier-utils.ts` where its siblings already live.

### D9. `RuleBuilder` uses a `Proxy` to serve `manipulators` as both a method and an array

[karabiner-helpers.ts:35-57](src/engine/karabiner-helpers.ts:35) returns a `Proxy` from the constructor so `.manipulators` works as a getter, a setter-method, *and* an array-like. That is a lot of machinery — and it defeats type inference, which is why `defineBindings` ends with `as unknown as Rule` ([binding.ts:74](src/engine/emit-manipulators/binding.ts:74)). Two plain methods (`manipulators(m)` returning `this`, `getManipulators()` returning the array) would remove the Proxy, the double `build()`/`toJSON()`, and the double cast.

### D10. `package.json` hygiene

No `"private": true`, no `"type": "module"` (the code is ESM and tsconfig says `ESNext`), no `engines`. `"private": true` is the important one — it's the guard against an accidental `npm publish` of a personal config.

---

# Suggested order of work

Sequenced so each step makes the next one safer.

| # | Change | Why first |
|---|---|---|
| 1 | Fix `writeToProfile`: atomic write + timestamped backup + non-zero exit (D5) | Protects the file everything else touches |
| 2 | Collapse the three config writes into one read/build/write; drop `setTimeout` (D6) | Removes the race before adding passes |
| 3 | Fix `detect_key_down_unbroken_sequence` + drop duplicate `SimultaneousOptions` + typo'd param key (C4, C5) | One-line type fixes that delete three `as any` |
| 4 | Delete `src/engine/utils.ts`; rename `binding.ts`/`binding/` (B2) | Unambiguous imports before touching either |
| 5 | Retarget the test suite: engine fixtures in, definition deep-equals out; add golden file (D1, A5) | Restores a green gate to work against |
| 6 | **Build the overlap analyzer; wire into the pipeline over all bindings (A1, A2, A3)** | The headline feature; needs 5 to be safe to land |
| 7 | Fix the ⌘D duplicate the analyzer finds | First result from 6 |
| 8 | Handler-registry refactor for `ActionSpec` + exhaustive `default:` (C1) | The extensibility win |
| 9 | Same for `Condition`, with an explicit `kind` discriminant (C2) | Unlocks the 5 unreachable Karabiner condition types |
| 10 | Type `software_function` / `send_user_command` / `select_input_source` (C3) | Now cheap; the registry gives them a home |
| 11 | `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (D4) | Do after the refactors, not during |
| 12 | Ratchet ESLint: `no-explicit-any` → warn, `switch-exhaustiveness-check` on (D3) | Locks in 8–11 |
| 13 | Rewrite README; add `--explain` mode (B7, B6) | Documents the result |
| 14 | Tighten `bind()` to wrapper-only args; dedupe aliases (B3, B5) | Cosmetic-ish; do last, touches every definition file |

Items 1–4 are mechanical and independently safe. Item 6 is the one that pays for the rest.
