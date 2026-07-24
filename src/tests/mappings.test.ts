import assert from "node:assert/strict";
import test from "node:test";

import { HOME_DIR, PATHS } from "../data";
import { appRegistry } from "../data/apps";
import { cleanShotRegistry } from "../data/cleanshot";
import { folderRegistry } from "../data/folders";
import { raycastRegistry } from "../data/raycast";
import {
  rectangleMaxOrRestoreCommand,
  rectangleOrientationBasedCommand,
} from "../data/rectangle";
import { tapHoldBindings } from "../definitions";
import {
  enterKeyHoldMappings,
  equalsKeyHoldMappings,
} from "../definitions/enter-equals";
import { homeEndBindings } from "../definitions/home-end";
import {
  disabledShortcutBindings,
  passwordsQuickFillBinding,
} from "../definitions/system";
import type { Binding, Case } from "../engine";

/** Find a tap-hold binding in the merged set by single key + modifiers. */
function findTapHold(key: string, modifiers: string[] = []): Binding {
  const mods = [...modifiers].sort().join(",");
  const found = tapHoldBindings.find(
    (b) =>
      "keys" in b.trigger &&
      b.trigger.keys.length === 1 &&
      b.trigger.keys[0] === key &&
      [...(b.trigger.modifiers ?? [])].sort().join(",") === mods,
  );
  if (!found) throw new Error(`tap-hold binding not found: ${modifiers.join("+")}+${key}`);
  return found;
}

/** Pull a phase's action list out of a binding. */
function phaseDo(b: Binding, phase: "release" | "hold"): Case["do"] {
  const c = b.cases.find((cc) => cc.phase === phase);
  if (!c) throw new Error(`binding has no ${phase} case`);
  return c.do;
}

test("rectangle focused-window orientation command uses focused display", () => {
  const command = rectangleOrientationBasedCommand("left-half", "top-half");

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
  assert.equal(appRegistry.outlook.name, "com.microsoft.Outlook");
  assert.equal(folderRegistry.home.name, `${HOME_DIR}/`);
  assert.equal(raycastRegistry.recentFolders.name, "jason/recents/recentFolders");
  assert.equal(cleanShotRegistry.captureArea.name, "capture-area");
});

test("home-end navigation mappings stay declarative", () => {
  assert.equal(homeEndBindings.length, 4);
  assert.deepEqual(homeEndBindings[0], {
    trigger: { keys: ["home"] },
    cases: [
      {
        phase: "press",
        do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }],
      },
    ],
  });
  assert.deepEqual(homeEndBindings[1], {
    trigger: { keys: ["home"], modifiers: ["left_shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["left_command", "left_shift"],
          },
        ],
      },
    ],
  });
});

test("disabled shortcut mappings stay declarative", () => {
  assert.equal(disabledShortcutBindings.length, 3);
  assert.deepEqual(disabledShortcutBindings[0], {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  });
  assert.deepEqual(disabledShortcutBindings[2], {
    trigger: { keys: ["m"], modifiers: ["left_command", "left_option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  });
});

test("enter key hold mappings stay declarative", () => {
  assert.equal(enterKeyHoldMappings.length, 2);
  assert.deepEqual(enterKeyHoldMappings[0]?.variants[0], {
    description: "Evaluate selection",
    when: { app: appRegistry.excel, unless: true },
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
    timeoutMs: 400,
    thresholdMs: 400,
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
            command: `${PATHS.uvBin} --directory ${PATHS.textProcessorDir} run python ${PATHS.textProcessorEntrypoint} quick_date --source clipboard --dest paste`,
          },
        ],
        timeoutMs: 400,
        thresholdMs: 400,
      },
    ],
  });
});

test("passwords quick fill mapping stays declarative", () => {
  const trigger = passwordsQuickFillBinding.trigger as {
    keys: string[];
    modifiers?: string[];
  };
  // Description is now auto-derived (Phase 2) — no hand-written override.
  assert.equal(passwordsQuickFillBinding.description, undefined);
  assert.deepEqual(trigger.keys, ["slash"]);
  assert.deepEqual(trigger.modifiers, ["left_command"]);
  assert.equal(passwordsQuickFillBinding.cases.length, 2);
});

test("tap-hold mappings keep expected anchor keys", () => {
  // Each findTapHold throws if the binding is absent.
  findTapHold("a");
  findTapHold("q", ["vmCOCS"]);
  findTapHold("left_arrow", ["vmCOCS"]);
  findTapHold("right_arrow", ["vmCOCS"]);
  findTapHold("spacebar", ["vmCOCS"]);
  findTapHold("tab");
  findTapHold("tab", ["vmCOCS"]);
  findTapHold("keypad_1", ["vmCOCS"]);
  findTapHold("keypad_3", ["vmCOCS"]);
  findTapHold("keypad_5", ["vmCOCS"]);
  findTapHold("keypad_7", ["vmCOCS"]);
  findTapHold("keypad_9", ["vmCOCS"]);
  findTapHold("s", ["right_option"]);
});

test("new vmCOCS rectangle mappings stay declarative", () => {
  const left = findTapHold("left_arrow", ["vmCOCS"]);
  assert.deepEqual(phaseDo(left, "release"), [
    { type: "shell", command: rectangleOrientationBasedCommand("left-half", "top-half") },
  ]);
  assert.deepEqual(phaseDo(left, "hold"), [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=app-prev-display",
      background: true,
    },
  ]);

  const spacebar = findTapHold("spacebar", ["vmCOCS"]);
  assert.deepEqual(phaseDo(spacebar, "release"), [
    { type: "shell", command: rectangleMaxOrRestoreCommand() },
  ]);

  const keypad9 = findTapHold("keypad_9", ["vmCOCS"]);
  assert.deepEqual(phaseDo(keypad9, "release"), [
    {
      type: "url",
      url: "rectangle-pro://execute-action?name=top-right-eighth",
      background: true,
    },
  ]);
});

test("vmCOCS+q/e/r/f focus-window tap-hold mappings stay declarative", () => {
  // hyper.ts uses macOS focus-window arrow chords (q/e/r/f = left/right/top/bottom).
  // vmCOCS+w no longer exists.
  assert.throws(() => findTapHold("w", ["vmCOCS"]), /not found/);

  const focusModifiers = ["left_command", "left_control", "left_option"];
  assert.deepEqual(phaseDo(findTapHold("q", ["vmCOCS"]), "release"), [
    { type: "key", key: "left_arrow", modifiers: focusModifiers, options: { repeat: false } },
  ]);
  assert.deepEqual(phaseDo(findTapHold("e", ["vmCOCS"]), "release"), [
    { type: "key", key: "right_arrow", modifiers: focusModifiers, options: { repeat: false } },
  ]);
  assert.deepEqual(phaseDo(findTapHold("r", ["vmCOCS"]), "release"), [
    { type: "key", key: "up_arrow", modifiers: focusModifiers, options: { repeat: false } },
  ]);
  assert.deepEqual(phaseDo(findTapHold("f", ["vmCOCS"]), "release"), [
    { type: "key", key: "down_arrow", modifiers: focusModifiers, options: { repeat: false } },
  ]);
});
