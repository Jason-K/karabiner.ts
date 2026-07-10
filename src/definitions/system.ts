import {
  ACCESSIBILITY_VALUES,
  ACCESSIBILITY_VARIABLES,
  appRegistry,
  PATHS,
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

const GET_PRIVILEGES = `${PATHS.privCLI} -a && sleep 1.3`;
const FILL_PW_CLICLICK = `${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.cliclick} kd:cmd,alt,ctrl t:\/ ku:cmd,alt,ctrl`;
const FILL_UN_PW_CLICLICK = `${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.cliclick} kd:cmd t:a ku:cmd t:Jason w:100 kp:tab w:100 kd:cmd,alt,ctrl t:\/ ku:cmd,alt,ctrl`;
const FILL_PW_SENDKEYS = `${PATHS.privCLI} -r && sleep 0.1 && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters \"<c:\/:command,option,control>\"`;
const FILL_UN_PW_SENDKEYS = `${PATHS.privCLI} -r && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters \"<c:a:command>Jason<c:tab><c:\/:command,option,control>\"`;

const QUICK_FILL_APP_BUNDLE_IDENTIFIERS = [
  appRegistry.securityAgent,
  appRegistry.settings,
  appRegistry.settingsPrivacySecurityExtension,
  appRegistry.brewUpdater,
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
          command: FILL_PW_SENDKEYS,
        },
        //   actions: [
        //     { type: "shell", command: GET_PRIVILEGES },
        //     {
        //       type: "key",
        //       key: "slash",
        //       modifiers: ["vmCOC_"],
        //       options: { repeat: false },
        //     },
        //   ],
        // },
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
          command: FILL_UN_PW_SENDKEYS,
        },
        // {
        //   type: "sequence",
        //   actions: [
        //     { type: "shell", command: GET_PRIVILEGES },
        //     { type: "key", key: "a", modifiers: ["left_command"] },
        //     { type: "key", key: "j", modifiers: ["left_shift"] },
        //     { type: "key", key: "a" },
        //     { type: "key", key: "s" },
        //     { type: "key", key: "o" },
        //     { type: "key", key: "n" },
        //     { type: "key", key: "tab" },
        //     {
        //       type: "key",
        //       key: "slash",
        //       modifiers: ["vmCOC_"],
        //       options: { repeat: false },
        //     },
        //   ],
        // },
      ],
    },
  ],
};

export const buildDisableHideMinimizeRule = () =>
  generateDisabledShortcutRules(disabledShortcuts);

export const buildPasswordsQuickFillRule = () =>
  generateConditionalActionRules([passwordsQuickFillMapping])[0]!;
