import type { SubLayerConfig } from "../lib/functions";

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
        openAppOpts: { bundleIdentifier: "net.imput.helium" },
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
        description: "Claudé for Desktop",
        openAppOpts: { bundleIdentifier: "com.anthropic.claudefordesktop" },
      },
      k: {
        description: "Kitty here",
        command:
          "/Users/jason/Scripts/Metascripts/take_action_here/take_action_here.sh --action kitty",
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
          {
            type: "command",
            value:
              "/Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py lowercase --source clipboard --dest paste",
          },
        ],
      },
      s: {
        description: "Sentence case",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "/Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py sentence_case --source clipboard --dest paste",
          },
        ],
      },
      t: {
        description: "Title Case",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "/Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py title_case --source clipboard --dest paste",
          },
        ],
      },
      u: {
        description: "UPPERCASE",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "/Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py uppercase --source clipboard --dest paste",
          },
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
      a: {
        description: "Applications",
        command: getOpenFolderCommand("/Applications/"),
      },
      ".": {
        description: "Chezmoi",
        command: getOpenFolderCommand("/Users/jason/.local/share/chezmoi/"),
      },
      d: {
        description: "Downloads",
        command: getOpenFolderCommand("/Users/jason/Downloads/"),
      },
      h: {
        description: "Home",
        command: getOpenFolderCommand("/Users/jason/"),
      },
      r: {
        description: "Recent Folders",
        command: 'open "raycast://extensions/jason/recents/recentFolders"',
      },
      s: {
        description: "Scripts",
        command: getOpenFolderCommand("/Users/jason/Scripts/"),
      },
    },
    subLayers: [
      {
        layerKey: "w",
        layerName: "Work Folders >",
        mappings: {
          "1": {
            description: "Work OneDrive",
            command: getOpenFolderCommand(
              "/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP",
            ),
          },
          l: {
            description: "Library",
            command: getOpenFolderCommand(
              "/Users/jason/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/",
            ),
          },
          c: {
            description: "Cases",
            command: getOpenFolderCommand(
              "/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/",
            ),
          },
          p: {
            description: "PDFs",
            command: getOpenFolderCommand("/Users/jason/Downloads/PDFs/"),
          },
          o: {
            description: "Office Files",
            command: getOpenFolderCommand("/Users/jason/Downloads/Office/"),
          },
        },
      },
      {
        layerKey: "c",
        layerName: "Coding Folders >",
        mappings: {
          s: {
            description: "Scripts",
            command: getOpenFolderCommand("/Users/jason/Scripts/"),
          },
          w: {
            description: "Workspaces",
            command: getOpenFolderCommand("/Users/jason/Scripts/workspaces/"),
          },
          c: {
            description: "Chezmoi",
            command: getOpenFolderCommand("/Users/jason/.local/share/chezmoi/"),
          },
          g: {
            description: "Gits",
            command: getOpenFolderCommand("/Users/jason/gits/"),
          },
        },
      },
      {
        layerKey: "p",
        layerName: "Personal Cloud >",
        mappings: {
          "1": {
            description: "Personal OneDrive",
            command: getOpenFolderCommand(
              "/Users/jason/Library/CloudStorage/OneDrive-Personal/",
            ),
          },
          p: {
            description: "Proton Drive",
            command: getOpenFolderCommand(
              "/Users/jason/Library/CloudStorage/ProtonDrive-jason.j.knox@pm.me-folders/",
            ),
          },
        },
      },
    ],
  },
  {
    layerKey: "r",
    layerName: "Recent >",
    releaseLayer: false,
    mappings: {
      a: {
        description: "Applications",
        command: 'open "raycast://extensions/jason/recents/recentApplications"',
      },
      d: {
        description: "Directories",
        command: 'open "raycast://extensions/jason/recents/recentFolders"',
      },
      f: {
        description: "Files",
        command: 'open "raycast://extensions/jason/recents/recents"',
      },
      j: {
        description: "Downloads",
        command: 'open "raycast://extensions/jason/recents/recentDownloads"',
      },
      r: {
        description: "Custom",
        command: 'open "raycast://extensions/jason/recents/recentCustom"',
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
        command: 'open "cleanshot://capture-area"',
      },
      o: {
        description: "OCR",
        command: 'open "cleanshot://capture-text?linebreaks=false"',
      },
      r: {
        description: "Record Screen",
        command: 'open "cleanshot://record-screen"',
      },
      s: {
        description: "Capture Screen",
        command: 'open "cleanshot://capture-fullscreen"',
      },
      w: {
        description: "Capture Window",
        command: 'open "cleanshot://capture-window"',
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
          {
            type: "command",
            value:
              "sleep 0.2 && /Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py wrap_braces --source clipboard --dest paste",
          },
        ],
      },
      p: {
        description: "Parentheses",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && /Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py wrap_parentheses --source clipboard --dest paste",
          },
        ],
      },
      q: {
        description: "Quotes",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && /Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py wrap_quotes --source clipboard --dest paste",
          },
        ],
      },
      s: {
        description: "Square Brackets",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && /Users/jason/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py wrap_brackets --source clipboard --dest paste",
          },
        ],
      },
    },
  },
];
