import { map, rule, toKey } from "karabiner.ts";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd, focusApp } from "../lib/scripts";
import { varTapTapHold } from "../lib/tap-hold";

export const buildEscapeTapTapHoldRule = () => {
  return rule(
    formatRuleDescription("escape", "Escape / Kill app", "multi-tap"),
  ).manipulators(
    varTapTapHold({
      key: "escape",
      firstVar: "escape_first_tap",
      aloneEvents: [toKey("escape")],
      holdEvents: [cmd("~/.local/bin/kill-app --foreground")],
      tapTapHoldEvents: [cmd("~/.local/bin/kill-app")],
      thresholdMs: 250,
      description: formatRuleDescription(
        "escape",
        "Escape / Kill app",
        "multi-tap",
      ),
      mods: [],
    }),
  );
};

export const buildCtrlEscapeMonitorRule = () => {
  return rule(
    formatRuleDescription(
      ["left_control", "escape"],
      "Activity Monitor / Process Spy",
      "hold",
    ),
  ).manipulators([
    ...map("escape", "left_control")
      .parameters({
        "basic.to_if_alone_timeout_milliseconds": 300,
        "basic.to_if_held_down_threshold_milliseconds": 300,
      })
      .toIfAlone(focusApp("com.apple.ActivityMonitor"))
      .toIfHeldDown(focusApp("com.itone.ProcessSpy"))
      .toDelayedAction([], [focusApp("com.apple.ActivityMonitor")])
      .description(
        formatRuleDescription(
          ["left_control", "escape"],
          "Activity Monitor / Process Spy",
          "hold",
        ),
      )
      .build(),
  ]);
};
