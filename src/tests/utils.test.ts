import assert from "node:assert/strict";
import test from "node:test";
import type { Manipulator } from "../types/karabiner";
import {
  ensurePathQuotingInCommand,
  ensurePathQuotingInManipulators,
  isModifierKey,
  isPathToken,
  normalizePathForShell,
  normalizeShellPath,
  resolveKeyAlias,
  resolveModifiers,
  shellDoubleQuote,
  shellSingleQuote,
  tokenizeShellCommand,
} from "../engine/utils";
import { vmod } from "../engine";

test("shellSingleQuote quotes strings and escapes internal single quotes", () => {
  assert.equal(shellSingleQuote("hello"), "'hello'");
  assert.equal(shellSingleQuote("don't stop"), "'don'\"'\"'t stop'");
});

test("shellDoubleQuote quotes strings and escapes internal double quotes", () => {
  assert.equal(shellDoubleQuote("hello"), '"hello"');
  assert.equal(shellDoubleQuote('say "hi"'), '"say \\"hi\\""');
});

test("normalizeShellPath expands ~/ to $HOME/", () => {
  assert.equal(normalizeShellPath("~/Library/Logs"), "$HOME/Library/Logs");
  assert.equal(normalizeShellPath("/var/log"), "/var/log");
});

test("normalizePathForShell normalizes and double-quotes paths", () => {
  assert.equal(normalizePathForShell("~/script.py"), '"$HOME/script.py"');
  assert.equal(normalizePathForShell("/usr/local/bin/node"), '"/usr/local/bin/node"');
});

test("isPathToken detects file system path strings", () => {
  assert.equal(isPathToken("/Users/jason/script.sh"), true);
  assert.equal(isPathToken("~/script.sh"), true);
  assert.equal(isPathToken("./script.sh"), true);
  assert.equal(isPathToken("$HOME/script.sh"), true);
  assert.equal(isPathToken("arg1"), false);
});

test("tokenizeShellCommand splits commands into arguments and operators", () => {
  const tokens = tokenizeShellCommand("osascript /path/to/script.applescript arg1");
  assert.deepEqual(tokens, [
    "osascript",
    " ",
    "/path/to/script.applescript",
    " ",
    "arg1",
  ]);
});

test("ensurePathQuotingInCommand encloses unquoted path tokens in quotes", () => {
  assert.equal(
    ensurePathQuotingInCommand("osascript /Users/jason/script.applescript arg1"),
    'osascript "/Users/jason/script.applescript" arg1'
  );
  assert.equal(
    ensurePathQuotingInCommand("osascript ''/Users/jason/script.applescript'' arg1"),
    'osascript "/Users/jason/script.applescript" arg1'
  );
});

test("ensurePathQuotingInManipulators updates shell_command in manipulators", () => {
  const manipulator: Manipulator = {
    type: "basic",
    from: { key_code: "a" },
    to: [{ shell_command: "osascript /Users/jason/script.applescript" } as any],
  };

  const result = ensurePathQuotingInManipulators(manipulator) as any;
  assert.equal(
    result.to[0].shell_command,
    'osascript "/Users/jason/script.applescript"'
  );
});

test("resolveKeyAlias maps cmd, L, R side prefixes to standard Karabiner keys", () => {
  assert.equal(resolveKeyAlias("cmd"), "command");
  assert.equal(resolveKeyAlias("R.cmd"), "right_command");
  assert.equal(resolveKeyAlias("L.cmd"), "left_command");
  assert.equal(resolveKeyAlias("R_cmd"), "right_command");
  assert.equal(resolveKeyAlias("L_cmd"), "left_command");
  assert.equal(resolveKeyAlias("R.opt"), "right_option");
  assert.equal(resolveKeyAlias("L.opt"), "left_option");
  assert.equal(resolveKeyAlias("R.ctrl"), "right_control");
  assert.equal(resolveKeyAlias("L.ctrl"), "left_control");
  assert.equal(resolveKeyAlias("R.shift"), "right_shift");
  assert.equal(resolveKeyAlias("L.shift"), "left_shift");
  assert.equal(resolveKeyAlias("R.command"), "right_command");
  assert.equal(resolveKeyAlias("L.command"), "left_command");
});

test("isModifierKey handles key aliases", () => {
  assert.equal(isModifierKey("R.cmd"), true);
  assert.equal(isModifierKey("L.cmd"), true);
  assert.equal(isModifierKey("cmd"), true);
  assert.equal(isModifierKey("R.opt"), true);
  assert.equal(isModifierKey("L.shift"), true);
  assert.equal(isModifierKey("a"), false);
});

test("resolveModifiers expands key aliases", () => {
  assert.deepEqual(resolveModifiers(["R.cmd", "L.shift"]), {
    mandatory: ["right_command", "left_shift"],
    optional: [],
  });
});

test("vmod accepts ModKey aliases in subtractiveModifiers", () => {
  const bindingsAlias = vmod("caps_lock", ["L.shift", "L.ctrl"]);
  const bindingsCanonical = vmod("caps_lock", ["left_shift", "left_control"]);
  assert.deepEqual(bindingsAlias, bindingsCanonical);
});

