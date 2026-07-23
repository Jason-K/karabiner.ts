import assert from "node:assert/strict";
import test from "node:test";

import type { ActionSpec } from "../core/action-dsl";
import { appRegistry } from "../data/apps";
import { cleanShotRegistry } from "../data/cleanshot";
import { commandRegistry } from "../data/commands";
import { folderRegistry } from "../data/folders";
import { raycastRegistry } from "../data/raycast";
import type { Binding } from "../engine/binding";
import {
  describeAction,
  describeConditionGroup,
  describeTrigger,
  synthesizeManipulatorLabel,
  synthesizeRuleDescription,
} from "../engine/description-synthesizer";

test("describeAction: app variants by mode + actionDesc", () => {
  assert.equal(describeAction({ type: "app", ref: appRegistry.excel }), "open Microsoft Excel");
  assert.equal(
    describeAction({ type: "app", ref: appRegistry.excel, mode: "focus" }),
    "focus Microsoft Excel",
  );
  assert.equal(
    describeAction({ type: "app", ref: appRegistry.excel, mode: "shell" }),
    "open-shell Microsoft Excel",
  );
  assert.equal(
    describeAction({ type: "app", ref: appRegistry.excel, actionDesc: "force" }),
    "open Microsoft Excel | force",
  );
});

test("describeAction: appHistory / folder / raycast / cleanShot / command", () => {
  assert.equal(describeAction({ type: "appHistory", index: 2 }), "Go back 2 apps");
  assert.equal(
    describeAction({ type: "folder", ref: folderRegistry.downloads }),
    "open 'D/Ls'",
  );
  assert.equal(
    describeAction({
      type: "folder",
      ref: folderRegistry.downloads,
      actionDesc: "new tab",
    }),
    "open 'D/Ls' | new tab",
  );
  assert.equal(
    describeAction({ type: "raycast", ref: raycastRegistry.clipboardHistory }),
    "Call 'Clipboard history'",
  );
  assert.equal(
    describeAction({ type: "cleanShot", ref: cleanShotRegistry.captureArea }),
    "Capture area using CSX",
  );
  assert.equal(
    describeAction({ type: "command", ref: commandRegistry.fillPassword }),
    "Run command 'Fill password'",
  );
});

test("describeAction: actHere / caseChange / wrapString", () => {
  assert.equal(describeAction({ type: "actHere", action: "formatCutSeed" }), "Context action: formatCutSeed");
  assert.equal(describeAction({ type: "caseChange", operation: "uppercase" }), "Change case to uppercase");
  assert.equal(
    describeAction({ type: "wrapString", operation: "wrap_quotes" }),
    "Wrap selection in wrap_quotes",
  );
});

test("describeAction: key (with/without mods) + actionDesc", () => {
  assert.equal(describeAction({ type: "key", key: "f2" }), "Emit 'F2'");
  assert.equal(describeAction({ type: "key", key: "return_or_enter" }), "Emit '⏎'");
  assert.equal(describeAction({ type: "key", key: "h", modifiers: ["left_command"] }), "Emit 'H'+←⌘");
  assert.equal(
    describeAction({ type: "key", key: "h", modifiers: ["left_command", "left_option"] }),
    "Emit 'H'+←⌘←⌥",
  );
  assert.equal(
    describeAction({ type: "key", key: "f2", actionDesc: "edit cell" }),
    "Emit 'F2' | edit cell",
  );
});

test("describeAction: url / shell / python / osascript", () => {
  assert.equal(describeAction({ type: "url", url: "https://x.io" }), "Open 'https://x.io'");
  assert.equal(describeAction({ type: "shell", command: "open -u x" }), "Run 'open -u x'");
  assert.equal(describeAction({ type: "python", scriptPath: "/p/s.py" }), "Run python '/p/s.py'");
  assert.equal(describeAction({ type: "osascript", scriptPath: "/p/a.scpt" }), "Run osascript '/p/a.scpt'");
});

test("describeAction: cut / copy / paste / noop", () => {
  assert.equal(describeAction({ type: "cut" }), "Cut selection");
  assert.equal(describeAction({ type: "copy" }), "Copy selection");
  assert.equal(describeAction({ type: "paste" }), "Paste selection");
  assert.equal(describeAction({ type: "noop" }), "No operation");
});

test("describeAction: sequence joins sub-actions with ' then '", () => {
  const seq: ActionSpec = { type: "sequence", actions: [{ type: "cut" }, { type: "paste" }] };
  assert.equal(describeAction(seq), "Cut selection then Paste selection");
});

test("describeAction: setVar uses the var label", () => {
  assert.equal(
    describeAction({ type: "setVar", var: { name: "right_button_pressed", varDesc: "Right button held" } }),
    "Set Right button held",
  );
});

const excelCond = {
  type: "app" as const,
  name: "com.microsoft.Excel",
  refDesc: "Microsoft Excel",
};
const roleVar = {
  name: "accessibility.focused_ui_element.role_string",
  varDesc: "Focused UI role",
};

test("describeConditionGroup: empty -> Always", () => {
  assert.equal(describeConditionGroup(undefined), "Always");
  assert.equal(describeConditionGroup([]), "Always");
});

