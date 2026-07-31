import assert from "node:assert/strict";
import test from "node:test";
import type { Manipulator } from "karabiner.ts";
import {
  ensurePathQuotingInCommand,
  ensurePathQuotingInManipulators,
  isPathToken,
  normalizePathForShell,
  normalizeShellPath,
  shellDoubleQuote,
  shellSingleQuote,
  tokenizeShellCommand,
} from "../engine/utils";

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
