# Rule Generation Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all bespoke rule-building logic from `src/definitions/` by unifying action types under `ActionSpec` and adding engine functions for every remaining manual pattern.

**Architecture:** All output-event conversion flows through `resolveActionToEvents` in `engine/action-resolver.ts`. Definition files export data configs and call a single engine function. No definition file imports from `karabiner.ts` directly or iterates over its own mappings.

**Tech Stack:** TypeScript, karabiner.ts library, Node.js `node:test` runner, `tsx` for execution.

---

## File Map

**Modified:**
- `src/core/action-dsl.ts` — add `sequence` variant
- `src/engine/action-resolver.ts` — handle `sequence`; normalize empty modifier arrays to `undefined`
- `src/engine/conditional-tap-hold-rules.ts` — replace `TapHoldActionSpec` with `ActionSpec`
- `src/engine/conditional-action-rules.ts` — replace `ConditionalAction` with `ActionSpec`
- `src/engine/launcher-rules.ts` — replace `LauncherAction` with `ActionSpec`; `triggerKey: string | string[]`; add `triggerLabel?`; remove `getOpenFolderCommand` param
- `src/engine/simple-rules.ts` — add `generateAppScopedRemapRules`
- `src/engine/index.ts` — export new engine files
- `src/definitions/special-keys.ts` — type updates + `PointerRemapConfig` data
- `src/definitions/security.ts` — type updates
- `src/definitions/right-option-launchers.ts` — type updates; remove `getOpenFolderCommand`
- `src/definitions/skim.ts` — full migration to `generateAppScopedRemapRules`
- `src/definitions/hyper-plus.ts` — full migration to `generateModifierLauncherRules`
- `src/definitions/antinote.ts` — full migration to `generateDoubleTapGuardRule`
- `src/definitions/left-command-chords.ts` — full migration to `generateDoubleTapGuardRule` + `generateMultiTapRule`
- `src/definitions/escape-monitor.ts` — full migration to `generateMultiTapRule` + `generateTapAloneHoldRule`
- `src/definitions/hyper-chords.ts` — full migration to `generateModifierChordRules`
- `src/tests/rules-factories.test.ts` — add `sequence` test; update imports for migrated functions

**Created:**
- `src/engine/double-tap-guard-rules.ts`
- `src/engine/multi-tap-rules.ts`
- `src/engine/tap-alone-hold-rules.ts`
- `src/engine/pointer-remap-rules.ts`
- `src/engine/modifier-chord-rules.ts`
- `src/tests/double-tap-guard.test.ts`
- `src/tests/multi-tap.test.ts`
- `src/tests/tap-alone-hold.test.ts`
- `src/tests/pointer-remap.test.ts`
- `src/tests/modifier-chord.test.ts`

---

## Task 1: Add `sequence` to ActionSpec and fix empty-modifier normalization

**Files:**
- Modify: `src/core/action-dsl.ts`
- Modify: `src/engine/action-resolver.ts`
- Modify: `src/tests/rules-factories.test.ts`

- [ ] **Step 1: Write a failing test for `sequence`**

Add to `src/tests/rules-factories.test.ts` (after the existing imports, add `resolveActionToEvents` to the import from `../engine`):

```ts
import { resolveActionToEvents } from "../engine";

test("resolveActionToEvents flattens sequence into multiple events", () => {
  const events = resolveActionToEvents({
    type: "sequence",
    actions: [
      { type: "key", key: "c", modifiers: ["left_command"] },
      { type: "shell", command: "echo hello" },
    ],
  });
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { key_code: "c", modifiers: ["left_command"] });
  assert.deepEqual(events[1], { shell_command: "echo hello" });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test 2>&1 | grep -A3 "sequence"
```
Expected: error — `sequence` is not a known ActionSpec type.

- [ ] **Step 3: Add `sequence` to `src/core/action-dsl.ts`**

Add as the last variant in the `ActionSpec` union (before the closing `;`):

```ts
  | {
      type: "sequence";
      actions: ActionSpec[];
    };
```

- [ ] **Step 4: Handle `sequence` in `src/engine/action-resolver.ts`**

Add before the `default` case in `resolveActionToEvents`:

```ts
    case "sequence":
      return action.actions.flatMap(resolveActionToEvents);
```

- [ ] **Step 5: Fix empty-modifier normalization in `action-resolver.ts`**

The `key` case currently passes `[]` for empty modifiers. karabiner.ts `toKey` treats `[]` and `undefined` differently. Change the `key` case to:

```ts
    case "key":
      return [
        toKey(
          action.key as any,
          action.modifiers?.length ? (action.modifiers as any) : undefined,
          action.options && Object.keys(action.options).length ? (action.options as any) : undefined,
        ),
      ];
```

- [ ] **Step 6: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all existing tests pass + new `sequence` test passes.

- [ ] **Step 7: Commit**

```bash
git add src/core/action-dsl.ts src/engine/action-resolver.ts src/tests/rules-factories.test.ts
git commit -m "feat: add ActionSpec sequence type and normalize empty modifier arrays"
```

---

## Task 2: Migrate `generateConditionalTapHoldRules` to ActionSpec

**Files:**
- Modify: `src/engine/conditional-tap-hold-rules.ts`
- Modify: `src/definitions/special-keys.ts`

- [ ] **Step 1: Update `src/engine/conditional-tap-hold-rules.ts`**

Replace the file contents with:

```ts
import { ifApp, withCondition } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { tapHold } from "../core/tap-hold";
import { resolveActionToEvents } from "./action-resolver";
import { buildRulesWithVariantRules } from "./rule-factory-base";
import type { AppCondition } from "./variant-types";

export type TapHoldVariantMapping = {
  description: string;
  when?: AppCondition;
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
  thresholdMs: number;
};

export type ConditionalTapHoldMapping = {
  key: string;
  variants: TapHoldVariantMapping[];
};

export function generateConditionalTapHoldRules(
  mappings: ReadonlyArray<ConditionalTapHoldMapping>,
) {
  return buildRulesWithVariantRules({
    mappings,
    getVariants: ({ variants }) => variants,
    toDescription: ({ key }, variant) =>
      formatRuleDescription(key, variant.description, "hold"),
    toManipulators: ({ key }, variant) => {
      const manipulator = tapHold({
        key,
        alone: variant.alone.flatMap(resolveActionToEvents),
        hold: variant.hold.flatMap(resolveActionToEvents),
        timeoutMs: variant.timeoutMs,
        thresholdMs: variant.thresholdMs,
      }).build();

      if (variant.when) {
        const conditionedManipulator = withCondition(
          variant.when.unless
            ? ifApp(variant.when.app).unless()
            : ifApp(variant.when.app),
        )(manipulator).build();
        return conditionedManipulator;
      }

      return manipulator;
    },
  });
}
```

