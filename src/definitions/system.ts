import { AccessibilityValues, AccessibilityVariables } from "../data";
import { QUICK_FILL_APP_BUNDLE_IDENTIFIERS, Apps } from "../data/apps";
import { Commands } from "../data/commands";
import { defineBindings, type Binding } from "../engine";

// Disabled shortcuts swallow the chord entirely (noop = no `to` events).
export const disabledShortcutBindings: Binding[] = [
  {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    trigger: { keys: ["h"], modifiers: ["left_command", "option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    trigger: { keys: ["m"], modifiers: ["left_command", "option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
  {
    trigger: { keys: ["d"], modifiers: ["left_command"] },
    conditions: [{ app: Apps.antinote }],
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  },
];

// CMD+/ quick-fill: dispatches by text-field role. Two press cases share the
// frontmost-app + focused-UI-role guard; the secure vs non-secure subrole
// distinguishes password-only from username+password fill.
export const passwordsQuickFillBinding: Binding = {
  trigger: { keys: ["slash"], modifiers: ["left_command"] },
  cases: [
    {
      phase: "press",
      conditions: [
        { app: QUICK_FILL_APP_BUNDLE_IDENTIFIERS },
        {
          var: AccessibilityVariables.focusedUiRole,
          equals: AccessibilityValues.textFieldRole,
        },
        {
          var: AccessibilityVariables.focusedUiSubrole,
          equals: AccessibilityValues.secureTextFieldSubrole,
        },
      ],
      do: [{ type: "command", ref: Commands.fillPassword }],
    },
    {
      phase: "press",
      conditions: [
        { app: QUICK_FILL_APP_BUNDLE_IDENTIFIERS },
        {
          var: AccessibilityVariables.focusedUiRole,
          equals: AccessibilityValues.textFieldRole,
        },
        {
          var: AccessibilityVariables.focusedUiSubrole,
          equals: AccessibilityValues.secureTextFieldSubrole,
          unless: true,
        },
      ],
      do: [
        { type: "command", ref: Commands.fillUsernameAndPassword },
      ],
    },
  ],
};

export const buildDisableHideMinimizeRule = () =>
  defineBindings(disabledShortcutBindings);

export const buildPasswordsQuickFillRule = () =>
  defineBindings([passwordsQuickFillBinding])[0]!;
