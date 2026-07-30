import assert from "node:assert/strict";
import test from "node:test";

import { HOME_DIR, PATHS, TIMINGS } from "../data";
import { APP_ID } from "../data/registry-app-ids";
import { CMDS } from "../data/registry-cmds";
import { COMBOS } from "../data/registry-combos";
import { URLS } from "../data/registry-urls";
import { tapHoldBindings } from "../definitions";
import { disabledHotkeys } from "../definitions/disable-hotkeys";

import {
  condApp,
  condNotApp,
  hold,
  key,
  noop,
  openUrl,
  press,
  release,
  resolveModifiers,
  shell,
  type Binding,
  type Case,
} from "../engine";

const fillPassword = tapHoldBindings.find(
  (b) =>
    "keys" in b.trigger &&
    b.trigger.keys.includes("slash") &&
    Array.isArray(b.trigger.modifiers) &&
    b.trigger.modifiers.includes("left_command"),
)!;

/** Find a tap-hold binding in the merged set by single key + modifiers. */
function findTapHold(key: string, modifiers: string[] = []): Binding {
  const { mandatory: expectedMandatory } = resolveModifiers(modifiers);
  const expectedMandStr = expectedMandatory.sort().join(",");
  const found = tapHoldBindings.find((b) => {
    if (
      !("keys" in b.trigger) ||
      b.trigger.keys.length !== 1 ||
      b.trigger.keys[0] !== key
    ) {
      return false;
    }
    const { mandatory, optional } = resolveModifiers(b.trigger.modifiers);
    return (
      mandatory.sort().join(",") === expectedMandStr && optional.length === 0
    );
  });
  if (!found)
    throw new Error(
      `tap-hold binding not found: ${modifiers.join("+")}+${key}`,
    );
  return found;
}

/** Pull a phase's action list out of a binding. */
function phaseDo(b: Binding, phase: "release" | "hold"): Case["do"] {
  const c = b.cases.find((cc) => cc.phase === phase);
  if (!c) throw new Error(`binding has no ${phase} case`);
  return c.do;
}

test("rectangle focused-window orientation command uses focused display", () => {
  const command = CMDS.winLeftOrTop.name;

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
  const command = CMDS.winMaxOrRestore.name;

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
  assert.equal(APP_ID.outlook.name, "com.microsoft.Outlook");
  assert.equal(PATHS.dirHome.name, HOME_DIR);
  assert.equal(
    URLS.rayRecentFolders.name,
    "raycast-x://extensions/jason/recents/recentFolders",
  );
  assert.equal(URLS.csxCaptureArea.name, "cleanshot://capture-area");
});

test("home-end navigation mappings stay declarative", () => {
  const home = findTapHold("home");
  assert.deepEqual(home, {
    trigger: { keys: ["home"] },
    cases: [press(key("left_arrow", ["left_command"]))],
  });

  const homeShift = findTapHold("home", ["shift"]);
  assert.deepEqual(homeShift, {
    trigger: { keys: ["home"], modifiers: ["shift"] },
    cases: [press(key("left_arrow", ["left_command", "shift"]))],
  });

  const end = findTapHold("end");
  assert.deepEqual(end, {
    trigger: { keys: ["end"] },
    cases: [press(key("right_arrow", ["left_command"]))],
  });

  const endShift = findTapHold("end", ["shift"]);
  assert.deepEqual(endShift, {
    trigger: { keys: ["end"], modifiers: ["shift"] },
    cases: [press(key("right_arrow", ["left_command", "shift"]))],
  });
});

test("disabled shortcut mappings stay declarative", () => {
  assert.equal(disabledHotkeys.length, 4);
  assert.deepEqual(disabledHotkeys[0], {
    trigger: { keys: ["h"], modifiers: ["left_command"] },
    cases: [press(noop())],
  });
  assert.deepEqual(disabledHotkeys[2], {
    trigger: { keys: ["m"], modifiers: ["left_command", "option"] },
    cases: [press(noop())],
  });
});

