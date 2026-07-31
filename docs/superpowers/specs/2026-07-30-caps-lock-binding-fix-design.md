# Caps Lock Binding Fix — Design (revised)

**Date:** 2026-07-30
**Status:** Draft → pending approval (revised after receiving the known-good rule)
**Scope:** `src/definitions/caps-lock.ts` + a small, opt-in engine flag in
`src/engine/binding.ts`. Caps-lock is the only affected rule.

## Problem

`caps-lock.ts` was converted from bespoke engine logic
(`generateModifierChordRules`) into `Binding[]`. The tap functionality broke.

## Evidence: known-good vs current

The user supplied the **known-good** rule. The base manipulator there is:

```jsonc
{
  "from": { "key_code": "caps_lock" },
  "to": [
    { "set_variable": { "name": "caps_lock_pressed", "value": 1 } },
    { "key_code": "left_command", "modifiers": ["left_option","left_control","left_shift"] }
  ],
  "to_after_key_up": [ { "set_variable": { "name": "caps_lock_pressed", "value": 0 } } ],
  "to_if_alone": [
    { "key_code": "f15", "modifiers": ["left_command","left_option","left_control","left_shift"] }
  ]
  // NOTE: NO to_delayed_action, NO to_if_held_down
}
```

The **current** binding output's base manipulator is identical **except** it adds:

```jsonc
"to_delayed_action": {
  "to_if_invoked": [],
  "to_if_canceled": [ { "key_code": "f15", "modifiers": ["command","option","control","shift"] } ]
}
```

Two discrepancies:

| # | Current | Known-good | Impact |
| - | -- | -- | -- |
| 1 | `to_delayed_action` **present** (with `to_if_canceled: [f15+COCS]`) | **absent** | **Functional bug** — see below |
| 2 | generic modifier tokens (`option`,`control`,`shift`) | `left_`-prefixed (`left_option`,...) | Cosmetic; byte-difference only |

(Note: the modifier belongs in `to` and fires on key-down in **both** versions — that is intentional
bespoke behavior, not the bug. The held modifier stays asserted until key-up.)

### Why discrepancy #1 breaks the tap

A plain `map(caps).to(mod).toIfAlone(combo)` manipulator has **no delayed
action**. Its tap lifecycle is simple: key-down asserts COCS in `to` → clean
key-up → `to_if_alone` fires `f15+COCS`. The COCS from `to` releases on key-up
and is re-asserted by `to_if_alone`; the brief lift-and-repress is invisible to
Hammerspoon.

`tapHold()` in `src/core/tap-hold.ts:148` **always** calls `m.toDelayedAction(...)`.
Adding `to_delayed_action` engages Karabiner's hold/cancel state machine: the
tap no longer resolves through a clean `to_if_alone` path, and the f15+COCS
handoff to Hammerspoon breaks. There is no existing flag to produce a
delayed-action-free tap-hold manipulator (`suppressCancelFallback` empties
`to_if_canceled` but leaves the `to_delayed_action` wrapper).

## Design

Two changes:

### 1. Engine: opt-in `modWhileDown` mode for `buildKeyTapHold`

Add a binding-level flag: `modWhileDown?: boolean`. **Defaults to `false`** when
omitted — every binding that doesn't set it is untouched, so no existing rule
is affected. Caps-lock is currently the only `press`+`release` (no `hold`)
binding and the only legitimate consumer.

When `modWhileDown` is `true`, `buildKeyTapHold` emits a single manipulator with
exactly:

- `to` — var=1 (from `whileHoldVar`) + the held-modifier events (`pressDo`, since
  for caps the held modifier routes through `to`)
- `to_after_key_up` — var=0 (from `whileHoldVar`)
- `to_if_alone` — the `releaseDo` (the tap combo)
- **NO** `to_delayed_action`, **NO** `to_if_held_down`

This is built directly with `map()` (like `buildRemap`), bypassing `tapHold()` —
no timer state machine. This reproduces the bespoke `map().to().toIfAlone()`
shape byte-for-byte.

The name reflects the mechanism: the emitted modifier is asserted while the key
is physically down (immediate, in `to`, no hold threshold), distinct from the
threshold-gated `hold` phase.

### 2. Definition: rewrite `caps-lock.ts` to use the flag + `left_` modifiers

```ts
export const capsLockBindings: Binding[] = [
  bind(
    from("caps_lock"),
    to(
      press(key("left_command", ["left_option", "left_control", "left_shift"])),
      release(key("f15", ["left_command", "left_option", "left_control", "left_shift"])),
    ),
    options({
      modWhileDown: true,
      whileHoldVar: { name: "caps_lock_pressed", varDesc: "Caps lock pressed" },
    }),
  ),
  // variants unchanged in behavior; use left_ modifiers for byte-parity
  bind(from("caps_lock", ["left_shift"]),
       to(press(key("left_command", ["left_option", "left_control"])))),
  // ... (all 15 variants, identical logic, left_ tokens)
];
```

`modWhileDown: true` + the existing `press`/`release` phases produce the known-good
shape directly: `to` (var=1 + left_command+_OCS), `to_after_key_up` (var=0),
`to_if_alone` (f15+COCS), no delayed action.

## Expected output (base) — matches known-good

```jsonc
{
  "type": "basic",
  "from": { "key_code": "caps_lock", "modifiers": { "optional": [] } },
  "to": [
    { "set_variable": { "name": "caps_lock_pressed", "value": 1 } },
    { "key_code": "left_command", "modifiers": ["left_option","left_control","left_shift"] }
  ],
  "to_after_key_up": [ { "set_variable": { "name": "caps_lock_pressed", "value": 0 } } ],
  "to_if_alone": [
    { "key_code": "f15", "modifiers": ["left_command","left_option","left_control","left_shift"] }
  ]
}
```

## What is NOT changing

- The 16 variant manipulators stay plain remaps (`from` + mandatory mods → `to`).
  Only their modifier tokens switch to `left_` form.
- `whileHoldVar` / `caps_lock_pressed` semantics unchanged.
- All other rules — `modWhileDown` defaults to `false` when omitted.

## Verification

1. `npx tsx src/index.ts` regenerates `karabiner-output.json`.
2. The `[⇪]` base manipulator has: `to`, `to_after_key_up`, `to_if_alone`,
   `from`, `type` — and **no** `to_delayed_action`.
3. Modifier tokens are `left_`-prefixed.
4. Variants remain plain remaps.
5. `npx tsx --test src/tests/*.test.ts` stays green (pre-existing unrelated
   "Missing tap-hold rules" failure excepted).
6. Add a structural test asserting the base caps manipulator omits
   `to_delayed_action`.

## Risk

Low-moderate. The engine flag is opt-in (`modWhileDown` defaults to `false`)
and isolated to `buildKeyTapHold`'s `modWhileDown` branch; it cannot affect
bindings that don't set it. The definition change is mechanical. Caps-lock is
the sole consumer and the sole press+release-no-hold binding.
