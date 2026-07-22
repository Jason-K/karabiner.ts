import { formatRuleDescription } from "../../core/rule-descriptions";
import { appRegistry } from "../../data";
import { defineBindings, type Binding } from "../../engine";

export const onePieceClickEnterBinding: Binding = {
  description: formatRuleDescription(
    "button1",
    "OnePiece left click -> enter",
    "tap",
  ),
  trigger: { pointer: "button1" },
  conditions: [{ app: appRegistry.onePiece }],
  cases: [{ phase: "press", do: [{ type: "key", key: "return_or_enter" }] }],
};

export const buildOnePieceClickEnterRule = () =>
  defineBindings([onePieceClickEnterBinding])[0]!;
