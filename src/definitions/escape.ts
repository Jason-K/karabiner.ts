import { formatRuleDescription } from "../core/rule-descriptions";
import { killAppCommand } from "../core/scripts";
import { TIMINGS, appRegistry } from "../data";
import { defineBindings, type Binding } from "../engine";

export const escapeTapTapHoldBinding: Binding = {
  description: formatRuleDescription("escape", "Escape / Kill app", "multi-tap"),
  trigger: { keys: ["escape"] },
  timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
  multiTap: { mods: [] },
  cases: [
    { phase: "release", do: [{ type: "key", key: "escape" }] },
    { phase: "hold", do: [{ type: "shell", command: killAppCommand("foreground") }] },
    { tapCount: 2, phase: "hold", do: [{ type: "shell", command: killAppCommand() }] },
  ],
};

// ctrl+escape: tap → Activity Monitor, hold → Process Spy. Routed through the
// tapHold builder, which does not emit a manipulator-level description — this
// preserves the §8.1 normalization landed in round 1.
export const ctrlEscapeMonitorBinding: Binding = {
  description: formatRuleDescription(
    ["left_control", "escape"],
    "Activity Monitor / Process Spy",
    "hold",
  ),
  trigger: { keys: ["escape"], modifiers: ["left_control"] },
  timing: { aloneMs: TIMINGS.delayHoldMs, heldThresholdMs: TIMINGS.delayHoldMs },
  cases: [
    { phase: "release", do: [{ type: "app", ref: appRegistry.activityMonitor }] },
    { phase: "hold", do: [{ type: "app", ref: appRegistry.processSpy }] },
  ],
};

export const buildEscapeTapTapHoldRule = () =>
  defineBindings([escapeTapTapHoldBinding])[0]!;

export const buildCtrlEscapeMonitorRule = () =>
  defineBindings([ctrlEscapeMonitorBinding])[0]!;