- [ ] **Step 2: Update type imports in `src/definitions/special-keys.ts`**

The data values in `enterKeyHoldMappings` and `equalsKeyHoldMappings` are unchanged — they already use `{ type: "key", ... }` and `{ type: "shell", ... }` shapes compatible with `ActionSpec`. Only the import annotation changes.

Replace:
```ts
import {
    generateConditionalTapHoldRules,
    type ConditionalTapHoldMapping,
} from "../engine/conditional-tap-hold-rules";
```
With:
```ts
import {
    generateConditionalTapHoldRules,
    type ConditionalTapHoldMapping,
} from "../engine/conditional-tap-hold-rules";
```

No change needed — `ConditionalTapHoldMapping` still exists with the same shape. TypeScript will validate that the data values are compatible with `ActionSpec[]`. If TypeScript reports errors on the `alone`/`hold` arrays, verify the values use `type: "key"` or `type: "shell"` which are valid `ActionSpec` variants.

- [ ] **Step 3: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/engine/conditional-tap-hold-rules.ts src/definitions/special-keys.ts
git commit -m "refactor: migrate generateConditionalTapHoldRules to ActionSpec"
```

---

## Task 3: Migrate `generateConditionalActionRules` to ActionSpec

**Files:**
- Modify: `src/engine/conditional-action-rules.ts`
- Modify: `src/definitions/security.ts`

- [ ] **Step 1: Replace `src/engine/conditional-action-rules.ts`**

```ts
import { ifApp, map } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";
import { buildRulesWithVariantManipulators } from "./rule-factory-base";

export type ConditionalActionCondition =
  | {
      type: "frontmostApp";
      bundleIds: string[];
      unless?: boolean;
    }
  | {
      type: "variable";
      name: string;
      match: "if" | "unless";
      value: string | number;
    };

export type ConditionalActionVariant = {
  when: ConditionalActionCondition[];
  actions: ActionSpec[];
  delayedAction?: {
    invoked: ActionSpec[];
    canceled: ActionSpec[];
  };
  parameters?: {
    delayedActionDelayMs?: number;
  };
};

export type ConditionalActionMapping = {
  key: string;
  modifiers: string[];
  description: string;
  variants: ConditionalActionVariant[];
};

function toCondition(condition: ConditionalActionCondition) {
  if (condition.type === "frontmostApp") {
    const appCondition = ifApp({ bundle_identifiers: condition.bundleIds });
    return condition.unless ? appCondition.unless() : appCondition;
  }

  return {
    type: condition.match === "if" ? "variable_if" : "variable_unless",
    name: condition.name,
    value: condition.value,
  } as const;
}

export function generateConditionalActionRules(
  mappings: ReadonlyArray<ConditionalActionMapping>,
) {
  return buildRulesWithVariantManipulators({
    mappings,
    getVariants: ({ variants }) => variants,
    toDescription: ({ key, modifiers, description }) =>
      formatRuleDescription([...modifiers, key], description, "tap"),
    toManipulators: ({ key, modifiers }, variant) => {
      const builder = map(key as any, modifiers as any);

      if (variant.parameters?.delayedActionDelayMs !== undefined) {
        builder.parameters({
          "basic.to_delayed_action_delay_milliseconds":
            variant.parameters.delayedActionDelayMs,
        });
      }

      variant.when.forEach((condition) => {
        builder.condition(toCondition(condition));
      });

      variant.actions.forEach((action) => {
        resolveActionToEvents(action).forEach((e) => builder.to(e));
      });

      if (variant.delayedAction) {
        builder.toDelayedAction(
          variant.delayedAction.invoked.flatMap(resolveActionToEvents),
          variant.delayedAction.canceled.flatMap(resolveActionToEvents),
        );
      }

      return builder.build();
    },
  });
}
```

- [ ] **Step 2: Update `src/definitions/security.ts`**

The data values in `securitySlashActionMappings` use `{ type: "osascript" }`, `{ type: "shell" }`, and `{ type: "key" }` — all valid `ActionSpec` variants. Remove the `ConditionalAction` type import if it exists as an explicit annotation. The type will be inferred from `ConditionalActionVariant.actions: ActionSpec[]`.

- [ ] **Step 3: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/engine/conditional-action-rules.ts src/definitions/security.ts
git commit -m "refactor: migrate generateConditionalActionRules to ActionSpec"
```

---

## Task 4: Migrate `generateModifierLauncherRules` + migrate `right-option-launchers.ts` and `hyper-plus.ts`

**Files:**
- Modify: `src/engine/launcher-rules.ts`
- Modify: `src/definitions/right-option-launchers.ts`
- Modify: `src/definitions/hyper-plus.ts`

- [ ] **Step 1: Replace `src/engine/launcher-rules.ts`**

```ts
import { map } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";
import { buildRulesFromMappings } from "./rule-factory-base";

export type ModifierLauncherMapping<TKey extends string = string> = {
  key: TKey;
  description: string;
  action: ActionSpec;
};

type LauncherRuleConfig<TKey extends string> = {
  triggerKey: string | string[];
  triggerLabel?: string;
  launchers: ReadonlyArray<ModifierLauncherMapping<TKey>>;
};

export function generateModifierLauncherRules<TKey extends string>(
  config: LauncherRuleConfig<TKey>,
) {
  const { triggerKey, triggerLabel, launchers } = config;
  const descriptionTrigger = triggerLabel ?? triggerKey;

  return buildRulesFromMappings({
    mappings: launchers,
    toDescription: ({ key, description }) =>
      formatRuleDescription(
        Array.isArray(descriptionTrigger)
          ? [...descriptionTrigger, key]
          : [descriptionTrigger, key],
        description,
        "tap",
      ),
    toManipulators: ({ key, action }) => {
      const builder = map(key as any, triggerKey as any);
      resolveActionToEvents(action).forEach((e) => builder.to(e));
      return builder.build();
    },
  });
}
```

- [ ] **Step 2: Update `src/definitions/right-option-launchers.ts`**

