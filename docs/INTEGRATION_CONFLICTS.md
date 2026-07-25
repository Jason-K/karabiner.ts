# Integration Conflict Report (upstream vs local)

Date: Thu Jul 16 12:08:47 PDT 2026

## Summary

Upstream: karabiner.ts-upstream; Local: karabiner.ts

### package.json

```diff
--- ../karabiner.ts-upstream/package.json	2026-07-16 12:08:47
+++ package.json	2026-03-17 21:43:07
@@ -1,44 +1,22 @@
 {
-  "name": "karabiner.ts",
-  "version": "1.38.0",
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
--- ../karabiner.ts-upstream/tsconfig.json	2026-07-16 12:08:47
+++ tsconfig.json	2026-06-30 09:00:55
@@ -1,19 +1,23 @@
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
+      "module": "ESNext",
+      "moduleResolution": "Bundler",
+      "target": "ES2024",
+      "jsx": "react-jsx",
+      "strictNullChecks": true,
+      "strictFunctionTypes": true,
+      "strict": true,
+      "sourceMap": true,
+      "noEmit": true,
+      "allowImportingTsExtensions": true,
+      "ignoreDeprecations": "5.0",
+      "types": ["node"]
+    },
+    "include": ["src"],
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
--- ../karabiner.ts-upstream/README.md	2026-07-16 12:08:47
+++ README.md	2026-05-22 11:36:26
@@ -1,94 +1,64 @@
-# karabiner.ts
+# Karabiner Config
 
-[![License](https://img.shields.io/npm/l/karabiner.ts.svg)](LICENSE)
-[![Coverage Status](https://coveralls.io/repos/github/evan-liu/karabiner.ts/badge.svg)](https://coveralls.io/github/evan-liu/karabiner.ts)
-[![Wallaby.js](https://img.shields.io/badge/wallaby.js-powered-blue.svg?style=flat&logo=github)](https://wallabyjs.com/oss/)
-[![npm](https://img.shields.io/npm/v/karabiner.ts.svg)](https://www.npmjs.com/package/karabiner.ts)
-[![deno module](https://shield.deno.dev/x/karabinerts)](https://deno.land/x/karabinerts)
+Personal Karabiner-Elements configuration written in TypeScript with `karabiner.ts`.
 
-Write [Karabiner-Elements](https://github.com/pqrs-org/Karabiner-Elements) configuration in TypeScript.
+## Architecture
 
-> [!NOTE]
-> Use of TypeScript is optional. Config can also be written in JavaScript.
-> Only the basics of JavaScript are needed. Check out my interactive course at [codojo.dev](https://codojo.dev/javascript/basics/hello-world).
+The config is split by responsibility:
 
-## Why karabiner.ts
+- `src/core/` — low-level builders and shared primitives (`ActionSpec`, mods, conditions, scripts, tap-hold, mouse helpers, leader internals)
+- `src/data/` — registries and constants (apps, folders, raycast, cleanshot, devices, paths, timings, UI labels)
+- `src/definitions/` — data configs + one engine-function call per behaviour; this is the user edit surface
+- `src/engine/` — rule-generation functions; the only layer that constructs manipulators
+- `src/tests/` — unit + integration regression coverage
+- `src/index.ts` — orchestrates the pipeline and writes the profile
 
-`karabiner.ts` is heavily inspired by [Goku](https://github.com/yqrashawn/GokuRakuJoudo). Compared to the edn format, it allows for:
+Every behaviour is a typed config object plus a single engine call. No definition file imports from `karabiner.ts` directly or iterates over its own mappings. All output events flow through one path: `ActionSpec` → `resolveActionToEvents` (in `src/engine/action-resolver.ts`) → karabiner.ts `ToEvent[]`.
 
-- Easier-to-understand TypeScript/JavaScript syntax
-- Strong-typed abstractions and key aliases with IDE support
-- Structured config files instead of one big file
+## Upstream Integration
 
-And more features (abstractions)
-([hyperLayer](https://evan-liu.github.io/karabiner.ts/rules/hyper-layer),
-[duoLayer](https://evan-liu.github.io/karabiner.ts/rules/duo-layer),
-[leaderMode](https://evan-liu.github.io/karabiner.ts/rules/leader-mode), ...).
+- Imports resolve from the installed `karabiner.ts` package, not from mirrored source paths.
+- Local beta compatibility helpers live in `src/core/beta.ts`.
+- `karabiner.ts-upstream/` and `docs/upstream/` are read-only reference and diff surfaces used by sync workflows.
 
-## Learn More
+See `docs/UPSTREAM_SYNC.md` for the sync workflow.
 
-- [📝 Docs](https://karabiner.ts.evanliu.dev)
-- [🔧 My Config](https://github.com/evan-liu/karabiner-config/blob/main/karabiner-config.ts)
-- [💡 In-the-wild usage](https://github.com/evan-liu/karabiner.ts/network/dependents)
+## Key Files
 
-## Using the Online Editor
+- `src/core/action-dsl.ts` — the `ActionSpec` union used for every output event
+- `src/engine/action-resolver.ts` — single compiler from `ActionSpec` to Karabiner `ToEvent`s
+- `src/core/leader/build.ts` — generic leader-layer compiler (used by the space leader, ready for additional leaders)
+- `src/data/apps.ts`, `folders.ts`, `raycast.ts`, `cleanshot.ts` — registries referenced by definitions
+- `src/index.ts` — orchestration entry point
 
-1. Write config in the [online editor](https://karabiner.ts.evanliu.dev/editor).
-2. Copy the generated JSON then [add to Karabiner-Elements](https://karabiner-elements.pqrs.org/docs/manual/configuration/add-your-own-complex-modifications/).
+## Common Commands
 
-> [!NOTE]
-> Importing JSON to Karabiner-Elements is only needed when using the Online Editor.
-> `karabiner.ts` writes to `~/.config/karabiner/karabiner.json` if using with Node.js or Deno.
->
-> > Karabiner-Elements watches ~/.config/karabiner/karabiner.json and reloads it if updated.
+```bash
+npm run typecheck
+npm test
+npm run build
+npm run check
+```
 
-## Using Node.js
+## Practical Rule
 
-[![npm](https://img.shields.io/npm/v/karabiner.ts.svg)](https://www.npmjs.com/package/karabiner.ts)
+If a file answers "what should this key do?", it belongs in `src/definitions/`.
 
-### Option 1
+If a file answers "how do we turn that declaration into Karabiner JSON?", it belongs in `src/engine/`.
 
-    npx create-karabiner-config@latest
+If a file is a low-level builder, a shared helper, or part of the leader runtime, it belongs in `src/core/`.
 
-The default directory name is `karabiner-config`. You can pass another `project-name`:
+If a file is a plain registry or constant table consumed across layers, it belongs in `src/data/`.
 
-    npx create-karabiner-config@latest [project-name]
+## Documentation
 
-Then:
-
-1. Write your key mapping in `src/index.ts`.
-2. Set the profile name. Create a new Karabiner-Elements profile if needed.
-3. Run `npm run build`.
-
-To update to the latest version, run `npm run update` (or `npm update karabiner.ts`).
-
-### Option 2
-
-1. [Download](https://github.com/evan-liu/karabiner.ts.examples/archive/refs/heads/main.zip) (or clone | [fork](https://github.com/evan-liu/karabiner.ts.examples/fork)) the [examples/starter repo](https://github.com/evan-liu/karabiner.ts.examples).
-2. Run `npm install`.
-
-Then write and build the config same as Option 1.
-
-### Option 3
-
-    npm install karabiner.ts
-
-(or install with `yarn`, `pnpm`, etc) then call `writeToProfile()` from any Node.js script in your preferred way.
-
-## Using Deno
-
-[![deno module](https://shield.deno.dev/x/karabinerts)](https://deno.land/x/karabinerts)
-
-In a Deno script file (replace `{version}`):
-
-```typescript
-import { writeToProfile } from 'https://deno.land/x/karabinerts@{version}/deno.ts'
-
-writeToProfile('Default', [
-  // rule(...
-])
-```
-
-Then run it with:
-
-    deno run --allow-env --allow-read --allow-write {filename}
+- `docs/DECLARATIVE_CONFIG_PLAN.md` — current architecture, engine-function inventory, and the definition-file contract
+- `docs/COMMAND_SERVER_GUIDE.md` — when to use the user command server vs shell commands, plus migration, performance, testing, and troubleshooting
+- `docs/INTEGRATION_SUMMARY.md` — upstream integration strategy and ownership boundaries
+- `docs/UPSTREAM_SYNC.md` — how to update the upstream mirror safely
+- `docs/INSIGHTS.md` — Karabiner manipulator pattern notes (variable conditions, evaluation order, timing parameters)
+- `docs/FUTURE_FEATURES.md` — tracked unimplemented Karabiner capabilities
+- `docs/BETA_IMPLEMENTATION_SUMMARY.md` — historical snapshot of the v15.6–v15.9 beta features adoption
+- `docs/superpowers/` — design specs and execution plans for in-flight or recently completed refactors
+- `docs/karabiner_docs/` - Karabiner Elements documentation and examples
+- `docs/karabiner_docs/complex-modifications-manipulator-definition/_index.md` - anatomy of a Karabiner JSON rule with links to definitions of each element.
```