test("describeConditionGroup: app if/unless + multi-app", () => {
  assert.equal(describeConditionGroup([{ app: excelCond }]), "In Microsoft Excel");
  assert.equal(describeConditionGroup([{ app: excelCond, unless: true }]), "Outside Microsoft Excel");
  assert.equal(
    describeConditionGroup([{ app: [excelCond, { type: "app", name: "b", refDesc: "B" }] }]),
    "In Microsoft Excel/B",
  );
});

test("describeConditionGroup: var if/unless", () => {
  assert.equal(describeConditionGroup([{ var: roleVar, equals: "AXTextField" }]), "Focused UI role");
  assert.equal(
    describeConditionGroup([{ var: roleVar, equals: "AXTextField", unless: true }]),
    "not Focused UI role",
  );
});

test("describeConditionGroup: multiple joined with ' and '", () => {
  assert.equal(
    describeConditionGroup([{ app: excelCond }, { var: roleVar, equals: "AXTextField" }]),
    "In Microsoft Excel and Focused UI role",
  );
});

test("describeTrigger: single key + modifier chords", () => {
  assert.equal(describeTrigger({ keys: ["return_or_enter"] }), "[⏎]:");
  assert.equal(describeTrigger({ keys: ["escape"] }), "[␛]:");
  assert.equal(describeTrigger({ keys: ["home"] }), "[HOME]:");
  assert.equal(describeTrigger({ keys: ["h"], modifiers: ["left_command"] }), "[←⌘]+[H]:");
  assert.equal(
    describeTrigger({ keys: ["m"], modifiers: ["left_command", "left_option"] }),
    "[←⌘←⌥]+[M]:",
  );
});

test("describeTrigger: simultaneous chord joins keys with ']+['", () => {
  assert.equal(describeTrigger({ keys: ["j", "k"] }), "[J]+[K]:");
});

test("describeTrigger: pointer", () => {
  assert.equal(describeTrigger({ pointer: "button1" }), "Click:");
  assert.equal(
    describeTrigger({ pointer: "button1", modifiers: ["left_command"] }),
    "[←⌘]+Click:",
  );
});

const evaluateCmd = { type: "command" as const, name: "x", refDesc: "Evaluate selection" };

test("synthesizeRuleDescription: simple unconditional remap", () => {
  const binding: Binding = {
    trigger: { keys: ["home"] },
    cases: [
      { phase: "press", do: [{ type: "key", key: "left_arrow", modifiers: ["left_command"] }] },
    ],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[HOME]:\n---\n\tOn Tap:\n\t\tAlways:\tEmit '←'+←⌘",
  );
});

test("synthesizeRuleDescription: conditional tap+hold (spec §9 canonical)", () => {
  const binding: Binding = {
    trigger: { keys: ["return_or_enter"] },
    cases: [
      { phase: "release", conditions: [{ app: excelCond }], do: [{ type: "key", key: "f2" }] },
      {
        phase: "release",
        conditions: [{ app: excelCond, unless: true }],
        do: [{ type: "key", key: "return_or_enter" }],
      },
      { phase: "hold", conditions: [{ app: excelCond }], do: [{ type: "key", key: "f2" }] },
      {
        phase: "hold",
        conditions: [{ app: excelCond, unless: true }],
        do: [{ type: "command", ref: evaluateCmd }],
      },
    ],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[⏎]:\n---\n\tOn Tap:\n\t\tIn Microsoft Excel:\tEmit 'F2'\n\t\tOutside Microsoft Excel:\tEmit '⏎'\n\tOn Hold:\n\t\tIn Microsoft Excel:\tEmit 'F2'\n\t\tOutside Microsoft Excel:\tRun command 'Evaluate selection'",
  );
});

test("synthesizeRuleDescription: multi-action case joined with ' then '", () => {
  const binding: Binding = {
    trigger: { keys: ["slash"], modifiers: ["left_command"] },
    cases: [
      {
        phase: "press",
        conditions: [{ app: { type: "app", name: "w", refDesc: "Word" } }],
        do: [{ type: "osascript", scriptPath: "/a.scpt" }, { type: "shell", command: "elevate" }],
      },
    ],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[←⌘]+[/]:\n---\n\tOn Tap:\n\t\tIn Word:\tRun osascript '/a.scpt' then Run 'elevate'",
  );
});

test("synthesizeRuleDescription: Case.description overrides the action line", () => {
  const binding: Binding = {
    trigger: { keys: ["x"] },
    cases: [{ phase: "press", do: [{ type: "noop" }], description: "Custom fragment" }],
  };
  assert.equal(
    synthesizeRuleDescription(binding),
    "[X]:\n---\n\tOn Tap:\n\t\tAlways:\tCustom fragment",
  );
});

test("synthesizeManipulatorLabel: undefined when unconditional", () => {
  assert.equal(synthesizeManipulatorLabel(undefined), undefined);
  assert.equal(synthesizeManipulatorLabel([]), undefined);
});

test("synthesizeManipulatorLabel: condition-group label when conditional", () => {
  assert.equal(
    synthesizeManipulatorLabel([{ app: { type: "app", name: "x", refDesc: "Excel" } }]),
    "In Excel",
  );
  assert.equal(
    synthesizeManipulatorLabel([
      { app: { type: "app", name: "x", refDesc: "Excel" }, unless: true },
    ]),
    "Outside Excel",
  );
});
