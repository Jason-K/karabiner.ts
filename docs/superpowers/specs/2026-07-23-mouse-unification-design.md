# Mouse Unification — Design

**Date:** 2026-07-23
**Branch:** `refactor_engine`
**Status:** Design (pending user review)
**Supersedes:** the "mouse unification = task 9, its own sub-project" deferral in the auto-derived-descriptions spec §13.

## 1. Goal

Bring the mouse under the same `Binding[]` + `defineBindings` paradigm as the keyboard. Today the mouse is a parallel universe: `data/mouse.ts` config types, `core/mouse.ts` (`g502xButtons`, `resolveMouseButton`, `mouseTapHold`, `mouseVarTapTapHold`), and a bespoke `engine/mouse-rules.ts` that builds manipulators with device-scoping, prepended override manipulators, and button-specific tweaks. After this work, mouse bindings are plain `Binding[]` literals and flow through the same `defineBindings` engine as keys.

## 2. The reframe (why this is tractable)

A mouse binding is **not architecturally distinct** from a keyboard binding:

- A device is just a `device_if` **condition**.
- A mouse button is just a `pointing_button` in the `from` event instead of a `key_code`.
- Overrides (`{when, to}`) are just **conditional cases** — `defineBindings`' `groupByConditions` already emits one manipulator per condition-group, which is exactly what `mouse-rules.ts` does by hand.
- The wheel-left/right guards are just `variable_unless` **conditions**.

The bespoke engine is accidental complexity from the old config model. Two small mechanism extensions are genuinely mouse-specific (chord-modifier variable signaling, and one cancel-fallback suppression); everything else is declaration, not engineering.

## 3. Button registry (replaces `g502xButtons`)

