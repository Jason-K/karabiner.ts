export const appRegistry = {
  antinote: "com.chabomakers.Antinote-setapp",
  browser: "app.zen-browser.zen",
  calendar: "com.busymac.busycal-setapp",
  claude: "com.anthropic.claudefordesktop",
  code: "com.microsoft.VSCode",
  folderOpener: "__folder_opener__",
  helium: "net.imput.helium",
  kitty: "net.kovidgoyal.kitty",
  messages: "com.apple.MobileSMS",
  numi: "com.nikolaeu.numi-setapp",
  outlook: "com.microsoft.Outlook",
  protonMail: "ch.protonmail.desktop",
  qspace: "com.jinghaoshe.qspace.pro",
  ringCentral: "com.ringcentral.glip",
  spotify: "com.spotify.client",
  teams: "com.microsoft.teams2",
  todoist: "com.todoist.mac.Todoist",
  word: "com.microsoft.Word",
} as const;

export type AppRef = keyof typeof appRegistry;