```ts
import { appRegistry } from "../data";
import {
    generateModifierLauncherRules,
    type ModifierLauncherMapping,
} from "../engine/launcher-rules";

export const rightOptionLaunchers: ModifierLauncherMapping<
  "a" | "b" | "c" | "e" | "f" | "m" | "o" | "t" | "w" | "8"
>[] = [
  { key: "a", description: "Antinote", action: { type: "app", ref: "antinote", mode: "focus" } },
  { key: "b", description: "Helium", action: { type: "app", ref: "helium", mode: "focus" } },
  { key: "c", description: "VS Code", action: { type: "app", ref: "code", mode: "focus" } },
  { key: "e", description: "Proton Mail", action: { type: "app", ref: "protonMail", mode: "focus" } },
  { key: "f", description: "Home folder", action: { type: "folder", ref: "home" } },
  { key: "m", description: "Messages", action: { type: "app", ref: "messages", mode: "focus" } },
  { key: "o", description: "Outlook", action: { type: "app", ref: "outlook", mode: "focus" } },
  { key: "t", description: "Teams", action: { type: "app", ref: "teams", mode: "focus" } },
  { key: "w", description: "Word", action: { type: "app", ref: "word", mode: "focus" } },
  { key: "8", description: "RingCentral", action: { type: "app", ref: "ringCentral", mode: "focus" } },
];

export const buildRightOptionAppsRule = () =>
  generateModifierLauncherRules({
    triggerKey: "right_option",
    launchers: rightOptionLaunchers,
  });
```

- [ ] **Step 3: Migrate `src/definitions/hyper-plus.ts`**

```ts
import {
    generateModifierLauncherRules,
    type ModifierLauncherMapping,
} from "../engine/launcher-rules";
import { HYPER } from "../core/mods";
import {
    formatSelectionCommand,
    typinatorNewRuleCommand,
} from "../core/scripts";
import { PATHS } from "../data";

export const hyperPlusMappings: ModifierLauncherMapping[] = [
  {
    key: "s",
    description: "Format selection",
    action: { type: "shell", command: formatSelectionCommand() },
  },
  {
    key: "t",
    description: "New Typinator rule",
    action: { type: "shell", command: typinatorNewRuleCommand() },
  },
  {
    key: "semicolon",
    description: "Open System Settings",
    action: { type: "shell", command: "open -a '/System/Applications/System Settings.app'" },
  },
  {
    key: "f12",
    description: "Edit last Typinator rule",
    action: { type: "shell", command: `/usr/bin/osascript ${PATHS.typinatorEditLastRule}` },
  },
  {
    key: "escape",
    description: "Open Activity Monitor",
    action: { type: "shell", command: "open -a 'Activity Monitor'" },
  },
];

export const buildHyperPlusRules = () =>
  generateModifierLauncherRules({
    triggerKey: HYPER,
    triggerLabel: "hyper",
    launchers: hyperPlusMappings,
  });
```

- [ ] **Step 4: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass. The `hyper plus rules factory` test checks descriptions — verify `"[✦]+[S]        →    Format selection (on tap)"` still matches.

- [ ] **Step 5: Commit**

```bash
git add src/engine/launcher-rules.ts src/definitions/right-option-launchers.ts src/definitions/hyper-plus.ts
git commit -m "refactor: migrate generateModifierLauncherRules to ActionSpec; migrate hyper-plus"
```

---

## Task 5: Add `generateAppScopedRemapRules` + migrate `skim.ts`

**Files:**
- Modify: `src/engine/simple-rules.ts`
- Modify: `src/definitions/skim.ts`
- Modify: `src/tests/rules-factories.test.ts`

- [ ] **Step 1: Write a failing test**

Add to `src/tests/rules-factories.test.ts`:

```ts
import { generateAppScopedRemapRules } from "../engine";

test("generateAppScopedRemapRules attaches ifApp condition to each rule", () => {
  const rules = toRules(
    generateAppScopedRemapRules([
      {
        from: { key: "h", modifiers: ["left_command"] },
        description: "Test remap",
        to: { key: "h", modifiers: ["left_command", "left_control"] },
        ifApp: "com.example.App",
      },
    ]),
  );
  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.description, "[←⌘]+[H]        →    Test remap (on tap)");
  const manipulator: any = rules[0]?.manipulators[0];
  assert.ok(
    manipulator?.conditions?.some(
      (c: any) => c.type === "frontmost_application_if",
    ),
    "Missing frontmost_application_if condition",
  );
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test 2>&1 | grep -A3 "generateAppScopedRemapRules"
```
Expected: `generateAppScopedRemapRules is not a function` or similar.

- [ ] **Step 3: Add `generateAppScopedRemapRules` to `src/engine/simple-rules.ts`**

Append to the existing file:

```ts
import { ifApp, map, toKey } from "karabiner.ts";
// (ifApp is already imported if not already — add it to the existing import line)

export type AppScopedRemapMapping = {
  from: {
    key: string;
    modifiers?: string[];
  };
  description: string;
  to: {
    key: string;
    modifiers?: string[];
  };
  ifApp: string | string[];
};

export function generateAppScopedRemapRules(
  mappings: ReadonlyArray<AppScopedRemapMapping>,
) {
  return buildRulesFromMappings({
    mappings,
    toDescription: ({ from, description }) => {
      const chord = [...(from.modifiers ?? []), from.key];
      return formatRuleDescription(chord, description, "tap");
    },
    toManipulators: ({ from, to, ifApp: appScope }) => {
      const appIds = Array.isArray(appScope) ? appScope : [appScope];
      return map(from.key as any, (from.modifiers as any) ?? undefined)
        .condition(ifApp(appIds))
        .to(toKey(to.key as any, (to.modifiers as any) ?? undefined))
        .build();
    },
  });
}
```

Note: The existing imports at the top of `simple-rules.ts` are `import { map, toKey } from "karabiner.ts"`. Add `ifApp` to that import.

- [ ] **Step 4: Export from `src/engine/index.ts`**

`simple-rules.ts` is already exported via `export * from "./simple-rules"` — `AppScopedRemapMapping` and `generateAppScopedRemapRules` will be available automatically.

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm test 2>&1 | grep -A3 "generateAppScopedRemapRules"
```
Expected: PASS.

- [ ] **Step 6: Migrate `src/definitions/skim.ts`**

```ts
import { L } from "../core/mods";
import { appRegistry } from "../data";
import {
    generateAppScopedRemapRules,
    type AppScopedRemapMapping,
} from "../engine/simple-rules";

export const skimRemapMappings: AppScopedRemapMapping[] = [
  {
    from: { key: "h", modifiers: ["left_command"] },
    description: "Skim command H remap",
    to: { key: "h", modifiers: [L.cmd, L.ctrl] },
    ifApp: appRegistry.skim,
  },
  {
    from: { key: "u", modifiers: ["left_command"] },
    description: "Skim command U remap",
    to: { key: "u", modifiers: [L.cmd, L.ctrl] },
    ifApp: appRegistry.skim,
  },
];

