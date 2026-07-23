import { appRegistry } from "./apps";

export type FocusAppBehavior = {
  appName: string;
  activationDelaySeconds: number;
  createWindowShortcut: {
    key: string;
    modifiers?: string[];
  };
};

export const FOCUS_APP_BEHAVIORS: Partial<Record<string, FocusAppBehavior>> = {
  [appRegistry.antinote.name as string]: {
    appName: "Antinote",
    activationDelaySeconds: 0.2,
    createWindowShortcut: {
      key: "n",
      modifiers: ["command down"],
    },
  },
};
