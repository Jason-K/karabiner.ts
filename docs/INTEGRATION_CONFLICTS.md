# Integration Conflict Report (upstream vs local)

Date: Wed May 13 09:58:34 PDT 2026

## Summary

Upstream: karabiner.ts-upstream; Local: karabiner.ts

### package.json

```diff
--- ../karabiner.ts-upstream/package.json	2026-05-13 09:58:34
+++ package.json	2026-03-17 21:43:07
@@ -1,44 +1,22 @@
 {
-  "name": "karabiner.ts",
-  "version": "1.36.0",
-  "description": "Karabiner-Elements configuration in TypeScript",
-  "license": "MIT",
-  "author": "Evan Liu",
-  "homepage": "https://github.com/evan-liu/karabiner.ts",
-  "repository": {
-    "type": "git",
-    "url": "git+https://github.com/evan-liu/karabiner.ts.git"
-  },
-  "bugs": {
-    "url": "https://github.com/evan-liu/karabiner.ts/issues"
-  },
-  "type": "module",
-  "files": [
-    "dist"
-  ],
-  "main": "./dist/index.umd.cjs",
-  "module": "./dist/index.js",
-  "types": "./dist/index.d.ts",
-  "exports": {
-    ".": {
-      "import": "./dist/index.js",
-      "require": "./dist/index.umd.cjs"
-    }
-  },
+  "name": "karabiner-config",
+  "description": "karabiner config in karabiner.ts",
   "scripts": {
-    "build": "vite build",
-    "test": "vitest run",
-    "test:coverage": "vitest run --coverage"
+    "build": "tsx src/index.ts && hs -c \"hs.reload()\"",
+    "typecheck": "tsc -p tsconfig.json",
+    "test": "tsx --test src/*.test.ts src/**/*.test.ts",
+    "check": "npm run typecheck && npm run lint && npm run test && npm run build",
+    "update": "npm update karabiner.ts",
+    "lint": "eslint src --ignore-pattern docs --max-warnings=0"
   },
   "devDependencies": {
-    "@ianvs/prettier-plugin-sort-imports": "^4.1.0",
-    "@microsoft/api-extractor": "^7.35.4",
-    "@types/node": "^20.3.1",
-    "@vitest/coverage-v8": "^1.6.0",
-    "prettier": "^3.0.0",
-    "typescript": "^5.1.3",
-    "vite": "^5.2.11",
-    "vite-plugin-dts": "^3.9.1",
-    "vitest": "^1.6.0"
+    "@eslint/js": "^9.39.1",
+    "@types/node": "^20",
+    "eslint": "^9.39.1",
+    "karabiner.ts": "^1.36.0",
+    "karabiner.ts-greg-mods": "latest",
+    "tsx": "^4",
+    "typescript": "^5.9.3",
+    "typescript-eslint": "^8.47.0"
   }
 }
```

### tsconfig.json

```diff
--- ../karabiner.ts-upstream/tsconfig.json	2026-05-13 09:58:34
+++ tsconfig.json	2026-02-26 17:38:16
@@ -1,19 +1,28 @@
 {
-  "compilerOptions": {
-    "module": "ESNext",
-    "target": "ES2021",
-    "lib": ["ES2021"],
-
-    "moduleResolution": "node",
-    "skipLibCheck": true,
-    "noEmit": true,
-
-    "strict": true,
-    "noUnusedLocals": true,
-    "noUnusedParameters": true,
-    "noFallthroughCasesInSwitch": true,
-
-    "allowImportingTsExtensions": true
-  },
-  "include": ["src"]
+    "compilerOptions": {
+        "module": "ESNext",
+        "moduleResolution": "Bundler",
+        "target": "ES2024",
+        "jsx": "react-jsx",
+        "strictNullChecks": true,
+        "strictFunctionTypes": true,
+        "strict": true,
+        "sourceMap": true,
+        "noEmit": true,
+        "allowImportingTsExtensions": true,
+        "baseUrl": ".",
+        "paths": {
+            "karabiner.ts": ["../karabiner.ts-upstream/src/index.ts"],
+            "karabiner.ts/*": ["../karabiner.ts-upstream/src/*"]
+        }
+    },
+    "include": [
+        "src"
+    ],
+    "exclude": [
+        "node_modules",
+        "**/node_modules/*",
+        "docs",
+        "docs/**"
+    ]
 }
```