A new registry in `data/mouse.ts`, modeled on `MOD_COMBO` but with device scope (modifiers are universal; buttons aren't):

```ts
export type DeviceName = keyof typeof DEVICE_IDENTIFIERS; // from data/devices.ts (Phase 1)

export type ButtonSpec = {
  button: PointingButton;                 // raw karabiner pointing_button, e.g. "button5"
  nameScope: "global" | DeviceName[];     // where this button physically exists (truthful)
  desc: string;                           // human label for the synthesizer, e.g. "Left click"
};

export const buttons = {
  // Physically standard (exist on most pointing devices) → global. Bindings
  // that must restrict them add an explicit `device` condition (see §4).
  left:       { button: "button1",  nameScope: "global", desc: "Left click" },
  right:      { button: "button2",  nameScope: "global", desc: "Right click" },
  middle:     { button: "button3",  nameScope: "global", desc: "Middle click" },
  wheel:      { button: "button3",  nameScope: "global", desc: "Wheel click" }, // scroll-wheel-as-button == middle
  back:       { button: "button4",  nameScope: "global", desc: "Back button" },
  // G502X-specific extra buttons → auto-scope to the G502X.
  shift:      { button: "button5",  nameScope: ["logitechG502X"], desc: "Shift button" },
  forward:    { button: "button6",  nameScope: ["logitechG502X"], desc: "Forward button" },
  wheelLeft:  { button: "button7",  nameScope: ["logitechG502X"], desc: "Wheel left" },
  wheelRight: { button: "button8",  nameScope: ["logitechG502X"], desc: "Wheel right" },
  middleBack: { button: "button9",  nameScope: ["logitechG502X"], desc: "Middle-back (G9)" },
  leftForward:{ button: "button10", nameScope: ["logitechG502X"], desc: "Left-forward (G8)" },
  leftBack:   { button: "button11", nameScope: ["logitechG502X"], desc: "Left-back (G7)" },
} as const satisfies Record<string, ButtonSpec>;

// Fallback labels for RAW pointing_buttons referenced without an alias.
export const defaultButtonNames: Record<string, string> = {
  button1: "Left click", button2: "Right click", button3: "Middle click",
  // …add as needed; unknown raw buttons fall back to the button id itself.
};
```

`DEVICE_IDENTIFIERS` (Phase 1 `DeviceSpec`s) already holds `product_id`/`vendor_id` — that **is** the device registry; no new `device_names` needed. `core/mouse.ts`'s `g502xButtons` + `resolveMouseButton` are deleted. `nameScope` stays **truthful** (physical existence), not a device-restriction trick. Global entries are the default names; device-scoped entries are the per-device overrides.

## 4. Trigger + device scope (the agreed design)

A binding references a button by alias; the engine resolves it **and derives the device condition from `nameScope`**:

```ts
{
  trigger: { pointer: "shift" },     // alias; resolves to button5
  cases: [ { phase: "hold", do: [...] }, ... ],
}
```

- **Resolution**: `triggerToFrom` looks up `buttons[trigger.pointer]`; if found, `from.pointing_button = spec.button`; else treat `trigger.pointer` as a raw `pointing_button` (back-compat).
- **Device condition derived for device-specific buttons**: when `spec.nameScope` is a device list, `defineBindings` adds a `device_if` condition covering those devices' identifiers to every manipulator the binding produces. So `pointer: "shift"` → `button5` + `device_if(G502X)` automatically.
- **Standard/global buttons do NOT auto-scope**: `nameScope: "global"` adds no device condition (truthfully — the button exists everywhere). Bindings that use a global button but must be device-restricted add an **explicit `device` condition**. This is how the G502X config's standard-button rules (left/right/back/forward/wheel) preserve today's device-scoping: each carries `conditions: [{ device: logitechG502X }]`.
- **Explicit device condition**: implement `Condition`'s reserved `device` arm — `{ device: DeviceSpec; unless?: boolean }` → `ifDevice([spec.product_id/vendor_id])` (or `.unless()`).

Net: device-specific buttons (the bulk of the G502X mappings) auto-scope with zero boilerplate; the handful of standard-button G502X bindings state their device condition explicitly. `nameScope` stays truthful (physical existence); device restriction for global buttons is an explicit condition, not a nameScope trick.

## 5. Variables & signaling — `setVar` action + `Binding.whileHoldVar`

**`setVar` as a first-class action** (new `ActionSpec` variant; useful beyond mouse):

```ts
| { type: "setVar"; var: VarSpec; value?: number | string | boolean; toggle?: boolean }
```

Resolves to a `set_variable` to-event (default value `1`). `toggle` flips the stored value. Usable in any case's `do`.

**Timing is by channel, not a field on the action.** Phases already route to Karabiner channels — `press`→`to` (key-down), `release`→`to_if_alone`, `hold`→`to_if_held_down` — and `Binding.afterKeyUp` (already present) routes to `to_after_key_up` (key-up). So "set 1 on down, 0 on up" is a press-case `do: [setVar(1)]` + `afterKeyUp: [setVar(0)]`. This composes with every action type.

**`Binding.whileHoldVar`** — purpose-built shortcut for the one lifecycle channel-placement can't reach: a *tap-hold* chord-modifier (e.g. the right button) needs its signaling variable set on key-**down** (before the hold threshold), but the tap-hold `to`/key-down channel isn't exposed as a case phase (`buildTapHold` uses alone/hold). `core/tap-hold.ts`'s `tapHoldFrom({ variable })` already implements this exactly (`m.to(toSetVar(variable, 1))` on down + `m.toAfterKeyUp(toSetVar(variable, 0))` on up), and it reproduces today's mouse output. So:

```ts
export type Binding = {
  // …existing fields…
  whileHoldVar?: VarSpec;   // tap-hold chord-modifier: set 1 on key-down, 0 on key-up
};
```

`buildTapHold` passes `variable: b.whileHoldVar?.name` through. The mouse's signaling variables become `VarSpec`s (describable): `rightButtonPressed`, `wheelDown`, `leftButtonPressed`, `leftWithRightFirstTap`. Existing `Condition.var` reads them (e.g. an override case `{ var: rightButtonPressed, equals: 1 }`). `setVar` covers ad-hoc signaling in non-tap-hold bindings; `whileHoldVar` covers the tap-hold case. Both kept rather than distorting the tap-hold model.

## 6. Suppression

Karabiner semantics: a manipulator's `to` **replaces** the `from` event — so a `setVar`-only or empty `do` already **swallows the original trigger** (it's never re-emitted). Suppression is therefore the default whenever you don't explicitly re-emit the trigger. `setVar` inherently suppresses (it *is* the `to`).

Two explicit levers for the cases where the default doesn't do what you want:

- **`suppress?: boolean` on `Binding` + `Case`** — forces that channel to emit only `do` (no trigger fallback). Mainly affects tap-hold's default-alone pass-through (a binding with only a `hold` case normally passes the key through on tap; `suppress` drops that). On a `Case`, means "this case's channel emits `do`, never the trigger as a fallback."
- **`Binding.suppressCancelFallback?: boolean`** — clears `to_delayed_action.to_if_canceled` for a chord-modifier button, so a canceled hold doesn't leak a stray click (today's `button === "right"` special case). Defaults off.

Defaults: `suppress` off, `suppressCancelFallback` off. Keys rarely need either; buttons-as-modifiers do.

## 7. wheel-left/right guards → declared conditions

`mouse-rules.ts` imperatively injects `variable_unless(wheel_down, 1)` + `variable_unless(right_button_pressed, 1)` onto wheel-left/right manipulators. Under `Binding[]` these are just **conditions authored on the relevant cases** (or hoisted `conditions` on the binding). No engine special-casing.

## 8. Double-tap (left button) → `multiTap` binding

The left-button `doubleTap` mapping (right-button-held + left: single tap / single-tap-hold / double tap, split Zen vs non-Zen) becomes one `multiTap` binding with hoisted + per-case conditions — the user's target shape:

```ts
{
  trigger: { pointer: "left" },
  conditions: [{ var: rightButtonPressed, equals: 1 }],   // only while right button is held
  multiTap: { allowPassThrough: false },
  cases: [
    // single tap (Zen / non-Zen variants), single-tap-hold, double-tap — each a
    // condition-split case:
    { tapCount: 1, phase: "press", conditions: [{ app: zen }], do: [/* … */] },
    { tapCount: 1, phase: "press", conditions: [{ app: zen, unless: true }], do: [/* … */] },
    { tapCount: 1, phase: "hold",  conditions: [{ app: zen }], do: [/* … */] },
    // … double-tap cases at tapCount 2 …
  ],
}
```

Phase mapping (the `press` phase is the `to`/key-down channel): `immediateSingleTap`→press(tap1), `hold`→hold(tap1), `doubleTap`→press(tap2), `doubleTapHold`→hold(tap2). `firstTapPendingVar` maps to the multi-tap var-dance (`defineBindings`' multiTap arm).

**Plan-level open item:** the **delayed single tap** — the variant that fires after the double-tap timer expires without a second tap (`to_delayed_action.to_if_invoked`) — doesn't map cleanly to press/release/hold. Pinning its exact case expression (a phase hint, e.g. `phase: "delayedTap"`, or a small multiTap extension) is deferred to the plan; the case shape above is the target.

## 9. Descriptions

Mouse rule descriptions auto-derive via the Phase 2 synthesizer.

- **Button labels**: the synthesizer renders a `pointer` trigger using `ButtonSpec.desc` (resolved via the alias name), falling back to `defaultButtonNames` for raw `pointing_button`s, then to the button id. So `[Left click]:` rather than `[button1]:`.
- **Device**: the bespoke engine's `${device.name}: ` prefix is dropped from the rule description; the device appears as the manipulator's `device_if` and surfaces in the slice-label (the synthesizer renders a device condition as `on <deviceDesc>` / `not on <deviceDesc>` once `Condition.device` is implemented).
- `integration.test.ts`'s standardization regex already accepts the synthesized format; mouse rules will conform.

## 10. Engine changes (summary)

- `ActionSpec` + `action-resolver`: add the `setVar` variant; resolve it to a `set_variable` to-event (`value`/`toggle`). `Binding.afterKeyUp` already routes actions to `to_after_key_up`.
- `triggerToFrom`: resolve `pointer` alias via `buttons` registry → raw `pointing_button`.
- `defineBindings` / `buildManipulators`: for a pointer binding, add the `nameScope`-derived `device_if` condition(s) to each manipulator.
- `buildTapHold` / `buildRemap`: forward `whileHoldVar` (→ `variable`); honor `Binding.suppress` / `Case.suppress` (no trigger fallback) and `Binding.suppressCancelFallback` (clear `to_if_canceled`).
- `resolveCondition`: implement the `device` arm (`ifDevice`).
- `description-synthesizer`: render `Condition.device` (`on <deviceDesc>` / `not on <deviceDesc>`); render a `pointer` trigger via `ButtonSpec.desc` / `defaultButtonNames`.

## 11. Files deleted / dissolved

- `core/mouse.ts`: `g502xButtons`, `resolveMouseButton`, `mouseTapHold`, `mouseVarTapTapHold` — absorbed by the registry + `defineBindings`. (`MouseButtonMap`/`MouseButtonAlias` types go too.)
- `engine/mouse-rules.ts`: `buildMouseDeviceRules`/`buildMouseRules` + all the bespoke builders — replaced by `defineBindings(mouseBindings)`.
- `data/mouse.ts` config types (`MouseMapping` union, `MouseCondition`, `MouseDeviceConfig`, `MouseTapHoldMapping`, etc.) — replaced by `Binding`/`Case`/`Condition` + the `buttons` registry. (`WIN_ACTIVATE_UNDER_CURSOR` and the rectangle event helpers stay; they're just `ToEvent`s.)

## 12. Gate

Behavior-identical, verified by the description-agnostic structural diff (strip `ruleDescription` + manipulator `description`, compare). The migrated mouse rules must produce the same `from`/`to*`/`conditions`/`parameters` as today (device conditions, override manipulators via condition-grouping, wheel guards, cancel suppression). Manipulator **count and ordering** should match because `groupByConditions` mirrors the current per-override-prepend structure; if any reordering occurs it must be shown behavior-neutral (distinct triggers / non-overlapping conditions). Descriptions change freely (auto-derived).

## 13. Out of scope / deferred

- **Multi-device button-name collisions**: the `buttons` shape maps one name → one raw button + scope. If a future device reuses a name for a different raw button, that needs disambiguation (separate names or a per-device registry) — not today's problem (one device).
- **`simultaneous` mouse mappings** (`MouseSimultaneousMapping`): the G502X config currently has none live; the `simultaneous` arm of the bespoke engine can be dropped or ported minimally. Decide in the plan.
- **`mouseRemap` mappings**: simple button→button remaps; become plain `press`-case bindings. Straightforward.
- Leader layer + the §13 specials (caps-lock, double-tap-guard, conditional-tap-hold, escape-rule) remain on `formatRuleDescription` — untouched.