test("enter key hold mappings stay declarative", () => {
  const keypadEnter = findTapHold("keypad_enter");
  assert.deepEqual(keypadEnter, {
    trigger: { keys: ["keypad_enter"] },
    cases: [
      release(key("keypad_enter", { halt: true })),
      hold(shell(CMDS.hsFormatCutSeed)).when(condNotApp(APP_ID.excel)),
      hold(key("f2", { repeat: false })).when(
        condApp(APP_ID.excel),
      ),
    ],
  });

  const returnOrEnter = findTapHold("return_or_enter");
  assert.deepEqual(returnOrEnter, {
    trigger: { keys: ["return_or_enter"] },
    cases: [
      release(key("return_or_enter", { halt: true })),
      hold(shell(CMDS.hsFormatCutSeed)).when(condNotApp(APP_ID.excel)),
      hold(key("f2", { repeat: false })).when(
        condApp(APP_ID.excel),
      ),
    ],
  });
});

test("equals key hold mappings stay declarative", () => {
  const keypadEqualSign = findTapHold("keypad_equal_sign");
  assert.deepEqual(keypadEqualSign, {
    trigger: { keys: ["keypad_equal_sign"] },
    cases: [
      release(key("keypad_equal_sign", { halt: true })),
      hold([
        key("left_arrow", ["option", "shift"]),
        shell(CMDS.tpQuickDate),
      ]),
    ],
  });

  const equalSign = findTapHold("equal_sign");
  assert.deepEqual(equalSign, {
    trigger: { keys: ["equal_sign"] },
    cases: [
      release(key("keypad_equal_sign", { halt: true })),
      hold([
        key("left_arrow", ["option", "shift"]),
        shell(CMDS.tpQuickDate),
      ]),
    ],
  });
});

test("passwords quick fill mapping stays declarative", () => {
  const trigger = fillPassword.trigger as {
    keys: string[];
    modifiers?: string[];
  };
  // Description is now auto-derived (Phase 2) — no hand-written override.
  assert.equal(fillPassword.description, undefined);
  assert.deepEqual(trigger.keys, ["slash"]);
  assert.deepEqual(trigger.modifiers, ["left_command"]);
  assert.equal(fillPassword.cases.length, 3);
});

test("tap-hold mappings keep expected anchor keys", () => {
  // Each findTapHold throws if the binding is absent.
  findTapHold("a");
  findTapHold("q", ["COCS"]);
  findTapHold("left_arrow", ["COCS"]);
  findTapHold("right_arrow", ["COCS"]);
  findTapHold("spacebar", ["COCS"]);
  findTapHold("tab");
  findTapHold("tab", ["COCS"]);
  findTapHold("keypad_1", ["COCS"]);
  findTapHold("keypad_3", ["COCS"]);
  findTapHold("keypad_5", ["COCS"]);
  findTapHold("keypad_7", ["COCS"]);
  findTapHold("keypad_9", ["COCS"]);
  findTapHold("s", ["right_option"]);
});

test("new COCS rectangle mappings stay declarative", () => {
  const left = findTapHold("left_arrow", ["COCS"]);
  assert.deepEqual(phaseDo(left, "release"), [
    { type: "shell", command: CMDS.winLeftOrTop },
  ]);
  assert.deepEqual(phaseDo(left, "hold"), [
    {
      type: "url",
      url: URLS.rectAppPrevDisplay,
      background: true,
    },
  ]);

  const spacebar = findTapHold("spacebar", ["COCS"]);
  assert.deepEqual(phaseDo(spacebar, "release"), [
    { type: "shell", command: CMDS.winMaxOrRestore },
  ]);

  const keypad9 = findTapHold("keypad_9", ["COCS"]);
  assert.deepEqual(phaseDo(keypad9, "release"), [
    {
      type: "url",
      url: URLS.rectWinTopRightEighth,
      background: true,
    },
  ]);
});