export const buildSkimCommandRemapRule = () =>
  generateAppScopedRemapRules(skimRemapMappings);
```

- [ ] **Step 7: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass including `"skim command remap factory keeps both remaps"`.

- [ ] **Step 8: Commit**

```bash
git add src/engine/simple-rules.ts src/definitions/skim.ts src/tests/rules-factories.test.ts
git commit -m "feat: add generateAppScopedRemapRules; migrate skim.ts"
```

---

## Task 6: Add `generateDoubleTapGuardRule` + migrate `antinote.ts` + `buildCmdQRule`

**Files:**
- Create: `src/engine/double-tap-guard-rules.ts`
- Create: `src/tests/double-tap-guard.test.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/definitions/antinote.ts`
- Modify: `src/definitions/left-command-chords.ts`

- [ ] **Step 1: Write failing tests in `src/tests/double-tap-guard.test.ts`**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { appRegistry } from "../data";
import { generateDoubleTapGuardRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateDoubleTapGuardRule produces two manipulators", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  assert.equal(rule.manipulators.length, 2);
});

test("generateDoubleTapGuardRule description uses multi-tap trigger", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  assert.equal(rule.description, "[←⌘]+[Q]        →    Quit app (on multi-tap)");
});

test("generateDoubleTapGuardRule auto-derives var name from key and modifier", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  const firstPress: any = rule.manipulators[1];
  assert.ok(
    firstPress?.to?.some((e: any) => e.set_variable?.name === "guard_cmd_q"),
    "Expected guard_cmd_q variable",
  );
});

test("generateDoubleTapGuardRule adds ifApp condition when provided", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "d",
      modifiers: ["left_command"],
      description: "Delete note",
      ifApp: [appRegistry.antinote, appRegistry.antinoteLegacy],
    }),
  );
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "Both manipulators should have app condition",
  );
});

test("generateDoubleTapGuardRule has no ifApp condition when omitted", () => {
  const rule = toRule(
    generateDoubleTapGuardRule({
      key: "q",
      modifiers: ["left_command"],
      description: "Quit app",
    }),
  );
  assert.ok(
    rule.manipulators.every(
      (m: any) =>
        !m.conditions?.some((c: any) => c.type === "frontmost_application_if"),
    ),
    "No app condition expected for global rule",
  );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test 2>&1 | grep -A3 "double-tap-guard"
```
Expected: `generateDoubleTapGuardRule is not a function`.

- [ ] **Step 3: Create `src/engine/double-tap-guard-rules.ts`**

```ts
import { ifApp, ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";

import { formatRuleDescription } from "../core/rule-descriptions";

export type DoubleTapGuardConfig = {
  key: string;
  modifiers: string[];
  description: string;
  ifApp?: string | string[];
  timeoutMs?: number;
};

function normalizeModifier(mod: string): string {
  const base = mod.replace(/^(left|right)_/, "");
  const aliases: Record<string, string> = {
    command: "cmd",
    control: "ctrl",
    option: "opt",
  };
  return aliases[base] ?? base;
}

function deriveGuardVar(key: string, modifiers: string[]): string {
  const primaryMod = modifiers[0] ? normalizeModifier(modifiers[0]) : "none";
  return `guard_${primaryMod}_${key}`;
}

export function generateDoubleTapGuardRule(config: DoubleTapGuardConfig) {
  const { key, modifiers, description, ifApp: appScope, timeoutMs } = config;
  const varName = deriveGuardVar(key, modifiers);

  const appCondition = appScope
    ? ifApp(Array.isArray(appScope) ? appScope : [appScope])
    : null;

  // Second press: fire real key combo, reset var
  const secondPressBuilder = map(key as any, modifiers as any).condition(
    ifVar(varName, 1),
  );
  if (appCondition) secondPressBuilder.condition(appCondition);
  secondPressBuilder
    .to(toKey(key as any, modifiers as any))
    .to(toSetVar(varName, 0));

  // First press: set var, delayed action resets var
  const firstPressBuilder = map(key as any, modifiers as any);
  if (timeoutMs !== undefined) {
    firstPressBuilder.parameters({
      "basic.to_delayed_action_delay_milliseconds": timeoutMs,
    });
  }
  if (appCondition) firstPressBuilder.condition(appCondition);
  firstPressBuilder
    .condition(ifVar(varName, 0))
    .to(toSetVar(varName, 1))
    .toDelayedAction([toSetVar(varName, 0)], [toSetVar(varName, 0)]);

  const ruleDescription = formatRuleDescription(
    [...modifiers, key],
    description,
    "multi-tap",
  );

  return rule(ruleDescription).manipulators([
    ...secondPressBuilder.build(),
    ...firstPressBuilder.build(),
  ]) as any;
}
```

- [ ] **Step 4: Export from `src/engine/index.ts`**

Add to `src/engine/index.ts`:

```ts
export * from "./double-tap-guard-rules";
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test 2>&1 | grep -E "(double-tap-guard|PASS|FAIL)" | head -20
```
Expected: all 5 new tests pass.

- [ ] **Step 6: Migrate `src/definitions/antinote.ts`**

```ts
import { appRegistry } from "../data";
import {
    generateDoubleTapGuardRule,
    type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";

export const antinoteDeleteGuard: DoubleTapGuardConfig = {
  key: "d",
  modifiers: ["left_command"],
  description: "Delete note",
  ifApp: [appRegistry.antinote, appRegistry.antinoteLegacy],
};

export const buildAntinoteDeleteRule = () =>
  generateDoubleTapGuardRule(antinoteDeleteGuard);
```

- [ ] **Step 7: Migrate `buildCmdQRule` in `src/definitions/left-command-chords.ts`**

Keep `buildLeftCommandRule` unchanged for now. Replace only the `buildCmdQRule` export:

```ts
import {
    generateDoubleTapGuardRule,
    type DoubleTapGuardConfig,
} from "../engine/double-tap-guard-rules";
// keep existing imports for buildLeftCommandRule

const LEFT_COMMAND_TAP_DELAY_MS = 600;

export const cmdQGuard: DoubleTapGuardConfig = {
  key: "q",
  modifiers: ["left_command"],
  description: "Quit app",
  timeoutMs: 300,
};

export const buildCmdQRule = () => generateDoubleTapGuardRule(cmdQGuard);

// buildLeftCommandRule stays as-is for now
export const buildLeftCommandRule = () => {
  // ... existing implementation unchanged
};
```

- [ ] **Step 8: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass including `"antinote delete factory keeps double-tap workflow"` and `"cmd-q factory keeps double-tap protection structure"`.

- [ ] **Step 9: Commit**

