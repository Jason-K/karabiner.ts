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
 * - vmCOC_: Command + Option + Control
 * - vmCOCS: Command + Option + Control + Shift
 * - vmCO_S: Command + Option + Shift
 */

import { map, writeToProfile } from "karabiner.ts";
import { readFileSync } from "node:fs";
import {
  DEFAULT_PROFILE_NAME,
  DEVICE_IDS,
  karabinerDeviceId,
  NUMPAD_REMAPS,
  PATHS,
  PREFERRED_PROFILE_NAME,
} from "./data";
import {
  buildCapsLockRule,
  buildDisabledHotkeys,
  buildHotkeyGuards,
  buildHyperLauncherRules,
  mouseBindings,
  simultaneousMappings,
  tapHoldBindings,
} from "./definitions";
import type { DeviceConfig } from "./engine";
import {
  defineBindings,
  generateSimultaneousRules,
  updateDeviceConfigurations,
} from "./engine";

// Generate tap-hold rules with automatic conflict prevention
const tapHoldRules = defineBindings(tapHoldBindings);
const simultaneousRules = generateSimultaneousRules(simultaneousMappings, tapHoldBindings);

// ============================================================================
// SPECIAL RULES
// ============================================================================

let rules: any[] = [
  // Simultaneous chord rules — must come before tap-hold rules
  ...simultaneousRules,
  // All tap-hold rules generated from configuration
  ...tapHoldRules,

  // GUARD - Various guard rules
  ...buildHotkeyGuards(),

  // Mouse mappings — all G502X bindings (tap-hold/remap + left-button double-tap)
  // flow through the same Binding[] + defineBindings engine as keys.
  ...defineBindings(mouseBindings),

  // CAPS LOCK - Multiple behaviors
  buildCapsLockRule(),

  // vmCOC_ + _ - Grouped virtual-mod shortcuts
  ...buildHyperLauncherRules(),

  // DISABLE - CMD+H / CMD+OPT+H / CMD+M / CMD+OPT+M (empty to events = disabled)
  ...buildDisabledHotkeys(),
];

// ============================================================================
// DEVICE-SPECIFIC SIMPLE MODIFICATIONS
// ============================================================================

const deviceConfigs: DeviceConfig[] = [
  {
    identifiers: karabinerDeviceId(DEVICE_IDS.appleNumericKeypad),
    simple_modifications: [...NUMPAD_REMAPS],
  },
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
    return PREFERRED_PROFILE_NAME;
  }

  try {
    const raw = readFileSync(PATHS.karabinerConfig.name, "utf8");
    const parsed = JSON.parse(raw) as {
      profiles?: Array<{ name?: string; selected?: boolean }>;
    };
    const profiles = parsed.profiles ?? [];

    const explicit = process.env.KARABINER_PROFILE_NAME?.trim();
    if (explicit) {
      return explicit;
    }

    const preferred = profiles.find((profile) => profile.name === PREFERRED_PROFILE_NAME)?.name;
    if (preferred) {
      return preferred;
    }

    const selected = profiles.find((profile) => profile.selected)?.name;
    if (selected) {
      return selected;
    }

    const first = profiles[0]?.name;
    return first ?? DEFAULT_PROFILE_NAME;
  } catch {
    return process.env.KARABINER_PROFILE_NAME?.trim() || DEFAULT_PROFILE_NAME;
  }
}

const targetProfileName = resolveTargetProfileName();

// Write rules: use real profile locally, dry-run in CI/non-macOS
writeToProfile(
  canWriteProfile ? targetProfileName : "--dry-run",
  rules,
  {},
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
