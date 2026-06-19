import assert from "node:assert/strict";
import test from "node:test";

import { leaderSuppressionVars } from "../core/leader";
import type { SubLayerConfig } from "../core/leader";

const layers: SubLayerConfig[] = [
  { layerKey: "d", layerName: "Downloads", mappings: {} },
  {
    layerKey: "f",
    layerName: "Folders",
    mappings: {},
    subLayers: [{ layerKey: "r", layerName: "Recent", mappings: {} }],
  },
];

test("leaderSuppressionVars: returns <prefix>_mod plus all sublayer vars", () => {
  assert.deepEqual(leaderSuppressionVars("leader", layers), [
    "leader_mod",
    "leader_d_sublayer",
    "leader_f_sublayer",
    "leader_f_r_sublayer",
  ]);
});

test("leaderSuppressionVars: empty layers yields just <prefix>_mod", () => {
  assert.deepEqual(leaderSuppressionVars("leader", []), ["leader_mod"]);
});
