import { TIMINGS, appRegistry } from "../constants";
import { evaluateSelectionCommand, textProcessorCommand } from "../lib/scripts";

export type KeyActionSpec = {
  type: "key";
  key: string;
  modifiers?: string[];
  options?: {
    halt?: boolean;
    repeat?: boolean;
  };
};

export type ShellActionSpec = {
  type: "shell";
  command: string;
};

export type TapHoldActionSpec = KeyActionSpec | ShellActionSpec;

export type AppConditionSpec = {
  app: string;
  unless?: boolean;
};

export type TapHoldVariantMapping = {
  description: string;
  when?: AppConditionSpec;
  alone: TapHoldActionSpec[];
  hold: TapHoldActionSpec[];
  timeoutMs: number;
  thresholdMs: number;
};

export type ConditionalTapHoldMapping = {
  key: string;
  variants: TapHoldVariantMapping[];
};

const EVALUATE_SELECTION_COMMAND = evaluateSelectionCommand();
const QUICK_DATE_COMMAND = textProcessorCommand("quick_date");

export const enterKeyHoldMappings: ConditionalTapHoldMapping[] = [
  {
    key: "keypad_enter",
    variants: [
      {
        description: "Evaluate selection",
        when: { app: appRegistry.excel, unless: true },
        alone: [
          {
            type: "key",
            key: "keypad_enter",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "shell",
            command: EVALUATE_SELECTION_COMMAND,
          },
        ],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
      {
        description: "Edit cell",
        when: { app: appRegistry.excel },
        alone: [
          {
            type: "key",
            key: "keypad_enter",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "key",
            key: "f2",
            options: { repeat: false },
          },
        ],
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
          {
            type: "key",
            key: "return_or_enter",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "shell",
            command: EVALUATE_SELECTION_COMMAND,
          },
        ],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
      {
        description: "Edit cell",
        when: { app: appRegistry.excel },
        alone: [
          {
            type: "key",
            key: "return_or_enter",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "key",
            key: "f2",
            options: { repeat: false },
          },
        ],
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
          {
            type: "key",
            key: "keypad_equal_sign",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          {
            type: "key",
            key: "c",
            modifiers: ["command"],
          },
          {
            type: "shell",
            command: QUICK_DATE_COMMAND,
          },
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
          {
            type: "key",
            key: "keypad_equal_sign",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          {
            type: "key",
            key: "c",
            modifiers: ["command"],
          },
          {
            type: "shell",
            command: QUICK_DATE_COMMAND,
          },
        ],
        timeoutMs: TIMINGS.conditionalTapHoldMs,
        thresholdMs: TIMINGS.conditionalTapHoldMs,
      },
    ],
  },
];
