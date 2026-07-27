import {
  AccessibilityValues,
  AccessibilityVariables,
  Apps,
  Commands,
  QUICK_FILL_APP_BUNDLE_IDENTIFIERS,
} from "../data";
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
      // AUTHENTICATION DIALOG: fill username and password.
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
      do: [{ type: "command", ref: Commands.fillUsernameAndPassword }],
    },
    {
      // MICROSOFT WORD: get the path to the active document and elevate privileges for upload to Merus
      phase: "press",
      conditions: [{ app: Apps.word }],
      do: [{ type: "shell", command: Commands.getWordDocPathAndPrivileges }],
    },
  ],
};

export const buildPasswordsQuickFillRule = () =>
  defineBindings([passwordsQuickFillBinding])[0]!;
