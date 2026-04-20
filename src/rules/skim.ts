import { ifApp, map, rule, toKey } from "karabiner.ts";
import { L } from "../lib/mods";
import { formatRuleDescription } from "../lib/rule-descriptions";
// import { applescript, cmd } from "../lib/scripts";

export const buildSkimCommandRemapRule = () => {
  return [
    {
      key: "h",
      description: "Skim command H remap",
    },
    {
      key: "u",
      description: "Skim command U remap",
    },
  ].map(({ key, description }) =>
    rule(
      formatRuleDescription(["command", key], description, "tap"),
    ).manipulators([
      ...map(key, "command")
        .condition(ifApp("net.sourceforge.skim-app.skim"))
        .to(toKey(key as any, [L.cmd, L.ctrl]))
        .build(),
    ]),
  );
};

// export const buildSkimAppleScriptHoldRule = () => {
//   return rule("SKIM - 1/2/3 hold AppleScripts").manipulators([
//     ...map("1")
//       .condition(ifApp("net.sourceforge.skim-app.skim"))
//       .parameters({
//         "basic.to_if_alone_timeout_milliseconds": 300,
//         "basic.to_if_held_down_threshold_milliseconds": 300,
//       })
//       .toIfAlone(toKey("1", [], { halt: true }))
//       .toIfHeldDown(
//         cmd(
//           "osascript ~/Scripts/apps/Skim/skim_bookmarker/skim-create-anchored-note.applescript",
//         ),
//       )
//       .toDelayedAction([], [toKey("1", [], { halt: true })])
//       .description("SKIM 1 hold -> anchored note")
//       .build(),
//     ...map("2")
//       .condition(ifApp("net.sourceforge.skim-app.skim"))
//       .parameters({
//         "basic.to_if_alone_timeout_milliseconds": 300,
//         "basic.to_if_held_down_threshold_milliseconds": 300,
//       })
//       .toIfAlone(toKey("2", [], { halt: true }))
//       .toIfHeldDown(
//         applescript(
//           "~/Scripts/apps/Skim/skim_bookmarker/skim-add-heading-to-anchored-note.applescript",
//         ),
//       )
//       .toDelayedAction([], [toKey("2", [], { halt: true })])
//       .description("SKIM 2 hold -> add heading")
//       .build(),
//     ...map("3")
//       .condition(ifApp("net.sourceforge.skim-app.skim"))
//       .parameters({
//         "basic.to_if_alone_timeout_milliseconds": 300,
//         "basic.to_if_held_down_threshold_milliseconds": 300,
//       })
//       .toIfAlone(toKey("3", [], { halt: true }))
//       .toIfHeldDown(
//         applescript(
//           "~/Scripts/apps/Skim/skim_bookmarker/skim-add-extended-text-to-anchored-note.applescript",
//         ),
//       )
//       .toDelayedAction([], [toKey("3", [], { halt: true })])
//       .description("SKIM 3 hold -> add extended text")
//       .build(),
//   ]);
// };
