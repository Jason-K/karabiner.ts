# Engine Consolidation & Standardized Definitions — Design

**Date:** 2026-07-21
**Branch:** `refactor_engine`
**Status:** Architecture finalized; pending spec review

## 1. Goal

`src/engine/` contains ~19 independent rule generators that duplicate the same orchestration logic (resolve actions → build manipulators → wrap in a rule) in slightly different forms. Each definition file calls a different generator with a different bespoke config shape.

**Ultimate goal:** one standardized declarative schema (`Binding[]`) that every definition file speaks, backed by a small set of engine primitives/builders. Replaces the generator zoo and the per-type config types.

This round delivers the foundation (engine primitives + builders + the `Binding` schema + `defineBindings`) and proves it by migrating one definition (home-end) end-to-end. Full definition migration and mouse unification are sequenced follow-ons.

## 2. The byte-identical contract

`karabiner-output.json` is `JSON.stringify({ complex_modifications: { rules } }, null, 2)` where `rules` is the array assembled at `src/index.ts:65-128`. Each serialized `Rule` has the shape karabiner.ts's `rule()` produces: `{ ruleDescription, manipulatorSources[], allowEmptyManipulators, conditions }`.

**Byte-identical** = same rules, same order, each with same `ruleDescription` + same `manipulatorSources` in the same order, each manipulator's key-insertion order preserved. Because every refactor routes through the *same* karabiner.ts builders (`rule`, `map`, `tapHold`/`tapHoldFrom`, `varTapTapHold`/`varTapTapHoldFrom`, `mapSimultaneous`) in the *same* order, the object shapes stay identical; only *which* manipulators are produced and the description string can change, and both must match today.

**Success gate:** after a rebuild, `git diff karabiner-output.json` is empty. The per-step loop is: change one generator → rebuild → diff → fix drift before the next.

JSON serialization is insertion-order-sensitive, so preserve: object key order, array order (manipulators/conditions/to-events), exact `formatRuleDescription` output, and the "append after existing conditions" semantics of suppression-var injection.

## 3. Architecture — the standardized model

The model is organized around four concepts, per the design discussion: **triggers**, **conditions**, **actions**, and **builders**.

### 3.1 Triggers — what was pressed

```ts
type Trigger = {
  keys: string[];                // 1 key = single; 2+ = simultaneous chord
  modifiers?: string[];          // mandatory from-modifiers (vm aliases OK)
  order?: {                      // simultaneous_options (only meaningful for 2+ keys)
    down?: "insensitive" | "strict" | "strict_inverse";   // key_down_order
    up?:   "insensitive" | "strict" | "strict_inverse";   // key_up_order
    upWhen?: "any" | "all";                               // key_up_when
    detectUninterrupted?: boolean;                        // detect_key_down_uninterruptedly
  };
};
```
`keys: string[]` unifies single-key and simultaneous (one array, length decides). Modifiers live separately from keys (no more parsing `"vmCOCS+t"` strings). A `pointer` form is reserved for the later mouse round.

### 3.2 Conditions — when it fires (two flavors)

Both flavors answer "when does this action fire?", but Karabiner realizes them differently. The dividing line is **whether resolving the condition requires state that persists across keypresses**.

**State conditions** (cross-press state; realized as Karabiner `conditions[]`):
```ts
type Condition =
  | { app: string | string[]; unless?: boolean }              // frontmost (not) in bundle set
  | { var: string; equals: string | number; unless?: boolean } // variable state
  | { device: string; unless?: boolean };                      // reserved for mouse
```
Includes externally-managed state (app / user-or-leader variable / device) **and** framework-managed state — see `tapCount` below, which the builder promotes from a timing pattern into a synthesized variable condition.

**Timing conditions** (stateless, single-press; realized as manipulator *output channels*): expressed via `phase` —
```ts
type Phase = "press" | "release" | "hold";
```
- `press` → `to`
- `release` → `to_if_alone` (the tap: fires on release within `aloneMs`, uninterrupted)
- `hold` → `to_if_held_down` (held past `heldThresholdMs`)

