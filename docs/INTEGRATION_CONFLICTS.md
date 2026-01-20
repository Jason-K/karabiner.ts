# Integration Conflict Report (upstream vs local)

Date: Fri Jan 16 17:26:37 PST 2026

## Summary

Upstream: karabiner.ts-upstream; Local: karabiner.ts

### package.json

```diff
--- ../karabiner.ts-upstream/package.json	2026-01-16 17:26:36
+++ package.json	2025-12-22 11:35:20
@@ -1,44 +1,19 @@
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
+    "build": "tsx src/index.ts",
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
+    "karabiner.ts": "latest",
+    "karabiner.ts-greg-mods": "latest",
+    "tsx": "^4",
+    "typescript": "^5.9.3",
+    "typescript-eslint": "^8.47.0"
   }
 }
```

### tsconfig.json

```diff
--- ../karabiner.ts-upstream/tsconfig.json	2026-01-16 17:26:36
+++ tsconfig.json	2025-12-03 15:43:01
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
--- ../karabiner.ts-upstream/README.md	2026-01-16 17:26:36
+++ README.md	2025-12-06 12:52:48
@@ -1,96 +1,150 @@
-# karabiner.ts
+# Karabiner.ts Configuration
 
-[![License](https://img.shields.io/npm/l/karabiner.ts.svg)](LICENSE)
-[![Coverage Status](https://coveralls.io/repos/github/evan-liu/karabiner.ts/badge.svg)](https://coveralls.io/github/evan-liu/karabiner.ts)
-[![Wallaby.js](https://img.shields.io/badge/wallaby.js-powered-blue.svg?style=flat&logo=github)](https://wallabyjs.com/oss/)
-[![npm](https://img.shields.io/npm/v/karabiner.ts.svg)](https://www.npmjs.com/package/karabiner.ts)
-[![deno module](https://shield.deno.dev/x/karabinerts)](https://deno.land/x/karabinerts)
+## Source Project
 
-Write [Karabiner-Elements](https://github.com/pqrs-org/Karabiner-Elements) configuration in TypeScript.
+This project is an extension of the node module, Karabiner.ts [Git repo](https://github.com/evan-liu/karabiner.ts). It is a focused, type-safe Karabiner-Elements configuration with small builder utilities and clean layering.
 
-> [!NOTE]
-> Use of TypeScript is optional. Config can also be written in JavaScript.
-> Only the basics of JavaScript are needed. Check out my interactive course at [codojo.dev](https://codojo.dev/javascript/basics/hello-world).
+### Upstream Integration
 
-<a href="https://www.buymeacoffee.com/evanliu.dev" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 40px;" ></a>
+We vendor the upstream Karabiner.ts project for reference and diffing:
 
-## Why karabiner.ts
+- Upstream source, docs, and workflows are mirrored under `../karabiner.ts-upstream/` at the parent repo level.
+- Inside this project, upstream assets are copied into safe, non-active locations:
+  - Upstream GitHub workflows are stored in `.github/upstream-workflows/` so they do not alter CI by default.
+  - Upstream docs are available under `docs/upstream/`.
 
-`karabiner.ts` is heavily inspired by [Goku](https://github.com/yqrashawn/GokuRakuJoudo). Compared to the edn format, it allows for:
+Our local extensions take precedence over upstream files. When adopting upstream changes, we selectively merge while preserving our `package.json`, build scripts, eslint settings, and source overrides under `src/`.
 
-- Easier-to-understand TypeScript/JavaScript syntax
-- Strong-typed abstractions and key aliases with IDE support
-- Structured config files instead of one big file
+See `docs/INTEGRATION_CONFLICTS.md` for the current conflict report and diff summary.
 
-And more features (abstractions)
-([hyperLayer](https://evan-liu.github.io/karabiner.ts/rules/hyper-layer),
-[duoLayer](https://evan-liu.github.io/karabiner.ts/rules/duo-layer),
-[leaderMode](https://evan-liu.github.io/karabiner.ts/rules/leader-mode), ...).
+## Integration Status
 
-## Learn More
+The upstream integration is complete and merged to main. Your local extensions and main config are isolated from upstream, with TypeScript path mapping providing IDE support against the mirrored upstream sources.
 
-- [📝 Docs](https://karabiner.ts.evanliu.dev)
-- [🔧 My Config](https://github.com/evan-liu/karabiner-config/blob/main/karabiner-config.ts)
-- [💡 In-the-wild usage](https://github.com/evan-liu/karabiner.ts/network/dependents)
+- Upstream mirror lives at `../karabiner.ts-upstream/` in the parent repo.
+- Local extensions: `src/lib/*.ts` are owned here and marked with LOCAL EXTENSION headers.
+- Main config: `src/index.ts` is the authoritative configuration you edit.
+- CI: Typecheck, lint, and build run on main.
 
-## Using the Online Editor
+Daily workflow:
 
-1. Write config in the [online editor](https://karabiner.ts.evanliu.dev/editor).
-2. Copy the generated JSON then [add to Karabiner-Elements](https://karabiner-elements.pqrs.org/docs/manual/configuration/add-your-own-complex-modifications/).
+```bash
+cd karabiner.ts
+npm run build
+```
 
-> [!NOTE]
-> Importing JSON to Karabiner-Elements is only needed when using the Online Editor.
-> `karabiner.ts` writes to `~/.config/karabiner/karabiner.json` if using with Node.js or Deno.
->
-> > Karabiner-Elements watches ~/.config/karabiner/karabiner.json and reloads it if updated.
+Upstream sync (optional, when you want new features):
 
-## Using Node.js
+```bash
+cd ../karabiner.ts-upstream && git pull origin main
+cd ../karabiner.ts && npm run typecheck && npm run build
+```
 
-[![npm](https://img.shields.io/npm/v/karabiner.ts.svg)](https://www.npmjs.com/package/karabiner.ts)
+Documentation:
 
-### Option 1
+- `docs/INTEGRATION_SUMMARY.md` – Architecture overview
+- `docs/UPSTREAM_SYNC.md` – Sync workflow
+- `docs/MERGE_CHECKLIST.md` – Validation steps
 
-    npx create-karabiner-config@latest
+### Local Upstream Mapping
 
-The default directory name is `karabiner-config`. You can pass another `project-name`:
+For local development, imports of `karabiner.ts` resolve to the upstream mirror via TypeScript path mapping.
 
-    npx create-karabiner-config@latest [project-name]
+- Config: see `tsconfig.json` `compilerOptions.paths` where `karabiner.ts` and `karabiner.ts/*` point to `../karabiner.ts-upstream/src`.
+- Typechecking only: `compilerOptions.noEmit` is enabled alongside `allowImportingTsExtensions` to support upstream’s `.ts` import style without producing build outputs.
+- Usage: write local code that imports `karabiner.ts` APIs; the compiler will typecheck against upstream sources in `karabiner.ts-upstream/src`.
 
-Then:
+This keeps runtime artifacts unchanged while enabling tight local iteration against upstream APIs.
 
-1. Write your key mapping in `src/index.ts`.
-2. Set the profile name. Create a new Karabiner-Elements profile if needed.
-3. Run `npm run build`.
+### Layer Indicator (Hammerspoon URL Scheme)
 
-To update to the latest version, run `npm run update` (or `npm update karabiner.ts`).
+- Layer popups now use the Hammerspoon URL handler instead of the `hs` CLI.
+- Karabiner sends background URL events: `open -g 'hammerspoon://layer_indicator?action=show&layer=space_*'` and `action=hide` on release.
+- The handler lives in Hammerspoon at `karabiner_layer_indicator_url.lua` (symlinked into `src/` for reference).
+- Benefit: no helper processes, faster updates, and no focus stealing.
 
-### Option 2
+## Files
 
-1. [Download](https://github.com/evan-liu/karabiner.ts.examples/archive/refs/heads/main.zip) (or clone | [fork](https://github.com/evan-liu/karabiner.ts.examples/fork)) the [examples/starter repo](https://github.com/evan-liu/karabiner.ts.examples).
-2. Run `npm install`.
+- **`src/index.ts`** - All rules converted to TypeScript using abstractions
+- **`src/lib/mods.ts`** - Custom modifier definitions (HYPER, SUPER, MEH)
+- **`src/lib/builders.ts`** - Helper functions (`tapHold`, `varTapTapHold`, `cmd`)
+- **`src/inputRules.json`** - Original JSON (preserved for reference)
 
-Then write and build the config same as Option 1.
+## Custom Modifier Definitions
 
-### Option 3
+Your local definitions in `src/lib/mods.ts`:
 
-    npm install karabiner.ts
+- **HYPER** = `command + option + control`
+- **SUPER** = `command + option + control + shift`
+- **MEH** = `command + option + shift`
 
-(or install with `yarn`, `pnpm`, etc) then call `writeToProfile()` from any Node.js script in your preferred way.
+These override upstream defaults and remain stable under your control.
 
-## Using Deno
+## Build & Deploy
 
-[![deno module](https://shield.deno.dev/x/karabinerts)](https://deno.land/x/karabinerts)
+```bash
+# Deploy to Karabiner (edit src/index.ts, change '--dry-run' to 'JJK_Default')
+npm run build
+```
 
-In a Deno script file (replace `{version}`):
+## Where Things Live
 
-```typescript
-import { writeToProfile } from 'https://deno.land/x/karabinerts@{version}/deno.ts'
+- `src/index.ts`: Main rules (tap-hold, space layers, specials)
+- `src/lib/builders.ts`: Builders (shell, apps, mouse, notifications, expressions)
+- `src/lib/functions.ts`: Generators (tap-hold rules, space layers, escape rule, device updates)
+- `src/lib/mods.ts`: Mod constants (`HYPER`, `SUPER`, `MEH`)
 
-writeToProfile('Default', [
-  // rule(...
-])
+## Builders (1-line each + tiny example)
+
+- `cmd(cmd)`: Run a shell command. Example: `cmd("open -b com.apple.Safari")`
+- `openApp(opts)`: Native app focus/launch (`bundleIdentifier` | `filePath` | `historyIndex`). Example: `openApp({ historyIndex: 1 })`
+- `notify({ message, id? })`: macOS notification. Example: `notify({ message: 'Layer Active', id: 'mode' })`
+- `mouseJump({ x, y, screen? })`: Move cursor. Example: `mouseJump({ x: 960, y: 540 })`
+- `sleepSystem()`: Sleep the Mac. Example: `sleepSystem()`
+- `doubleClick(button?)`: System double-click. Example: `doubleClick()`
+- `setVarExpr(name, expr, keyUpExpr?)`: Expression variables. Example: `setVarExpr('uses', '{{ uses + 1 }}')`
+- `exprIf(expr)` / `exprUnless(expr)`: Expression conditions. Example: `exprIf('{{ uses > 5 }}')`
+- `withConditions(event, conds)`: Attach conditions to a single `to` event. Example: `withConditions(notify({message:'Hi'}), [exprIf('{{ uses<5 }}')])`
+
+## Patterns You’ll Reuse
+
+- Tap-Hold: `tapHold({ key:'x', alone:[toKey('x')], hold:[openApp({...})] })`
+- Per-To Conditions: `map('n', HYPER).to([ withConditions(notify({...}), [exprIf('...')]) ])`
+- App Toggle: `map('tab', HYPER).to([ openApp({ historyIndex: 1 }) ])`
+
+## Space Layer Enhancements
+
+- Direct events: any mapping may use `toEvents: ToEvent[]` (advanced)
+- Usage counters: `usageCounterVar: 'apps_toggle_uses'` auto-increments via expressions
+- Activation timestamp: `space_<layerKey>_activate_ms` set on layer entry
+
+Example (Applications layer snippet):
+
+```ts
+tab: {
+  description: 'Toggle Last App',
+  openAppOpts: { historyIndex: 1 },
+  usageCounterVar: 'apps_toggle_uses'
+}
 ```
 
-Then run it with:
+## Guardrails & Notes
 
-    deno run --allow-env --allow-read --allow-write {filename}
+- The file `/Library/.../karabiner_environment` sets shell env only; it does not create Karabiner variables. Use `set_variable`/expressions for runtime state.
+- Expression support (`set_variable.expression`, `expression_if`) requires Karabiner v15.6.0+.
+
+## Practical Next Steps
+
+- Idle auto-clear example: use `expression_if` comparing `system.now.milliseconds` to `space_<layer>_activate_ms`.
+- Consider `integer_value` in `from` (v15.6.0) if you add unusual HID sources.
+
+## Quick Verify
+
+```bash
+grep -n "frontmost_application_history_index" karabiner-output.json
+grep -n "set_notification_message" karabiner-output.json
+grep -n "set_mouse_cursor_position" karabiner-output.json
+grep -n "iokit_power_management_sleep_system" karabiner-output.json
+```
+
+That’s it—keep `src/index.ts` readable, prefer builders, and iterate.
```

### src/index.ts

```diff
--- ../karabiner.ts-upstream/src/index.ts	2026-01-16 17:26:36
+++ src/index.ts	2026-01-15 12:14:56
@@ -1,82 +1,958 @@
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
+import {
+  ifApp,
+  ifVar,
+  map,
+  rule,
+  toKey,
+  toSetVar,
+  writeToProfile,
+} from "karabiner.ts";
+import { applescript, cmd, openApp, tapHold, varTapTapHold } from "./lib/builders";
+import type {
+  DeviceConfig,
+  SubLayerConfig,
+  TapHoldConfig,
+} from "./lib/functions";
+import {
+  emitLayerDefinitions,
+  generateEscapeRule,
+  generateSpaceLayerRules,
+  generateTapHoldRules,
+  updateDeviceConfigurations,
+} from "./lib/functions";
+import { HYPER, L, MEH, SUPER } from "./lib/mods";
+import { indentLine } from "./lib/text";
 
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
+// ============================================================================
+// CONFIGURATION
+// ============================================================================
+/**
+ * Folder/Finder replacement app selection
+ * Set to 'bloom' or 'qspace' to choose which app opens folders
+ *
+ * Note: Bloom requires 'open -a Bloom' with escaped paths, while QspacePro uses bundle ID
+ */
+const FOLDER_OPENER: 'bloom' | 'qspace' = 'bloom';
 
