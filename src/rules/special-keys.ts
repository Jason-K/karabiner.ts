import { ifApp, map, rule, toKey, withCondition } from "karabiner.ts";

import { HYPER } from "../lib/mods";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd } from "../lib/scripts";
import { tapHold } from "../lib/tap-hold";

export const buildHomeEndRule = () => {
  return [
    {
      chord: ["home"],
      description: "Move to line start",
      manipulator: map("home").to(toKey("left_arrow", ["command"])),
    },
    {
      chord: ["shift", "home"],
      description: "Select to line start",
      manipulator: map("home", "shift").to(
        toKey("left_arrow", ["command", "shift"]),
      ),
    },
    {
      chord: ["end"],
      description: "Move to line end",
      manipulator: map("end").to(toKey("right_arrow", ["command"])),
    },
    {
      chord: ["shift", "end"],
      description: "Select to line end",
      manipulator: map("end", "shift").to(
        toKey("right_arrow", ["command", "shift"]),
      ),
    },
  ].map(({ chord, description, manipulator }) =>
    rule(formatRuleDescription(chord, description, "tap")).manipulators([
      ...manipulator.build(),
    ]),
  );
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
  return ["keypad_enter", "return_or_enter"].flatMap((key) => [
    rule(formatRuleDescription(key, "Evaluate selection", "hold")).manipulators(
      withCondition(ifApp("com.microsoft.Excel").unless())(
        tapHold({
          key,
          alone: [toKey(key as any, [], { halt: true })],
          hold: [cmd("/opt/homebrew/bin/hs -c 'FormatCutSeed()'")],
          timeoutMs: 200,
          thresholdMs: 200,
        }).build(),
      ).build(),
    ),
    rule(formatRuleDescription(key, "Edit cell", "hold")).manipulators(
      withCondition(ifApp("com.microsoft.Excel"))(
        tapHold({
          key,
          alone: [toKey(key as any, [], { halt: true })],
          hold: [toKey("f2", [], { repeat: false })],
          timeoutMs: 200,
          thresholdMs: 200,
        }).build(),
      ).build(),
    ),
  ]);
};

export const buildEqualsRules = () => {
  return ["keypad_equal_sign", "equal_sign"].map((key) =>
    rule(formatRuleDescription(key, "Quick date", "hold")).manipulators([
      tapHold({
        key,
        alone: [
          toKey(key === "equal_sign" ? "keypad_equal_sign" : (key as any), [], {
            halt: true,
          }),
        ],
        hold: [
          toKey("left_arrow", ["shift", "option"]),
          toKey("c", ["command"]),
          cmd(
            "~/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py quick_date --source clipboard --dest paste",
          ),
        ],
        timeoutMs: 200,
        thresholdMs: 200,
      }),
    ]),
  );
};
