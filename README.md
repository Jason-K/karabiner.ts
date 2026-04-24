# Karabiner Config

Personal Karabiner-Elements configuration written in TypeScript with `karabiner.ts`.

## Current Architecture

The config is now split by responsibility:

- `src/mappings`: declarative intent tables only
- `src/generators`: reusable compilers from mapping data to Karabiner rules
- `src/rules`: stateful or exceptional adapters that do not yet fit a shared schema cleanly
- `src/lib`: lower-level helpers, leader-layer internals, and integration utilities
- `src/tests`: mapping- and generator-level regression coverage

The main entrypoint in `src/index.ts` wires these pieces together.

## Declarative Surfaces

The larger mapping-heavy areas extracted during this refactor are now declarative:

- right-option launchers via `src/mappings/right-option-launchers.ts`
- navigation remaps via `src/mappings/navigation.ts`
- disabled shortcuts via `src/mappings/disabled-shortcuts.ts`
- special key holds via `src/mappings/special-key-holds.ts`
- security slash actions via `src/mappings/security-actions.ts`
- space layers via `src/mappings/space-layers.ts`
- tap-hold bindings via `src/mappings/tap-hold.ts`

Space layers and tap-hold mappings now use a shared `ActionSpec` DSL plus central registries for app, folder, Raycast, and CleanShot references.

## Key Files

- `src/mappings/action-dsl.ts`: symbolic action vocabulary used by declarative mappings
- `src/generators/action-resolver.ts`: shared compiler from `ActionSpec` to Karabiner `ToEvent`s
- `src/mappings/apps.ts`: app bundle registry
- `src/mappings/folders.ts`: folder registry
- `src/mappings/raycast.ts`: Raycast command registry
- `src/mappings/cleanshot.ts`: CleanShot command registry
- `docs/DECLARATIVE_CONFIG_PLAN.md`: architecture rules and migration status
- `docs/COMMAND_SERVER_GUIDE.md`: command-server-specific guidance

## Common Commands

```bash
npm run typecheck
npm test
npm run build
npm run check
```

## Documentation

- `docs/DECLARATIVE_CONFIG_PLAN.md`: current mappings/generators/rules taxonomy
- `docs/COMMAND_SERVER_GUIDE.md`: when to use the user command server vs shell commands
- `docs/INTEGRATION_SUMMARY.md`: upstream integration strategy and local extension layout
- `docs/UPSTREAM_SYNC.md`: how to update the upstream mirror safely

## Practical Rule

If a file answers "what should this key do?", it should usually live in `src/mappings`.

If a file answers "how do we turn that declaration into Karabiner JSON?", it should usually live in `src/generators`.

If a file answers "how do we hand-build this unusual behavior that our schemas still do not express?", it belongs in `src/rules`.

---

## Migration Guide: shell_command → Command Server

### When to Migrate

✅ **Good candidates:**

- `open -g 'hammerspoon://...'` calls → Hammerspoon endpoint
- High-frequency operations (layer indicator, notifications)
- Operations that benefit from daemon session state

❌ **Don't migrate:**

- Complex shell pipelines
- Operations needing error handling and feedback
- One-off operations called <5 times/session

### Migration Pattern

**Before (shell_command):**

```typescript
rule("Example").manipulators([
  map("key_x").to(cmd("open -g 'hammerspoon://action?param=value'")).build(),
]);
```

**After (command server):**

```typescript
import { userCommand } from "../../lib/scripts";

rule("Example").manipulators([
  map("key_x")
    .to(
      userCommand("hammerspoon", {
        function: "action",
        args: { param: "value" },
      }),
    )
    .build(),
]);
```

---

## Performance Tuning

### Measuring Latency

Use the `smoke-check` command:

```bash
bash scripts/install-layer-indicator-user-command-server.sh smoke-check
# smoke-check: pass show_ms=49.39 hide_ms=45.71 max_allowed_ms=500.00
```

Or the bundled diagnostic:

```bash
bash scripts/install-layer-indicator-user-command-server.sh observability-bundle
```

