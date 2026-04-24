import assert from "node:assert/strict";
import test from "node:test";

import {
    getFolderOpenerBundleIdFor,
    getOpenFolderCommandFor,
} from "../lib/folder-opener";

test("bloom opener escapes spaces", () => {
  const command = getOpenFolderCommandFor("bloom", "/Users/jason/My Folder");
  assert.equal(command, "open -a Bloom /Users/jason/My\\ Folder");
});

test("qspace opener uses bundle open syntax", () => {
  const command = getOpenFolderCommandFor("qspace", "/Users/jason/My Folder");
  assert.equal(
    command,
    "open -b com.jinghaoshe.qspace.pro '/Users/jason/My Folder'",
  );
});

test("bundle id resolution stays stable across openers", () => {
  assert.equal(getFolderOpenerBundleIdFor("bloom"), "com.jinghaoshe.qspace.pro");
  assert.equal(getFolderOpenerBundleIdFor("qspace"), "com.jinghaoshe.qspace.pro");
});
