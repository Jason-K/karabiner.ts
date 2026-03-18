import assert from "node:assert/strict";
import test from "node:test";

import { buildSpaceLayers } from "./space-layers";
import { tapHoldKeys } from "./tap-hold-keys";

test("tap-hold config keeps expected anchor keys", () => {
  assert.ok(tapHoldKeys.a);
  assert.ok(tapHoldKeys.tab);
  assert.ok(tapHoldKeys["right_option+s"]);
});

test("space layer config keeps expected top-level layers", () => {
  const layers = buildSpaceLayers((p) => p, () => "bundle");
  const layerKeys = layers.map((l) => l.layerKey);
  assert.deepEqual(layerKeys, ["a", "c", "d", "f", "r", "s", "w"]);
});

test("folders layer keeps nested sublayers", () => {
  const layers = buildSpaceLayers((p) => p, () => "bundle");
  const folders = layers.find((l) => l.layerKey === "f");
  assert.ok(folders);
  assert.equal(folders?.subLayers?.length, 3);
});
