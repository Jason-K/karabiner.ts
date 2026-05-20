import { map, rule, toKey, toSetVar, toStickyModifier } from 'karabiner.ts';
import { getAllSublayerVars } from '../lib/leader/runtime';
import type { SubLayerConfig } from '../lib/leader/types';
import { L } from '../lib/mods';
import { formatRuleDescription } from "../lib/rule-descriptions";

export function generateEscapeRule(spaceLayers: SubLayerConfig[]): any[] {
  const spaceModVar = 'space_mod';
  const allSublayerVars = getAllSublayerVars(spaceLayers, 'space');

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
          toSetVar(spaceModVar, 0),
          ...allSublayerVars.map((v) => toSetVar(v, 0)),
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
