import {
    PATHS,
    TIMINGS,
    appRegistry,
} from "../../data";
import {
    generateConditionalActionRules,
    type ConditionalActionMapping,
} from "../../engine/conditional-action-rules";

const QUICK_FILL_ELEVATE_PRIVILEGES_CMD =
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
          command: `${QUICK_FILL_ELEVATE_PRIVILEGES_CMD} && sleep ${TIMINGS.privilegesPostElevationDelayMs / 1000}`,
        },
      ],
    },
  ],
};

export const buildWordPrivilegesRule = () =>
  generateConditionalActionRules([wordPrivilegesMapping])[0]!;
