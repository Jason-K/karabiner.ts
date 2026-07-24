# Trigger Optional vs Mandatory Modifiers — Design

**Date:** 2026-07-24
**Branch:** `refactor_engine`
**Status:** Deferred — design captured for a later implementation date.

## 1. Problem

`Binding` triggers only emit `from.modifiers.mandatory`. A trigger like
`{ keys: ["escape"], modifiers: ["left_shift"] }` requires `left_shift` to be held —
the manipulator does not fire at all without it. There is no way to express
**optional** modifiers, which Karabiner supports via `from.modifiers.optional`:

- **mandatory** — the manipulator fires *only* when these are held; they are stripped from output.
- **optional** — the manipulator fires with or without these; if held, they are **kept** in the output event. If a modifier is *neither* mandatory nor optional, the event is not manipulated.

Karabiner shape:
```json
"from": { "key_code": "escape", "modifiers": { "optional": ["left_shift", "left_control"] } }
```

| Input | Output |
| --- | --- |
| escape | tab |
| left_shift + escape | left_shift + tab (shift kept) |
| left_option + escape | left_option + escape (not manipulated) |

Today `binding.ts` always does `from.modifiers = { mandatory: trigger.modifiers }`
(`triggerToFrom` lines ~130/141, `buildKeyTapHold` ~452, `buildRemap` pointer ~472/499).

## 2. Design options

### Option A — Backwards-compatible object form (recommended)

Widen `trigger.modifiers` to accept either the current array (meaning mandatory) or an explicit object:

```ts
type TriggerModifiers =
  | string[]                                   // shorthand: all mandatory (current behavior)
  | { mandatory?: string[]; optional?: string[] };
```

Usage:
```ts
{ keys: ["escape"], modifiers: ["vmCOCS"] }                       // mandatory (unchanged)
{ keys: ["escape"], modifiers: { optional: ["left_shift"] } }     // optional only
{ keys: ["escape"], modifiers: { mandatory: ["vmCOCS"], optional: ["left_shift"] } }
```

- **Pros:** one field; reads clearly at the call site; mirrors Karabiner's own `{mandatory, optional}` shape; non-breaking (every existing `string[]` stays mandatory).
- **Cons:** the type is a union, so internal consumers must normalize (a small helper `resolveModifiers(m): {mandatory, optional}`).

### Option B — Additive separate field

Keep `modifiers?: string[]` (mandatory) and add `optionalModifiers?: string[]`.

- **Pros:** simplest; zero migration; no union type.
- **Cons:** two fields to remember; diverges from Karabiner's single-`modifiers` shape; easier to mis-author.

**Recommendation: A.** It keeps a single `modifiers` field, is self-documenting at the call site, and tracks Karabiner's vocabulary. The normalization helper is trivial.

## 3. Wiring touchpoints (when implemented)

1. **`binding.ts` `Trigger` type** — widen `modifiers` to `TriggerModifiers` on both arms (`keys` and `pointer`).
2. **Normalize** — add `resolveModifiers(m?: TriggerModifiers): { mandatory: string[]; optional: string[] }`, expanding vm aliases (`resolveModComboAlias`) for both buckets.
3. **`triggerToFrom`** — emit `from.modifiers = { mandatory, ...(optional.length ? { optional } : {}) }` (omit empty buckets).
4. **`buildKeyTapHold`** — the mandatory-mod injection (~line 452) must inject both `mandatory` and `optional` onto each manipulator's `from.modifiers`.
5. **`buildRemap`** (both arms) + **`buildPointerTapHold`** — pass `optional` through to `from`.
6. **`description-synthesizer.ts` `describeTrigger`** — render optional modifiers distinctly, e.g. `[⌘]+(⇧)?+[A]:` (mandatory in brackets, optional in parens with `?`), so descriptions distinguish the two.
7. **Simultaneous triggers** — the `simultaneous` `from` uses `modifiers: { optional: ["any"] }` today; confirm optional-from-modifiers compose with it.

## 4. Gate

Description-agnostic structural diff vs the pre-change output: existing bindings (all-mandatory) must be byte-identical (the `string[]` shorthand normalizes to `{mandatory, optional:[]}` → identical `from.modifiers`). New optional bindings are additive. Add synthesizer + resolver unit tests for the optional path; an integration test that a `{optional:["left_shift"]}` binding produces `from.modifiers.optional: ["left_shift"]`.

## 5. Out of scope

- Per-key mandatory/optional mixing within a simultaneous chord (not needed today).
- `optional: ["any"]` on non-simultaneous triggers (the simultaneous arm already uses it).
