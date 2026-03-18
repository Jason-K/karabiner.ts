import { map, rule, toKey } from "karabiner.ts";
import { cmd } from "../lib/scripts";
import { varTapTapHold } from "../lib/tap-hold";

export const buildEscapeTapTapHoldRule = () => {
  return rule(
    "ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)",
  ).manipulators(
    varTapTapHold({
      key: "escape",
      firstVar: "escape_first_tap",
      aloneEvents: [toKey("escape")],
      holdEvents: [cmd("/Users/jason/.local/bin/kill-app --foreground")],
      tapTapHoldEvents: [cmd("/Users/jason/.local/bin/kill-app")],
      thresholdMs: 250,
      description:
        "ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)",
      mods: [],
    }),
  );
};

export const buildCtrlEscapeMonitorRule = () => {
  return rule(
    "LEFT CTRL + ESCAPE - Activity Monitor (tap), Process Spy (hold)",
  ).manipulators([
    ...map("escape", "left_control")
      .parameters({
        "basic.to_if_alone_timeout_milliseconds": 300,
        "basic.to_if_held_down_threshold_milliseconds": 300,
      })
      .toIfAlone(
        cmd(
          "/Users/jason/.local/bin/open-app -b 'com.apple.ActivityMonitor' && echo 'Activity Monitor launched'",
        ),
      )
      .toIfHeldDown(
        cmd(
          "/Users/jason/.local/bin/open-app -b 'com.itone.ProcessSpy' && echo 'Process Spy launched'",
        ),
      )
      .toDelayedAction(
        [],
        [
          cmd(
            "/Users/jason/.local/bin/open-app -b 'com.apple.ActivityMonitor' && echo 'Activity Monitor launched'",
          ),
        ],
      )
      .description(
        "LEFT CTRL + ESCAPE - Activity Monitor (tap), Process Spy (hold)",
      )
      .build(),
  ]);
};
