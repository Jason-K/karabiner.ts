import { map, rule, toKey } from "karabiner.ts";
import { TIMINGS, appRegistry } from "../constants";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd, focusApp, killAppCommand } from "../lib/scripts";
import { varTapTapHold } from "../lib/tap-hold";

export const buildEscapeTapTapHoldRule = () => {
  return rule(
    formatRuleDescription("escape", "Escape / Kill app", "multi-tap"),
  ).manipulators(
    varTapTapHold({
      key: "escape",
      firstVar: "escape_first_tap",
      aloneEvents: [toKey("escape")],
      holdEvents: [cmd(killAppCommand("foreground"))],
      tapTapHoldEvents: [cmd(killAppCommand())],
      thresholdMs: TIMINGS.escapeTapHoldMs,
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
        "basic.to_if_alone_timeout_milliseconds": TIMINGS.mouseDefaultMs,
        "basic.to_if_held_down_threshold_milliseconds": TIMINGS.mouseDefaultMs,
      })
      .toIfAlone(focusApp(appRegistry.activityMonitor))
      .toIfHeldDown(focusApp(appRegistry.processSpy))
      .toDelayedAction([], [focusApp(appRegistry.activityMonitor)])
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
