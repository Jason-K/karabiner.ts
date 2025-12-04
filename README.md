# Karabiner.ts Configuration

## Source Project

This project is an extension of the node module, Karabiner.ts [Git repo](https://github.com/evan-liu/karabiner.ts). It is a focused, type-safe Karabiner-Elements configuration with small builder utilities and clean layering.

### Upstream Integration

We vendor the upstream Karabiner.ts project for reference and diffing:

- Upstream source, docs, and workflows are mirrored under `../karabiner.ts-upstream/` at the parent repo level.
- Inside this project, upstream assets are copied into safe, non-active locations:
  - Upstream GitHub workflows are stored in `.github/upstream-workflows/` so they do not alter CI by default.
  - Upstream docs are available under `docs/upstream/`.

Our local extensions take precedence over upstream files. When adopting upstream changes, we selectively merge while preserving our `package.json`, build scripts, eslint settings, and source overrides under `src/`.

See `docs/INTEGRATION_CONFLICTS.md` for the current conflict report and diff summary.

## Integration Status

The upstream integration is complete and merged to main. Your local extensions and main config are isolated from upstream, with TypeScript path mapping providing IDE support against the mirrored upstream sources.

- Upstream mirror lives at `../karabiner.ts-upstream/` in the parent repo.
- Local extensions: `src/lib/*.ts` are owned here and marked with LOCAL EXTENSION headers.
- Main config: `src/index.ts` is the authoritative configuration you edit.
- CI: Typecheck, lint, and build run on main.

Daily workflow:

```bash
cd karabiner.ts
npm run build
```

Upstream sync (optional, when you want new features):

```bash
cd ../karabiner.ts-upstream && git pull origin main
cd ../karabiner.ts && npm run typecheck && npm run build
```

Documentation:

- `docs/INTEGRATION_SUMMARY.md` – Architecture overview
- `docs/UPSTREAM_SYNC.md` – Sync workflow
- `docs/MERGE_CHECKLIST.md` – Validation steps

### Local Upstream Mapping

For local development, imports of `karabiner.ts` resolve to the upstream mirror via TypeScript path mapping.

- Config: see `tsconfig.json` `compilerOptions.paths` where `karabiner.ts` and `karabiner.ts/*` point to `../karabiner.ts-upstream/src`.
- Typechecking only: `compilerOptions.noEmit` is enabled alongside `allowImportingTsExtensions` to support upstream’s `.ts` import style without producing build outputs.
- Usage: write local code that imports `karabiner.ts` APIs; the compiler will typecheck against upstream sources in `karabiner.ts-upstream/src`.

This keeps runtime artifacts unchanged while enabling tight local iteration against upstream APIs.

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
# Deploy to Karabiner (edit src/index.ts, change '--dry-run' to 'JJK_Default')
npm run build
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