```bash
git add src/engine/double-tap-guard-rules.ts src/engine/index.ts src/tests/double-tap-guard.test.ts src/definitions/antinote.ts src/definitions/left-command-chords.ts
git commit -m "feat: add generateDoubleTapGuardRule; migrate antinote and cmd-Q"
```

---

## Task 7: Add `generateMultiTapRule` + migrate `escape-monitor.ts` and `buildLeftCommandRule`

**Files:**
- Create: `src/engine/multi-tap-rules.ts`
- Create: `src/tests/multi-tap.test.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/definitions/escape-monitor.ts`
- Modify: `src/definitions/left-command-chords.ts`

- [ ] **Step 1: Write failing tests in `src/tests/multi-tap.test.ts`**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { generateMultiTapRule } from "../engine";
import { TIMINGS } from "../data";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateMultiTapRule produces two manipulators", () => {
  const rule = toRule(
    generateMultiTapRule({
      key: "escape",
      description: "Escape / Kill app",
      alone: [{ type: "key", key: "escape" }],
      tapTapHold: [{ type: "shell", command: "echo kill" }],
      thresholdMs: 300,
      mods: [],
    }),
  );
  assert.equal(rule.manipulators.length, 2);
});

test("generateMultiTapRule description uses multi-tap trigger", () => {
  const rule = toRule(
    generateMultiTapRule({
      key: "escape",
      description: "Escape / Kill app",
      thresholdMs: 300,
      mods: [],
    }),
  );
  assert.equal(rule.description, "[ESC]        →    Escape / Kill app (on multi-tap)");
});

test("generateMultiTapRule throws when tapTap and tapTapHold are both provided", () => {
  assert.throws(
    () =>
      generateMultiTapRule({
        key: "escape",
        description: "Bad config",
        tapTap: [{ type: "key", key: "escape" }],
        tapTapHold: [{ type: "key", key: "escape" }],
        thresholdMs: 300,
        mods: [],
      }),
    /mutually exclusive/,
  );
});

