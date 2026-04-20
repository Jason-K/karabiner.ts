import { map, rule } from "karabiner.ts";
import { formatRuleDescription } from "../lib/rule-descriptions";
import { cmd, focusApp } from "../lib/scripts";

export const buildRightOptionAppsRule = (
  getOpenFolderCommand: (folderPath: string) => string,
) => {
  return [
    {
      key: "a",
      description: "Antinote",
      event: focusApp("com.chabomakers.Antinote-setapp"),
    },
    {
      key: "b",
      description: "Helium",
      event: focusApp("net.imput.helium"),
    },
    {
      key: "c",
      description: "VS Code",
      event: focusApp("com.microsoft.VSCode"),
    },
    {
      key: "e",
      description: "Proton Mail",
      event: focusApp("ch.protonmail.desktop"),
    },
    {
      key: "f",
      description: "Home folder",
      event: cmd(`${getOpenFolderCommand("/Users/jason")}`),
    },
    {
      key: "m",
      description: "Messages",
      event: focusApp("com.apple.MobileSMS"),
    },
    {
      key: "o",
      description: "Outlook",
      event: focusApp("com.microsoft.Outlook"),
    },
    {
      key: "t",
      description: "Teams",
      event: focusApp("com.microsoft.teams2"),
    },
    {
      key: "w",
      description: "Word",
      event: focusApp("com.microsoft.Word"),
    },
    {
      key: "8",
      description: "RingCentral",
      event: focusApp("com.ringcentral.glip"),
    },
  ].map(({ key, description, event }) =>
    rule(
      formatRuleDescription(["right_option", key], description, "tap"),
    ).manipulators([...map(key, "right_option").to(event).build()]),
  );
};
