import {
    PATHS,
    TIMINGS,
    appRegistry,
} from "../../data";
import {
    generateConditionalActionRules,
    type ConditionalActionMapping,
} from "../../engine/conditional-action-rules";

const GET_PRIVILEGES =
  "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a";

export const wordPrivilegesMapping: ConditionalActionMapping = {
  key: "slash",
  modifiers: ["left_command"],
  description: "Copy document name and elevate privileges",
  variants: [
    {
      when: [
        {
          type: "frontmostApp",
          bundleIds: [appRegistry.word],
        },
      ],
      actions: [
        {
          type: "osascript",
          scriptPath: PATHS.wordDocumentPathAppleScript,
        },
        {
          type: "shell",
          command: `${GET_PRIVILEGES} && sleep ${TIMINGS.privilegesPostElevationDelayMs / 1000}`,
        },
      ],
    },
  ],
};

export const buildWordPrivilegesRule = () =>
  generateConditionalActionRules([wordPrivilegesMapping])[0]!;
