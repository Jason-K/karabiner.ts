export type DisabledShortcutMapping = {
  key: string;
  modifiers: string[];
  description: string;
};

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
