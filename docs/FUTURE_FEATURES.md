# Future Features

This document tracks unimplemented Karabiner-Elements capabilities that may be worth adding. Items are ordered by implementation priority.

---

## Medium Priority

### Auto-Clear Active Leader After Idle

**Karabiner feature:** `set_variable` with `expression` + `system.now.milliseconds` (v15.6.0)

**Problem:** If the space leader is activated and the user walks away, the layer stays active indefinitely.

**Solution:** Record the activation timestamp with `setVarExpr`, then conditionally auto-clear the layer if enough idle time has elapsed:

```typescript
// On leader activation, record timestamp
setVarExpr('space_activated_at', '{{ system.now.milliseconds }}')

// In a periodic or next-keypress check, clear if idle > 5 seconds
exprIf('{{ system.now.milliseconds - space_activated_at > 5000 }}')
```

**Implementation note:** The `setVarExpr` and `exprIf` builders already exist in `src/lib/builders.ts`. The main change is wiring the timestamp into the leader activation manipulator.

---

### Additional Leader Layers

**Background:** `generateLayerRules` is fully generic. Any key can be a leader (see [INSIGHTS.md — Leader Layer Architecture](./INSIGHTS.md)).

**Potential use case:** A `tab` leader for system/media actions (sleep, cursor jump, app history navigation) that is conceptually separate from the space "apps and folders" leader.

**Implementation:** Add a second `generateLayerRules` call in `src/index.ts` with a new set of `SubLayerConfig` entries and distinct `leaderKey`/`layerPrefix`/`indicatorRootLayer` values.

---

## Low Priority

### Integer/HID Value Matching (v15.6.0)

**Karabiner feature:** `integer_value` in `from` event definitions.

**Use case:** Map raw HID usage codes from vendor-specific devices — USB foot pedals, programmable macro pads, or buttons that don't emit standard key codes.

**Implementation:** Add `integerValue?: number` to the `from` event type in the upstream-adjacent builders. This is primarily useful if a foot pedal or specialty input device is added to the workflow.

---

### Extended Mouse Button Support (v15.6.0)

**Karabiner feature:** Mouse buttons 33–255 now supported (previously capped at button1–button32).

**Use case:** Multi-button mice, pen tablet side buttons, or gaming mice with many programmable buttons.

**Current status:** The config maps no mouse buttons beyond standard. This is a no-op until a device with extended buttons is in use.

---

## Reference

- [Karabiner-Elements release notes](https://karabiner-elements.pqrs.org/docs/releasenotes/)
- [set_variable expression docs](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/set-variable/)
- [expression_if / expression_unless conditions](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/conditions/expression/)
