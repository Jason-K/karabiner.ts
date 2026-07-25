import assert from "node:assert/strict";
import test from "node:test";

import { HOME_DIR, Paths } from "../data";
import { Apps } from "../data/apps";
import { Commands } from "../data/commands";
import { Folders } from "../data/folders";
import { Urls } from "../data/urls";
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
import { resolveModifiers, type Binding, type Case } from "../engine";

/** Find a tap-hold binding in the merged set by single key + modifiers. */
function findTapHold(key: string, modifiers: string[] = []): Binding {
  const { mandatory: expectedMandatory } = resolveModifiers(modifiers);
  const expectedMandStr = expectedMandatory.sort().join(",");
  const found = tapHoldBindings.find((b) => {
    if (!("keys" in b.trigger) || b.trigger.keys.length !== 1 || b.trigger.keys[0] !== key) {
      return false;
    }
    const { mandatory, optional } = resolveModifiers(b.trigger.modifiers);
    return mandatory.sort().join(",") === expectedMandStr && optional.length === 0;
  });
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
  const command = Commands.winLeftOrTop.name;

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
  const command = Commands.winMaxOrRestore.name;

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
  assert.equal(Apps.outlook.name, "com.microsoft.Outlook");
  assert.equal(Folders.home.name, `${HOME_DIR}/`);
  assert.equal(Urls.rayRecentFolders.name, "raycast-x://extensions/jason/recents/recentFolders");
  assert.equal(Urls.csxCaptureArea.name, "cleanshot://capture-area");
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
    trigger: { keys: ["home"], modifiers: ["shift"] },
    cases: [
      {
        phase: "press",
        do: [
          {
            type: "key",
            key: "left_arrow",
            modifiers: ["left_command", "shift"],
          },
        ],
      },
    ],
  });
});

test("disabled shortcut mappings stay declarative", () => {
  assert.equal(disabledShortcutBindings.length, 4);
  assert.deepEqual(disabledShortcutBindings[0], {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  });
  assert.deepEqual(disabledShortcutBindings[2], {
    trigger: { keys: ["m"], modifiers: ["left_command", "option"] },
    cases: [{ phase: "press", do: [{ type: "noop" }] }],
  });
});

test("enter key hold mappings stay declarative", () => {
  assert.equal(enterKeyHoldMappings.length, 2);
  assert.deepEqual(enterKeyHoldMappings[0]?.variants[0], {
    description: "Evaluate selection",
    when: { app: Apps.excel, unless: true },
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
            modifiers: ["shift", "option"],
          },
          {
            type: "key",
            key: "c",
            modifiers: ["left_command"],
          },
          {
            type: "shell",
            command: `${Paths.uvBin.name} --directory ${Paths.textProcessorDir.name} run python ${Paths.textProcessorEntrypoint.name} quick_date --source clipboard --dest paste`,
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
    { type: "shell", command: Commands.winLeftOrTop },
  ]);
  assert.deepEqual(phaseDo(left, "hold"), [
    {
      type: "url",
      url: Urls.rectAppPrevDisplay,
      background: true,
    },
  ]);

  const spacebar = findTapHold("spacebar", ["vmCOCS"]);
  assert.deepEqual(phaseDo(spacebar, "release"), [
    { type: "shell", command: Commands.winMaxOrRestore },
  ]);

  const keypad9 = findTapHold("keypad_9", ["vmCOCS"]);
  assert.deepEqual(phaseDo(keypad9, "release"), [
    {
      type: "url",
      url: Urls.rectWinTopRightEighth,
      background: true,
    },
  ]);
});

test("vmCOCS+q/e/r/f focus-window tap-hold mappings stay declarative", () => {
  // hyper.ts uses macOS focus-window arrow chords (q/e/r/f = left/right/top/bottom).
  // vmCOCS+w no longer exists.
  assert.throws(() => findTapHold("w", ["vmCOCS"]), /not found/);

  const focusModifiers = ["left_command", "control", "option"];
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