-// Utils
-export { withCondition } from './utils/with-condition.ts'
-export { withMapper } from './utils/with-mapper.ts'
-export { withModifier } from './utils/with-modifier.ts'
+/**
+ * Generate the correct open command for the selected folder opener app
+ * Bloom: uses 'open -a Bloom' with escaped path
+ * QspacePro: uses 'open -b' with bundle ID
+ */
+const getOpenFolderCommand = (folderPath: string): string => {
+  if (FOLDER_OPENER === 'bloom') {
+    // Bloom requires 'open -a' with escaped path (spaces escaped with backslash)
+    const escapedPath = folderPath.replace(/ /g, '\\ ');
+    return `open -a Bloom ${escapedPath}`;
+  } else {
+    // QspacePro uses bundle ID
+    return `open -b com.jinghaoshe.qspace.pro '${folderPath}'`;
+  }
+};
 
-// From
-export * from './config/from.ts'
-export { mapSimultaneous } from './config/simultaneous.ts'
-export type { DoubleTapParam } from './config/double-tap.ts'
-export { mapDoubleTap } from './config/double-tap.ts'
-export { mouseMotionToScroll } from './config/mouse-motion-to-scroll.ts'
+/**
+ * Get the bundle ID for the selected folder opener (used for openAppOpts)
+ * Falls back to QspacePro if Bloom is selected, as QspacePro has proper bundle ID support
+ */
+const getFolderOpenerBundleId = (): string => {
+  if (FOLDER_OPENER === 'bloom') {
+    // Bloom doesn't work well with bundle ID, so use QspacePro as fallback for openAppOpts
+    return 'com.jinghaoshe.qspace.pro';
+  } else {
+    return 'com.jinghaoshe.qspace.pro';
+  }
+};
 