### README.md

```diff
--- ../karabiner.ts-upstream/README.md	2026-05-13 09:58:34
+++ README.md	2026-04-30 13:19:12
@@ -1,94 +1,278 @@
-# karabiner.ts
+# Karabiner Config
 
-[![License](https://img.shields.io/npm/l/karabiner.ts.svg)](LICENSE)
-[![Coverage Status](https://coveralls.io/repos/github/evan-liu/karabiner.ts/badge.svg)](https://coveralls.io/github/evan-liu/karabiner.ts)
-[![Wallaby.js](https://img.shields.io/badge/wallaby.js-powered-blue.svg?style=flat&logo=github)](https://wallabyjs.com/oss/)
-[![npm](https://img.shields.io/npm/v/karabiner.ts.svg)](https://www.npmjs.com/package/karabiner.ts)
-[![deno module](https://shield.deno.dev/x/karabinerts)](https://deno.land/x/karabinerts)
+Personal Karabiner-Elements configuration written in TypeScript with `karabiner.ts`.
 
-Write [Karabiner-Elements](https://github.com/pqrs-org/Karabiner-Elements) configuration in TypeScript.
+## Current Architecture
 
-> [!NOTE]
-> Use of TypeScript is optional. Config can also be written in JavaScript.
-> Only the basics of JavaScript are needed. Check out my interactive course at [codojo.dev](https://codojo.dev/javascript/basics/hello-world).
+The config is now split by responsibility:
 
-## Why karabiner.ts
+- `src/mappings`: declarative intent tables only
+- `src/generators`: reusable compilers from mapping data to Karabiner rules
+- `src/rules`: stateful or exceptional adapters that do not yet fit a shared schema cleanly
+- `src/lib`: lower-level helpers, leader-layer internals, and integration utilities
+- `src/tests`: mapping- and generator-level regression coverage
 
-`karabiner.ts` is heavily inspired by [Goku](https://github.com/yqrashawn/GokuRakuJoudo). Compared to the edn format, it allows for:
+The main entrypoint in `src/index.ts` wires these pieces together.
 
-- Easier-to-understand TypeScript/JavaScript syntax
-- Strong-typed abstractions and key aliases with IDE support
-- Structured config files instead of one big file
+## Declarative Surfaces
 
-And more features (abstractions)
-([hyperLayer](https://evan-liu.github.io/karabiner.ts/rules/hyper-layer),
-[duoLayer](https://evan-liu.github.io/karabiner.ts/rules/duo-layer),
-[leaderMode](https://evan-liu.github.io/karabiner.ts/rules/leader-mode), ...).
+The larger mapping-heavy areas extracted during this refactor are now declarative:
 
-## Learn More
+- right-option launchers via `src/mappings/right-option-launchers.ts`
+- navigation remaps via `src/mappings/navigation.ts`
+- disabled shortcuts via `src/mappings/disabled-shortcuts.ts`
+- special key holds via `src/mappings/special-key-holds.ts`
+- security slash actions via `src/mappings/security-actions.ts`
+- space layers via `src/mappings/space-layers.ts`
+- tap-hold bindings via `src/mappings/tap-hold.ts`
 
-- [📝 Docs](https://karabiner.ts.evanliu.dev)
-- [🔧 My Config](https://github.com/evan-liu/karabiner-config/blob/main/karabiner-config.ts)
-- [💡 In-the-wild usage](https://github.com/evan-liu/karabiner.ts/network/dependents)
+Space layers and tap-hold mappings now use a shared `ActionSpec` DSL plus central registries for app, folder, Raycast, and CleanShot references.
 
-## Using the Online Editor
+## Key Files
 
-1. Write config in the [online editor](https://karabiner.ts.evanliu.dev/editor).
-2. Copy the generated JSON then [add to Karabiner-Elements](https://karabiner-elements.pqrs.org/docs/manual/configuration/add-your-own-complex-modifications/).
+- `src/mappings/action-dsl.ts`: symbolic action vocabulary used by declarative mappings
+- `src/generators/action-resolver.ts`: shared compiler from `ActionSpec` to Karabiner `ToEvent`s
+- `src/mappings/apps.ts`: app bundle registry
+- `src/mappings/folders.ts`: folder registry
+- `src/mappings/raycast.ts`: Raycast command registry
+- `src/mappings/cleanshot.ts`: CleanShot command registry
+- `docs/DECLARATIVE_CONFIG_PLAN.md`: architecture rules and migration status
+- `docs/COMMAND_SERVER_GUIDE.md`: command-server-specific guidance
 
-> [!NOTE]
-> Importing JSON to Karabiner-Elements is only needed when using the Online Editor.
-> `karabiner.ts` writes to `~/.config/karabiner/karabiner.json` if using with Node.js or Deno.
->
-> > Karabiner-Elements watches ~/.config/karabiner/karabiner.json and reloads it if updated.
+## Common Commands
 
-## Using Node.js
+```bash
+npm run typecheck
+npm test
+npm run build
+npm run check
+```
 
-[![npm](https://img.shields.io/npm/v/karabiner.ts.svg)](https://www.npmjs.com/package/karabiner.ts)
+## Documentation
 
-### Option 1
+- `docs/DECLARATIVE_CONFIG_PLAN.md`: current mappings/generators/rules taxonomy
+- `docs/COMMAND_SERVER_GUIDE.md`: when to use the user command server vs shell commands
+- `docs/INTEGRATION_SUMMARY.md`: upstream integration strategy and local extension layout
+- `docs/UPSTREAM_SYNC.md`: how to update the upstream mirror safely
 
-    npx create-karabiner-config@latest
+## Practical Rule
 
-The default directory name is `karabiner-config`. You can pass another `project-name`:
+If a file answers "what should this key do?", it should usually live in `src/mappings`.
 
-    npx create-karabiner-config@latest [project-name]
+If a file answers "how do we turn that declaration into Karabiner JSON?", it should usually live in `src/generators`.
 
-Then:
+If a file answers "how do we hand-build this unusual behavior that our schemas still do not express?", it belongs in `src/rules`.
 
-1. Write your key mapping in `src/index.ts`.
-2. Set the profile name. Create a new Karabiner-Elements profile if needed.
-3. Run `npm run build`.
+---
 
-To update to the latest version, run `npm run update` (or `npm update karabiner.ts`).
+## Migration Guide: shell_command → Command Server
 
-### Option 2
+### When to Migrate
 
-1. [Download](https://github.com/evan-liu/karabiner.ts.examples/archive/refs/heads/main.zip) (or clone | [fork](https://github.com/evan-liu/karabiner.ts.examples/fork)) the [examples/starter repo](https://github.com/evan-liu/karabiner.ts.examples).
-2. Run `npm install`.
+✅ **Good candidates:**
 
-Then write and build the config same as Option 1.
+- `open -g 'hammerspoon://...'` calls → Hammerspoon endpoint
+- High-frequency operations (layer indicator, notifications)
+- Operations that benefit from daemon session state
 
-### Option 3
+❌ **Don't migrate:**
 
-    npm install karabiner.ts
+- Complex shell pipelines
+- Operations needing error handling and feedback
+- One-off operations called <5 times/session
 
-(or install with `yarn`, `pnpm`, etc) then call `writeToProfile()` from any Node.js script in your preferred way.
+### Migration Pattern
 
-## Using Deno
+**Before (shell_command):**
 
-[![deno module](https://shield.deno.dev/x/karabinerts)](https://deno.land/x/karabinerts)
+```typescript
+rule("Example").manipulators([
+  map("key_x").to(cmd("open -g 'hammerspoon://action?param=value'")).build(),
+]);
+```
 
-In a Deno script file (replace `{version}`):
+**After (command server):**
 
 ```typescript
