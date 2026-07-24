import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * Integration tests for generated karabiner-output.json
 *
 * These tests validate the output-level structure and confirm that
 * critical rules are properly generated into the final JSON config.
 */

function loadGeneratedOutput() {
  const outputPath = join(process.cwd(), "karabiner-output.json");
  const content = readFileSync(outputPath, "utf-8");
  return JSON.parse(content);
}

test("generated output contains complex_modifications.rules array", () => {
  const output = loadGeneratedOutput();
  assert.ok(output.complex_modifications);
  assert.ok(Array.isArray(output.complex_modifications.rules));
  assert.ok(output.complex_modifications.rules.length > 0);
});

test("generated output includes all critical rule categories", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;
  const descriptions = rules.map((r: any) => r.ruleDescription || "");

  // Sample critical rules: tap-hold, special rules
  assert.ok(
    descriptions.some((d: string) => d.endsWith("(on hold)")),
    "Missing tap-hold rules",
  );
  assert.ok(
    descriptions.some((d: string) => d.startsWith("[⇪]")),
    "Missing CAPS rule",
  );
  assert.ok(
    descriptions.some((d: string) => d.startsWith("[␛]")),
    "Missing ESCAPE rule",
  );
  assert.ok(
    descriptions.some((d: string) => d.startsWith("[⌘]+[Q]")),
    "Missing CMD-Q rule",
  );
});

test("generated output uses standardized rule descriptions", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;

  // Legacy format — still used by engine-adapter rules (tap-hold family, caps,
  // cmd-q, enter/equals) until Phase 3 migrates them.
  const standardDescription =
    /^\[[^\]]+\](\+\[[^\]]+\])* {8}→ {4}.+ \(on (tap|hold|multi-tap)\)$/;
  // Phase 2 auto-derived format: first line ends in ":" (key chord like [⏎]:
  // or pointer like Click:), then a "---" divider line.
  const synthesizedDescription = /^[^\n]+:\n---/;
  // Mouse device descriptions are inherently varied (single tap, tap/hold,
  // double-tap chords, app-conditional variants, etc.) and don't always
  // end in a (tap|hold) suffix. Floor: "<device name>: <non-empty body>".
  const mouseDeviceDescription = /^[^:]+: .+$/;

  rules.forEach((rule: any) => {
    assert.ok(
      standardDescription.test(rule.ruleDescription) ||
        synthesizedDescription.test(rule.ruleDescription) ||
        mouseDeviceDescription.test(rule.ruleDescription),
      `Rule description is not standardized: ${rule.ruleDescription}`,
    );
  });
});

test("each rule has required manipulatorSources structure", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;

  rules.forEach((rule: any) => {
    assert.ok(rule.ruleDescription, `Rule missing ruleDescription`);
    assert.ok(
      Array.isArray(rule.manipulatorSources),
      `Rule "${rule.ruleDescription}" missing manipulatorSources array`
    );
    // Note: allowEmptyManipulators flag allows some rules to have empty arrays
    // We validate that non-empty manipulators have proper structure
    rule.manipulatorSources
      .filter((m: any) => Object.keys(m).length > 0) // Skip empty manipulators
      .forEach((m: any) => {
        assert.ok(
          m.type,
          `Non-empty manipulator in "${rule.ruleDescription}" missing type`
        );
        assert.ok(
          m.from,
          `Non-empty manipulator in "${rule.ruleDescription}" missing from`
        );
      });
  });
});

test("generated output contains no leader-suppression pollution", () => {
  const output = loadGeneratedOutput();
  const fullContent = JSON.stringify(output);

  assert.ok(
    !fullContent.includes("space_"),
    "Output should contain no space_ leader variables when no leader is active"
  );
});
