import {
  ACCESSIBILITY_VALUES,
  ACCESSIBILITY_VARIABLES,
  appRegistry,
} from "../data";
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

const QUICK_FILL_ELEVATE_PRIVILEGES_CMD =
  "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a && sleep 1.3";
const QUICK_FILL_APP_BUNDLE_IDENTIFIERS = [
  appRegistry.securityAgent,
  appRegistry.settings,
  appRegistry.settingsPrivacySecurityExtension,
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
          type: "sequence",
          actions: [
            { type: "shell", command: QUICK_FILL_ELEVATE_PRIVILEGES_CMD },
            {
              type: "key",
              key: "slash",
              modifiers: ["hyper"],
              options: { repeat: false },
            },
          ],
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
          type: "sequence",
          actions: [
            { type: "shell", command: QUICK_FILL_ELEVATE_PRIVILEGES_CMD },
            { type: "key", key: "a", modifiers: ["left_command"] },
            { type: "key", key: "j", modifiers: ["left_shift"] },
            { type: "key", key: "a" },
            { type: "key", key: "s" },
            { type: "key", key: "o" },
            { type: "key", key: "n" },
            { type: "key", key: "tab" },
            {
              type: "key",
              key: "slash",
              modifiers: ["hyper"],
              options: { repeat: false },
            },
          ],
        },
      ],
    },
  ],
};

export const buildDisableHideMinimizeRule = () =>
  generateDisabledShortcutRules(disabledShortcuts);

export const buildPasswordsQuickFillRule = () =>
  generateConditionalActionRules([passwordsQuickFillMapping])[0]!;
