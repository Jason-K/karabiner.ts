import {
    evaluateSelectionCommand,
    textProcessorCommand,
} from "../core/scripts";
import { TIMINGS, appRegistry } from "../data";
import {
    generateConditionalTapHoldRules,
    type ConditionalTapHoldMapping,
} from "../engine/conditional-tap-hold-rules";

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
        timeoutMs: TIMINGS.delayHoldMs,
        thresholdMs: TIMINGS.delayHoldMs,
      },
      {
        description: "Edit cell",
        when: { app: appRegistry.excel },
        alone: [{ type: "key", key: "keypad_enter", options: { halt: true } }],
        hold: [{ type: "key", key: "f2", options: { repeat: false } }],
        timeoutMs: TIMINGS.delayHoldMs,
        thresholdMs: TIMINGS.delayHoldMs,
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
        timeoutMs: TIMINGS.delayHoldMs,
        thresholdMs: TIMINGS.delayHoldMs,
      },
      {
        description: "Edit cell",
        when: { app: appRegistry.excel },
        alone: [
          { type: "key", key: "return_or_enter", options: { halt: true } },
        ],
        hold: [{ type: "key", key: "f2", options: { repeat: false } }],
        timeoutMs: TIMINGS.delayHoldMs,
        thresholdMs: TIMINGS.delayHoldMs,
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
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          { type: "key", key: "c", modifiers: ["command"] },
          { type: "shell", command: QUICK_DATE_COMMAND },
        ],
        timeoutMs: TIMINGS.delayHoldMs,
        thresholdMs: TIMINGS.delayHoldMs,
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
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          { type: "key", key: "c", modifiers: ["command"] },
          { type: "shell", command: QUICK_DATE_COMMAND },
        ],
        timeoutMs: TIMINGS.delayHoldMs,
        thresholdMs: TIMINGS.delayHoldMs,
      },
    ],
  },
];

export const buildEnterRules = () =>
  generateConditionalTapHoldRules(enterKeyHoldMappings);

export const buildEqualsRules = () =>
  generateConditionalTapHoldRules(equalsKeyHoldMappings);