test("generateMultiTapRule auto-derives firstVar from key", () => {
  const rule = toRule(
    generateMultiTapRule({
      key: "escape",
      description: "Test",
      thresholdMs: 300,
      mods: [],
    }),
  );
  // firstVar is used internally in conditions — check the second manipulator's condition
  const secondManipulator: any = rule.manipulators[0];
  assert.ok(
    secondManipulator?.conditions?.some(
      (c: any) => c.name === "multi_tap_escape",
    ),
    "Expected multi_tap_escape variable condition",
  );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test 2>&1 | grep -A3 "multi-tap"
```
Expected: `generateMultiTapRule is not a function`.

- [ ] **Step 3: Create `src/engine/multi-tap-rules.ts`**

```ts
import { rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { varTapTapHold } from "../core/tap-hold";
import { resolveActionToEvents } from "./action-resolver";

export type MultiTapConfig = {
  key: string;
  description: string;
  alone?: ActionSpec[];
  hold?: ActionSpec[];
  tapTap?: ActionSpec[];
  tapTapHold?: ActionSpec[];
  thresholdMs: number;
  allowPassThrough?: boolean;
  mods?: string[];
};

export function generateMultiTapRule(config: MultiTapConfig) {
  const {
    key,
    description,
    alone,
    hold,
    tapTap,
    tapTapHold,
    thresholdMs,
    allowPassThrough = false,
    mods = [],
  } = config;

  if (tapTap && tapTapHold) {
    throw new Error(
      "MultiTapConfig: tapTap and tapTapHold are mutually exclusive",
    );
  }

  const firstVar = `multi_tap_${key}`;

  const manipulators = varTapTapHold({
    key,
    firstVar,
    aloneEvents: alone?.flatMap(resolveActionToEvents),
    holdEvents: hold?.flatMap(resolveActionToEvents),
    tapTapEvents: tapTap?.flatMap(resolveActionToEvents),
    tapTapHoldEvents: tapTapHold?.flatMap(resolveActionToEvents),
    thresholdMs,
    allowPassThrough,
    mods: mods as any,
  });

  return rule(
    formatRuleDescription(key, description, "multi-tap"),
  ).manipulators(manipulators) as any;
}
```

- [ ] **Step 4: Export from `src/engine/index.ts`**

Add:
```ts
export * from "./multi-tap-rules";
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test 2>&1 | grep -E "(multi-tap|✓|✗)" | head -20
```

- [ ] **Step 6: Migrate `src/definitions/escape-monitor.ts`**

```ts
import { map, rule, toKey } from "karabiner.ts";
import { formatRuleDescription } from "../core/rule-descriptions";
import { focusApp } from "../core/scripts";
import { TIMINGS, appRegistry } from "../data";
import { generateMultiTapRule, type MultiTapConfig } from "../engine/multi-tap-rules";
import { generateTapAloneHoldRule, type TapAloneHoldConfig } from "../engine/tap-alone-hold-rules";
// Note: generateTapAloneHoldRule is added in Task 8 — leave buildCtrlEscapeMonitorRule
// as its current implementation until Task 8. Only migrate buildEscapeTapTapHoldRule here.

import { cmd, killAppCommand } from "../core/scripts";

export const escapeTapTapHold: MultiTapConfig = {
  key: "escape",
  description: "Escape / Kill app",
  alone: [{ type: "key", key: "escape" }],
  hold: [{ type: "shell", command: killAppCommand("foreground") }],
  tapTapHold: [{ type: "shell", command: killAppCommand() }],
  thresholdMs: TIMINGS.escapeTapHoldMs,
  mods: [],
};

export const buildEscapeTapTapHoldRule = () =>
  generateMultiTapRule(escapeTapTapHold);

// buildCtrlEscapeMonitorRule stays as-is until Task 8
export const buildCtrlEscapeMonitorRule = () => {
  return rule(
    formatRuleDescription(
      ["left_control", "escape"],
      "Activity Monitor / Process Spy",
      "hold",
    ),
  ).manipulators([
    ...map("escape", "left_control")
      .parameters({
        "basic.to_if_alone_timeout_milliseconds": TIMINGS.mouseDefaultMs,
        "basic.to_if_held_down_threshold_milliseconds": TIMINGS.mouseDefaultMs,
      })
      .toIfAlone(focusApp(appRegistry.activityMonitor))
      .toIfHeldDown(focusApp(appRegistry.processSpy))
      .toDelayedAction([], [focusApp(appRegistry.activityMonitor)])
      .description(
        formatRuleDescription(
          ["left_control", "escape"],
          "Activity Monitor / Process Spy",
          "hold",
        ),
      )
      .build(),
  ]);
};
```

- [ ] **Step 7: Migrate `buildLeftCommandRule` in `src/definitions/left-command-chords.ts`**

Add the `MultiTapConfig` import alongside the existing `DoubleTapGuardConfig` import, then replace `buildLeftCommandRule`:

```ts
import { generateMultiTapRule, type MultiTapConfig } from "../engine/multi-tap-rules";
import { openApp } from "../core/software";
// remove: import { ifVar, map, rule, toKey, toSetVar } from "karabiner.ts";
// remove: import { varTapTapHold } from "../core/tap-hold";

const LEFT_COMMAND_TAP_DELAY_MS = 600;

export const leftCommandMultiTap: MultiTapConfig = {
  key: "left_command",
  description: "Tap/double-tap/hold handler",
  alone: [{ type: "key", key: "left_command" }],
  hold: [{ type: "key", key: "left_command" }],
  tapTap: [{ type: "appHistory", index: 1 }],
  thresholdMs: LEFT_COMMAND_TAP_DELAY_MS,
  allowPassThrough: true,
  mods: [],
};

export const buildLeftCommandRule = () => generateMultiTapRule(leftCommandMultiTap);
```

- [ ] **Step 8: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass including `"escape tap-tap-hold factory"`, `"left command factory keeps dual manipulator behavior"`, and `"left command factory keeps pass-through lcmd"`.

- [ ] **Step 9: Commit**

```bash
git add src/engine/multi-tap-rules.ts src/engine/index.ts src/tests/multi-tap.test.ts src/definitions/escape-monitor.ts src/definitions/left-command-chords.ts
git commit -m "feat: add generateMultiTapRule; migrate escape and left-command"
```

---

## Task 8: Add `generateTapAloneHoldRule` + migrate `buildCtrlEscapeMonitorRule`

**Files:**
- Create: `src/engine/tap-alone-hold-rules.ts`
- Create: `src/tests/tap-alone-hold.test.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/definitions/escape-monitor.ts`

- [ ] **Step 1: Write failing tests in `src/tests/tap-alone-hold.test.ts`**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { appRegistry } from "../data";
import { generateTapAloneHoldRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateTapAloneHoldRule produces one manipulator", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "escape",
      modifiers: ["left_control"],
      description: "Activity Monitor / Process Spy",
      alone: [{ type: "app", ref: "activityMonitor" }],
      hold: [{ type: "app", ref: "processSpy" }],
      timeoutMs: 250,
    }),
  );
  assert.equal(rule.manipulators.length, 1);
});

test("generateTapAloneHoldRule description uses hold trigger", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "escape",
      modifiers: ["left_control"],
      description: "Activity Monitor / Process Spy",
      alone: [{ type: "app", ref: "activityMonitor" }],
      hold: [{ type: "app", ref: "processSpy" }],
      timeoutMs: 250,
    }),
  );
  assert.equal(
    rule.description,
    "[←⌃]+[ESC]        →    Activity Monitor / Process Spy (on hold)",
  );
});

test("generateTapAloneHoldRule cancel action mirrors alone", () => {
  const rule = toRule(
    generateTapAloneHoldRule({
      key: "escape",
      modifiers: ["left_control"],
      description: "Activity Monitor / Process Spy",
      alone: [{ type: "app", ref: "activityMonitor" }],
      hold: [{ type: "app", ref: "processSpy" }],
      timeoutMs: 250,
    }),
  );
  const manipulator: any = rule.manipulators[0];
  // toDelayedAction(invoked=[], canceled=aloneEvents)
  assert.deepEqual(
    manipulator?.to_delayed_action?.to_if_invoked,
    [],
  );
  assert.ok(
    manipulator?.to_delayed_action?.to_if_canceled?.length > 0,
    "Cancel action should mirror alone events",
  );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test 2>&1 | grep -A3 "tap-alone-hold"
```

- [ ] **Step 3: Create `src/engine/tap-alone-hold-rules.ts`**

```ts
import { map, rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";

export type TapAloneHoldConfig = {
  key: string;
  modifiers?: string[];
  description: string;
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
};

export function generateTapAloneHoldRule(config: TapAloneHoldConfig) {
  const { key, modifiers, description, alone, hold, timeoutMs } = config;

  const aloneEvents = alone.flatMap(resolveActionToEvents);
  const holdEvents = hold.flatMap(resolveActionToEvents);

  const chord = modifiers ? [...modifiers, key] : key;
  const ruleDescription = formatRuleDescription(chord, description, "hold");

  const builder = map(key as any, (modifiers as any) ?? undefined)
    .parameters({
      "basic.to_if_alone_timeout_milliseconds": timeoutMs,
      "basic.to_if_held_down_threshold_milliseconds": timeoutMs,
    });

  aloneEvents.forEach((e) => builder.toIfAlone(e));
  holdEvents.forEach((e) => builder.toIfHeldDown(e));

  builder
    .toDelayedAction([], aloneEvents)
    .description(ruleDescription);

  return rule(ruleDescription).manipulators(builder.build()) as any;
}
```

- [ ] **Step 4: Export from `src/engine/index.ts`**

Add:
```ts
export * from "./tap-alone-hold-rules";
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test 2>&1 | grep -E "tap-alone" | head -10
```

- [ ] **Step 6: Complete the migration of `src/definitions/escape-monitor.ts`**

Replace the remaining bespoke `buildCtrlEscapeMonitorRule` with the engine function. The full file becomes:

```ts
import { TIMINGS, appRegistry } from "../data";
import { killAppCommand } from "../core/scripts";
import { generateMultiTapRule, type MultiTapConfig } from "../engine/multi-tap-rules";
import { generateTapAloneHoldRule, type TapAloneHoldConfig } from "../engine/tap-alone-hold-rules";

export const escapeTapTapHold: MultiTapConfig = {
  key: "escape",
  description: "Escape / Kill app",
  alone: [{ type: "key", key: "escape" }],
  hold: [{ type: "shell", command: killAppCommand("foreground") }],
  tapTapHold: [{ type: "shell", command: killAppCommand() }],
  thresholdMs: TIMINGS.escapeTapHoldMs,
  mods: [],
};

export const ctrlEscapeConfig: TapAloneHoldConfig = {
  key: "escape",
  modifiers: ["left_control"],
  description: "Activity Monitor / Process Spy",
  alone: [{ type: "app", ref: "activityMonitor" }],
  hold: [{ type: "app", ref: "processSpy" }],
  timeoutMs: TIMINGS.mouseDefaultMs,
};

export const buildEscapeTapTapHoldRule = () =>
  generateMultiTapRule(escapeTapTapHold);

export const buildCtrlEscapeMonitorRule = () =>
  generateTapAloneHoldRule(ctrlEscapeConfig);
```

- [ ] **Step 7: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass including `"ctrl-escape monitor factory keeps single manipulator"`.

- [ ] **Step 8: Commit**

```bash
git add src/engine/tap-alone-hold-rules.ts src/engine/index.ts src/tests/tap-alone-hold.test.ts src/definitions/escape-monitor.ts
git commit -m "feat: add generateTapAloneHoldRule; complete escape-monitor migration"
```

---

## Task 9: Add `generatePointerRemapRule` + migrate `buildOnePieceClickEnterRule`

**Files:**
- Create: `src/engine/pointer-remap-rules.ts`
- Create: `src/tests/pointer-remap.test.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/definitions/special-keys.ts`

- [ ] **Step 1: Write failing tests in `src/tests/pointer-remap.test.ts`**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { appRegistry } from "../data";
import { generatePointerRemapRule } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generatePointerRemapRule produces one manipulator", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      description: "Left click -> enter",
      to: [{ type: "key", key: "return_or_enter" }],
    }),
  );
  assert.equal(rule.manipulators.length, 1);
});

