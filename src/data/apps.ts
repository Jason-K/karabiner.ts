const app = (name: string, refDesc: string) => ({
  type: "app" as const,
  name,
  refDesc,
});

export const appRegistry = {
  activityMonitor: app("com.apple.ActivityMonitor", "Activity Monitor"),
  antinote: app("com.chabomakers.Antinote", "Antinote"),
  brewUpdater: app("org.gpgtools.pinentry-mac", "PIN entry"),
  browser: app("app.zen-browser.zen", "Zen browser"),
  calendar: app("com.busymac.busycal-setapp", "BusyCal"),
  claude: app("com.anthropic.claudefordesktop", "Claude"),
  code: app("com.microsoft.VSCode", "VS Code"),
  excel: app("com.microsoft.Excel", "Microsoft Excel"),
  // getFolderOpenerBundleId() is a constant ("com.jinghaoshe.qspace.pro",
  // independent of the opener choice), so it is inlined here to keep data/
  // free of core/ imports. No action references folderOpener today, so the
  // old "__folder_opener__" sentinel + resolver special case were dead.
  folderOpener: app("com.jinghaoshe.qspace.pro", "Folder opener"),
  helium: app("net.imput.helium", "Helium"),
  kitty: app("net.kovidgoyal.kitty", "Kitty"),
  messages: app("com.apple.MobileSMS", "Messages"),
  numi: app("com.nikolaeu.numi-setapp", "Numi"),
  onePiece: app("jp.fuji.1Piece", "1Piece"),
  outlook: app("com.microsoft.Outlook", "Microsoft Outlook"),
  processSpy: app("com.itone.ProcessSpy", "Process Spy"),
  protonMail: app("ch.protonmail.desktop", "Proton Mail"),
  qspace: app("com.jinghaoshe.qspace.pro", "QSpace"),
  ringCentral: app("com.ringcentral.glip", "RingCentral"),
  securityAgent: app("com.apple.SecurityAgent", "Security Agent"),
  settings: app("com.apple.systempreferences", "System Settings"),
  settingsPrivacySecurityExtension: app(
    "com.apple.settings.PrivacySecurity.extension",
    "Privacy & Security extension",
  ),
  skim: app("net.sourceforge.skim-app.skim", "Skim"),
  spotify: app("com.spotify.client", "Spotify"),
  systemSettings: app("com.apple.systempreferences", "System Settings"),
  teams: app("com.microsoft.teams2", "Microsoft Teams"),
  todoist: app("com.todoist.mac.Todoist", "Todoist"),
  word: app("com.microsoft.Word", "Microsoft Word"),
  zen: app("app.zen-browser.zen", "Zen browser"),
} as const;

export type AppRef = import("./refs").AppRef;

export const QUICK_FILL_APP_BUNDLE_IDENTIFIERS: AppRef[] = [
  appRegistry.securityAgent,
  appRegistry.settings,
  appRegistry.settingsPrivacySecurityExtension,
  appRegistry.brewUpdater,
];
