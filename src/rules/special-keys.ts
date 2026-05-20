import { ifApp, rule, toKey } from "karabiner.ts";
import { TIMINGS, appRegistry } from "../constants";
import {
  generateConditionalTapHoldRules,
  type ConditionalTapHoldMapping,
} from "../generators/conditional-tap-hold-rules";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { evaluateSelectionCommand, textProcessorCommand } from "../lib/scripts";

const EVALUATE_SELECTION_COMMAND = evaluateSelectionCommand();
const QUICK_DATE_COMMAND = textProcessorCommand("quick_date");

export const enterKeyHoldMappings: ConditionalTapHoldMapping[] = [
  {
    key: "keypad_enter",
    variants: [
      {
        description: "Evaluate selection",
        when: { app: appRegistry.excel, unless: true },
        alone: [{ type: "key", key: "keypad_enter", options: { halt: true } }],
        hold: [{ type: "shell", command: EVALUATE_SELECTION_COMMAND }],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
      {
        description: "Edit cell",
        when: { app: appRegistry.excel },
        alone: [{ type: "key", key: "keypad_enter", options: { halt: true } }],
        hold: [{ type: "key", key: "f2", options: { repeat: false } }],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
    ],
  },
  {
    key: "return_or_enter",
    variants: [
      {
        description: "Evaluate selection",
        when: { app: appRegistry.excel, unless: true },
        alone: [
          { type: "key", key: "return_or_enter", options: { halt: true } },
        ],
        hold: [{ type: "shell", command: EVALUATE_SELECTION_COMMAND }],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
      {
        description: "Edit cell",
        when: { app: appRegistry.excel },
        alone: [
          { type: "key", key: "return_or_enter", options: { halt: true } },
        ],
        hold: [{ type: "key", key: "f2", options: { repeat: false } }],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
    ],
  },
];

export const equalsKeyHoldMappings: ConditionalTapHoldMapping[] = [
  {
    key: "keypad_equal_sign",
    variants: [
      {
        description: "Quick date",
        alone: [
          { type: "key", key: "keypad_equal_sign", options: { halt: true } },
        ],
        hold: [
          { type: "key", key: "left_arrow", modifiers: ["shift", "option"] },
          { type: "key", key: "c", modifiers: ["command"] },
          { type: "shell", command: QUICK_DATE_COMMAND },
        ],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
    ],
  },
  {
    key: "equal_sign",
    variants: [
      {
        description: "Quick date",
        alone: [
          { type: "key", key: "keypad_equal_sign", options: { halt: true } },
        ],
        hold: [
          { type: "key", key: "left_arrow", modifiers: ["shift", "option"] },
          { type: "key", key: "c", modifiers: ["command"] },
          { type: "shell", command: QUICK_DATE_COMMAND },
        ],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
    ],
  },
];

export const buildEnterRules = () =>
  generateConditionalTapHoldRules(enterKeyHoldMappings);

export const buildEqualsRules = () =>
  generateConditionalTapHoldRules(equalsKeyHoldMappings);

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