test("generatePointerRemapRule uses pointing_button in from", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      description: "Left click -> enter",
      to: [{ type: "key", key: "return_or_enter" }],
    }),
  );
  assert.deepEqual(rule.manipulators[0]?.from, { pointing_button: "button1" });
});

test("generatePointerRemapRule attaches ifApp condition when provided", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      description: "Left click -> enter",
      to: [{ type: "key", key: "return_or_enter" }],
      ifApp: appRegistry.onePiece,
    }),
  );
  assert.ok(
    rule.manipulators[0]?.conditions?.some(
      (c: any) => c.type === "frontmost_application_if",
    ),
  );
});

test("generatePointerRemapRule includes modifiers in from when provided", () => {
  const rule = toRule(
    generatePointerRemapRule({
      button: "button1",
      modifiers: ["left_command"],
      description: "Cmd-click",
      to: [{ type: "key", key: "return_or_enter" }],
    }),
  );
  assert.deepEqual(rule.manipulators[0]?.from, {
    pointing_button: "button1",
    modifiers: { mandatory: ["left_command"] },
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test 2>&1 | grep -A3 "pointer-remap"
```

- [ ] **Step 3: Create `src/engine/pointer-remap-rules.ts`**

```ts
import { ifApp, rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";

export type PointerRemapConfig = {
  button: string;
  modifiers?: string[];
  description: string;
  to: ActionSpec[];
  ifApp?: string | string[];
};

export function generatePointerRemapRule(config: PointerRemapConfig) {
  const { button, modifiers, description, to, ifApp: appScope } = config;

  const toEvents = to.flatMap(resolveActionToEvents);

  const from: Record<string, unknown> = { pointing_button: button };
  if (modifiers?.length) {
    from.modifiers = { mandatory: modifiers };
  }

  const conditions: unknown[] = [];
  if (appScope) {
    const appIds = Array.isArray(appScope) ? appScope : [appScope];
    conditions.push(ifApp(appIds).build());
  }

  const ruleDescription = formatRuleDescription(button, description, "tap");

  const manipulator: Record<string, unknown> = {
    type: "basic",
    from,
    to: toEvents,
    description: ruleDescription,
  };
  if (conditions.length) {
    manipulator.conditions = conditions;
  }

  return rule(ruleDescription).manipulators([manipulator as any]) as any;
}
```

- [ ] **Step 4: Export from `src/engine/index.ts`**

Add:
```ts
export * from "./pointer-remap-rules";
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test 2>&1 | grep -E "pointer-remap" | head -10
```

- [ ] **Step 6: Migrate `buildOnePieceClickEnterRule` in `src/definitions/special-keys.ts`**

Add import and replace `buildOnePieceClickEnterRule`:

```ts
import {
    generatePointerRemapRule,
    type PointerRemapConfig,
} from "../engine/pointer-remap-rules";

export const onePieceClickEnter: PointerRemapConfig = {
  button: "button1",
  description: "OnePiece left click -> enter",
  to: [{ type: "key", key: "return_or_enter" }],
  ifApp: appRegistry.onePiece,
};

export const buildOnePieceClickEnterRule = () =>
  generatePointerRemapRule(onePieceClickEnter);
```

Remove the old `buildOnePieceClickEnterRule` implementation. Remove now-unused imports (`ifApp`, `rule`, `toKey` from karabiner.ts) if nothing else in the file uses them.

- [ ] **Step 7: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass including `"onepiece click-enter factory keeps app-scoped left click remap"`.

- [ ] **Step 8: Commit**

```bash
git add src/engine/pointer-remap-rules.ts src/engine/index.ts src/tests/pointer-remap.test.ts src/definitions/special-keys.ts
git commit -m "feat: add generatePointerRemapRule; migrate OnePiece click-enter rule"
```

---

## Task 10: Add `generateModifierChordRules` + migrate `hyper-chords.ts`

**Files:**
- Create: `src/engine/modifier-chord-rules.ts`
- Create: `src/tests/modifier-chord.test.ts`
- Modify: `src/engine/index.ts`
- Modify: `src/definitions/hyper-chords.ts`

- [ ] **Step 1: Write failing tests in `src/tests/modifier-chord.test.ts`**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { generateModifierChordRules } from "../engine";

function toRule(input: any): any {
  return typeof input?.build === "function" ? input.build() : input;
}

test("generateModifierChordRules produces one manipulator per variant plus base", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "Test chord rule",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
      },
      variants: [
        {
          modifiers: ["left_shift"],
          description: "Super",
          to: [{ type: "key", key: "left_shift", modifiers: ["left_command", "left_option", "left_control"] }],
        },
      ],
    }),
  );
  assert.equal(rule.manipulators.length, 2); // 1 base + 1 variant
});

test("generateModifierChordRules uses ruleName as rule description", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "[CAPS]        →    HSLauncher / Hyper / Super / Meh (on hold)",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
      },
      variants: [],
    }),
  );
  assert.equal(
    rule.description,
    "[CAPS]        →    HSLauncher / Hyper / Super / Meh (on hold)",
  );
});

test("generateModifierChordRules trackVar adds setVar and afterKeyUp events", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "Test",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
        trackVar: "caps_lock_pressed",
      },
      variants: [],
    }),
  );
  const base: any = rule.manipulators[0];
  assert.ok(
    base?.to?.some((e: any) => e.set_variable?.name === "caps_lock_pressed"),
    "Expected set_variable in to events",
  );
  assert.ok(
    base?.to_after_key_up?.some(
      (e: any) => e.set_variable?.name === "caps_lock_pressed",
    ),
    "Expected set_variable in to_after_key_up",
  );
});

test("generateModifierChordRules variant uses mandatory modifiers in from", () => {
  const rule = toRule(
    generateModifierChordRules({
      ruleName: "Test",
      base: {
        key: "caps_lock",
        description: "Hyper",
        to: [{ type: "key", key: "left_command", modifiers: ["left_control", "left_option"] }],
      },
      variants: [
        {
          modifiers: ["left_shift"],
          description: "Super",
          to: [{ type: "key", key: "left_shift", modifiers: ["left_command"] }],
        },
      ],
    }),
  );
  const variant: any = rule.manipulators[1];
  assert.deepEqual(variant?.from?.modifiers?.mandatory, ["left_shift"]);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test 2>&1 | grep -A3 "modifier-chord"
```

- [ ] **Step 3: Create `src/engine/modifier-chord-rules.ts`**

```ts
import { map, rule, toSetVar } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import { resolveActionToEvents } from "./action-resolver";

export type ModifierChordBase = {
  key: string;
  description: string;
  to: ActionSpec[];
  toIfAlone?: ActionSpec[];
  trackVar?: string;
};

export type ModifierChordVariant = {
  modifiers: string[];
  description: string;
  to: ActionSpec[];
};

export type ModifierChordConfig = {
  ruleName: string;
  base: ModifierChordBase;
  variants: ModifierChordVariant[];
};

export function generateModifierChordRules(config: ModifierChordConfig) {
  const { ruleName, base, variants } = config;

  const baseBuilder = map(base.key as any);

  if (base.trackVar) {
    baseBuilder.to(toSetVar(base.trackVar, 1));
    baseBuilder.toAfterKeyUp(toSetVar(base.trackVar, 0));
  }

  base.to.flatMap(resolveActionToEvents).forEach((e) => baseBuilder.to(e));

  if (base.toIfAlone) {
    base.toIfAlone
      .flatMap(resolveActionToEvents)
      .forEach((e) => baseBuilder.toIfAlone(e));
  }

  baseBuilder.description(
    formatRuleDescription(base.key, base.description, "hold"),
  );

  const variantManipulators = variants.flatMap((variant) => {
    const builder = map(base.key as any, variant.modifiers as any);
    variant.to.flatMap(resolveActionToEvents).forEach((e) => builder.to(e));
    builder.description(
      formatRuleDescription(
        [...variant.modifiers, base.key],
        variant.description,
        "hold",
      ),
    );
    return builder.build();
  });

  return rule(ruleName).manipulators([
    ...baseBuilder.build(),
    ...variantManipulators,
  ]) as any;
}
```

- [ ] **Step 4: Export from `src/engine/index.ts`**

Add:
```ts
export * from "./modifier-chord-rules";
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test 2>&1 | grep -E "modifier-chord" | head -10
```

- [ ] **Step 6: Migrate `src/definitions/hyper-chords.ts`**

```ts
import { HYPER, L } from "../core/mods";
import { formatRuleDescription } from "../core/rule-descriptions";
import {
    generateModifierChordRules,
    type ModifierChordConfig,
} from "../engine/modifier-chord-rules";

export const capsLockChordConfig: ModifierChordConfig = {
  ruleName: formatRuleDescription(
    "caps_lock",
    "HSLauncher / Hyper / Super / Meh",
    "hold",
  ),
  base: {
    key: "caps_lock",
    description: "HSLauncher / Hyper",
    to: [
      {
        type: "key",
        key: L.cmd,
        modifiers: [L.ctrl, L.opt],
      },
    ],
    toIfAlone: [
      {
        type: "key",
        key: "f15",
        modifiers: HYPER,
      },
    ],
    trackVar: "caps_lock_pressed",
  },
  variants: [
    {
      modifiers: [L.shift],
      description: "Super",
      to: [
        {
          type: "key",
          key: L.shift,
          modifiers: [L.cmd, L.opt, L.ctrl],
        },
      ],
    },
    {
      modifiers: [L.ctrl],
      description: "Meh",
      to: [
        {
          type: "key",
          key: L.cmd,
          modifiers: [L.opt, L.shift],
        },
      ],
    },
  ],
};

export const buildCapsLockRule = () =>
  generateModifierChordRules(capsLockChordConfig);
```

- [ ] **Step 7: Run tests and typecheck**

```bash
npm test && npm run typecheck
```
Expected: all tests pass including `"caps lock factory keeps three behavior variants"`.

- [ ] **Step 8: Commit**

```bash
git add src/engine/modifier-chord-rules.ts src/engine/index.ts src/tests/modifier-chord.test.ts src/definitions/hyper-chords.ts
git commit -m "feat: add generateModifierChordRules; migrate hyper-chords caps lock rule"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `sequence` added to ActionSpec + resolver — Task 1
- ✅ `generateConditionalTapHoldRules` migrated to ActionSpec — Task 2
- ✅ `generateConditionalActionRules` migrated to ActionSpec — Task 3
- ✅ `generateModifierLauncherRules` migrated + extended; `hyper-plus.ts` migrated — Task 4
- ✅ `generateAppScopedRemapRules` added; `skim.ts` migrated — Task 5
- ✅ `generateDoubleTapGuardRule` added; `antinote.ts` + `buildCmdQRule` migrated — Task 6
- ✅ `generateMultiTapRule` added; `escape-monitor.ts` + `buildLeftCommandRule` migrated — Tasks 7-8
- ✅ `generateTapAloneHoldRule` added; `buildCtrlEscapeMonitorRule` migrated — Task 8
- ✅ `generatePointerRemapRule` added; `buildOnePieceClickEnterRule` migrated — Task 9
- ✅ `generateModifierChordRules` added; `hyper-chords.ts` migrated — Task 10
- ✅ `TapHoldActionSpec`/`ConditionalAction`/`LauncherAction` deleted — Tasks 2, 3, 4
- ✅ Unit tests for each new engine function — Tasks 5-10

**Per-file migration map check:**
- ✅ `definitions/special-keys.ts` — type updates (Task 2) + PointerRemapConfig (Task 9)
- ✅ `definitions/security.ts` — type updates (Task 3)
- ✅ `definitions/right-option-launchers.ts` — type updates (Task 4)
- ✅ All bespoke files migrated

**Note for implementer on Task 4:** Verify `resolveActionToEvents` for `{ type: "app", ref: "...", mode: "focus" }` produces the same output as the old `focusApp(bundleId)` call. The integration test (`npm run check`) provides the authoritative regression check — run it after all tasks complete.