(Karabiner also has a fourth channel pair, `to_delayed_action` — `to_if_invoked` if no other key is pressed during `delayedMs`, `to_if_canceled` if one is — but it is **not** exposed as a user phase; see §3.6.)

**`to_delayed_action` is foundational — but builder-internal.** A timer (`delayedMs` after press) that resolves to one of two branches: `to_if_invoked` if nothing else is pressed during the window, `to_if_canceled` if something is. `tapCount` is literally built out of delayed + a variable (the delay window *is* the multi-tap window; a second press interrupts → canceled branch arms/resets the pending var). Guard works the same way, and tap-hold uses the canceled branch to fire the tap action promptly on interrupt. All of this is builder machinery — none of it is exposed as a user phase (§3.6).

**tapCount** — framework-managed state, expressed as a number (default 1; 2 = double-tap, etc.):
```ts
tapCount?: number;
```

### 3.3 Actions — what happens

Pure `ActionSpec[]`. One addition: **`{ type: "noop" }` = swallow = omit the `to` key entirely** (verified: disabled-shortcut serializes as `{type, from}` with no `to`). This is distinct from `vk_none`, which is an ordinary key event (`to: [{key_code:"vk_none"}]`, used by caps-lock `vm____`) — `noop` produces no `to`; `vk_none` is a real event.

### 3.4 The standardized shapes

```ts
type Case = {
  tapCount?: number;            // default 1
  phase?: Phase;                // default "press"
  conditions?: Condition[];     // external state (app/var/device)
  do: ActionSpec[];             // {type:"noop"} = swallow
};

type Binding = {
  description: string;          // rule-partition key: one binding = one rule
  trigger: Trigger;
  timing?: { aloneMs?; heldThresholdMs?; delayedMs?; simultaneousMs?: number };
  conditions?: Condition[];     // hoisted — shared across all cases
  cases: Case[];
  eventOptions?: { halt?: boolean; repeat?: boolean };
  multiTap?: { allowPassThrough?: boolean; mods?: string[] };  // varTapTapHold opts
  afterKeyUp?: ActionSpec[];    // to_after_key_up channel (general)
};
```

**Merge rule:** within a binding, cases that share the same `(tapCount, conditions)` merge into ONE manipulator, each `phase` filling a different channel (`to` / `to_if_alone` / `to_if_held_down`). So `{phase:"release"}` + `{phase:"hold"}` with matching tapCount+conditions become one tap-hold manipulator; multiple `{phase:"press"}` cases with *different* conditions become sibling manipulators within the same rule (the conditional-action shape).

**Rule grouping:** one binding = one `description` = one rule. enter-equals becomes *two* bindings (its two variants have different descriptions), so "one rule per variant" falls out free. passwords is *one* binding with two cases (shared description) → one rule, two manipulators. No `group` field needed.

**Default pass-through:** if a binding has no `{phase:"release"}` case, the builder emits `to_if_alone` = the trigger key (with `halt:true`) — matching today's tap-hold default-alone (verified in single-key 'a' output).

**Tap-hold responsiveness (builder-internal):** for tap-hold bindings the builder auto-wires `to_delayed_action = { to_if_invoked: [], to_if_canceled: <release action> }` so the tap action fires promptly on interrupt — verified in single-key 'a'.

### 3.5 Builders — the limited primitive set, selected by case shape

| Builder | Selected when | Emits | Replaces |
|---|---|---|---|
| **remap** | only `press` phases, `tapCount` 1 | `map(trigger).to(...)` | simple-remap, launcher, pointer-remap, disabled-shortcut, conditional-action, app-scoped-remap |
| **tapHold** | `release`/`hold`, `tapCount` 1 | one manipulator: `to_if_alone`+`to_if_held_down`+`to_delayed_action` (auto responsiveness) | tap-hold, conditional-tap-hold, tap-alone-hold†, simultaneous-tap-hold |
| **multiTap** | any `tapCount ≥ 2` | `varTapTapHoldFrom` var-dance (carries tap/hold) | multi-tap, simultaneous-multi-tap |
| **modifierChord** (special) | `kind:"modifierChord"` | base + modifier-variant manipulators with `trackVar` | caps-lock |
| **reset** (special) | n/a | var-reset on escape | escape-rule |

