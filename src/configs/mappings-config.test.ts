import assert from "node:assert/strict";
import test from "node:test";

import { buildSpaceLayers } from "./space-layers";
import { tapHoldKeys } from "./tap-hold-keys";

test("tap-hold config keeps expected anchor keys", () => {
  assert.ok(tapHoldKeys.a);
  assert.ok(tapHoldKeys["hyper+q"]);
  assert.ok(tapHoldKeys["hyper+tab"]);
  assert.ok(tapHoldKeys.tab);
  assert.ok(tapHoldKeys["super+tab"]);
  assert.ok(tapHoldKeys["hyper+w"]);
  assert.ok(tapHoldKeys["right_option+s"]);
});

test("hyper+q and hyper+w tap-hold config map to Rectangle Pro actions", () => {
  assert.equal(tapHoldKeys["hyper+q"].description, "Rectangle Pro left");
  assert.equal(tapHoldKeys["hyper+w"].description, "Rectangle Pro right");

  assert.deepEqual(tapHoldKeys["hyper+q"].alone, [
    {
      shell_command: 'open -g "rectangle-pro://execute-action?name=left-half"',
    },
  ]);
  assert.deepEqual(tapHoldKeys["hyper+q"].hold, [
    {
      shell_command: 'open -g "rectangle-pro://execute-action?name=fill-left"',
    },
  ]);

  assert.deepEqual(tapHoldKeys["hyper+w"].alone, [
    {
      shell_command: 'open -g "rectangle-pro://execute-action?name=right-half"',
    },
  ]);
  assert.deepEqual(tapHoldKeys["hyper+w"].hold, [
    {
      shell_command: 'open -g "rectangle-pro://execute-action?name=fill-right"',
    },
  ]);
});

test("hyper+tab and super+tab tap-hold config map to Rectangle Pro actions", () => {
  assert.equal(
    tapHoldKeys["hyper+tab"].description,
    "Rectangle Pro next display/space",
  );
  assert.equal(
    tapHoldKeys["super+tab"].description,
    "Rectangle Pro prev display/space",
  );

  assert.deepEqual(tapHoldKeys["hyper+tab"].alone, [
    {
      shell_command:
        'open -g "rectangle-pro://execute-action?name=next-display"',
    },
  ]);
  assert.deepEqual(tapHoldKeys["hyper+tab"].hold, [
    {
      shell_command: 'open -g "rectangle-pro://execute-action?name=next-space"',
    },
  ]);

  assert.deepEqual(tapHoldKeys["super+tab"].alone, [
    {
      shell_command:
        'open -g "rectangle-pro://execute-action?name=prev-display"',
    },
  ]);
  assert.deepEqual(tapHoldKeys["super+tab"].hold, [
    {
      shell_command: 'open -g "rectangle-pro://execute-action?name=prev-space"',
    },
  ]);
});

test("space layer config keeps expected top-level layers", () => {
  const layers = buildSpaceLayers((p) => p, () => "bundle");
  const layerKeys = layers.map((l) => l.layerKey);
  assert.deepEqual(layerKeys, ["a", "c", "d", "f", "r", "s", "w"]);
});

test("folders layer keeps expected direct mappings", () => {
  const layers = buildSpaceLayers((p) => p, () => "bundle");
  const folders = layers.find((l) => l.layerKey === "f");
  assert.ok(folders);
  assert.equal(Object.keys(folders?.mappings ?? {}).length, 11);
  assert.ok(folders?.mappings.r);
  assert.ok(folders?.mappings.s);
});
