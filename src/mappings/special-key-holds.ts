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

const EVALUATE_SELECTION_COMMAND = "/opt/homebrew/bin/hs -c 'FormatCutSeed()'";
const QUICK_DATE_COMMAND =
  "~/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py quick_date --source clipboard --dest paste";

export const enterKeyHoldMappings: ConditionalTapHoldMapping[] = [
  {
    key: "keypad_enter",
    variants: [
      {
        description: "Evaluate selection",
        when: { app: "com.microsoft.Excel", unless: true },
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
        timeoutMs: 200,
        thresholdMs: 200,
      },
      {
        description: "Edit cell",
        when: { app: "com.microsoft.Excel" },
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
        timeoutMs: 200,
        thresholdMs: 200,
      },
    ],
  },
  {
    key: "return_or_enter",
    variants: [
      {
        description: "Evaluate selection",
        when: { app: "com.microsoft.Excel", unless: true },
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
        timeoutMs: 200,
        thresholdMs: 200,
      },
      {
        description: "Edit cell",
        when: { app: "com.microsoft.Excel" },
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
        timeoutMs: 200,
        thresholdMs: 200,
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
        timeoutMs: 200,
        thresholdMs: 200,
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
        timeoutMs: 200,
        thresholdMs: 200,
      },
    ],
  },
];