† tap-alone-hold see §8. Selection: any `tapCount ≥ 2` → multiTap; else any release/hold/delayed → tapHold; else remap. Simultaneous triggers (2+ keys) swap the underlying core primitive (`mapSimultaneous` / `varTapTapHoldFrom` with a simultaneous from-event).

**Guard stays specialized** (planning correction). cmd-q's second tap fires the real key on *press* (`to`), but `varTapTapHold`'s second tap fires on *release* (`to_if_alone`) — so the guard var-dance is a distinct manipulator shape, not a multiTap cases-binding. `double-tap-guard-rules` keeps its dedicated builder (§5), refactored only to share condition helpers.

### 3.6 Not exposed: the delayed-action channel (YAGNI)

`to_delayed_action` (`to_if_invoked` / `to_if_canceled`) is deliberately **not** exposed as user phases. Every actual usage in the codebase is framework-internal — the `tapCount` var-dance, guard var reset, and tap-hold/simultaneous responsiveness wiring — and **no definition authors a delayed action** (the `ConditionalActionVariant.delayedAction` field exists in the type but is populated nowhere). Exposing it would be speculative API surface.

If a real need ever arises, add two phases with semantically honest names — **`onUndisturbed`** (Karabiner's `to_if_invoked`: no other key pressed during the delay) and **`onInterrupted`** (`to_if_canceled`: another key pressed) — which read far more clearly than invoked/canceled. The Phase-1 conditional-action adapter preserves the existing (unused) field for parity; it simply is not surfaced in `Binding`.

## 4. Mapping — current definition → `Binding[]`

| Definition (today) | Standardized |
|---|---|
| `home-end` (simple remap) | `{trigger:{keys:[home]}, cases:[{phase:"press", do:[…]}]}` ×4 |
| `single-key`/`right-option`/`hyper`/`left-command` tap-hold dict | `{trigger:{keys,modifiers}, cases:[{phase:"hold", do:[…]}]}` (release passes through) |
| `left-command`/`shift`/`escape` multi-tap | `{trigger:{keys}, cases:[{phase:"release",…},{phase:"hold",…},{tapCount:2,phase:"hold",…}], multiTap:{…}}` |
| `ctrl-escape` (tap-alone-hold) | `{trigger:{keys,modifiers}, cases:[{phase:"release",…},{phase:"hold",…}], timing:{aloneMs}}` (see §8) |
| `hyper`/`right-option` launcher | `{trigger:{keys,modifiers:vmCOCS}, cases:[{phase:"press", do:[action]}]}` ×N |
| `simultaneous` | `{trigger:{keys:[j,k],order:{…}}, cases:[{phase:"hold",…}]}` |
| `enter-equals` (conditional-tap-hold) | **two** bindings (different descriptions); each `{trigger:{keys}, conditions:[{app:Excel}], cases:[{phase:"hold",…},{phase:"release",…}]}` |
| `passwords` (conditional-action) | one binding, `cases:[{phase:"press",conditions:[…secure…],do:[…]},{phase:"press",conditions:[…non-secure…],do:[…]}]` |
| `cmd-q` (double-tap-guard) | specialized builder (§5) — press-firing second tap ≠ multiTap's release-firing |
| `disabled-shortcut` | `{trigger:{keys,modifiers}, cases:[{phase:"press", do:[{noop}]}]}` |
| `caps-lock` (modifier-chord) | `kind:"modifierChord"` specialized (base + variants + trackVar) |
| `escape` reset | specialized reset builder |

## 5. Specials (deliberately not forced into cases)

- **`modifierChord`** (caps-lock) — variants change the *trigger* (add a modifier to caps_lock), not the action-condition; a case can't alter its own trigger, and splitting into 16 bindings would break byte-identity (one rule → 16). Distinct kind.
- **`guard`** (cmd-q) — its second tap fires on *press* (`to`), unlike multiTap's release-firing second tap, so it uses a dedicated var-dance builder rather than the cases model.
- **`reset`** (escape) — not a binding; a global var-reset manipulator.
- **noop vs vk_none** — noop omits `to`; vk_none is a key event (§3.3).

## 6. Phasing (each phase independently byte-identical)

1. **Engine primitives + builders.** Create the primitive types (`Phase`, `Condition`, `Case`, `Binding`, `Trigger`) and the builders (`remap`, `tapHold`, `multiTap`, + `modifierChord`/`reset` specials) backed by the existing core primitives. Rewrite every keyboard generator as a thin adapter that translates its bespoke config into a `Binding`/cases and calls the builders. **Definitions untouched** — every generator keeps its exported name, signature, and config type so `definitions/*.ts` and `src/index.ts` compile and behave identically. Gate: `git diff karabiner-output.json` empty.
2. **`defineBindings`.** The single entry point: `defineBindings(bindings: Binding[]): Rule[]`, built on the builders. Coexists with the adapters.
3. **Proof migration.** Convert `home-end.ts` from `SimpleRemapMapping[]` + `generateSimpleRemapRules` to `Binding[]` + `defineBindings`. Gate: diff empty.
4. **(Follow-on)** Migrate remaining keyboard definitions one file per commit; delete dead generators; mouse unification via `{pointer}` triggers.

## 7. Scope of this round

**In scope:** Phase 1 (primitives + builders + all keyboard generators as adapters), Phase 2 (`defineBindings`), Phase 3 partial (migrate `home-end.ts`).

**Out of scope:** `mouse-rules.ts`/`core/mouse.ts` (trigger's `pointer` form reserved only); remaining ~11 keyboard definition files (follow-on); `escape-rule.ts`/`layer-emit.ts`/`device-config.ts` (already standalone).

## 8. Risks & decisions

1. **tap-alone-hold manipulator description — DECIDED: normalize.** Today's `tap-alone-hold-rules` sets a manipulator-level `description`; the `tapHold` builder does not (verified: single-key 'a' has no `description`, ctrl-escape does). It is behavior-irrelevant UI metadata. **Decision: drop it** — the tap-hold builder stays uniform; ctrl-escape's manipulator loses its `description` key (one manipulator changes in the golden file; no behavior change). This is the single intentional deviation from strict byte-identity, made in service of standardization.
2. **Per-arm byte-identity.** Each adapter must reproduce its generator's exact manipulator (key order, condition push order, parameter keys). The rebuild-and-diff loop after each generator conversion is the safety net; drift is localized to one arm.
3. **Merge-rule ordering.** When cases merge into one manipulator, channel-fill order (`to` before `to_if_alone` etc.) and condition-array order must match what today's per-generator code emits. Verified per-generator by diff.
4. **Default pass-through `halt:true`.** Tap-hold bindings with no explicit release case emit `to_if_alone = [{key_code, halt:true}]` (verified). Builder must replicate exactly.
5. **`simultaneous` to_after_key_up / detect_key_down_uninterruptedly** — carried via `trigger.order` + `afterKeyUp`; no active simultaneous bindings today, so low risk, but the builder must emit the options correctly when present.

## 9. Verification plan

1. Baseline: current `karabiner-output.json` is tracked.
2. Phase 1 generator-by-generator; after each, rebuild (`tsx src/index.ts`) and `git diff karabiner-output.json`. Fix drift before the next.
3. Phase 2: new code, unused — confirm diff still empty.
4. Phase 3: convert `home-end.ts`, rebuild, confirm diff empty (subject to the §8.1 decision).
5. Run `npm test` — all existing `node:test` tests pass.
6. Clean `git diff karabiner-output.json` at end of round = success, except the single §8.1 normalization (ctrl-escape's manipulator loses its `description` key) — the one intentional, behavior-irrelevant deviation.
