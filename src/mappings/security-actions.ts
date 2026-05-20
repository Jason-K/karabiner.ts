import {
  ACCESSIBILITY_VALUES,
  ACCESSIBILITY_VARIABLES,
  PATHS,
  TIMINGS,
  appRegistry,
} from "../constants";

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

export type ConditionalAction =
  | {
      type: "key";
      key: string;
      modifiers?: string[];
      options?: {
        repeat?: boolean;
        halt?: boolean;
      };
    }
  | {
      type: "shell";
      command: string;
    }
  | {
      type: "applescript";
      scriptPath: string;
      args?: string[];
    };

export type ConditionalActionVariant = {
  when: ConditionalActionCondition[];
  actions: ConditionalAction[];
  delayedAction?: {
    invoked: ConditionalAction[];
    canceled: ConditionalAction[];
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
            {
              type: "key",
              key: "a",
              modifiers: ["command"],
            },
            {
              type: "key",
              key: "j",
              modifiers: ["shift"],
            },
            {
              type: "key",
              key: "a",
            },
            {
              type: "key",
              key: "s",
            },
            {
              type: "key",
              key: "o",
            },
            {
              type: "key",
              key: "n",
            },
            {
              type: "key",
              key: "tab",
            },
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
