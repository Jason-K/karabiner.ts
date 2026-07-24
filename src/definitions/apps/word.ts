import { appRegistry, commandRegistry, pathRegistry } from "../../data";
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
        {
          type: "osascript",
          scriptPath: pathRegistry.wordDocumentPathAppleScript.name,
        },
        {
          type: "shell",
          command: `${commandRegistry.getPrivileges.name}`,
        },
      ],
    },
  ],
};

export const buildWordPrivilegesRule = () =>
  defineBindings([wordPrivilegesBinding])[0]!;
