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

  // Sample critical rules: tap-hold, space layer, special rules
  assert.ok(
    descriptions.some((d: string) => d.includes("hold ->")),
    "Missing tap-hold rules"
  );
  assert.ok(
    descriptions.some((d: string) => d.includes("CAPS")),
    "Missing CAPS rule"
  );
  assert.ok(
    descriptions.some((d: string) => d.includes("ESCAPE")),
    "Missing ESCAPE rule"
  );
  assert.ok(
    descriptions.some((d: string) => d.includes("CMD-Q")),
    "Missing CMD-Q rule"
  );
  assert.ok(
    descriptions.some((d: string) => d.includes("SPACE")),
    "Missing SPACE layer rules"
  );
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

test("generated output validates against critical variable names", () => {
  const output = loadGeneratedOutput();
  const fullContent = JSON.stringify(output);

  // Check for expected variable references in layer/tap-hold rules
  assert.ok(
    fullContent.includes("space_a_sublayer") ||
      fullContent.includes("space_mod"),
    "Missing expected layer variable references"
  );
});

test("output contains space layer rules", () => {
  const output = loadGeneratedOutput();
  const rules = output.complex_modifications.rules;
  const descriptions = rules.map((r: any) => r.ruleDescription || "");

  const spaceRules = descriptions.filter((d: string) => d.includes("SPACE+"));
  assert.ok(spaceRules.length > 0, "No SPACE+ layer rules found");
  assert.ok(
    spaceRules.some((d: string) => d.includes("Applications")),
    "Missing SPACE+A Applications layer"
  );
});
