import type { SubLayerConfig } from "../lib/functions";
import {
  cleanShotCommand,
  raycastExtensionCommand,
  takeActionHereCommand,
  textProcessorCommand,
  withSleep,
} from "../lib/scripts";

export const buildSpaceLayers = (
  getOpenFolderCommand: (folderPath: string) => string,
  getFolderOpenerBundleId: () => string,
): SubLayerConfig[] => [
  {
    layerKey: "a",
    layerName: "Applications",
    releaseLayer: false,
    mappings: {
      8: {
        description: "RingCentral",
        openAppOpts: { bundleIdentifier: "com.ringcentral.glip" },
      },
      b: {
        description: "Browser",
        openAppOpts: { bundleIdentifier: "app.zen-browser.zen" },
      },
      c: {
        description: "Calendar",
        openAppOpts: { bundleIdentifier: "com.busymac.busycal-setapp" },
      },
      e: {
        description: "Proton Mail",
        openAppOpts: { bundleIdentifier: "ch.protonmail.desktop" },
      },
      f: {
        description: "Finder",
        openAppOpts: { bundleIdentifier: getFolderOpenerBundleId() },
      },
      g: {
        description: "Claude",
        openAppOpts: { bundleIdentifier: "com.anthropic.claudefordesktop" },
      },
      k: {
        description: "Kitty here",
        command: takeActionHereCommand("kitty"),
      },
      m: {
        description: "Messages",
        openAppOpts: { bundleIdentifier: "com.apple.MobileSMS" },
      },
      o: {
        description: "Outlook",
        openAppOpts: { bundleIdentifier: "com.microsoft.Outlook" },
      },
      p: {
        description: "Phone",
        openAppOpts: { bundleIdentifier: "com.ringcentral.glip" },
      },
      q: {
        description: "QSpace",
        openAppOpts: { bundleIdentifier: "com.jinghaoshe.qspace.pro" },
      },
      r: {
        description: "RingCentral",
        openAppOpts: { bundleIdentifier: "com.ringcentral.glip" },
      },
      s: {
        description: "Spotify",
        openAppOpts: { bundleIdentifier: "com.spotify.client" },
      },
      t: {
        description: "Teams",
        openAppOpts: { bundleIdentifier: "com.microsoft.teams2" },
      },
      v: {
        description: "Code",
        openAppOpts: { bundleIdentifier: "com.microsoft.VSCode" },
      },
      w: {
        description: "Word",
        openAppOpts: { bundleIdentifier: "com.microsoft.Word" },
      },
      "=": {
        description: "Calculator",
        openAppOpts: { bundleIdentifier: "com.nikolaeu.numi-setapp" },
      },
      tab: {
        description: "Last App",
        openAppOpts: { historyIndex: 1 },
        usageCounterVar: "apps_toggle_uses",
      },
    },
  },
  {
    layerKey: "c",
    layerName: "Case >",
    releaseLayer: false,
    mappings: {
      l: {
        description: "lowercase",
        actions: [
          { type: "cut" },
          { type: "command", value: textProcessorCommand("lowercase") },
        ],
      },
      s: {
        description: "Sentence case",
        actions: [
          { type: "cut" },
          { type: "command", value: textProcessorCommand("sentence_case") },
        ],
      },
      t: {
        description: "Title Case",
        actions: [
          { type: "cut" },
          { type: "command", value: textProcessorCommand("title_case") },
        ],
      },
      u: {
        description: "UPPERCASE",
        actions: [
          { type: "cut" },
          { type: "command", value: textProcessorCommand("uppercase") },
        ],
      },
    },
  },
  {
    layerKey: "d",
    layerName: "Downloads >",
    releaseLayer: false,
    mappings: {
      "3": {
        description: "3dPrinting",
        command: getOpenFolderCommand("/Users/jason/Downloads/3dPrinting"),
      },
      a: {
        description: "Archives",
        command: getOpenFolderCommand("/Users/jason/Downloads/Archives"),
      },
      d: {
        description: "Downloads",
        command: getOpenFolderCommand("/Users/jason/Downloads/"),
      },
      i: {
        description: "Installs",
        command: getOpenFolderCommand("/Users/jason/Downloads/Installs"),
      },
      o: {
        description: "Office",
        command: getOpenFolderCommand("/Users/jason/Downloads/Office"),
      },
      p: {
        description: "PDFs",
        command: getOpenFolderCommand("/Users/jason/Downloads/PDFs"),
      },
    },
  },
  {
    layerKey: "f",
    layerName: "Folders >",
    releaseLayer: false,
    mappings: {
      ".": {
        description: "Chezmoi",
        command: getOpenFolderCommand("/Users/jason/.local/share/chezmoi/"),
      },
      a: {
        description: "Applications",
        command: getOpenFolderCommand("/Applications/"),
      },
      c: {
        description: "Cases",
        command: getOpenFolderCommand("/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/"),
      },
      d: {
        description: "Downloads",
        command: getOpenFolderCommand("/Users/jason/Downloads/"),
      },
      g: {
        description: "Gits",
        command: getOpenFolderCommand("/Users/jason/gits/"),
      },
      h: {
        description: "Home",
        command: getOpenFolderCommand("/Users/jason/"),
      },
      l: {
        description: "Library",
        command: getOpenFolderCommand("/Users/jason/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/"),
      },
      p: {
        description: "PDFs",
        command: getOpenFolderCommand("/Users/jason/Downloads/PDFs/"),
      },
      r: {
        description: "Recent Folders",
        command: raycastExtensionCommand("jason/recents/recentFolders"),
      },
      s: {
        description: "Scripts",
        command: getOpenFolderCommand("/Users/jason/Scripts/"),
      },
      w: {
        description: "Workspaces",
        command: getOpenFolderCommand("/Users/jason/Scripts/workspaces/"),
      },
    },
  },
  {
    layerKey: "r",
    layerName: "Recent >",
    releaseLayer: false,
    mappings: {
      a: {
        description: "Applications",
        command: raycastExtensionCommand("jason/recents/recentApplications"),
      },
      d: {
        description: "Directories",
        command: raycastExtensionCommand("jason/recents/recentFolders"),
      },
      f: {
        description: "Files",
        command: raycastExtensionCommand("jason/recents/recents"),
      },
      j: {
        description: "Downloads",
        command: raycastExtensionCommand("jason/recents/recentDownloads"),
      },
      r: {
        description: "Custom",
        command: raycastExtensionCommand("jason/recents/recentCustom"),
      },
    },
  },
  {
    layerKey: "s",
    layerName: "Screenshots >",
    releaseLayer: false,
    mappings: {
      a: {
        description: "Capture Area",
        command: cleanShotCommand("capture-area"),
      },
      o: {
        description: "OCR",
        command: cleanShotCommand("capture-text?linebreaks=false"),
      },
      r: {
        description: "Record Screen",
        command: cleanShotCommand("record-screen"),
      },
      s: {
        description: "Capture Screen",
        command: cleanShotCommand("capture-fullscreen"),
      },
      w: {
        description: "Capture Window",
        command: cleanShotCommand("capture-window"),
      },
    },
  },
  {
    layerKey: "w",
    layerName: "Wrap >",
    releaseLayer: false,
    mappings: {
      c: {
        description: "Curly Braces",
        actions: [
          { type: "cut" },
          { type: "command", value: withSleep(0.2, textProcessorCommand("wrap_braces")) },
        ],
      },
      p: {
        description: "Parentheses",
        actions: [
          { type: "cut" },
          { type: "command", value: withSleep(0.2, textProcessorCommand("wrap_parentheses")) },
        ],
      },
      q: {
        description: "Quotes",
        actions: [
          { type: "cut" },
          { type: "command", value: withSleep(0.2, textProcessorCommand("wrap_quotes")) },
        ],
      },
      s: {
        description: "Square Brackets",
        actions: [
          { type: "cut" },
          { type: "command", value: withSleep(0.2, textProcessorCommand("wrap_brackets")) },
        ],
      },
    },
  },
];
