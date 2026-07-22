import { MOD_COMBO } from "../../core/mods";
import { formatRuleDescription } from "../../core/rule-descriptions";
import { appRegistry } from "../../data";
import { defineBindings, type Binding } from "../../engine";

export const skimRemapBindings: Binding[] = [
  {
    description: formatRuleDescription(
      ["left_command", "h"],
      "Skim command H remap",
      "tap",
    ),
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    conditions: [{ app: appRegistry.skim }],
    cases: [
      { phase: "press", do: [{ type: "key", key: "h", modifiers: MOD_COMBO.vmC_C_ }] },
    ],
  },
  {
    description: formatRuleDescription(
      ["left_command", "u"],
      "Skim command U remap",
      "tap",
    ),
    trigger: { keys: ["u"], modifiers: ["left_command"] },
    conditions: [{ app: appRegistry.skim }],
    cases: [
      { phase: "press", do: [{ type: "key", key: "u", modifiers: MOD_COMBO.vmC_C_ }] },
    ],
  },
];

export const buildSkimCommandRemapRule = () => defineBindings(skimRemapBindings);
