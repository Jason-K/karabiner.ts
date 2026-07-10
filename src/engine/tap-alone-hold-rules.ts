import { map, rule } from "karabiner.ts";

import type { ActionSpec } from "../core/action-dsl";
import { formatRuleDescription } from "../core/rule-descriptions";
import type { ModKey } from "../data/key-aliases";
import { resolveActionToEvents } from "./action-resolver";

export type TapAloneHoldConfig = {
  key: string;
  modifiers?: ModKey[];
  description: string;
  alone: ActionSpec[];
  hold: ActionSpec[];
  timeoutMs: number;
};

export function generateTapAloneHoldRule(config: TapAloneHoldConfig) {
  const { key, modifiers, description, alone, hold, timeoutMs } = config;

  const aloneEvents = alone.flatMap(resolveActionToEvents);
  const holdEvents = hold.flatMap(resolveActionToEvents);

  const chord = modifiers ? [...modifiers, key] : key;
  const ruleDescription = formatRuleDescription(chord, description, "hold");

  const builder = map(key as any, modifiers?.length ? (modifiers as any) : undefined)
    .parameters({
      "basic.to_if_alone_timeout_milliseconds": timeoutMs,
      "basic.to_if_held_down_threshold_milliseconds": timeoutMs,
    });

  aloneEvents.forEach((e) => builder.toIfAlone(e));
  holdEvents.forEach((e) => builder.toIfHeldDown(e));

  builder
    .toDelayedAction([], aloneEvents)
    .description(ruleDescription);

  return rule(ruleDescription).manipulators(builder.build()) as any;
}
