import { MOD_COMBO } from "../../core/mods";
import { appRegistry } from "../../data";
import {
  generateAppScopedRemapRules,
  type AppScopedRemapMapping,
} from "../../engine/simple-rules";

export const skimRemapMappings: AppScopedRemapMapping[] = [
  {
    from: { key: "h", modifiers: ["left_command"] },
    description: "Skim command H remap",
    to: { key: "h", modifiers: MOD_COMBO.vmC_C_ },
    ifApp: appRegistry.skim,
  },
  {
    from: { key: "u", modifiers: ["left_command"] },
    description: "Skim command U remap",
    to: { key: "u", modifiers: MOD_COMBO.vmC_C_ },
    ifApp: appRegistry.skim,
  },
];

export const buildSkimCommandRemapRule = () =>
  generateAppScopedRemapRules(skimRemapMappings);
