import { map, rule, toKey, toSetVar, toStickyModifier } from 'karabiner.ts';
import { L } from '../core/mods';
import { formatRuleDescription } from "../core/rule-descriptions";

export function generateEscapeRule(suppressionVars: string[] = []): any[] {
  const otherVars = [
    'caps_lock_pressed',
    'command_q_pressed',
    'ctrl_opt_esc_first',
    'cmd_d_ready',
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
          toStickyModifier(L.shift, "off"),
          toStickyModifier(L.opt, "off"),
          toStickyModifier(L.cmd, "off"),
          toStickyModifier(L.ctrl, "off"),
        ])
        .build(),
    ]),
  ];
}
