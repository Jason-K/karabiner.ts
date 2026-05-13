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

export const buildEnterRules = () => {
  return buildConditionalTapHoldRules(enterKeyHoldMappings);
};

export const buildOnePieceClickEnterRule = () => {
  const description = formatRuleDescription(
    "button1",
    "OnePiece left click -> enter",
    "tap",
  );

  return rule(description).manipulators([
    {
      type: "basic" as const,
      from: {
        pointing_button: "button1",
      },
      to: [toKey("return_or_enter")],
      conditions: [ifApp("jp.fuji.1Piece").build()],
      description,
    } as any,
  ]);
};

export const buildEqualsRules = () => {
  return buildConditionalTapHoldRules(equalsKeyHoldMappings);
};
