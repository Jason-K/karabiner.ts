# Karabiner Pattern Notes

Generic lessons about Karabiner-Elements manipulator semantics. These rules apply whenever you reach for a raw manipulator — usually when adding a new engine function in `src/engine/`. Day-to-day work in `src/definitions/` should not need any of this: pick the engine function whose config shape matches and write data.

## Variable Conditions Are Manipulator Gates

`variable_if` and `variable_unless` prevent the **entire** manipulator from firing when their predicate fails. They are not filters on individual `to` events.

- Don't use `variable_unless` to "stop a manipulator from setting a variable twice" — that prevents the manipulator from running at all, and on the second press the variable will never be re-asserted.
- For per-event branching, attach a condition to the individual `to` event (`toKeyCond("left_command", [], {}, [{ type: "variable_if", name: "x", value: 1 }])`), not to the manipulator.

## Manipulators Are Evaluated Bottom-to-Top

Karabiner walks a rule's `manipulators` array from the **last** entry to the first when matching an event. The first matching manipulator wins.

- For double-tap detection, list the variable-guarded "second press" manipulator **after** the variable-setting "first press" manipulator. The bottom-to-top scan then evaluates the double-tap manipulator first; if its variable guard passes, it fires.
- This ordering is the canonical Karabiner pattern (see `change_double_press_of_q_to_escape` in the upstream examples).

## Timing Parameters Belong on the First-Press Manipulator

Two timing parameters control tap/hold/double-tap behaviour:

- `basic.to_if_held_down_threshold_milliseconds` — how long a press must be held before `to_if_held_down` fires
- `basic.to_delayed_action_delay_milliseconds` — how long to wait before `to_delayed_action.to_if_invoked` runs

Both belong on the first-press manipulator only. Adding them to the second (double-tap detector) manipulator creates conflicting timeouts. The second manipulator's job is purely state detection.

## `to_delayed_action` Handles the Single-Tap Fallback

When the user taps a key once and waits past the timeout, `to_delayed_action.to_if_invoked` runs. When the user presses something else first (a chord) or releases quickly, `to_if_canceled` runs instead. This is how the "lazy modifier" / "tap to emit, hold to act" patterns close out:

- emit the original key from `to_if_invoked` (gated on a variable so the double-tap manipulator can suppress it)
- mirror the same emit in `to_if_canceled` for the release-before-threshold case
- clear the tracking variable in both branches

## `lazy: true` Lets Modifiers Compose with Chords

Setting `lazy: true` on a modifier `to` event delays the emit until another key actually needs that modifier.

- If a second key is pressed while the modifier is held, the modifier becomes active for that chord.
- If nothing follows, `to_delayed_action` decides whether to emit the modifier back as a bare key.

This is the mechanism that lets a single key behave as both a pass-through modifier and a tap/double-tap trigger.

## Hold Cleanup with `to_after_key_up`

For "press to emit X-down, release to emit X-up" patterns:

- emit `X` down inside `to_if_held_down`, and set a tracking variable in the same array
- emit `X` up inside `to_after_key_up`, gated on the tracking variable so it only fires when the hold path was taken
- clear the variable in the same `to_after_key_up` block

Without the variable guard, `to_after_key_up` would fire on every release — including taps that never triggered the hold.

## Always Check Karabiner's Official Examples First

The [typical complex modifications examples](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/) encode patterns that have been validated against Karabiner's evaluation model. When a custom builder produces unexpected behaviour, expand back to raw JSON, compare against the closest official example, and fix the divergence.

## Debug with EventViewer

Karabiner's EventViewer shows variable state changes in real time.

- If a variable never appears, the manipulator that should set it failed its conditions — usually a `variable_if`/`variable_unless` guard or a frontmost-app condition.
- If a variable appears and disappears faster than expected, check the timeout parameters and `to_after_key_up` cleanup.
- Variable lifetimes are easier to reason about when their names are explicit (`guard_cmd_q`, `multi_tap_left_command`) rather than generic.

## State Discipline

Each additional variable widens the state space and makes failure modes harder to enumerate.

- Prefer engine functions that auto-derive variable names from the trigger key (`generateDoubleTapGuardRule`, `generateMultiTapRule`) so two rules cannot accidentally collide.
- Reserve `trackVar` (and similar explicit fields) for cases where the variable is observed elsewhere — for example a hyper chord whose state another rule reads.

## References

- [Karabiner-Elements official examples](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/)
- [Double-press pattern](https://karabiner-elements.pqrs.org/docs/json/typical-complex-modifications-examples/#change-double-press-of-q-to-escape)
- [Complex modifications manipulator definition](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/)
- [`to_delayed_action` reference](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to-delayed-action/)

## Leader Layer Architecture

`generateLayerRules` (`src/core/leader/build.ts`) is fully generic. Space is not a special case — it is simply the `leaderKey` wired at the call site in `src/index.ts`. The builder has no knowledge of space.

`generateLayerRules(layerConfigs, options)` accepts:

| Option              | What it controls                                                       |
| ------------------- | ---------------------------------------------------------------------- |
| `leaderKey`         | The key that activates the leader layer (`space_bar` in current config) |
| `layerPrefix`       | Prefix for Karabiner variable names (e.g. `space_`)                    |
| `leaderLabel`       | Display label for the Hammerspoon layer indicator                       |
| `indicatorRootLayer`| Hammerspoon indicator root layer name                                  |
| `leaderHoldEvents`  | Events emitted while the leader is held without a sublayer selection   |
| `debugSwallowedKeys`| Whether to log swallowed keys to a file                                |
| `debugLogPath`      | Path for the debug log                                                 |

`src/index.ts` provides all space-specific values at the call site. The leader internals are unaware of them.

### Adding a Second Leader Layer

Because the builder is fully generic, a second leader layer requires nothing more than a second call with different options:

```typescript
// Space leader (existing)
const spaceLayers = generateLayerRules(spaceLayerConfigs, {
  leaderKey: "space_bar",
  layerPrefix: "space_",
  leaderLabel: "SPACE",
  indicatorRootLayer: "space_root",
});

// Tab leader (example — system/media actions)
const tabLayers = generateLayerRules(tabLayerConfigs, {
  leaderKey: "tab",
  layerPrefix: "tab_",
  leaderLabel: "TAB",
  indicatorRootLayer: "tab_root",
});
```

Both can coexist in the same `rules` array in `src/index.ts`. Variable namespacing (via `layerPrefix`) ensures no collisions between leader layers.

### Module Structure

```text
src/core/leader/
├── types.ts    — LayerMappingConfig, NestedLayerConfig, SubLayerConfig, LayerRuleOptions
├── runtime.ts  — Variable naming helpers, escape reset construction, all-sublayer-var derivation
├── build.ts    — generateLayerRules() — the single assembly entry point
└── index.ts    — Barrel exports
```

The space-specific values (`SPACE_LAYER_LEADER_KEY`, `SPACE_LAYER_PREFIX`, etc.) live in `src/data/space-layer.ts` and are imported by `src/index.ts`. They are not part of the leader module.
