import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { emitLayerDefinitions } from "../engine";
import type { SubLayerConfig } from "../core/leader";

const layers: SubLayerConfig[] = [
  {
    layerKey: "d",
    layerName: "Downloads",
    mappings: { q: { description: "Query", key: "q" } },
  },
];

test("layer-emit: writes prefix-keyed layer json to the given path", () => {
  const tmp = path.join(os.tmpdir(), `layer-emit-${process.pid}.json`);
  emitLayerDefinitions("leader", "L", layers, tmp, false);
  const written = JSON.parse(fs.readFileSync(tmp, "utf8"));
  assert.ok(written.leader, "root layer key uses the prefix");
  assert.ok(written.leader_D, "sublayer id is <prefix>_<KEY>");
  assert.equal(written.leader.label, "L");
  fs.unlinkSync(tmp);
});