-// To
-export * from './config/to.ts'
-export * from './config/to-type-sequence.ts'
+// ============================================================================
+// TAP-HOLD KEY DEFINITIONS
+// ============================================================================
+/**
+ * - Tap: Send the key normally (with halt to prevent accidental holds)
+ * - Hold: Execute a custom action (open app, trigger hotkey, etc.)
+ *
+ * Default timing: 400ms for both timeout and threshold
+ *
+ * Configuration is declarative - just add entries to the object below.
+ */
 
-// Condition
-export * from './config/condition.ts'
+const tapHoldKeys: Record<string, TapHoldConfig> = {
+  a: { description: "Antinote", hold: [cmd("open -u 'antinote://x-callback-url/hotkey' && echo 'Antinote launched'")] },
+  b: {
+    description: "Search menu apps / Skim note", hold: [toKey("b", SUPER, { repeat: false })],
+    appOverrides: [
+      { app: "net.sourceforge.skim-app.skim", hold: [cmd("osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-create-anchored-note.applescript")], },
+    ],
+  },
+  c: { description: "Calendar", hold: [toKey("7", MEH, { repeat: false })] },
+  d: { description: "Dato", hold: [toKey("d", MEH, { repeat: false })] },
+  e: { description: "New event", hold: [toKey("e", MEH, { repeat: false })] },
+  f: { description: "Houdah", hold: [toKey("h", SUPER, { repeat: false })] },
+  g: { description: "ChatGPT", hold: [cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.anthropic.claudefordesktop' && echo 'ChatGPT launched'")] },
+  h: {
+    description: "HS (global) / New heading (Skim)", hold: [cmd("/opt/homebrew/bin/hs -c 'hs.openConsole()' && echo 'HS launched'")],
+    appOverrides: [
+      { app: "net.sourceforge.skim-app.skim", hold: [cmd("osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-add-heading-to-anchored-note.applescript")] },
+    ],
+  },
+  i: { description: "Indent", hold: indentLine() },
+  j: { description: "Recent download", hold: [cmd('bash ~/Scripts/Metascripts/recent_dl.sh')] },
+  m: { description: "Deminimize", hold: [toKey("m", HYPER, { repeat: false })] },
+  n: {
+    description: "New note / Skim highlight", hold: [toKey("n")],
+    appOverrides: [
+      { app: "net.sourceforge.skim-app.skim", hold: [cmd("osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-add-extended-text-to-anchored-note.applescript")] },
+    ],
+  },
+  o: { description: "OCR", hold: [cmd('open "cleanshot://capture-text?linebreaks=false"')] },
+  p: { description: "Paletro", hold: [toKey("p", HYPER, { repeat: false })] },
+  q: { description: "QSpace Pro", hold: [cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.jinghaoshe.qspace.pro' && echo 'QSpace Pro launched'")] },
+  r: { description: "Last d/l", hold: [cmd('bash ~/Scripts/Metascripts/recent_dl.sh')] },
+  s: { description: "Screenshot", hold: [cmd('open "cleanshot://capture-area"')] },
+  t: { description: "Terminal Here", hold: [cmd("osascript ~/Scripts/Application_Specific/iterm2/iterm2_openHere.applescript")] },
+  v: { description: "Maccy", hold: [toKey("grave_accent_and_tilde", ["control"], { halt: true, repeat: false })] },
+  w: { description: "Writing Tools", hold: [toKey("w", ["command", "shift"], { repeat: false })] },
+  "8": { description: "RingCentral", hold: [cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.ringcentral.glip' && echo 'RingCentral launched'")] },
+  "f1": { description: "Decrease brightness", hold: [toKey("display_brightness_decrement", [], { repeat: true })] },
+  "f2": { description: "Increase brightness", hold: [toKey("display_brightness_increment", [], { repeat: true })] },
+  "f3": { description: "Mission Control", hold: [toKey("mission_control", [], { repeat: false })] },
+  "f4": { description: "Launchpad", hold: [toKey("launchpad", [], { repeat: false })] },
+  "f5": { description: "Dictation", hold: [toKey("f5", ['command', 'option', 'control'], { repeat: false })] },
+  "f7": { description: "Rewind", hold: [toKey("rewind", [], { repeat: true })] },
+  "f8": { description: "Play/Pause", hold: [toKey("play_or_pause", [], { repeat: false })] },
+  "f9": { description: "Fast Forward", hold: [toKey("fastforward", [], { repeat: true })] },
+  "f10": { description: "Mute", hold: [toKey("mute", [], { repeat: false })] },
+  "f11": { description: "Volume Down", hold: [toKey("volume_decrement", [], { repeat: true })] },
+  "f12": { description: "Volume Up", hold: [toKey("volume_increment", [], { repeat: true })] },
+  slash: { description: "search for files", hold: [cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.cardinal.one' && echo 'Cardinal One launched'")] },
+  tab: { description: "Mission Control", hold: [toKey("mission_control", [], { halt: true, repeat: true })] },
+};
 
-// Rules
-export type { BuildContext } from './utils/build-context.ts'
-export type { RuleBuilder } from './config/rule.ts'
-export { rule } from './config/rule.ts'
-export type { LayerKeyCode, LayerKeyParam } from './config/layer.ts'
-export { layer, hyperLayer, modifierLayer } from './config/layer.ts'
-export { simlayer } from './config/simlayer.ts'
-export { duoLayer } from './config/duo-layer.ts'
+// ============================================================================
+// SPACE LAYER CONFIGURATION
+// ============================================================================
+/**
+ * Space layer system provides access to sublayers for quick actions:
+ *
+ * Usage:
+ * 1. Hold Space (150ms threshold)
+ * 2. Tap a layer key (d/a/f) to activate that sublayer
+ * 3. Tap an action key to execute and deactivate sublayer
+ *
+ * All sublayer variables are cleared when:
+ * - Space is tapped alone
+ * - Space + key pressed before threshold
+ * - No hardcoded key lists to maintain
+ */
 
-// Configs
-export type { ModificationParameters } from './config/complex-modifications.ts'
-export { defaultComplexModificationsParameters } from './config/complex-modifications.ts'
-export { defaultDoubleTapParameters } from './config/double-tap.ts'
-export { defaultSimlayerParameters } from './config/simlayer.ts'
-export { defaultDuoLayerParameters } from './config/duo-layer.ts'
-export { defaultLayerParameters } from './config/layer.ts'
+const spaceLayers: SubLayerConfig[] = [
+  {
+    layerKey: "a",
+    layerName: "Applications",
+    releaseLayer: false,
+    mappings: {
+      8: {
+        description: "RingCentral",
+        openAppOpts: { bundleIdentifier: "com.ringcentral.glip" },
+      },
+      b : {
+        description: "Browser",
+        openAppOpts: { bundleIdentifier: "net.imput.helium" },
+      },
+      c: {
+        description: "Calendar",
+        openAppOpts: { bundleIdentifier: "com.busymac.busycal-setapp" },
+      },
+      d: {
+        description: "Dia",
+        openAppOpts: { bundleIdentifier: "company.thebrowser.dia" },
+      },
+      e: {
+        description: "Proton Mail",
+        openAppOpts: { bundleIdentifier: "ch.protonmail.desktop" },
+      },
+      f: {
+        description: "Finder",
+        openAppOpts: { bundleIdentifier: getFolderOpenerBundleId() },
+      },
+      g: {
+        description: "ChatGPT",
+        openAppOpts: { bundleIdentifier: "com.openai.chat" },
+      },
+      m: {
+        description: "Messages",
+        openAppOpts: { bundleIdentifier: "com.apple.MobileSMS" },
+      },
+      o: {
+        description: "Outlook",
+        openAppOpts: { bundleIdentifier: "com.microsoft.Outlook" },
+      },
+      p: {
+        description: "Phone",
+        openAppOpts: { bundleIdentifier: "com.ringcentral.glip" },
+      },
+      q: {
+        description: "QSpace",
+        openAppOpts: { bundleIdentifier: "com.jinghaoshe.qspace.pro" },
+      },
+      r: {
+        description: "RingCentral",
+        openAppOpts: { bundleIdentifier: "com.ringcentral.glip" },
+      },
+      s: {
+        description: "Safari",
+        openAppOpts: { bundleIdentifier: "com.apple.Safari" },
+      },
+      t: {
+        description: "Teams",
+        openAppOpts: { bundleIdentifier: "com.microsoft.teams2" },
+      },
+      v: {
+        description: "Code",
+        openAppOpts: { bundleIdentifier: "com.microsoft.VSCodeInsiders" },
+      },
+      w: {
+        description: "Word",
+        openAppOpts: { bundleIdentifier: "com.microsoft.Word" },
+      },
+      "=": {
+        description: "Calculator",
+        openAppOpts: { bundleIdentifier: "com.nikolaeu.numi-setapp" },
+      },
+      tab: {
+        description: "Last App",
+        openAppOpts: { historyIndex: 1 },
+        usageCounterVar: "apps_toggle_uses",
+      },
 
-// Imports
-export { importJson } from './imports/import-json.ts'
-export { importProfile } from './imports/import-profile.ts'
+    },
+  },
+  {
+    layerKey: "m",
+    layerName: "Cursor Movement",
+    releaseLayer: false, // Keep layer active until space released for continuous cursor movement
+    mappings: {
+      ";": { description: "Page Down", key: "page_down", passModifiers: true },
+      d: {
+        description: "Delete",
+        key: "delete_or_backspace",
+        passModifiers: true,
+      },
+      f: {
+        description: "Forward Delete",
+        key: "delete_forward",
+        passModifiers: true,
+      },
+      i: { description: "Up", key: "up_arrow", passModifiers: true },
+      j: { description: "Left", key: "left_arrow", passModifiers: true },
+      k: { description: "Down", key: "down_arrow", passModifiers: true },
+      l: { description: "Right", key: "right_arrow", passModifiers: true },
+      o: { description: "End", key: "end", passModifiers: true },
+      p: { description: "Page Up", key: "page_up", passModifiers: true },
+      s: { description: "Shift", key: "left_shift", passModifiers: true },
+      u: { description: "Home", key: "home", passModifiers: true },
+    },
+  },
+  {
+    layerKey: "c",
+    layerName: "Case",
+    releaseLayer: false,
+    mappings: {
+      l: {
+        description: "lowercase",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py lowercase --source clipboard --dest paste",
+          },
+        ],
+      },
+      s: {
+        description: "Sentence case",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py sentence_case --source clipboard --dest paste",
+          },
+        ],
+      },
+      t: {
+        description: "Title Case",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py title_case --source clipboard --dest paste",
+          },
+        ],
+      },
+      u: {
+        description: "UPPERCASE",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py uppercase --source clipboard --dest paste",
+          },
+        ],
+      },
+    },
+  },
+  {
+    layerKey: "d",
+    layerName: "Downloads",
+    releaseLayer: false,
+    mappings: {
+      "3": {
+        description: "3dPrinting",
+        command: getOpenFolderCommand('/Users/jason/Downloads/3dPrinting'),
+      },
+      a: {
+        description: "Archives",
+        command: getOpenFolderCommand('/Users/jason/Downloads/Archives'),
+      },
+      i: {
+        description: "Installs",
+        command: getOpenFolderCommand('/Users/jason/Downloads/Installs'),
+      },
+      o: {
+        description: "Office",
+        command: getOpenFolderCommand('/Users/jason/Downloads/Office'),
+      },
+      p: {
+        description: "PDFs",
+        command: getOpenFolderCommand('/Users/jason/Downloads/PDFs'),
+      },
+    },
+  },
+  {
+    layerKey: "f",
+    layerName: "Folders",
+    releaseLayer: false,
+    mappings: {
+      "`": {
+        description: "Home",
+        command: getOpenFolderCommand('/Users/jason/'),
+      },
+      a: {
+        description: "Applications",
+        command: getOpenFolderCommand('/Applications'),
+      },
+      c: {
+        description: "Code Workspaces",
+        command: getOpenFolderCommand('/Users/jason/Scripts/Workspaces'),
+      },
+      d: {
+        description: "Downloads",
+        command: getOpenFolderCommand('/Users/jason/Downloads'),
+      },
+      g: {
+        description: "GitHub",
+        command: getOpenFolderCommand('/Users/jason/Gits'),
+      },
+      o: {
+        description: "My OneDrive",
+        command: getOpenFolderCommand('/Users/jason/Library/CloudStorage/OneDrive-Personal'),
+      },
+      p: {
+        description: "Proton Drive",
+        command: getOpenFolderCommand('/Users/jason/Library/CloudStorage/ProtonDrive-jason.j.knox@pm.me-folder'),
+      },
+      s: {
+        description: "Scripts",
+        command: getOpenFolderCommand('/Users/jason/Scripts'),
+      },
+      v: {
+        description: "Videos",
+        command: getOpenFolderCommand('/Users/jason/Videos'),
+      },
+      w: {
+        description: "Work OneDrive",
+        command: getOpenFolderCommand('/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP'),
+      },
+      ".": {
+        description: "Dotfiles",
+        command: getOpenFolderCommand('/Users/jason/dotfiles'),
+      },
+    },
+  },
+  {
+    layerKey: "s",
+    layerName: "Screenshots",
+    releaseLayer: false,
+    mappings: {
+      a: {
+        description: "Capture Area",
+        command: 'open "cleanshot://capture-area"',
+      },
+      o: {
+        description: "OCR",
+        command: 'open "cleanshot://capture-text?linebreaks=false"',
+      },
+      r: {
+        description: "Record Screen",
+        command: 'open "cleanshot://record-screen"',
+      },
+      s: {
+        description: "Capture Screen",
+        command: 'open "cleanshot://capture-fullscreen"',
+      },
+      w: {
+        description: "Capture Window",
+        command: 'open "cleanshot://capture-window"',
+      },
+    },
+  },
+  {
+    layerKey: "w",
+    layerName: "Wrap",
+    releaseLayer: false, // Keep layer active to allow shell commands to complete
+    mappings: {
+      c: {
+        description: "Curly Braces",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_braces --source clipboard --dest paste",
+          },
+        ],
+      },
+      p: {
+        description: "Parentheses",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_parentheses --source clipboard --dest paste",
+          },
+        ],
+      },
+      q: {
+        description: "Quotes",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_quotes --source clipboard --dest paste",
+          },
+        ],
+      },
+      s: {
+        description: "Square Brackets",
+        actions: [
+          { type: "cut" },
+          {
+            type: "command",
+            value:
+              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_brackets --source clipboard --dest paste",
+          },
+        ],
+      },
+    },
+  },
+];
 
