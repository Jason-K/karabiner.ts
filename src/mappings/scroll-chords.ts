import { appRegistry } from "./apps";

export const scrollChordTriggerKeys = {
  volumeUp: "f19",
  volumeDown: "f20",
  appSwitcherNext: "f21",
  appSwitcherPrevious: "f22",
  tabSwitcherNext: "f23",
  tabSwitcherPrevious: "f24",
} as const;

export const scrollChordBrowserBundleIds = [
  appRegistry.browser,
  "org.mozilla.firefox",
  "com.asiafu.Bloom",
] as const;