### src/index.ts

```diff
--- ../karabiner.ts-upstream/src/index.ts	2026-07-16 12:08:47
+++ src/index.ts	2026-07-16 10:08:37
@@ -1,82 +1,217 @@
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
+ * 2. Caps Lock: Multiple modifier behaviors based on how it's pressed
+ * 3. Special Rules: CMD+Q protection, HOME/END fixes, app-specific behaviors
+ *
+ * Virtual Modifiers:
+ * - vmCOC_: Command + Option + Control
+ * - vmCOCS: Command + Option + Control + Shift
+ * - vmCO_S: Command + Option + Shift
+ */
 
-// Key alias
-export * from './config/modifier.ts'
-export * from './utils/key-alias.ts'
-export * from './utils/multi-modifier.ts'
+import { map, writeToProfile } from "karabiner.ts";
+import { readFileSync } from "node:fs";
+import {
+  APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS,
+  DEFAULT_PROFILE_NAME,
+  DEVICE_IDENTIFIERS,
+  Paths,
+  PREFERRED_PROFILE_NAME,
+} from "./data";
+import {
+  buildAntinoteRules,
+  buildCapsLockRule,
+  buildCmdQRule,
+  buildCtrlEscapeMonitorRule,
+  buildDisableHideMinimizeRule,
+  buildEnterRules,
+  buildEqualsRules,
+  buildEscapeTapTapHoldRule,
+  buildHomeEndRule,
+  buildHyperLauncherRules,
+  buildLeftCommandRule,
+  buildOnePieceClickEnterRule,
+  buildPasswordsQuickFillRule,
+  buildRightOptionLauncherRules,
+  buildShiftRules,
+  buildSkimCommandRemapRule,
+  buildWordPrivilegesRule,
+  buildZenCommandRemapRule,
+  mouseDeviceMappings,
+  simultaneousMappings,
+  tapHoldMappings,
+} from "./definitions";
+import type { DeviceConfig } from "./engine";
+import {
+  buildMouseRules,
+  generateSimultaneousRules,
+  generateTapHoldRules,
+  updateDeviceConfigurations,
+} from "./engine";
 
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
+// Generate tap-hold rules with automatic conflict prevention
+const tapHoldRules = generateTapHoldRules(tapHoldMappings);
+const simultaneousRules = generateSimultaneousRules(simultaneousMappings, [], tapHoldMappings);
 
-// Utils
-export { withCondition } from './utils/with-condition.ts'
-export { withMapper } from './utils/with-mapper.ts'
-export { withModifier } from './utils/with-modifier.ts'
+// ============================================================================
+// SPECIAL RULES
+// ============================================================================
 
-// From
-export * from './config/from.ts'
-export { mapSimultaneous } from './config/simultaneous.ts'
-export type { DoubleTapParam } from './config/double-tap.ts'
-export { mapDoubleTap } from './config/double-tap.ts'
-export { mouseMotionToScroll } from './config/mouse-motion-to-scroll.ts'
+let rules: any[] = [
+  // Simultaneous chord rules — must come before tap-hold rules
+  ...simultaneousRules,
+  // All tap-hold rules generated from configuration
+  ...tapHoldRules,
 
-// To
-export * from './config/to.ts'
-export * from './config/to-type-sequence.ts'
+  // LEFT COMMAND - Tap (pass-through), double-tap (last app), hold (f13)
+  buildLeftCommandRule(),
 
-// Condition
-export * from './config/condition.ts'
+  // ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)
+  buildEscapeTapTapHoldRule(),
 
-// Rules
-export type { BuildContext } from './utils/build-context.ts'
-export type { RuleBuilder } from './config/rule.ts'
-export { rule } from './config/rule.ts'
-export type { LayerKeyCode, LayerKeyParam } from './config/layer.ts'
-export { layer, hyperLayer, modifierLayer } from './config/layer.ts'
-export { simlayer } from './config/simlayer.ts'
-export { duoLayer } from './config/duo-layer.ts'
+  // LEFT CONTROL + ESCAPE - Activity Monitor (tap), Process Spy (hold)
+  buildCtrlEscapeMonitorRule(),
 
-// Configs
-export type { ModificationParameters } from './config/complex-modifications.ts'
-export { defaultComplexModificationsParameters } from './config/complex-modifications.ts'
-export { defaultDoubleTapParameters } from './config/double-tap.ts'
-export { defaultSimlayerParameters } from './config/simlayer.ts'
-export { defaultDuoLayerParameters } from './config/duo-layer.ts'
-export { defaultLayerParameters } from './config/layer.ts'
+  // Mouse mappings (declarative per-device rules)
+  ...buildMouseRules(mouseDeviceMappings),
 
-// Imports
-export { importJson } from './imports/import-json.ts'
-export { importProfile } from './imports/import-profile.ts'
+  // ONEPIECE - Left click submits with Enter inside the app
+  buildOnePieceClickEnterRule(),
 
-// Output
-export { complexModifications } from './config/complex-modifications.ts'
-export { simpleModifications } from './config/simple-modifications.ts'
-export { writeToProfile, writeToGlobal } from './output.ts'
+  // CAPS LOCK - Multiple behaviors
+  buildCapsLockRule(),
+
+  // HOME/END - Make them work properly on macOS
+  ...buildHomeEndRule(),
+
+  // vmCOC_ + _ - Grouped virtual-mod shortcuts
+  ...buildHyperLauncherRules(),
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
+  ...buildRightOptionLauncherRules(),
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
+  // ZEN - CMD+SHIFT+H/U remapping
+  ...buildZenCommandRemapRule(),
+
+  // ANTINOTE - CMD+D double-tap to delete note
+  ...buildAntinoteRules(),
+
+  // SHIFT - Shift key rules
+  ...buildShiftRules(),
+];
+
+// ============================================================================
+// DEVICE-SPECIFIC SIMPLE MODIFICATIONS
+// ============================================================================
+
+const deviceConfigs: DeviceConfig[] = [
+  {
+    identifiers: DEVICE_IDENTIFIERS.appleNumericKeypad,
+    simple_modifications: [...APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS],
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
+function resolveTargetProfileName(): string {
+  if (!isDarwin) {
+    return PREFERRED_PROFILE_NAME;
+  }
+
+  try {
+    const raw = readFileSync(Paths.karabinerConfig, "utf8");
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
simultaneous.test.ts
simultaneous.ts
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