### Tuning Thresholds

Override latency limits when installing:

```bash
SMOKE_MAX_LATENCY_MS=1000 bash scripts/install-layer-indicator-user-command-server.sh smoke-check
```

### Why Latency Matters

- Karabiner processes key events with <10ms overhead
- Layer indicator needs to follow visually instantly (<100ms)
- Shell spawn background processes: ~150ms startup + execution
- Command server: ~50ms (daemon already warmth + socket I/O)

---

## Testing Command Server Rules

### Unit Tests

Add tests in `src/configs/folder-opener.test.ts` style:

```typescript
import test from "node:test";
import { strict as assert } from "node:assert";
import { showNotification } from "../lib/scripts";

test("showNotification emits correct payload structure", () => {
  const result = showNotification("Test", { subtitle: "Sub" });
  assert.match(
    JSON.stringify(result),
    /hammerspoon.*showNotification.*function/,
  );
});
```

### Integration Tests

Manually test with:

```bash
# 1. Start command server in background
bash scripts/install-layer-indicator-user-command-server.sh install

# 2. Test individual commands
bash scripts/install-layer-indicator-user-command-server.sh status

# 3. Test with bundled diagnostics
bash scripts/install-layer-indicator-user-command-server.sh observability-bundle
```

### Logging

All commands are logged to:

``` text
~/.config/karabiner/logs/layer-indicator-user-command-server.log
```

Example log line:

``` text
2026-03-19 13:25:57,569 INFO dispatched action=show marker=space_layer_show elapsed_ms=49.39
```

---

## Fallback Behavior

When the command server is unavailable, helpers have configurable fallbacks:

**layer_indicator_command():**

```typescript
// If server is down, falls back to:
cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=${layer}'`);
```

**userCommand() and other endpoints:**

```typescript
// No fallback available; logs warning
console.warn(`userCommand: endpoint 'hammerspoon' requires command server`);
return cmd('open -g "hammerspoon://noop"');
```

To ensure reliability:

1. Test `install-layer-indicator-user-command-server.sh status --json`
2. Verify `socket_present: true` and `loaded: true`
3. Run `observability-bundle` regularly to catch latency regressions

---

## Troubleshooting

### Command server socket not responsive

```bash
# Check status
bash scripts/install-layer-indicator-user-command-server.sh status

# Restart service
bash scripts/install-layer-indicator-user-command-server.sh restart

# View recent logs
tail -f ~/.config/karabiner/logs/layer-indicator-user-command-server.log
```

### High latency (>200ms)

```bash
# Run periodic auto-rotate to keep logs manageable
bash scripts/install-layer-indicator-user-command-server.sh enable-auto-rotate

# Benchmark current state
bash scripts/install-layer-indicator-user-command-server.sh smoke-check

# Check Hammerspoon responsiveness separately:
open -g 'hammerspoon://layer_indicator?action=show&layer=test'
```

### New function not working

1. Verify function is in `allowed_functions` dict
2. Check `observability-bundle` output for errors
3. Validate JSON payload format in rule builder
4. Test manually with curl/socket tool:

   ```bash
   echo '{"endpoint":"hammerspoon","function":"showNotification","args":{"title":"Test"}}' | nc -U /tmp/karabiner-layer-indicator.sock
   ```

---

## Summary: When to Use What

| Operation       | Best Tool                         | Example                                   |
| --------------- | --------------------------------- | ----------------------------------------- |
| Layer show/hide | Command server (fast)             | Space bar indicator                       |
| Notifications   | Command server (user feedback)    | Key macro confirmations                   |
| App focus       | Command server (low frequency ok) | Cmd+Alt+S → Safari                        |
| Clipboard       | Command server (persistent state) | Macro paste templates                     |
| Complex logic   | Shell command                     | Multi-step scripts, conditional execution |
| One-off launch  | Shell command                     | `open -a AppName`                         |
| Error handling  | Shell command                     | Check exit code, conditional flows        |

**Golden rule:** If you're calling Hammerspoon URL schemes from rules, migrate to the command server for better latency and maintainability.
