/**
 * Karabiner-Elements Configuration
 *
 * This configuration file uses karabiner.ts to generate Karabiner-Elements rules
 * in a type-safe, maintainable way. The configuration is organized into several
 * major sections:
 *
 * 1. Tap-Hold Keys: Single keys that perform different actions when tapped vs held
 * 2. Caps Lock: Multiple modifier behaviors based on how it's pressed
 * 3. Special Rules: CMD+Q protection, HOME/END fixes, app-specific behaviors
 *
 * Virtual Modifiers:
 * - COC_: Command + Option + Control
 * - COCS: Command + Option + Control + Shift
 * - CO_S: Command + Option + Shift
 */

import { map, writeToProfile } from "karabiner.ts";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import {
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_PROFILE,
  DEVICE_IDS,
  PATHS,
  PREFERRED_PROFILE,
  DEFAULT_PROFILE_TIMINGS,
} from "./data";
import {
  capsLockChordConfig,
  disabledHotkeys,
  guardRules,
  mouseBindings,
  NUMPAD_REMAPS,
  simultaneousMappings,
  tapHoldBindings,
} from "./definitions";
import type { DeviceConfig } from "./engine";
import {
  assertUniqueTriggers,
  buildDeviceConfig,
  defineBindings,
  generateDoubleTapGuardRule,
  generateModifierChordRules,
  generateSimultaneousRules,
  updateDeviceConfigurations,
} from "./engine";

// Generate tap-hold rules with automatic conflict prevention
const verifiedTapHoldBindings = assertUniqueTriggers(tapHoldBindings);
const tapHoldRules = defineBindings(verifiedTapHoldBindings);
const simultaneousRules = generateSimultaneousRules(simultaneousMappings, verifiedTapHoldBindings);

// ============================================================================
// SPECIAL RULES
// ============================================================================

let rules: any[] = [
  // Simultaneous chord rules — must come before tap-hold rules
  ...simultaneousRules,
  // All tap-hold rules generated from configuration
  ...tapHoldRules,

  // GUARD - Various guard rules
  ...guardRules.map((guard) => generateDoubleTapGuardRule(guard)),

  // Mouse mappings — all G502X bindings (tap-hold/remap + left-button double-tap)
  // flow through the same Binding[] + defineBindings engine as keys.
  ...defineBindings(mouseBindings),

  // CAPS LOCK - Multiple behaviors
  generateModifierChordRules(capsLockChordConfig),

  // DISABLE - CMD+H / CMD+OPT+H / CMD+M / CMD+OPT+M (empty to events = disabled)
  ...defineBindings(disabledHotkeys),
];


// ============================================================================
// DEVICE-SPECIFIC SIMPLE MODIFICATIONS
// ============================================================================

const deviceConfigs: DeviceConfig[] = [
  buildDeviceConfig(DEVICE_IDS.appleNumericKeypad, [...NUMPAD_REMAPS]),
  buildDeviceConfig(DEVICE_IDS.logitechG502X),
];

// ============================================================================
// WRITE TO PROFILE
// ============================================================================

// Detect CI/Linux environment and avoid writing to ~/.config/karabiner
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const isDarwin = process.platform === "darwin";
const canWriteProfile = isDarwin && !isCI;
function resolveTargetProfileName(): string {
  if (!isDarwin) {
    return PREFERRED_PROFILE;
  }

  try {
    const raw = readFileSync(PATHS.configKarabiner.name, "utf8");
    const parsed = JSON.parse(raw) as {
      profiles?: Array<{ name?: string; selected?: boolean }>;
    };
    const profiles = parsed.profiles ?? [];

    const explicit = process.env.KARABINER_PROFILE_NAME?.trim();
    if (explicit) {
      return explicit;
    }

    const preferred = profiles.find((profile) => profile.name === PREFERRED_PROFILE)?.name;
    if (preferred) {
      return preferred;
    }

    const selected = profiles.find((profile) => profile.selected)?.name;
    if (selected) {
      return selected;
    }

    const first = profiles[0]?.name;
    return first ?? DEFAULT_PROFILE;
  } catch {
    return process.env.KARABINER_PROFILE_NAME?.trim() || DEFAULT_PROFILE;
  }
}

const targetProfileName = resolveTargetProfileName();

function updateGlobalSettings(configPath: string): void {
  try {
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.global = { ...parsed.global, ...DEFAULT_GLOBAL_SETTINGS };
    const tmpPath = `${configPath}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(parsed, null, 2));
    renameSync(tmpPath, configPath);
    console.log("✓ Global settings updated.");
  } catch (error) {
    console.error("Error updating global settings:", error);
  }
}

if (canWriteProfile) {
  updateGlobalSettings(PATHS.configKarabiner.name);
}

// Write rules: use real profile locally, dry-run in CI/non-macOS
writeToProfile(
  canWriteProfile ? targetProfileName : "--dry-run",
  rules,
  DEFAULT_PROFILE_TIMINGS,
  {
    simple_modifications: [
      map("left_control").to("fn"),
      map("fn").to("left_control"),
    ],
  },
);

// Wait for writeToProfile to complete, then add device configurations (local only)
setTimeout(() => {
  if (canWriteProfile) {
    updateDeviceConfigurations(targetProfileName, deviceConfigs);
  }
}, 1000);

// Also write generated rules to workspace for inspection
import("fs").then((fs) => {
  import("path").then((path) => {
    try {
      const outPath = path.join(process.cwd(), "karabiner-output.json");
      const payload = { complex_modifications: { rules } };
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
      console.log(`✓ Wrote workspace copy: ${outPath}`);
    } catch (e) {
      console.error("✗ Failed to write workspace karabiner-output.json", e);
    }
  });
});
