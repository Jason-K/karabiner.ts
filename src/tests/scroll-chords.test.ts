import assert from "node:assert/strict";
import test from "node:test";

import {
    scrollChordBrowserBundleIds,
    scrollChordTriggerKeys,
} from "../mappings/scroll-chords";
import { buildScrollChordRules } from "../rules/scroll-chords";

test("scroll chord trigger keys reserve F19-F24 in order", () => {
  assert.deepEqual(scrollChordTriggerKeys, {
    volumeUp: "f19",
    volumeDown: "f20",
    appSwitcherNext: "f21",
    appSwitcherPrevious: "f22",
    tabSwitcherNext: "f23",
    tabSwitcherPrevious: "f24",
  });
});

test("scroll chord browser bundle ids include Zen, Firefox, and Bloom", () => {
  assert.deepEqual([...scrollChordBrowserBundleIds], [
    "app.zen-browser.zen",
    "org.mozilla.firefox",
    "com.asiafu.Bloom",
  ]);
});

test("scroll chord rules route browser tab switching through page up and down", () => {
  const rules = buildScrollChordRules().map((entry) => entry.build());

  assert.equal(rules.length, 6);

  const nextTabRule = rules[4];
  assert.equal(nextTabRule?.manipulators.length, 2);
  assert.deepEqual(nextTabRule?.manipulators[0]?.from, {
    key_code: "f23",
    modifiers: undefined,
  });
  assert.deepEqual(nextTabRule?.manipulators[0]?.to, [
    { key_code: "page_up", modifiers: ["left_control"], repeat: false },
  ]);
  assert.deepEqual(nextTabRule?.manipulators[0]?.conditions, [
    {
      type: "frontmost_application_if",
      bundle_identifiers: [...scrollChordBrowserBundleIds],
      description: undefined,
      file_paths: undefined,
    },
  ]);
  assert.deepEqual(nextTabRule?.manipulators[1]?.conditions, [
    {
      type: "frontmost_application_unless",
      bundle_identifiers: [...scrollChordBrowserBundleIds],
      description: undefined,
      file_paths: undefined,
    },
  ]);

  const previousTabRule = rules[5];
  assert.deepEqual(previousTabRule?.manipulators[0]?.to, [
    { key_code: "page_down", modifiers: ["left_control"], repeat: false },
  ]);
  assert.deepEqual(previousTabRule?.manipulators[1]?.to, [
    { key_code: "tab", modifiers: ["left_control", "left_shift"], repeat: false },
  ]);
});
