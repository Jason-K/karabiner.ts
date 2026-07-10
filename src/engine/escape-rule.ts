import { map, rule, toKey, toSetVar, toStickyModifier } from "karabiner.ts";
import { formatRuleDescription } from "../core/rule-descriptions";

export function generateEscapeRule(suppressionVars: string[] = []): any[] {
  const otherVars = [
    "caps_lock_pressed",
    "command_q_pressed",
    "ctrl_opt_esc_first",
    "cmd_d_ready",
  ];

  return [
    rule(
      formatRuleDescription("escape", "Reset all variables", "tap"),
    ).manipulators([
      ...map("escape")
        .to([
          toKey("escape"),
          ...suppressionVars.map((v) => toSetVar(v, 0)),
          ...otherVars.map((v) => toSetVar(v, 0)),
          toStickyModifier("left_shift", "off"),
          toStickyModifier("left_option", "off"),
          toStickyModifier("left_command", "off"),
          toStickyModifier("left_control", "off"),
        ])
        .build(),
    ]),
  ];
}
