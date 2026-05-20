import { ifApp, rule, toKey } from "karabiner.ts";
import { appRegistry } from "../constants";
import { formatRuleDescription } from "../lib/rule-descriptions";
export {
  buildEnterRules,
  buildEqualsRules,
  buildHomeEndRule,
} from "../builders/special-key-rules";

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
      conditions: [ifApp(appRegistry.onePiece).build()],
      description,
    } as any,
  ]);
};
