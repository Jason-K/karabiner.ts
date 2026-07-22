import { formatRuleDescription } from "../../core/rule-descriptions";
import { PATHS, TIMINGS, appRegistry } from "../../data";
import { defineBindings, type Binding } from "../../engine";

const GET_PRIVILEGES =
  "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a";

export const wordPrivilegesBinding: Binding = {
  description: formatRuleDescription(
    ["left_command", "slash"],
    "Copy document name and elevate privileges",
    "tap",
  ),
  trigger: { keys: ["slash"], modifiers: ["left_command"] },
  cases: [
    {
      phase: "press",
      conditions: [{ app: appRegistry.word }],
      do: [
        { type: "osascript", scriptPath: PATHS.wordDocumentPathAppleScript },
        {
          type: "shell",
          command: `${GET_PRIVILEGES} && sleep ${TIMINGS.privilegesPostElevationDelayMs / 1000}`,
        },
      ],
    },
  ],
};

export const buildWordPrivilegesRule = () =>
  defineBindings([wordPrivilegesBinding])[0]!;
