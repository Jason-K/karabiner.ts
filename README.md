# Karabiner.ts Configuration

## ✅ Conversion Complete!

All JSON rules from `src/inputRules.json` have been successfully converted to TypeScript with abstraction helpers.

## Files

- **`src/index.ts`** - All rules converted to TypeScript using abstractions
- **`src/lib/mods.ts`** - Custom modifier definitions (HYPER, SUPER, MEH)
- **`src/lib/builders.ts`** - Helper functions (`tapHold`, `varTapTapHold`, `cmd`)
- **`src/inputRules.json`** - Original JSON (preserved for reference)

## Custom Modifier Definitions

Your local definitions in `src/lib/mods.ts`:
- **HYPER** = `command + option + control`
- **SUPER** = `command + option + control + shift`
- **MEH** = `command + option + shift`

These override upstream defaults and remain stable under your control.

## Build & Deploy

```bash
# Test (dry-run to console)
npm run build

# Deploy to Karabiner (edit src/index.ts, change '--dry-run' to 'JJK_Default')
npm run build
```

## Rules Implemented

### Tap-Hold Keys
# karabiner.ts — Minimal Guide

Focused, type-safe Karabiner-Elements configuration with small builder utilities and clean layering.

## Build

```bash
npm run build   # writes to your Karabiner profile and karabiner-output.json
```

## Where Things Live

- `src/index.ts`: Main rules (tap-hold, space layers, specials)
- `src/lib/builders.ts`: Builders (shell, apps, mouse, notifications, expressions)
- `src/lib/functions.ts`: Generators (tap-hold rules, space layers, escape rule, device updates)
- `src/lib/mods.ts`: Mod constants (`HYPER`, `SUPER`, `MEH`)

## Builders (1-line each + tiny example)

- `cmd(cmd)`: Run a shell command. Example: `cmd("open -b com.apple.Safari")`
- `openApp(opts)`: Native app focus/launch (`bundleIdentifier` | `filePath` | `historyIndex`). Example: `openApp({ historyIndex: 1 })`
- `notify({ message, id? })`: macOS notification. Example: `notify({ message: 'Layer Active', id: 'mode' })`
- `mouseJump({ x, y, screen? })`: Move cursor. Example: `mouseJump({ x: 960, y: 540 })`
- `sleepSystem()`: Sleep the Mac. Example: `sleepSystem()`
- `doubleClick(button?)`: System double-click. Example: `doubleClick()`
- `setVarExpr(name, expr, keyUpExpr?)`: Expression variables. Example: `setVarExpr('uses', '{{ uses + 1 }}')`
- `exprIf(expr)` / `exprUnless(expr)`: Expression conditions. Example: `exprIf('{{ uses > 5 }}')`
- `withConditions(event, conds)`: Attach conditions to a single `to` event. Example: `withConditions(notify({message:'Hi'}), [exprIf('{{ uses<5 }}')])`

## Patterns You’ll Reuse

- Tap-Hold: `tapHold({ key:'x', alone:[toKey('x')], hold:[openApp({...})] })`
- Per-To Conditions: `map('n', HYPER).to([ withConditions(notify({...}), [exprIf('...')]) ])`
- App Toggle: `map('tab', HYPER).to([ openApp({ historyIndex: 1 }) ])`

## Space Layer Enhancements

- Direct events: any mapping may use `toEvents: ToEvent[]` (advanced)
- Usage counters: `usageCounterVar: 'apps_toggle_uses'` auto-increments via expressions
- Activation timestamp: `space_<layerKey>_activate_ms` set on layer entry

Example (Applications layer snippet):

```ts
tab: {
  description: 'Toggle Last App',
  openAppOpts: { historyIndex: 1 },
  usageCounterVar: 'apps_toggle_uses'
}
```

## Guardrails & Notes

- The file `/Library/.../karabiner_environment` sets shell env only; it does not create Karabiner variables. Use `set_variable`/expressions for runtime state.
- Expression support (`set_variable.expression`, `expression_if`) requires Karabiner v15.6.0+.

## Practical Next Steps

- Idle auto-clear example: use `expression_if` comparing `system.now.milliseconds` to `space_<layer>_activate_ms`.
- Consider `integer_value` in `from` (v15.6.0) if you add unusual HID sources.

## Quick Verify

```bash
grep -n "frontmost_application_history_index" karabiner-output.json
grep -n "set_notification_message" karabiner-output.json
grep -n "set_mouse_cursor_position" karabiner-output.json
grep -n "iokit_power_management_sleep_system" karabiner-output.json
```

That’s it—keep `src/index.ts` readable, prefer builders, and iterate.
