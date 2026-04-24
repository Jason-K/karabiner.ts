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
const QUICK_FILL_POST_ELEVATION_DELAY_MS = 1300;
const QUICK_FILL_APP_BUNDLE_IDENTIFIERS = [
  "com.apple.SecurityAgent",
  "com.apple.systempreferences",
  "com.apple.settings.PrivacySecurity.extension",
];
const FOCUSED_UI_ROLE_VARIABLE = "accessibility.focused_ui_element.role_string";
const FOCUSED_UI_SUBROLE_VARIABLE =
  "accessibility.focused_ui_element.subrole_string";
const AX_TEXT_FIELD_ROLE = "AXTextField";
const AX_SECURE_TEXT_FIELD_SUBROLE = "AXSecureTextField";

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
            bundleIds: ["com.microsoft.Word"],
          },
        ],
        actions: [
          {
            type: "applescript",
            scriptPath:
              "~/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript",
          },
          {
            type: "shell",
            command:
              "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a && sleep 1.3",
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
            name: FOCUSED_UI_ROLE_VARIABLE,
            match: "if",
            value: AX_TEXT_FIELD_ROLE,
          },
          {
            type: "variable",
            name: FOCUSED_UI_SUBROLE_VARIABLE,
            match: "if",
            value: AX_SECURE_TEXT_FIELD_SUBROLE,
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
          delayedActionDelayMs: QUICK_FILL_POST_ELEVATION_DELAY_MS,
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
            name: FOCUSED_UI_ROLE_VARIABLE,
            match: "if",
            value: AX_TEXT_FIELD_ROLE,
          },
          {
            type: "variable",
            name: FOCUSED_UI_SUBROLE_VARIABLE,
            match: "unless",
            value: AX_SECURE_TEXT_FIELD_SUBROLE,
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
          delayedActionDelayMs: QUICK_FILL_POST_ELEVATION_DELAY_MS,
        },
      },
    ],
  },
];
