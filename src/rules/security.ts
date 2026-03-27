import { ifApp, map, rule, toKey } from "karabiner.ts";
import { HYPER, L } from "../lib/mods";
import { applescript, cmd } from "../lib/scripts";

const QUICK_FILL_ELEVATE_PRIVILEGES_CMD = "/opt/homebrew/bin/privilegescli -a";
const QUICK_FILL_POST_ELEVATION_DELAY_MS = 3000;
const QUICK_FILL_APP_BUNDLE_IDENTIFIERS = [
  "com.apple.SecurityAgent",
  "com.apple.systempreferences",
  "com.apple.settings.PrivacySecurity.extension",
];
const FOCUSED_UI_ROLE_VARIABLE = "accessibility.focused_ui_element.role";
const FOCUSED_UI_SUBROLE_VARIABLE = "accessibility.focused_ui_element.subrole";
const AX_TEXT_FIELD_ROLE = "AXTextField";
const AX_SECURE_TEXT_FIELD_SUBROLE = "AXSecureTextField";

export const buildDisableHideMinimizeRule = () => {
  return rule("DISABLE - Hide/Minimize shortcuts").manipulators([
    ...map("h", ["command", "option"]).build(),
    ...map("m", ["command", "option"]).build(),
    ...map("h", "command").build(),
  ]);
};

export const buildWordPrivilegesRule = () => {
  return rule(
    "WORD - CMD+/ copy document name and elevate privileges",
  ).manipulators([
    ...map("slash", "command")
      .condition(ifApp("com.microsoft.Word"))
      .to(
        applescript(
          "~/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript",
        ),
      )
      .to(
        cmd(
          "/Applications/Privileges.app/Contents/MacOS/privilegescli -a && sleep 3",
        ),
      )
      .build(),
  ]);
};

export const buildPasswordsQuickFillRule = () => {
  const securityAgentCondition = ifApp({
    bundle_identifiers: QUICK_FILL_APP_BUNDLE_IDENTIFIERS,
  });

  return rule("PASSWORDS - CMD+/ quick fill").manipulators([
    ...map("slash", "command")
      .parameters({
        "basic.to_delayed_action_delay_milliseconds":
          QUICK_FILL_POST_ELEVATION_DELAY_MS,
      })
      .condition(securityAgentCondition)
      .condition({
        type: "variable_if",
        name: FOCUSED_UI_ROLE_VARIABLE,
        value: AX_TEXT_FIELD_ROLE,
      })
      .condition({
        type: "variable_if",
        name: FOCUSED_UI_SUBROLE_VARIABLE,
        value: AX_SECURE_TEXT_FIELD_SUBROLE,
      })
      .to(cmd(QUICK_FILL_ELEVATE_PRIVILEGES_CMD))
      .toDelayedAction([toKey("slash", HYPER, { repeat: false })], [])
      .build(),
    ...map("slash", "command")
      .parameters({
        "basic.to_delayed_action_delay_milliseconds":
          QUICK_FILL_POST_ELEVATION_DELAY_MS,
      })
      .condition(securityAgentCondition)
      .condition({
        type: "variable_if",
        name: FOCUSED_UI_ROLE_VARIABLE,
        value: AX_TEXT_FIELD_ROLE,
      })
      .condition({
        type: "variable_unless",
        name: FOCUSED_UI_SUBROLE_VARIABLE,
        value: AX_SECURE_TEXT_FIELD_SUBROLE,
      })
      .to(cmd(QUICK_FILL_ELEVATE_PRIVILEGES_CMD))
      .toDelayedAction(
        [
          toKey("a", [L.cmd]),
          toKey("j", [L.shift]),
          toKey("a"),
          toKey("s"),
          toKey("o"),
          toKey("n"),
          toKey("tab"),
          toKey("slash", HYPER, { repeat: false }),
        ],
        [],
      )
      .build(),
  ]);
};
