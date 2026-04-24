export type SimpleRemapMapping = {
  from: {
    key: string;
    modifiers?: string[];
  };
  description: string;
  to: {
    key: string;
    modifiers?: string[];
  };
};

export const homeEndNavigationMappings: SimpleRemapMapping[] = [
  {
    from: { key: "home" },
    description: "Move to line start",
    to: { key: "left_arrow", modifiers: ["command"] },
  },
  {
    from: { key: "home", modifiers: ["shift"] },
    description: "Select to line start",
    to: { key: "left_arrow", modifiers: ["command", "shift"] },
  },
  {
    from: { key: "end" },
    description: "Move to line end",
    to: { key: "right_arrow", modifiers: ["command"] },
  },
  {
    from: { key: "end", modifiers: ["shift"] },
    description: "Select to line end",
    to: { key: "right_arrow", modifiers: ["command", "shift"] },
  },
];
