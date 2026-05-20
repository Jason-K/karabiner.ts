import {
  ACCESSIBILITY_VALUES,
  ACCESSIBILITY_VARIABLES,
  PATHS,
  TIMINGS,
  appRegistry,
} from "../constants";
import {
  generateConditionalActionRules,
  type ConditionalActionMapping,
} from "../generators/conditional-action-rules";
import {
  generateDisabledShortcutRules,
  type DisabledShortcutMapping,
} from "../generators/simple-rules";

export const disabledShortcuts: DisabledShortcutMapping[] = [
  {
    key: "h",
    modifiers: ["left_command"],
    description: "Disabled hide shortcut",
  },
  {
    key: "h",
    modifiers: ["left_command", "option"],
    description: "Disabled hide others shortcut",
  },
  {
    key: "m",
    modifiers: ["left_command", "option"],
    description: "Disabled minimize shortcut",
  },
];

const QUICK_FILL_ELEVATE_PRIVILEGES_CMD =
  "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a";
const QUICK_FILL_APP_BUNDLE_IDENTIFIERS = [
  appRegistry.securityAgent,
  appRegistry.settings,
  appRegistry.settingsPrivacySecurityExtension,
];

export const securitySlashActionMappings: ConditionalActionMapping[] = [
  {
    key: "slash",
    modifiers: ["left_command"],
    description: "Copy document name and elevate privileges",
    variants: [
      {
        when: [
          {
            type: "frontmostApp",
            bundleIds: [appRegistry.word],
          },
        ],
        actions: [
          {
            type: "applescript",
            scriptPath: PATHS.wordDocumentPathAppleScript,
          },
          {
            type: "shell",
            command: `${QUICK_FILL_ELEVATE_PRIVILEGES_CMD} && sleep ${TIMINGS.privilegesPostElevationDelayMs / 1000}`,
          },
        ],
      },
    ],
  },
  {
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
            command: QUICK_FILL_ELEVATE_PRIVILEGES_CMD,
          },
        ],
        delayedAction: {
          invoked: [
            {
              type: "key",
              key: "slash",
              modifiers: ["command", "option", "control"],
              options: { repeat: false },
            },
          ],
          canceled: [],
        },
        parameters: {
          delayedActionDelayMs: TIMINGS.privilegesPostElevationDelayMs,
        },
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
            command: QUICK_FILL_ELEVATE_PRIVILEGES_CMD,
          },
        ],
        delayedAction: {
          invoked: [
            { type: "key", key: "a", modifiers: ["command"] },
            { type: "key", key: "j", modifiers: ["shift"] },
            { type: "key", key: "a" },
            { type: "key", key: "s" },
            { type: "key", key: "o" },
            { type: "key", key: "n" },
            { type: "key", key: "tab" },
            {
              type: "key",
              key: "slash",
              modifiers: ["command", "option", "control"],
              options: { repeat: false },
            },
          ],
          canceled: [],
        },
        parameters: {
          delayedActionDelayMs: TIMINGS.privilegesPostElevationDelayMs,
        },
      },
    ],
  },
];

export const buildDisableHideMinimizeRule = () =>
  generateDisabledShortcutRules(disabledShortcuts);

export const buildWordPrivilegesRule = () =>
  generateConditionalActionRules([securitySlashActionMappings[0]!])[0]!;

export const buildPasswordsQuickFillRule = () =>
  generateConditionalActionRules([securitySlashActionMappings[1]!])[0]!;
