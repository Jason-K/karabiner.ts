export type LauncherAction =
  | {
      type: "focusApp";
      bundleId: string;
    }
  | {
      type: "openFolder";
      path: string;
    };

export type ModifierLauncherMapping<TKey extends string = string> = {
  key: TKey;
  description: string;
  action: LauncherAction;
};

export const rightOptionLaunchers: ModifierLauncherMapping<
  "a" | "b" | "c" | "e" | "f" | "m" | "o" | "t" | "w" | "8"
>[] = [
  {
    key: "a",
    description: "Antinote",
    action: {
      type: "focusApp",
      bundleId: "com.chabomakers.Antinote-setapp",
    },
  },
  {
    key: "b",
    description: "Helium",
    action: {
      type: "focusApp",
      bundleId: "net.imput.helium",
    },
  },
  {
    key: "c",
    description: "VS Code",
    action: {
      type: "focusApp",
      bundleId: "com.microsoft.VSCode",
    },
  },
  {
    key: "e",
    description: "Proton Mail",
    action: {
      type: "focusApp",
      bundleId: "ch.protonmail.desktop",
    },
  },
  {
    key: "f",
    description: "Home folder",
    action: {
      type: "openFolder",
      path: "/Users/jason",
    },
  },
  {
    key: "m",
    description: "Messages",
    action: {
      type: "focusApp",
      bundleId: "com.apple.MobileSMS",
    },
  },
  {
    key: "o",
    description: "Outlook",
    action: {
      type: "focusApp",
      bundleId: "com.microsoft.Outlook",
    },
  },
  {
    key: "t",
    description: "Teams",
    action: {
      type: "focusApp",
      bundleId: "com.microsoft.teams2",
    },
  },
  {
    key: "w",
    description: "Word",
    action: {
      type: "focusApp",
      bundleId: "com.microsoft.Word",
    },
  },
  {
    key: "8",
    description: "RingCentral",
    action: {
      type: "focusApp",
      bundleId: "com.ringcentral.glip",
    },
  },
];
