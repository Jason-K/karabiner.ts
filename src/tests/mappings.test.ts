import assert from "node:assert/strict";
import test from "node:test";

import { DEVICE_IDENTIFIERS, HOME_DIR, PATHS } from "../data";
import { appRegistry } from "../data/apps";
import { cleanShotRegistry } from "../data/cleanshot";
import { folderRegistry } from "../data/folders";
import { ACTIVATE_WINDOW_UNDER_CURSOR_EVENT } from "../data/mouse";
import { raycastRegistry } from "../data/raycast";
import {
  rectangleActionByFocusedWindowOrientationCommand,
  rectangleActionUrl,
  rectangleMaxOrRestoreCommand,
} from "../data/rectangle";
import { tapHoldMappings } from "../definitions";
import {
  enterKeyHoldMappings,
  equalsKeyHoldMappings,
} from "../definitions/enter-equals";
import { homeEndNavigationMappings } from "../definitions/home-end";
import { mouseDeviceMappings } from "../definitions/mouse";
import { rightOptionLaunchers } from "../definitions/right-option";
import {
  disabledShortcuts,
  passwordsQuickFillMapping,
} from "../definitions/system";

test("rectangle focused-window orientation command uses focused display", () => {
  const command = rectangleActionByFocusedWindowOrientationCommand(
    "left-half",
    "top-half",
  );

  assert.match(command, /hs\.window\.focusedWindow\(\)/);
  assert.match(command, /win and win:screen\(\)/);
  assert.match(command, /hs\.urlevent\.openURL\(url\)/);
  assert.match(
    command,
    /\[\[rectangle-pro:\/\/execute-action\?name=left-half\]\]/,
  );
  assert.match(
    command,
    /\[\[rectangle-pro:\/\/execute-action\?name=top-half\]\]/,
  );
  assert.doesNotMatch(command, /hs\.execute\(/);
  assert.match(command, /rectangle-pro:\/\/execute-action\?name=left-half/);
  assert.match(command, /rectangle-pro:\/\/execute-action\?name=top-half/);
});

test("rectangle max-or-restore command uses focused window coverage", () => {
  const command = rectangleMaxOrRestoreCommand();

  assert.match(command, /hs\.window\.focusedWindow\(\)/);
  assert.match(command, /screen:frame\(\)/);
  assert.match(command, /win:frame\(\)/);
  assert.match(command, /widthCoverage >= 0\.97/);
  assert.match(command, /heightCoverage >= 0\.9/);
  assert.match(command, /hs\.urlevent\.openURL\(url\)/);
  assert.match(command, /rectangle-pro:\/\/execute-action\?name=restore/);
  assert.match(command, /rectangle-pro:\/\/execute-action\?name=maximize/);
});

test("registries centralize app folder and integration refs", () => {
  assert.equal(appRegistry.outlook, "com.microsoft.Outlook");
  assert.equal(folderRegistry.home, `${HOME_DIR}/`);
  assert.equal(raycastRegistry.recentFolders, "jason/recents/recentFolders");
  assert.equal(cleanShotRegistry.captureArea, "capture-area");
});

test("right-option launchers stay declarative", () => {
  assert.equal(rightOptionLaunchers.length, 10);
  assert.deepEqual(rightOptionLaunchers[0], {
    key: "a",
    description: "Antinote",
    action: {
      type: "app",
      ref: "antinote",
      mode: "focus",
    },
  });
  assert.deepEqual(rightOptionLaunchers[4], {
    key: "f",
    description: "Home folder",
    action: {
      type: "folder",
      ref: "home",
    },
  });
});

test("home-end navigation mappings stay declarative", () => {
  assert.equal(homeEndNavigationMappings.length, 4);
  assert.deepEqual(homeEndNavigationMappings[0], {
    from: { key: "home" },
    description: "Move to line start",
    to: { key: "left_arrow", modifiers: ["left_command"] },
  });
  assert.deepEqual(homeEndNavigationMappings[1], {
    from: { key: "home", modifiers: ["left_shift"] },
    description: "Select to line start",
    to: { key: "left_arrow", modifiers: ["left_command", "left_shift"] },
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
    modifiers: ["left_command", "left_option"],
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
            modifiers: ["left_shift", "left_option"],
          },
          {
            type: "key",
            key: "c",
            modifiers: ["left_command"],
          },
          {
            type: "shell",
            command: `${PATHS.textProcessorUvBin} --directory ${PATHS.textProcessorDir} run python ${PATHS.textProcessorEntrypoint} quick_date --source clipboard --dest paste`,
          },
        ],
        timeoutMs: 200,
        thresholdMs: 200,
      },
    ],
  });
});

