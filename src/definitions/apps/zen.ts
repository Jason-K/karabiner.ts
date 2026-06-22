import { appRegistry } from "../../data";
import {
    generateAppScopedRemapRules,
    type AppScopedRemapMapping,
} from "../../engine/simple-rules";

export const zenRemapMappings: AppScopedRemapMapping[] = [
  {
    from: { key: "right_arrow", modifiers: ["left_command", "left_shift"] },
    description: "Zen command H remap",
    to: { key: "close_bracket", modifiers: ["left_command", "left_shift"] },
    ifApp: appRegistry.zen,
  },
  {
    from: { key: "left_arrow", modifiers: ["left_command", "left_shift"] },
    description: "Zen command U remap",
    to: { key: "open_bracket", modifiers: ["left_command", "left_shift"] },
    ifApp: appRegistry.zen,
  },
];

export const buildZenCommandRemapRule = () =>
  generateAppScopedRemapRules(zenRemapMappings);
