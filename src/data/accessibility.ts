const v = (name: string, varDesc: string) => ({ name, varDesc });

export const ACCESSIBILITY_VARIABLES = {
  focusedUiRole: v(
    "accessibility.focused_ui_element.role_string",
    "Focused UI role",
  ),
  focusedUiSubrole: v(
    "accessibility.focused_ui_element.subrole_string",
    "Focused UI subrole",
  ),
} as const;

export const ACCESSIBILITY_VALUES = {
  textFieldRole: "AXTextField",
  secureTextFieldSubrole: "AXSecureTextField",
} as const;