test("passwords quick fill mapping stays declarative", () => {
  assert.equal(passwordsQuickFillMapping.key, "slash");
  assert.deepEqual(passwordsQuickFillMapping.modifiers, ["left_command"]);
  assert.equal(passwordsQuickFillMapping.description, "Quick fill password");
  assert.equal(passwordsQuickFillMapping.variants.length, 2);
});

test("tap-hold mappings keep expected anchor keys", () => {
  assert.ok(tapHoldMappings.a);
  assert.ok(tapHoldMappings["vmCOC_+q"]);
  assert.ok(tapHoldMappings["vmCOC_+left_arrow"]);
  assert.ok(tapHoldMappings["vmCOC_+right_arrow"]);
  assert.ok(tapHoldMappings["vmCOC_+spacebar"]);
  assert.ok(tapHoldMappings.tab);
  assert.ok(tapHoldMappings["vmCOC_+tab"]);
  assert.ok(tapHoldMappings["vmCOC_+keypad_1"]);
  assert.ok(tapHoldMappings["vmCOC_+keypad_3"]);
  assert.ok(tapHoldMappings["vmCOC_+keypad_5"]);
  assert.ok(tapHoldMappings["vmCOC_+keypad_7"]);
  assert.ok(tapHoldMappings["vmCOC_+keypad_9"]);
  assert.ok(tapHoldMappings["right_option+s"]);
});

test("new vmCOC_ rectangle mappings stay declarative", () => {
  assert.deepEqual(tapHoldMappings["vmCOC_+left_arrow"].alone, [
    {
      type: "shell",
      command: rectangleActionByFocusedWindowOrientationCommand(
        "left-half",
        "top-half",
      ),
    },
  ]);
  assert.deepEqual(tapHoldMappings["vmCOC_+left_arrow"].hold, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=previous-display",
      background: true,
    },
  ]);

  assert.deepEqual(tapHoldMappings["vmCOC_+spacebar"].alone, [
    {
      type: "shell",
      command: rectangleMaxOrRestoreCommand(),
    },
  ]);

  assert.deepEqual(tapHoldMappings["vmCOC_+keypad_9"].alone, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=top-right-eighth",
      background: true,
    },
  ]);
});

test("vmCOC_+q and vmCOC_+w tap-hold mappings stay declarative", () => {
  assert.equal(tapHoldMappings["vmCOC_+q"].description, "Rectangle Pro left");
  assert.equal(tapHoldMappings["vmCOC_+w"].description, "Rectangle Pro right");

  assert.deepEqual(tapHoldMappings["vmCOC_+q"].alone, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=left-half",
      background: true,
    },
  ]);
  assert.deepEqual(tapHoldMappings["vmCOC_+q"].hold, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=fill-left",
      background: true,
    },
  ]);

  assert.deepEqual(tapHoldMappings["vmCOC_+w"].alone, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=right-half",
      background: true,
    },
  ]);
  assert.deepEqual(tapHoldMappings["vmCOC_+w"].hold, [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=fill-right",
      background: true,
    },
  ]);
});

