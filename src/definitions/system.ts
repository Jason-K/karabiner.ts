import { ACCESSIBILITY_VALUES, ACCESSIBILITY_VARIABLES } from "../data";
import { QUICK_FILL_APP_BUNDLE_IDENTIFIERS } from "../data/apps";
import { commandRegistry } from "../data/commands";
import {
  generateConditionalActionRules,
  type ConditionalActionMapping,
} from "../engine/conditional-action-rules";
import {
  generateDisabledShortcutRules,
  type DisabledShortcutMapping,
} from "../engine/simple-rules";

export const disabledShortcuts: DisabledShortcutMapping[] = [
  {
    key: "h",
    modifiers: ["left_command"],
    description: "Disabled hide shortcut",
  },
  {
    key: "h",
    modifiers: ["left_command", "left_option"],
    description: "Disabled hide others shortcut",
  },
  {
    key: "m",
    modifiers: ["left_command", "left_option"],
    description: "Disabled minimize shortcut",
  },
];

export const passwordsQuickFillMapping: ConditionalActionMapping = {
  key: "slash",
  modifiers: ["left_command"],
  description: "Quick fill password",
  variants: [
    {
      when: [
        {
          type: "frontmostApp",
          bundleIds: QUICK_FILL_APP_BUNDLE_IDENTIFIERS,
        },
        {
          type: "variable",
          name: ACCESSIBILITY_VARIABLES.focusedUiRole,
          match: "if",
          value: ACCESSIBILITY_VALUES.textFieldRole,
        },
        {
          type: "variable",
          name: ACCESSIBILITY_VARIABLES.focusedUiSubrole,
          match: "if",
          value: ACCESSIBILITY_VALUES.secureTextFieldSubrole,
        },
      ],
      actions: [
        {
          type: "shell",
          command: commandRegistry.fillPassword,
        },
      ],
    },
    {
      when: [
        {
          type: "frontmostApp",
          bundleIds: QUICK_FILL_APP_BUNDLE_IDENTIFIERS,
        },
        {
          type: "variable",
          name: ACCESSIBILITY_VARIABLES.focusedUiRole,
          match: "if",
          value: ACCESSIBILITY_VALUES.textFieldRole,
        },
        {
          type: "variable",
          name: ACCESSIBILITY_VARIABLES.focusedUiSubrole,
          match: "unless",
          value: ACCESSIBILITY_VALUES.secureTextFieldSubrole,
        },
      ],
      actions: [
        {
          type: "shell",
          command: commandRegistry.fillUsernameAndPassword,
        },
      ],
    },
  ],
};

export const buildDisableHideMinimizeRule = () =>
  generateDisabledShortcutRules(disabledShortcuts);

export const buildPasswordsQuickFillRule = () =>
  generateConditionalActionRules([passwordsQuickFillMapping])[0]!;
