const variable = (name: string, varDesc: string) => ({ name, varDesc });

export const AccessibilityVariables = {
  focusedUiRole: variable(
    "accessibility.focused_ui_element.role_string",
    "Focused UI role",
  ),
  focusedUiSubrole: variable(
    "accessibility.focused_ui_element.subrole_string",
    "Focused UI subrole",
  ),
} as const;

export const AccessibilityValues = {
  textFieldRole: "AXTextField",
  secureTextFieldSubrole: "AXSecureTextField",
} as const;

export type AccessibilityVariable = import("./refs").VarSpec;

