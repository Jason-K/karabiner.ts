import { map, rule } from "karabiner.ts";
import { cmd } from "../lib/scripts";

export const buildRightOptionAppsRule = (
  getOpenFolderCommand: (folderPath: string) => string,
) => {
  return rule("Right_Option + Key - App launch or focus").manipulators([
    ...map("a", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.adobe.Acrobat.Pro'"))
      .build(),
    ...map("b", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'net.imput.helium'"))
      .build(),
    ...map("c", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.microsoft.VSCode'"))
      .build(),
    ...map("e", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'ch.protonmail.desktop'"))
      .build(),
    ...map("f", "right_option")
      .to(cmd(`${getOpenFolderCommand("/Users/jason")}`))
      .build(),
    ...map("m", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.apple.MobileSMS'"))
      .build(),
    ...map("o", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.microsoft.Outlook'"))
      .build(),
    ...map("t", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.microsoft.teams2'"))
      .build(),
    ...map("w", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.microsoft.Word'"))
      .build(),
    ...map("8", "right_option")
      .to(cmd("/Users/jason/.local/bin/open-app -b 'com.ringcentral.glip'"))
      .build(),
  ]);
};