-import { writeToProfile } from 'https://deno.land/x/karabinerts@{version}/deno.ts'
+import { userCommand } from "../../lib/scripts";
 
-writeToProfile('Default', [
-  // rule(...
-])
+rule("Example").manipulators([
+  map("key_x")
+    .to(
+      userCommand("hammerspoon", {
+        function: "action",
+        args: { param: "value" },
+      }),
+    )
+    .build(),
+]);
 ```
 
-Then run it with:
+---
 
-    deno run --allow-env --allow-read --allow-write {filename}
+## Performance Tuning
+
+### Measuring Latency
+
+Use the `smoke-check` command:
+
+```bash
+bash scripts/install-layer-indicator-user-command-server.sh smoke-check
+# smoke-check: pass show_ms=49.39 hide_ms=45.71 max_allowed_ms=500.00
+```
+
+Or the bundled diagnostic:
+
+```bash
+bash scripts/install-layer-indicator-user-command-server.sh observability-bundle
+```
+
+### Tuning Thresholds
+
+Override latency limits when installing:
+
+```bash
+SMOKE_MAX_LATENCY_MS=1000 bash scripts/install-layer-indicator-user-command-server.sh smoke-check
+```
+
+### Why Latency Matters
+
+- Karabiner processes key events with <10ms overhead
+- Layer indicator needs to follow visually instantly (<100ms)
+- Shell spawn background processes: ~150ms startup + execution
+- Command server: ~50ms (daemon already warmth + socket I/O)
+
+---
+
+## Testing Command Server Rules
+
+### Unit Tests
+
+Add tests in `src/tests/scripts.test.ts` style:
+
+```typescript
+import test from "node:test";
+import { strict as assert } from "node:assert";
+import { showNotification } from "../lib/scripts";
+
+test("showNotification emits correct payload structure", () => {
+  const result = showNotification("Test", { subtitle: "Sub" });
+  assert.match(
+    JSON.stringify(result),
+    /hammerspoon.*showNotification.*function/,
+  );
+});
+```
+
+### Integration Tests
+
+Manually test with:
+
+```bash
+# 1. Start command server in background
+bash scripts/install-layer-indicator-user-command-server.sh install
+
+# 2. Test individual commands
+bash scripts/install-layer-indicator-user-command-server.sh status
+
+# 3. Test with bundled diagnostics
+bash scripts/install-layer-indicator-user-command-server.sh observability-bundle
+```
+
+### Logging
+
+All commands are logged to:
+
+``` text
+~/.config/karabiner/logs/layer-indicator-user-command-server.log
+```
+
+Example log line:
+
+``` text
+2026-03-19 13:25:57,569 INFO dispatched action=show marker=space_layer_show elapsed_ms=49.39
+```
+
+---
+
+## Fallback Behavior
+
+When the command server is unavailable, helpers have configurable fallbacks:
+
+**layer_indicator_command():**
+
+```typescript
+// If server is down, falls back to:
+cmd(`open -g 'hammerspoon://layer_indicator?action=show&layer=${layer}'`);
+```
+
+**userCommand() and other endpoints:**
+
+```typescript
+// No fallback available; logs warning
+console.warn(`userCommand: endpoint 'hammerspoon' requires command server`);
+return cmd('open -g "hammerspoon://noop"');
+```
+
+To ensure reliability:
+
+1. Test `install-layer-indicator-user-command-server.sh status --json`
+2. Verify `socket_present: true` and `loaded: true`
+3. Run `observability-bundle` regularly to catch latency regressions
+
+---
+
+## Troubleshooting
+
+### Command server socket not responsive
+
+```bash
+# Check status
+bash scripts/install-layer-indicator-user-command-server.sh status
+
+# Restart service
+bash scripts/install-layer-indicator-user-command-server.sh restart
+
+# View recent logs
+tail -f ~/.config/karabiner/logs/layer-indicator-user-command-server.log
+```
+
+### High latency (>200ms)
+
+```bash
+# Run periodic auto-rotate to keep logs manageable
+bash scripts/install-layer-indicator-user-command-server.sh enable-auto-rotate
+
+# Benchmark current state
+bash scripts/install-layer-indicator-user-command-server.sh smoke-check
+
+# Check Hammerspoon responsiveness separately:
+open -g 'hammerspoon://layer_indicator?action=show&layer=test'
+```
+
+### New function not working
+
+1. Verify function is in `allowed_functions` dict
+2. Check `observability-bundle` output for errors
+3. Validate JSON payload format in rule builder
+4. Test manually with curl/socket tool:
+
+   ```bash
+   echo '{"endpoint":"hammerspoon","function":"showNotification","args":{"title":"Test"}}' | nc -U /tmp/karabiner-layer-indicator.sock
+   ```
+
+---
+
+## Summary: When to Use What
+
+| Operation       | Best Tool                         | Example                                   |
+| --------------- | --------------------------------- | ----------------------------------------- |
+| Layer show/hide | Command server (fast)             | Space bar indicator                       |
+| Notifications   | Command server (user feedback)    | Key macro confirmations                   |
+| App focus       | Command server (low frequency ok) | Cmd+Alt+S → Safari                        |
+| Clipboard       | Command server (persistent state) | Macro paste templates                     |
+| Complex logic   | Shell command                     | Multi-step scripts, conditional execution |
+| One-off launch  | Shell command                     | `open -a AppName`                         |
+| Error handling  | Shell command                     | Check exit code, conditional flows        |
+
+**Golden rule:** If you're calling Hammerspoon URL schemes from rules, migrate to the command server for better latency and maintainability.
```

