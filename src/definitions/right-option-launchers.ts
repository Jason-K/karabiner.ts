import {
    generateModifierLauncherRules,
    type ModifierLauncherMapping,
} from "../engine/launcher-rules";

export const rightOptionLaunchers: ModifierLauncherMapping<
  "a" | "b" | "c" | "e" | "f" | "m" | "o" | "t" | "w" | "8"
>[] = [
  { key: "a", description: "Antinote", action: { type: "app", ref: "antinote", mode: "focus" } },
  { key: "b", description: "Helium", action: { type: "app", ref: "helium", mode: "focus" } },
  { key: "c", description: "VS Code", action: { type: "app", ref: "code", mode: "focus" } },
  { key: "e", description: "Proton Mail", action: { type: "app", ref: "protonMail", mode: "focus" } },
  { key: "f", description: "Home folder", action: { type: "folder", ref: "home" } },
  { key: "m", description: "Messages", action: { type: "app", ref: "messages", mode: "focus" } },
  { key: "o", description: "Outlook", action: { type: "app", ref: "outlook", mode: "focus" } },
  { key: "t", description: "Teams", action: { type: "app", ref: "teams", mode: "focus" } },
  { key: "w", description: "Word", action: { type: "app", ref: "word", mode: "focus" } },
  { key: "8", description: "RingCentral", action: { type: "app", ref: "ringCentral", mode: "focus" } },
];

export const buildRightOptionAppsRule = () =>
  generateModifierLauncherRules({
    triggerKey: "right_option",
    launchers: rightOptionLaunchers,
  });
