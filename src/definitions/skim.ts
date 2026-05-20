import { L } from "../core/mods";
import { appRegistry } from "../data";
import {
    generateAppScopedRemapRules,
    type AppScopedRemapMapping,
} from "../engine/simple-rules";

export const skimRemapMappings: AppScopedRemapMapping[] = [
  {
    from: { key: "h", modifiers: ["left_command"] },
    description: "Skim command H remap",
    to: { key: "h", modifiers: [L.cmd, L.ctrl] },
    ifApp: appRegistry.skim,
  },
  {
    from: { key: "u", modifiers: ["left_command"] },
    description: "Skim command U remap",
    to: { key: "u", modifiers: [L.cmd, L.ctrl] },
    ifApp: appRegistry.skim,
  },
];

export const buildSkimCommandRemapRule = () =>
  generateAppScopedRemapRules(skimRemapMappings);
