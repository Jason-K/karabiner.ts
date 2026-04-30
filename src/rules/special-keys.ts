import { ifApp, rule, toKey } from "karabiner.ts";

import {
  buildConditionalTapHoldRules,
  buildSimpleRemapRules,
} from "../generators";
import { HYPER } from "../lib/mods";
import { formatRuleDescription } from "../lib/rule-descriptions";
import {
  enterKeyHoldMappings,
  equalsKeyHoldMappings,
  homeEndNavigationMappings,
} from "../mappings";

export const buildHomeEndRule = () => {
  return buildSimpleRemapRules(homeEndNavigationMappings);
};

export const buildGraveAccentHoldRule = () => {
  return rule(
    formatRuleDescription("grave_accent_and_tilde", "Hyper F5", "hold"),
  ).manipulators([
    {
      type: "basic" as const,
      from: {
        key_code: "grave_accent_and_tilde" as any,
      },
      parameters: {
        "basic.to_if_alone_timeout_milliseconds": 400,
        "basic.to_if_held_down_threshold_milliseconds": 400,
      },
      to_if_alone: [toKey("grave_accent_and_tilde", [], { halt: true })],
      to_if_held_down: [toKey("f5", HYPER, { halt: false })],
      description: formatRuleDescription(
        "grave_accent_and_tilde",
        "Hyper F5",
        "hold",
      ),
    } as any,
  ]);
};

export const buildEnterRules = () => {
  return buildConditionalTapHoldRules(enterKeyHoldMappings);
};

export const buildOnePieceClickEnterRule = () => {
  return rule("OnePiece: left click -> enter").manipulators([
    {
      type: "basic" as const,
      from: {
        pointing_button: "button1",
      },
      to: [toKey("return_or_enter")],
      conditions: [ifApp("jp.fuji.1Piece").build()],
      description: "OnePiece: left click -> enter",
    } as any,
  ]);
};

export const buildEqualsRules = () => {
  return buildConditionalTapHoldRules(equalsKeyHoldMappings);
};