-// Output
-export { complexModifications } from './config/complex-modifications.ts'
-export { simpleModifications } from './config/simple-modifications.ts'
-export { writeToProfile, writeToGlobal } from './output.ts'
+// Generate tap-hold rules with automatic conflict prevention
+const tapHoldRules = generateTapHoldRules(tapHoldKeys, spaceLayers);
+
+// Emit layer definitions for Hammerspoon (enable debug mode via KARABINER_DEBUG env var)
+const debugMode = process.env.KARABINER_DEBUG === 'true';
+emitLayerDefinitions(spaceLayers, undefined, debugMode);
+
+// ============================================================================
+// SPECIAL RULESf
+// ============================================================================
+
+let rules: any[] = [
+  // All tap-hold rules generated from configuration
+  ...tapHoldRules,
+
+  // LEFT COMMAND - Tap/Double-Tap/Hold pattern using varTapTapHold
+  rule(
+    "LCMD - left ⌘ (tap), return to last app (tap-tap), switcher (tap-tap-hold)"
+  ).manipulators(
+    varTapTapHold({
+      key: "left_command",
+      firstVar: "lcmd_first_tap",
+      aloneEvents: [],
+      tapTapEvents: [openApp({ historyIndex: 1 })],
+      tapTapHoldEvents: [toKey("tab", ["left_command"], { repeat: false })],
+      thresholdMs: 250,
+      description: "Left CMD tap/double-tap/hold",
+      allowPassThrough: true,
+    })
+  ),
+
+  // ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)
+  rule(
+    "ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)"
+  ).manipulators(
+    varTapTapHold({
+      key: "escape",
+      firstVar: "escape_first_tap",
+      aloneEvents: [toKey("escape")],
+      holdEvents: [cmd("/Users/jason/dotfiles/bin/kill_app/kill-app --foreground")],
+      tapTapHoldEvents: [cmd("/Users/jason/dotfiles/bin/kill_app/kill-app")],
+      thresholdMs: 250,
+      description: "ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)",
+      mods: [],
+    })
+  ),
+
+  // LEFT CONTROL + ESCAPE - Activity Monitor (tap), Process Spy (hold)
+  rule(
+    "LEFT CTRL + ESCAPE - Activity Monitor (tap), Process Spy (hold)"
+  ).manipulators([
+    ...map("escape", "left_control")
+      .parameters({
+        "basic.to_if_alone_timeout_milliseconds": 300,
+        "basic.to_if_held_down_threshold_milliseconds": 300,
+      })
+      .toIfAlone(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.apple.ActivityMonitor' && echo 'Activity Monitor launched'"))
+      .toIfHeldDown(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.itone.ProcessSpy' && echo 'Process Spy launched'"))
+      .toDelayedAction(
+        [],
+        [cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.apple.ActivityMonitor' && echo 'Activity Monitor launched'")]
+      )
+      .description("LEFT CTRL + ESCAPE - Activity Monitor (tap), Process Spy (hold)")
+      .build(),
+  ]),
+
+  // CAPS LOCK - Multiple behaviors
+  rule(
+    "CAPS - HSLAUNCHER (alone), HYPER (hold), SUPER (with shift), MEH (with ctrl)"
+  ).manipulators([
+    // Base caps_lock behavior (hold = hyper)
+    ...map("caps_lock")
+      .to(toSetVar("caps_lock_pressed", 1))
+      .to(toKey(L.cmd, [L.ctrl, L.opt]))
+      .toAfterKeyUp(toSetVar("caps_lock_pressed", 0))
+      .toIfAlone(toKey("f15", HYPER))
+      .description("CAPS - HSLAUNCHER (alone), HYPER (hold)")
+      .build(),
+    // Caps with shift = SUPER
+    ...map("caps_lock", "left_shift")
+      .to(toKey(L.shift, [L.cmd, L.opt, L.ctrl]))
+      .description("CAPS + Shift = SUPER")
+      .build(),
+    // Caps with ctrl = MEH
+    ...map("caps_lock", "left_control")
+      .to(toKey(L.cmd, [L.opt, L.shift]))
+      .description("CAPS + Ctrl = MEH")
+      .build(),
+  ]),
+
+  // Generate space layer rules with sublayer persistence
+  ...generateSpaceLayerRules(spaceLayers),
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
+  rule("HOME/END - Mac-style navigation").manipulators([
+    ...map("home")
+      .to(toKey("left_arrow", ["command"]))
+      .build(),
+    ...map("home", "shift")
+      .to(toKey("left_arrow", ["command", "shift"]))
+      .build(),
+    ...map("end")
+      .to(toKey("right_arrow", ["command"]))
+      .build(),
+    ...map("end", "shift")
+      .to(toKey("right_arrow", ["command", "shift"]))
+      .build(),
+  ]),
+
+  // GRAVE ACCENT & TILDE - Tap sends tilde, hold sends hyper+f5 with deferred release
+  rule("grave_accent_and_tilde tap/hold -> grave or hyper+f5").manipulators([
+    {
+      type: "basic" as const,
+      from: {
+        key_code: "grave_accent_and_tilde" as any,
+      },
+      parameters: {
+        "basic.to_if_alone_timeout_milliseconds": 400,
+        "basic.to_if_held_down_threshold_milliseconds": 400,
+      },
+      to_if_alone: [
+        toKey("grave_accent_and_tilde", [], { halt: true }),
+      ],
+      to_if_held_down: [
+        toKey("f5", HYPER, { halt: false }),
+      ],
+      description: "Tilde - self (tap), Hyper+F5 down (tap-hold down), Hyper+F5 up (tap-hold up)"
+    } as any,
+  ]),
+
+  // ENTER/RETURN - Hold for quick format (both keypad and regular)
+  ...["keypad_enter", "return_or_enter"].map((key) =>
+    rule(`${key} hold -> quick format`).manipulators([
+      tapHold({
+        key,
+        alone: [toKey(key as any, [], { halt: true })],
+        hold: [cmd("/opt/homebrew/bin/hs -c 'FormatCutSeed()'")],
+      }),
+    ])
+  ),
+
+  // EQUALS - Hold for Quick Date (both keypad and regular)
+  ...["keypad_equal_sign", "equal_sign"].map((key) =>
+    rule(`${key} hold -> Quick Date`).manipulators([
+      tapHold({
+        key,
+        alone: [
+          toKey(key === "equal_sign" ? "keypad_equal_sign" : (key as any), [], {
+            halt: true,
+          }),
+        ],
+        hold: [
+          toKey("left_arrow", ["shift", "option"]),
+          toKey("c", ["command"]),
+          cmd(
+            "/usr/bin/env python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py quick_date --source clipboard --dest paste"
+          ),
+        ],
+      }),
+    ])
+  ),
+
+  // CMD+Q double-tap protection (simplified - no optional any support in map())
+  rule("CMD-Q requires double-tap (300ms window)").manipulators([
+    // When variable is set (within window), allow quit
+    ...map("q", "command")
+      .condition(ifVar("command_q_pressed", 1))
+      .to(toKey("q", ["command"]))
+      .to(toSetVar("command_q_pressed", 0))
+      .build(),
+    // First press sets variable with timeout
+    ...map("q", "command")
+      .parameters({ "basic.to_delayed_action_delay_milliseconds": 300 })
+      .to(toSetVar("command_q_pressed", 1))
+      .toDelayedAction(
+        [toSetVar("command_q_pressed", 0)],
+        [toSetVar("command_q_pressed", 0)]
+      )
+      .build(),
+  ]),
+
+  // CMD+SHIFT+K - Delete line (except in VSCode Insiders)
+  rule("CMD+SHIFT+K - delete line").manipulators([
+    ...map("k", ["left_command", "left_shift"])
+      .condition(ifApp("com.microsoft.VSCodeInsiders").unless())
+      .to(toKey("a", [L.ctrl], { repeat: false }))
+      .to(toKey("k", [L.ctrl], { repeat: false }))
+      .to(toKey("delete_or_backspace", [], { repeat: false }))
+      .build(),
+  ]),
+
+  // RCMD + __ - App launch or focus
+  rule("RCMD + Key - App launch or focus").manipulators([
+    ...map("a", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.adobe.Acrobat.Pro' && echo 'Acrobat Pro launched'"))
+      .build(),
+    ...map("b", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'net.imput.helium' && echo 'Helium launched'"))
+      .build(),
+    ...map("c", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.microsoft.VSCodeInsiders' && echo 'VSCode Insiders launched'"))
+      .build(),
+    ...map("d", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'company.thebrowser.dia' && echo 'The Browser launched'"))
+      .build(),
+    ...map("e", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'ch.protonmail.desktop' && echo 'ProtonMail launched'"))
+      .build(),
+    ...map("f", "right_command")
+      .to(cmd(`${getOpenFolderCommand('/Users/jason')}`))
+      .build(),
+    ...map("m", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.apple.MobileSMS' && echo 'Messages launched'"))
+      .build(),
+    ...map("o", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.microsoft.Outlook' && echo 'Outlook launched'"))
+      .build(),
+    ...map("p", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'net.sourceforge.skim-app.skim' && echo 'Skim launched'"))
+      .build(),
+    ...map("q", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.jinghaoshe.qspace.pro' && echo 'QSpace Pro launched'"))
+      .build(),
+    ...map("r", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.ringcentral.glip' && echo 'RingCentral launched'"))
+      .build(),
+    ...map("s", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.apple.Safari' && echo 'Safari launched'"))
+      .build(),
+    ...map("t", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.microsoft.teams2' && echo 'Teams launched'"))
+      .build(),
+    ...map("w", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.microsoft.Word' && echo 'Word launched'"))
+      .build(),
+    ...map("8", "right_command")
+      .to(cmd("/Users/jason/dotfiles/bin/open_app/open-app -b 'com.ringcentral.glip' && echo 'RingCentral launched'"))
+      .build(),
+  ]),
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
+  rule("DISABLE - Hide/Minimize shortcuts").manipulators([
+    ...map("h", ["command", "option"]).build(),
+    ...map("m", ["command", "option"]).build(),
+    ...map("h", "command").build(),
+  ]),
+
+  // PASSWORDS - CMD+/ quick fill dialogue (in SecurityAgent only)
+  rule("PASSWORDS - CMD+/ quick fill").manipulators([
+    ...map("slash", "command")
+      .condition(ifApp({
+        bundle_identifiers: ["com.apple.SecurityAgent"],
+        file_paths: ["/Applications/Cork.app/Contents/Resources/Sudo Helper"]
+      }))
+      .to(
+        cmd(
+          "/Applications/Privileges.app/Contents/MacOS/privilegescli -a && sleep 3"
+        )
+      )
+      .to(toKey("a", [L.cmd]))
+      .to(toKey("j", [L.shift]))
+      .to(toKey("a"))
+      .to(toKey("s"))
+      .to(toKey("o"))
+      .to(toKey("n"))
+      .to(toKey("tab"))
+      .to(toKey("slash", HYPER, { repeat: false }))
+      .build(),
+  ]),
+
+  // SKIM - CMD+H/U remapping
+  rule("SKIM - CMD+H/U").manipulators([
+    ...map("h", "command")
+      .condition(ifApp("net.sourceforge.skim-app.skim"))
+      .to(toKey("h", [L.cmd, L.ctrl]))
+      .build(),
+    ...map("u", "command")
+      .condition(ifApp("net.sourceforge.skim-app.skim"))
+      .to(toKey("u", [L.cmd, L.ctrl]))
+      .build(),
+  ]),
+
+  // SKIM - Number row 1/2/3 hold AppleScripts
+  rule("SKIM - 1/2/3 hold AppleScripts").manipulators([
+    // 1 hold -> create anchored note
+    ...map("1")
+      .condition(ifApp("net.sourceforge.skim-app.skim"))
+      .parameters({
+        "basic.to_if_alone_timeout_milliseconds": 300,
+        "basic.to_if_held_down_threshold_milliseconds": 300,
+      })
+      .toIfAlone(toKey("1", [], { halt: true }))
+      .toIfHeldDown(
+        cmd(
+          "osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-create-anchored-note.applescript"
+        )
+      )
+      .toDelayedAction([], [toKey("1", [], { halt: true })])
+      .description("SKIM 1 hold -> anchored note")
+      .build(),
+    // 2 hold -> add heading
+    ...map("2")
+      .condition(ifApp("net.sourceforge.skim-app.skim"))
+      .parameters({
+        "basic.to_if_alone_timeout_milliseconds": 300,
+        "basic.to_if_held_down_threshold_milliseconds": 300,
+      })
+      .toIfAlone(toKey("2", [], { halt: true }))
+      .toIfHeldDown(
+        applescript(
+          "~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-add-heading-to-anchored-note.applescript"
+        )
+      )
+      .toDelayedAction([], [toKey("2", [], { halt: true })])
+      .description("SKIM 2 hold -> add heading")
+      .build(),
+    // 3 hold -> add extended text
+    ...map("3")
+      .condition(ifApp("net.sourceforge.skim-app.skim"))
+      .parameters({
+        "basic.to_if_alone_timeout_milliseconds": 300,
+        "basic.to_if_held_down_threshold_milliseconds": 300,
+      })
+      .toIfAlone(toKey("3", [], { halt: true }))
+      .toIfHeldDown(
+        applescript(
+          "~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-add-extended-text-to-anchored-note.applescript"
+        )
+      )
+      .toDelayedAction([], [toKey("3", [], { halt: true })])
+      .description("SKIM 3 hold -> add extended text")
+      .build(),
+  ]),
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
+  rule("ANTINOTE - CMD+D+D to delete note").manipulators([
+    // When ready variable set, execute delete
+    ...map("d", "command")
+      .condition(ifApp(["com.chabomakers.Antinote-setapp", "com.chabomakers.Antinote"]))
+      .condition(ifVar("cmd_d_ready", 1))
+      .to(toKey("d", ["command"]))
+      .to(toSetVar("cmd_d_ready", 0))
+      .build(),
+    // First press sets ready variable with delay
+    ...map("d", "command")
+      .condition(ifApp(["com.chabomakers.Antinote-setapp", "com.chabomakers.Antinote"]))
+      .condition(ifVar("cmd_d_ready", 0))
+      .to(toSetVar("cmd_d_ready", 1))
+      .toDelayedAction(
+        [toSetVar("cmd_d_ready", 0)],
+        [toSetVar("cmd_d_ready", 0)]
+      )
+      .build(),
+  ]),
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
+
+// Write rules: use real profile locally, dry-run in CI/non-macOS
+writeToProfile(canWriteProfile ? "JJK_Default" : "--dry-run", rules);
+
+// Wait for writeToProfile to complete, then add device configurations (local only)
+setTimeout(() => {
+  if (canWriteProfile) {
+    updateDeviceConfigurations("JJK_Default", deviceConfigs);
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