test("mouse device mappings are declarative and device-scoped", () => {
  assert.equal(mouseDeviceMappings.length, 1);
  assert.equal(mouseDeviceMappings[0]?.key, "logitech_g502_x");
  assert.deepEqual(
    mouseDeviceMappings[0]?.identifiers,
    DEVICE_IDENTIFIERS.logitechG502X,
  );
  assert.equal(mouseDeviceMappings[0]?.buttonMap.shift, "button5");
  assert.equal(mouseDeviceMappings[0]?.mappings.length, 10);

  const backMapping = mouseDeviceMappings[0]?.mappings.find(
    (m) => m.type === "tapHold" && m.button === "back",
  );
  assert.deepEqual(backMapping, {
    type: "tapHold",
    button: "back",
    description: "[BACK] Back (tap) / Window switch (hold)",
    alone: [{ pointing_button: "button4" }],
    hold: [{ key_code: "tab", modifiers: ["left_command"] }],
    eventOptions: { halt: true, repeat: false },
    thresholdMs: 300,
    timeoutMs: 300,
  });

  assert.deepEqual(mouseDeviceMappings[0]?.mappings[0], {
    type: "tapHold",
    button: "shift",
    description: "[SHIFT] Mission Control (tap) / Rectangle key (hold)",
    alone: [
      {
        key_code: "up_arrow",
        modifiers: ["left_control"],
      },
    ],
    hold: [
      ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
      {
        key_code: "left_control",
        modifiers: ["left_option", "left_shift"],
      },
    ],
    thresholdMs: 300,
    timeoutMs: 300,
  });

  assert.deepEqual(mouseDeviceMappings[0]?.mappings[1], {
    type: "tapHold",
    button: "wheel_left",
    description: "[WHEEL LEFT] Rectangle fill-left (hold)",
    hold: [
      ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
      {
        shell_command: rectangleActionByFocusedWindowOrientationCommand(
          "fill-left",
          "top-half",
        ),
      },
    ],
    thresholdMs: 200,
    timeoutMs: 200,
  });

  const middleFrontMapping = mouseDeviceMappings[0]?.mappings.find(
    (m) => m.type === "tapHold" && m.button === "middle_front",
  );
  assert.deepEqual(middleFrontMapping, {
    type: "tapHold",
    button: "middle_front",
    description: "[WHEEL] Middle (tap) / Rectangle maximize (hold)",
    variable: "middle_front_pressed",
    alone: [{ pointing_button: "button3" }],
    hold: [
      ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
      {
        shell_command: rectangleMaxOrRestoreCommand(),
      },
    ],
    thresholdMs: 300,
    timeoutMs: 300,
  });

  const leftForwardMapping = mouseDeviceMappings[0]?.mappings.find(
    (m) => m.type === "tapHold" && m.button === "left_forward",
  );

  const leftBackMapping = mouseDeviceMappings[0]?.mappings.find(
    (m) => m.type === "tapHold" && m.button === "left_back",
  );
  assert.equal(
    leftBackMapping?.description,
    "[G7] Rectangle Max/Restore (tap) / Next Display (hold)",
  );
  const leftBackAlone =
    leftBackMapping?.type === "tapHold" ? leftBackMapping.alone : undefined;
  assert.ok(leftBackAlone);
  assert.equal(leftBackAlone?.length, 1);
  assert.deepEqual(leftBackAlone?.[0], {
    shell_command: rectangleMaxOrRestoreCommand(),
  });
  const leftBackHold =
    leftBackMapping?.type === "tapHold" ? leftBackMapping.hold : undefined;
  assert.deepEqual(leftBackHold, [
    ACTIVATE_WINDOW_UNDER_CURSOR_EVENT,
    {
      shell_command: `open -g '${rectangleActionUrl("next-display")}'`,
    },
  ]);
  assert.deepEqual(leftForwardMapping, {
    type: "tapHold",
    button: "left_forward",
    description: "[G8] Activate Popclip (tap) / Sidenote (hold)",
    alone: [
      {
        shell_command: "osascript -e 'tell application \"Popclip\" to appear'",
      },
    ],
    hold: [
      {
        key_code: "f10",
        modifiers: ["left_command", "left_option", "left_shift"],
      },
    ],
    thresholdMs: 300,
    timeoutMs: 300,
  });
});
