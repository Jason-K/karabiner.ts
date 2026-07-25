import { Apps, Commands, Paths } from "../../data";
import { defineBindings, type Binding } from "../../engine";

const GET_PRIVILEGES =
  "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a";

export const wordPrivilegesBinding: Binding = {
  trigger: { keys: ["slash"], modifiers: ["left_command"] },
  cases: [
    {
      phase: "press",
      conditions: [{ app: Apps.word }],
      do: [
        {
          type: "osascript",
          scriptPath: Paths.wordDocumentPathAppleScript.name,
        },
        {
          type: "shell",
          command: Commands.getPrivileges,
        },
      ],
    },
  ],
};

export const buildWordPrivilegesRule = () =>
  defineBindings([wordPrivilegesBinding])[0]!;
