import assert from "node:assert/strict";
import test from "node:test";

import { getOpenFolderCommand } from "../core/folder-opener";

test("bloom opener escapes spaces", () => {
  const command = getOpenFolderCommand("/Users/jason/My Folder", "bloom");
  assert.equal(command, "open -a Bloom '/Users/jason/My\\ Folder'");
});

test("qspace opener uses bundle open syntax", () => {
  const command = getOpenFolderCommand("/Users/jason/My Folder", "qspace");
  assert.equal(
    command,
    "open -b com.jinghaoshe.qspace.pro '/Users/jason/My Folder'",
  );
});

test("finder opener (default) uses plain open", () => {
  assert.equal(
    getOpenFolderCommand("/Users/jason/My Folder", "finder"),
    "open '/Users/jason/My Folder'",
  );
  // default (no opener arg) also resolves to finder
  assert.equal(
    getOpenFolderCommand("/Users/jason/My Folder"),
    "open '/Users/jason/My Folder'",
  );
});
