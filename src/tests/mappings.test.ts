import assert from "node:assert/strict";
import test from "node:test";

import { appRegistry } from "../mappings/apps";
import { cleanShotRegistry } from "../mappings/cleanshot";
import { disabledShortcuts } from "../mappings/disabled-shortcuts";
import { folderRegistry } from "../mappings/folders";
import { homeEndNavigationMappings } from "../mappings/navigation";
import { raycastRegistry } from "../mappings/raycast";
import { rightOptionLaunchers } from "../mappings/right-option-launchers";
import { securitySlashActionMappings } from "../mappings/security-actions";
import { spaceLayerDefinitions } from "../mappings/space-layers";
import {
    enterKeyHoldMappings,
    equalsKeyHoldMappings,
} from "../mappings/special-key-holds";
import { tapHoldMappings } from "../mappings/tap-hold";

test("registries centralize app folder and integration refs", () => {
  assert.equal(appRegistry.outlook, "com.microsoft.Outlook");
  assert.equal(folderRegistry.home, "/Users/jason/");
  assert.equal(raycastRegistry.recentFolders, "jason/recents/recentFolders");
  assert.equal(cleanShotRegistry.captureArea, "capture-area");
});

test("right-option launchers stay declarative", () => {
  assert.equal(rightOptionLaunchers.length, 10);
  assert.deepEqual(rightOptionLaunchers[0], {
    key: "a",
    description: "Antinote",
    action: {
      type: "focusApp",
      bundleId: "com.chabomakers.Antinote-setapp",
    },
  });
  assert.deepEqual(rightOptionLaunchers[4], {
    key: "f",
    description: "Home folder",
    action: {
      type: "openFolder",
      path: "/Users/jason",
    },
  });
});

test("home-end navigation mappings stay declarative", () => {
  assert.equal(homeEndNavigationMappings.length, 4);
  assert.deepEqual(homeEndNavigationMappings[0], {
    from: { key: "home" },
    description: "Move to line start",
    to: { key: "left_arrow", modifiers: ["command"] },
  });
  assert.deepEqual(homeEndNavigationMappings[1], {
    from: { key: "home", modifiers: ["shift"] },
    description: "Select to line start",
    to: { key: "left_arrow", modifiers: ["command", "shift"] },
  });
});

test("disabled shortcut mappings stay declarative", () => {
  assert.equal(disabledShortcuts.length, 3);
  assert.deepEqual(disabledShortcuts[0], {
    key: "h",
    modifiers: ["left_command"],
    description: "Disabled hide shortcut",
  });
  assert.deepEqual(disabledShortcuts[2], {
    key: "m",
    modifiers: ["left_command", "option"],
    description: "Disabled minimize shortcut",
  });
});

test("enter key hold mappings stay declarative", () => {
  assert.equal(enterKeyHoldMappings.length, 2);
  assert.deepEqual(enterKeyHoldMappings[0]?.variants[0], {
    description: "Evaluate selection",
    when: { app: "com.microsoft.Excel", unless: true },
    alone: [
      {
        type: "key",
        key: "keypad_enter",
        options: { halt: true },
      },
    ],
    hold: [
      {
        type: "shell",
        command: "/opt/homebrew/bin/hs -c 'FormatCutSeed()'",
      },
    ],
    timeoutMs: 200,
    thresholdMs: 200,
  });
});

test("equals key hold mappings stay declarative", () => {
  assert.equal(equalsKeyHoldMappings.length, 2);
  assert.deepEqual(equalsKeyHoldMappings[1], {
    key: "equal_sign",
    variants: [
      {
        description: "Quick date",
        alone: [
          {
            type: "key",
            key: "keypad_equal_sign",
            options: { halt: true },
          },
        ],
        hold: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["shift", "option"],
          },
          {
            type: "key",
            key: "c",
            modifiers: ["command"],
          },
          {
            type: "shell",
            command:
              "~/.local/bin/uv --directory ~/Scripts/strings/text_processor run python interfaces/cli.py quick_date --source clipboard --dest paste",
          },
        ],
        timeoutMs: 200,
        thresholdMs: 200,
      },
    ],
  });
});

test("security slash action mappings stay declarative", () => {
  assert.equal(securitySlashActionMappings.length, 2);
  assert.deepEqual(securitySlashActionMappings[0], {
    key: "slash",
    modifiers: ["left_command"],
    description: "Copy document name and elevate privileges",
    variants: [
      {
        when: [
          {
            type: "frontmostApp",
            bundleIds: ["com.microsoft.Word"],
          },
        ],
        actions: [
          {
            type: "applescript",
            scriptPath:
              "~/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript",
          },
          {
            type: "shell",
            command:
              "/Applications/Privileges.app/Contents/MacOS/PrivilegesCLI -a && sleep 1.3",
          },
        ],
      },
    ],
  });
  assert.equal(securitySlashActionMappings[1]?.variants.length, 2);
});

test("tap-hold mappings keep expected anchor keys", () => {
  assert.ok(tapHoldMappings.a);
  assert.ok(tapHoldMappings["hyper+q"]);
  assert.ok(tapHoldMappings.tab);
  assert.ok(tapHoldMappings["hyper+w"]);
  assert.ok(tapHoldMappings["right_option+s"]);
});

test("hyper+q and hyper+w tap-hold mappings stay declarative", () => {
  assert.equal(tapHoldMappings["hyper+q"].description, "Rectangle Pro left");
  assert.equal(tapHoldMappings["hyper+w"].description, "Rectangle Pro right");

  assert.deepEqual(tapHoldMappings["hyper+q"].alone, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=left-half",
      background: true,
    },
  ]);
  assert.deepEqual(tapHoldMappings["hyper+q"].hold, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=fill-left",
      background: true,
    },
  ]);

  assert.deepEqual(tapHoldMappings["hyper+w"].alone, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=right-half",
      background: true,
    },
  ]);
  assert.deepEqual(tapHoldMappings["hyper+w"].hold, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=fill-right",
      background: true,
    },
  ]);
});

test("space layer definitions keep expected top-level layers", () => {
  const layerKeys = spaceLayerDefinitions.map((l) => l.layerKey);
  assert.deepEqual(layerKeys, ["a", "c", "d", "f", "r", "s", "w"]);
});

test("folders layer uses folder and raycast refs", () => {
  const folders = spaceLayerDefinitions.find((l) => l.layerKey === "f");
  assert.ok(folders);
  assert.equal(Object.keys(folders?.mappings ?? {}).length, 11);
  assert.deepEqual(folders?.mappings.r, {
    description: "Recent Folders",
    action: { type: "raycast", ref: "recentFolders" },
  });
  assert.deepEqual(folders?.mappings.s, {
    description: "Scripts",
    action: { type: "folder", ref: "scripts" },
  });
});
