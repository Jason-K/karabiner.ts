import { APPS, CMDS, PW_BUNDLES, WIN_VALS, WIN_VARS } from "../data";
import { defineBindings, type Binding } from "../engine";

// CMD+/ quick-fill: dispatches by text-field role. Two press cases share the
// frontmost-app + focused-UI-role guard; the secure vs non-secure subrole
// distinguishes password-only from username+password fill.
export const passwordsQuickFillBinding: Binding = {
  trigger: { keys: ["slash"], modifiers: ["left_command"] },
  cases: [
    {
      // AUTHENTICATION DIALOG fill password.
      phase: "press",
      conditions: [
        { app: PW_BUNDLES },
        {
          var: WIN_VARS.focusedUiRole,
          equals: WIN_VALS.textFieldRole,
        },
        {
          var: WIN_VARS.focusedUiSubrole,
          equals: WIN_VALS.secureTextFieldSubrole,
        },
      ],
      do: [{ type: "command", ref: CMDS.fillPassword }],
    },
    {
      // AUTHENTICATION DIALOG: fill username and password.
      phase: "press",
      conditions: [
        { app: PW_BUNDLES },
        {
          var: WIN_VARS.focusedUiRole,
          equals: WIN_VALS.textFieldRole,
        },
        {
          var: WIN_VARS.focusedUiSubrole,
          equals: WIN_VALS.secureTextFieldSubrole,
          unless: true,
        },
      ],
      do: [{ type: "command", ref: CMDS.fillUsernameAndPassword }],
    },
    {
      // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
      phase: "press",
      conditions: [{ app: APPS.word }],
      do: [{ type: "shell", command: CMDS.getWordDocPathAndPrivileges }],
    },
  ],
};

export const buildPasswordsQuickFillRule = () =>
  defineBindings([passwordsQuickFillBinding])[0]!;
