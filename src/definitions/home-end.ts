import {
    generateSimpleRemapRules,
    type SimpleRemapMapping,
} from "../engine/simple-rules";

export const homeEndNavigationMappings: SimpleRemapMapping[] = [
  {
    from: { key: "home" },
    description: "Move to line start",
    to: { key: "left_arrow", modifiers: ["left_command"] },
  },
  {
    from: { key: "home", modifiers: ["left_shift"] },
    description: "Select to line start",
    to: { key: "left_arrow", modifiers: ["left_command", "left_shift"] },
  },
  {
    from: { key: "end" },
    description: "Move to line end",
    to: { key: "right_arrow", modifiers: ["left_command"] },
  },
  {
    from: { key: "end", modifiers: ["left_shift"] },
    description: "Select to line end",
    to: { key: "right_arrow", modifiers: ["left_command", "left_shift"] },
  },
];

export const buildHomeEndRule = () =>
  generateSimpleRemapRules(homeEndNavigationMappings);
