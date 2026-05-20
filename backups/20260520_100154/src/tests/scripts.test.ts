import assert from "node:assert/strict";
import test from "node:test";

import { focusApp } from "../lib/scripts";

test("focusApp keeps native open command by default", () => {
  const event = focusApp("com.apple.Safari") as { shell_command: string };
  assert.equal(event.shell_command, "open -b 'com.apple.Safari'");
});

test("focusApp can ensure an app window exists after activation", () => {
  const event = focusApp("com.chabomakers.Antinote-setapp", {
    appName: "Antinote",
    createWindowShortcut: { key: "n", modifiers: ["command down"] },
  }) as { shell_command: string };

  assert.match(event.shell_command, /open -b 'com\.chabomakers\.Antinote-setapp'/);
  assert.match(event.shell_command, /count of windows of process "Antinote"/);
  assert.match(event.shell_command, /keystroke "n" using \{command down\}/);
});
