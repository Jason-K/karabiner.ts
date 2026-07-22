import { formatRuleDescription } from "../core/rule-descriptions";
import { ACCESSIBILITY_VALUES, ACCESSIBILITY_VARIABLES } from "../data";
import { QUICK_FILL_APP_BUNDLE_IDENTIFIERS } from "../data/apps";
import { commandRegistry } from "../data/commands";
import { defineBindings, type Binding } from "../engine";

// Disabled shortcuts swallow the chord entirely (noop = no `to` events).
export const disabledShortcutBindings: Binding[] = [
  {
    description: formatRuleDescription(
      ["left_command", "h"],
      "Disabled hide shortcut",
      "tap",
    ),
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    description: formatRuleDescription(
      ["left_command", "left_option", "h"],
      "Disabled hide others shortcut",
      "tap",
    ),
    trigger: { keys: ["h"], modifiers: ["left_command", "left_option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    description: formatRuleDescription(
      ["left_command", "left_option", "m"],
      "Disabled minimize shortcut",
      "tap",
    ),
    trigger: { keys: ["m"], modifiers: ["left_command", "left_option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
];

// CMD+/ quick-fill: dispatches by text-field role. Two press cases share the
// frontmost-app + focused-UI-role guard; the secure vs non-secure subrole
// distinguishes password-only from username+password fill.
export const passwordsQuickFillBinding: Binding = {
  description: formatRuleDescription(
    ["left_command", "slash"],
    "Quick fill password",
    "tap",
  ),
  trigger: { keys: ["slash"], modifiers: ["left_command"] },
  cases: [
    {
      phase: "press",
      conditions: [
        { app: QUICK_FILL_APP_BUNDLE_IDENTIFIERS },
        {
          var: ACCESSIBILITY_VARIABLES.focusedUiRole,
          equals: ACCESSIBILITY_VALUES.textFieldRole,
        },
        {
          var: ACCESSIBILITY_VARIABLES.focusedUiSubrole,
          equals: ACCESSIBILITY_VALUES.secureTextFieldSubrole,
        },
      ],
      do: [{ type: "shell", command: commandRegistry.fillPassword }],
    },
    {
      phase: "press",
      conditions: [
        { app: QUICK_FILL_APP_BUNDLE_IDENTIFIERS },
        {
          var: ACCESSIBILITY_VARIABLES.focusedUiRole,
          equals: ACCESSIBILITY_VALUES.textFieldRole,
        },
        {
          var: ACCESSIBILITY_VARIABLES.focusedUiSubrole,
          equals: ACCESSIBILITY_VALUES.secureTextFieldSubrole,
          unless: true,
        },
      ],
      do: [
        { type: "shell", command: commandRegistry.fillUsernameAndPassword },
      ],
    },
  ],
};

export const buildDisableHideMinimizeRule = () =>
  defineBindings(disabledShortcutBindings);

export const buildPasswordsQuickFillRule = () =>
  defineBindings([passwordsQuickFillBinding])[0]!;
