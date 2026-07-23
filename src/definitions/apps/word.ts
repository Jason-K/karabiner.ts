import { PATHS, TIMINGS, appRegistry } from "../../data";
import { defineBindings, type Binding } from "../../engine";

const GET_PRIVILEGES =
  "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a";

export const wordPrivilegesBinding: Binding = {
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
