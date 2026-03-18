import { ifApp, map, rule, toKey } from "karabiner.ts";
import { applescript, cmd } from "../lib/builders";
import { HYPER, L } from "../lib/mods";

export const buildDisableHideMinimizeRule = () => {
  return rule("DISABLE - Hide/Minimize shortcuts").manipulators([
    ...map("h", ["command", "option"]).build(),
    ...map("m", ["command", "option"]).build(),
    ...map("h", "command").build(),
  ]);
};

export const buildWordPrivilegesRule = () => {
  return rule("WORD - CMD+/ copy document name and elevate privileges").manipulators([
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
  return rule("PASSWORDS - CMD+/ quick fill").manipulators([
    ...map("slash", "command")
      .condition(
        ifApp({
          bundle_identifiers: ["com.apple.SecurityAgent"],
          file_paths: ["/Applications/Cork.app/Contents/Resources/Sudo Helper"],
        }),
      )
      .to(
        cmd(
          "/Applications/Privileges.app/Contents/MacOS/privilegescli -a && sleep 3",
        ),
      )
      .to(toKey("a", [L.cmd]))
      .to(toKey("j", [L.shift]))
      .to(toKey("a"))
      .to(toKey("s"))
      .to(toKey("o"))
      .to(toKey("n"))
      .to(toKey("tab"))
      .to(toKey("slash", HYPER, { repeat: false }))
      .build(),
  ]);
};
