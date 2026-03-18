import { ifApp, map, rule, toKey } from "karabiner.ts";
import { cmd, tapHold, withCondition } from "../lib/builders";
import { HYPER } from "../lib/mods";

export const buildHomeEndRule = () => {
  return rule("HOME/END - Mac-style navigation").manipulators([
    ...map("home")
      .to(toKey("left_arrow", ["command"]))
      .build(),
    ...map("home", "shift")
      .to(toKey("left_arrow", ["command", "shift"]))
      .build(),
    ...map("end")
      .to(toKey("right_arrow", ["command"]))
      .build(),
    ...map("end", "shift")
      .to(toKey("right_arrow", ["command", "shift"]))
      .build(),
  ]);
};

export const buildHyperF12Rule = () => {
  return rule("HYPER+F12 - Edit last Typinator rule").manipulators([
    ...map("f12", HYPER)
      .to(
        cmd(
          "/usr/bin/osascript /Users/jason/Scripts/apps/Typinator/Edit-Last-Typinator-Rule.scptd",
        ),
      )
      .build(),
  ]);
};

export const buildGraveAccentHoldRule = () => {
  return rule("grave_accent_and_tilde tap/hold -> grave or hyper+f5").manipulators([
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
      description:
        "Tilde - self (tap), Hyper+F5 down (tap-hold down), Hyper+F5 up (tap-hold up)",
    } as any,
  ]);
};

export const buildEnterRules = () => {
  return ["keypad_enter", "return_or_enter"].flatMap((key) => [
    rule(`${key} hold -> quick format (except Excel)`).manipulators(
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
    rule(`${key} hold -> F2 (Excel)`).manipulators(
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
    rule(`${key} hold -> Quick Date`).manipulators([
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
            "/Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py quick_date --source clipboard --dest paste",
          ),
        ],
        timeoutMs: 200,
        thresholdMs: 200,
      }),
    ]),
  );
};