### src/index.ts

```diff
--- ../karabiner.ts-upstream/src/index.ts	2026-05-13 09:58:34
+++ src/index.ts	2026-05-07 11:52:19
@@ -1,82 +1,309 @@
-// Karabiner
-export * from './karabiner/key-code.ts'
-export * from './karabiner/consumer-key-code.ts'
-export * from './karabiner/pointing-button.ts'
-export * from './karabiner/karabiner-config.ts'
+/**
+ * Karabiner-Elements Configuration
+ *
+ * This configuration file uses karabiner.ts to generate Karabiner-Elements rules
+ * in a type-safe, maintainable way. The configuration is organized into several
+ * major sections:
+ *
+ * 1. Tap-Hold Keys: Single keys that perform different actions when tapped vs held
+ * 2. Space Layer: Space bar as a layer key for accessing sublayers (Downloads, Apps, Folders)
+ * 3. Caps Lock: Multiple modifier behaviors based on how it's pressed
+ * 4. Special Rules: CMD+Q protection, HOME/END fixes, app-specific behaviors
+ *
+ * Custom Modifiers:
+ * - HYPER: Command + Option + Control
+ * - SUPER: Command + Option + Control + Shift
+ * - MEH: Command + Option + Shift
+ */
 
-// Key alias
-export * from './config/modifier.ts'
-export * from './utils/key-alias.ts'
-export * from './utils/multi-modifier.ts'
+import { map, toKey, writeToProfile } from "karabiner.ts";
+import { readFileSync } from "node:fs";
+import {
+  emitLayerDefinitions,
+  generateEscapeRule,
+  generateTapHoldRules,
+  updateDeviceConfigurations,
+} from "./generators";
+import type { DeviceConfig } from "./generators/device-config";
+import { getOpenFolderCommand } from "./lib/folder-opener";
+import { generateLayerRules } from "./lib/leader";
+import {
+  mouseDeviceMappings,
+  SPACE_LAYER_DEBUG,
+  SPACE_LAYER_DEBUG_LOG_PATH,
+  SPACE_LAYER_INDICATOR_ROOT,
+  SPACE_LAYER_LABEL,
+  SPACE_LAYER_LEADER_KEY,
+  SPACE_LAYER_PREFIX,
+  spaceLayerDefinitions,
+  tapHoldMappings,
+} from "./mappings";
+import {
+  buildAntinoteDeleteRule,
+  buildCapsLockRule,
+  buildCmdQRule,
+  buildCtrlEscapeMonitorRule,
+  buildDisableHideMinimizeRule,
+  buildEnterRules,
+  buildEqualsRules,
+  buildEscapeTapTapHoldRule,
+  buildHomeEndRule,
+  buildHyperPlusRules,
+  buildLeftCommandRule,
+  buildMouseRules,
+  buildOnePieceClickEnterRule,
+  buildPasswordsQuickFillRule,
+  buildRightOptionAppsRule,
+  buildSkimCommandRemapRule,
+  buildWordPrivilegesRule,
+} from "./rules";
 
-// Types
-export type {
-  LeftModifierFlag,
-  RightModifierFlag,
-  SideModifierFlag,
-  SideModifierAlias,
-  SideMultiModifierAlias,
-  ModifierParam,
-  FromModifierParam,
-} from './config/modifier.ts'
-export type {
-  MultiModifierAlias,
-  NamedMultiModifierAlias,
-} from './utils/multi-modifier.ts'
-export type {
-  ModifierKeyAlias,
-  ArrowKeyAlias,
-  ControlOrSymbolKeyAlias,
-  KeyAlias,
-  NumberKeyValue,
-} from './utils/key-alias.ts'
-export {
-  type ManipulatorMap,
-  type ManipulatorBuilder,
-  BasicManipulatorBuilder,
-} from './config/manipulator.ts'
+const spaceLayers = spaceLayerDefinitions;
 
-// Utils
-export { withCondition } from './utils/with-condition.ts'
-export { withMapper } from './utils/with-mapper.ts'
-export { withModifier } from './utils/with-modifier.ts'
+// Generate tap-hold rules with automatic conflict prevention
+const tapHoldRules = generateTapHoldRules(tapHoldMappings, spaceLayers);
 
-// From
-export * from './config/from.ts'
-export { mapSimultaneous } from './config/simultaneous.ts'
-export type { DoubleTapParam } from './config/double-tap.ts'
-export { mapDoubleTap } from './config/double-tap.ts'
-export { mouseMotionToScroll } from './config/mouse-motion-to-scroll.ts'
+// Emit layer definitions for Hammerspoon (enable debug mode via KARABINER_DEBUG env var)
+const debugMode = process.env.KARABINER_DEBUG === "true";
+emitLayerDefinitions(spaceLayers, undefined, debugMode);
 
-// To
-export * from './config/to.ts'
-export * from './config/to-type-sequence.ts'
+// ============================================================================
+// SPECIAL RULES
+// ============================================================================
 
-// Condition
-export * from './config/condition.ts'
+let rules: any[] = [
+  // All tap-hold rules generated from configuration
+  ...tapHoldRules,
 
-// Rules
-export type { BuildContext } from './utils/build-context.ts'
-export type { RuleBuilder } from './config/rule.ts'
-export { rule } from './config/rule.ts'
-export type { LayerKeyCode, LayerKeyParam } from './config/layer.ts'
-export { layer, hyperLayer, modifierLayer } from './config/layer.ts'
-export { simlayer } from './config/simlayer.ts'
-export { duoLayer } from './config/duo-layer.ts'
+  // LEFT COMMAND - Tap (pass-through), double-tap (last app), hold (f13)
+  buildLeftCommandRule(),
 
-// Configs
-export type { ModificationParameters } from './config/complex-modifications.ts'
-export { defaultComplexModificationsParameters } from './config/complex-modifications.ts'
-export { defaultDoubleTapParameters } from './config/double-tap.ts'
-export { defaultSimlayerParameters } from './config/simlayer.ts'
-export { defaultDuoLayerParameters } from './config/duo-layer.ts'
-export { defaultLayerParameters } from './config/layer.ts'
+  // ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)
+  buildEscapeTapTapHoldRule(),
 
-// Imports
-export { importJson } from './imports/import-json.ts'
-export { importProfile } from './imports/import-profile.ts'
+  // LEFT CONTROL + ESCAPE - Activity Monitor (tap), Process Spy (hold)
+  buildCtrlEscapeMonitorRule(),
 
-// Output
-export { complexModifications } from './config/complex-modifications.ts'
-export { simpleModifications } from './config/simple-modifications.ts'
-export { writeToProfile, writeToGlobal } from './output.ts'
+  // Mouse mappings (declarative per-device rules)
+  ...buildMouseRules(mouseDeviceMappings),
+
+  // ONEPIECE - Left click submits with Enter inside the app
+  buildOnePieceClickEnterRule(),
+
+  // CAPS LOCK - Multiple behaviors
+  buildCapsLockRule(),
+
+  // Generate space layer rules with sublayer persistence
+  ...generateLayerRules(spaceLayers, {
+    leaderKey: SPACE_LAYER_LEADER_KEY,
+    layerPrefix: SPACE_LAYER_PREFIX,
+    leaderLabel: SPACE_LAYER_LABEL,
+    indicatorRootLayer: SPACE_LAYER_INDICATOR_ROOT,
+    leaderHoldEvents: [toKey("c", ["left_command"], { repeat: false })],
+    debugSwallowedKeys: SPACE_LAYER_DEBUG,
+    debugLogPath: SPACE_LAYER_DEBUG_LOG_PATH,
+  }),
+
+  // ============================================================================
+  // SPECIAL RULES - SYSTEM & APPLICATION BEHAVIORS
+  // ============================================================================
+  /**
+   * This section contains miscellaneous rules that enhance macOS behavior:
+   *
+   * KEYBOARD IMPROVEMENTS:
+   * - HOME/END: Mac-style navigation (CMD+Left/Right instead of default)
+   * - ENTER/RETURN: Tap for enter, hold for quick format (Hammerspoon)
+   * - EQUALS: Tap for equals, hold for Quick Date (Python script)
+   * - CMD alone: Tapping either CMD key sends CMD+OPT+CTRL+L
+   *
+   * SAFETY FEATURES:
+   * - CMD+Q: Double-tap protection (300ms window prevents accidental app quit)
+   * - CTRL+OPT+ESC: Single tap for Activity Monitor, double tap for Force Quit
+   *
+   * APPLICATION-SPECIFIC:
+   * - CMD+SHIFT+K: Delete line (disabled in VSCode Insiders - native shortcut)
+   */
+
+  // HOME/END - Make them work properly on macOS
+  ...buildHomeEndRule(),
+
+  // HYPER + _ - Grouped hyper shortcuts
+  ...buildHyperPlusRules(),
+
+  // ENTER/RETURN - Hold for quick format (except Excel), hold for F2 in Excel
+  ...buildEnterRules(),
+
+  // EQUALS - Hold for Quick Date (both keypad and regular)
+  ...buildEqualsRules(),
+
+  // CMD+Q double-tap protection (simplified - no optional any support in map())
+  buildCmdQRule(),
+
+  // Right_Option + __ - App launch or focus
+  ...buildRightOptionAppsRule(getOpenFolderCommand),
+  // Generate escape rule to reset all variables
+  ...generateEscapeRule(spaceLayers),
+
+  // ============================================================================
+  // SECURITY & SYSTEM ACCESS RULES
+  // ============================================================================
+  /**
+   * These rules handle privileged operations and security dialogs:
+   *
+   * DISABLED SHORTCUTS:
+   * - CMD+H, CMD+OPT+H, CMD+OPT+M: Hide/Minimize shortcuts disabled (empty to events)
+   *
+   * PASSWORD AUTOMATION (SecurityAgent only):
+   * - CMD+/: Auto-fill admin password using Privileges.app + Hammerspoon
+   *
+   * APPLICATION-SPECIFIC OVERRIDES:
+   * - Skim: Remap CMD+H and CMD+U to use CTRL modifier for Skim-specific functions
+   */
+
+  // DISABLE - CMD+H / CMD+OPT+H / CMD+M / CMD+OPT+M (empty to events = disabled)
+  ...buildDisableHideMinimizeRule(),
+
+  // WORD - CMD+/ copy document name and elevate privileges
+  buildWordPrivilegesRule(),
+
+  // PASSWORDS - CMD+/ quick fill dialogue (in SecurityAgent only)
+  buildPasswordsQuickFillRule(),
+
+  // SKIM - CMD+H/U remapping
+  ...buildSkimCommandRemapRule(),
+
+  // ============================================================================
+  // APPLICATION-SPECIFIC RULES
+  // ============================================================================
+  /**
+   * Rules that modify behavior in specific applications:
+   *
+   * ANTINOTE:
+   * - CMD+D: Double-tap protection for deleting notes (300ms window)
+   * - Prevents accidental deletion of notes
+   *
+   * These rules use bundle ID matching to target specific apps.
+   */
+
+  // ANTINOTE - CMD+D double-tap to delete note
+  buildAntinoteDeleteRule(),
+];
+
+// ============================================================================
+// DEVICE-SPECIFIC SIMPLE MODIFICATIONS
+// ============================================================================
+
+const deviceConfigs: DeviceConfig[] = [
+  {
+    identifiers: {
+      vendor_id: 76,
+      product_id: 802,
+      is_keyboard: true,
+    },
+    simple_modifications: [
+      {
+        from: { key_code: "keypad_asterisk" },
+        to: [{ key_code: "keypad_hyphen" }],
+      },
+      {
+        from: { key_code: "keypad_equal_sign" },
+        to: [{ key_code: "keypad_slash" }],
+      },
+      {
+        from: { key_code: "keypad_hyphen" },
+        to: [{ key_code: "keypad_plus" }],
+      },
+      {
+        from: { key_code: "keypad_plus" },
+        to: [{ key_code: "keypad_equal_sign" }],
+      },
+      {
+        from: { key_code: "keypad_slash" },
+        to: [{ key_code: "keypad_asterisk" }],
+      },
+      { from: { key_code: "left_control" }, to: [{ key_code: "fn" }] },
+      { from: { key_code: "fn" }, to: [{ key_code: "left_control" }] },
+    ],
+  },
+];
+
+// ============================================================================
+// WRITE TO PROFILE
+// ============================================================================
+
+// Detect CI/Linux environment and avoid writing to ~/.config/karabiner
+const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
+const isDarwin = process.platform === "darwin";
+const canWriteProfile = isDarwin && !isCI;
+const DEFAULT_PROFILE_NAME = "Default profile";
+const PREFERRED_PROFILE_NAME = "JJK_Default";
+
+function resolveTargetProfileName(): string {
+  if (!isDarwin) {
+    return PREFERRED_PROFILE_NAME;
+  }
+
+  try {
+    const raw = readFileSync("/Users/jason/.config/karabiner/karabiner.json", "utf8");
+    const parsed = JSON.parse(raw) as {
+      profiles?: Array<{ name?: string; selected?: boolean }>;
+    };
+    const profiles = parsed.profiles ?? [];
+
+    const explicit = process.env.KARABINER_PROFILE_NAME?.trim();
+    if (explicit) {
+      return explicit;
+    }
+
+    const preferred = profiles.find((profile) => profile.name === PREFERRED_PROFILE_NAME)?.name;
+    if (preferred) {
+      return preferred;
+    }
+
+    const selected = profiles.find((profile) => profile.selected)?.name;
+    if (selected) {
+      return selected;
+    }
+
+    const first = profiles[0]?.name;
+    return first ?? DEFAULT_PROFILE_NAME;
+  } catch {
+    return process.env.KARABINER_PROFILE_NAME?.trim() || DEFAULT_PROFILE_NAME;
+  }
+}
+
+const targetProfileName = resolveTargetProfileName();
+
+// Write rules: use real profile locally, dry-run in CI/non-macOS
+writeToProfile(
+  canWriteProfile ? targetProfileName : "--dry-run",
+  rules,
+  {},
+  {
+    simple_modifications: [
+      map("left_control").to("fn"),
+      map("fn").to("left_control"),
+    ],
+  },
+);
+
+// Wait for writeToProfile to complete, then add device configurations (local only)
+setTimeout(() => {
+  if (canWriteProfile) {
+    updateDeviceConfigurations(targetProfileName, deviceConfigs);
+  }
+}, 1000);
+
+// Also write generated rules to workspace for inspection
+import("fs").then((fs) => {
+  import("path").then((path) => {
+    try {
+      const outPath = path.join(process.cwd(), "karabiner-output.json");
+      const payload = { complex_modifications: { rules } };
+      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
+      console.log(`✓ Wrote workspace copy: ${outPath}`);
+    } catch (e) {
+      console.error("✗ Failed to write workspace karabiner-output.json", e);
+    }
+  });
+});
```

### Overlapping src filenames (basename)

```text
index.ts
```

### GitHub Workflows present upstream

../karabiner.ts-upstream/.github/workflows/pr-test.yml
../karabiner.ts-upstream/.github/workflows/docs-publish.yml
../karabiner.ts-upstream/.github/workflows/build-publish.yml

### Linting/Format configs upstream

../karabiner.ts-upstream/.prettierignore
../karabiner.ts-upstream/prettier.config.cjs

### Note

Our local extensions take precedence. Upstream files are stored under karabiner.ts-upstream for reference.
