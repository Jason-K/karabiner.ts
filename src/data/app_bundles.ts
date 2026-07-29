import type { AppRef } from "./refs";

// ---------------------------------------------------------
// Factory
// ---------------------------------------------------------

/** Create a registry entry for an application bundle.
 *  @param name    - bundle identifier (e.g. "com.apple.ActivityMonitor")
 *  @param refDesc - human label used in descriptions
 */
const app = (name: string, refDesc: string) => ({
  type: "app" as const,
  name,
  refDesc,
});

// TO DO: Karabiner allows foremost_application_if|unless conditions to be set based on bundle_identifiers|file_paths (https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/conditions/frontmost-application/)
// APP_BUNDLES currently exports based on bundle ID; I want to also be able to export file paths, since some APPS have multiple APPS within the same bundle (e.g., 1Piece has /Applications/1Piece.app/Contents/Preferences/1Piece Preferences.app" and ))

// ---------------------------------------------------------
// Registry
// ---------------------------------------------------------

export const APP_BUNDLES = {
  activityMonitor: app("com.apple.ActivityMonitor", "Activity Monitor"),
  antinote: app("com.chabomakers.Antinote", "Antinote"),
  brewUpdater: app("org.gpgtools.pinentry-mac", "Brew auto-updater"),
  browser: app("app.zen-browser.zen", "Zen"),
  calendar: app("com.busymac.busycal-setapp", "BusyCal"),
  claude: app("com.anthropic.claudefordesktop", "Claude"),
  code: app("com.microsoft.VSCode", "Code"),
  excel: app("com.microsoft.Excel", "Microsoft Excel"),
  // getFinderReplacementBundleId() is a constant ("com.jinghaoshe.qspace.pro",
  // independent of the opener choice), so it is inlined here to keep data/
  // free of core/ imports. No action references FinderReplacement today, so the
  // old "__folder_opener__" sentinel + resolver special case were dead.
  FinderReplacement: app("com.jinghaoshe.qspace.pro", "QSpace"),
  helium: app("net.imput.helium", "Helium"),
  kitty: app("net.kovidgoyal.kitty", "Kitty"),
  messages: app("com.apple.MobileSMS", "Messages"),
  numi: app("com.nikolaeu.numi-setapp", "Numi"),
  onePiece: app("jp.fuji.1Piece", "1Piece"),
  onePiecePreferences: app("jp.fuji.1PiecePreferences", "1Piece Preferences"),
  outlook: app("com.microsoft.Outlook", "Microsoft Outlook"),
  processSpy: app("com.itone.ProcessSpy", "Process Spy"),
  protonMail: app("ch.protonmail.desktop", "Proton Mail"),
  qspace: app("com.jinghaoshe.qspace.pro", "QSpace"),
  ringCentral: app("com.ringcentral.glip", "RingCentral"),
  securityAgent: app("com.apple.SecurityAgent", "Security Agent"),
  settings: app("com.apple.systempreferences", "System Settings"),
  settingsPrivacySecurityExtension: app(
    "com.apple.settings.PrivacySecurity.extension",
    "System Settings, security",
  ),
  skim: app("net.sourceforge.skim-app.skim", "Skim"),
  spotify: app("com.spotify.client", "Spotify"),
  systemSettings: app("com.apple.systempreferences", "System Settings"),
  taphouse: app("com.multimodalsolutions.taphouse", "Taphouse"),
  teams: app("com.microsoft.teams2", "Microsoft Teams"),
  todoist: app("com.todoist.mac.Todoist", "Todoist"),
  word: app("com.microsoft.Word", "Word"),
  zen: app("app.zen-browser.zen", "Zen"),
} as const;

export type { AppRef };

export const PW_BUNDLES: AppRef[] = [
  APP_BUNDLES.securityAgent,
  APP_BUNDLES.settings,
  APP_BUNDLES.settingsPrivacySecurityExtension,
  APP_BUNDLES.brewUpdater,
  APP_BUNDLES.taphouse,
];
