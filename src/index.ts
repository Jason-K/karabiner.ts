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
  APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS,
  DEFAULT_PROFILE_NAME,
  DEVICE_IDENTIFIERS,
  Paths,
  PREFERRED_PROFILE_NAME,
  karabinerDeviceId,
} from "./data";
import {
  buildAntinoteRules,
  buildCapsLockRule,
  buildCmdQRule,
  buildCtrlEscapeMonitorRule,
  buildDisableHideMinimizeRule,
  buildEnterRules,
  buildEqualsRules,
  buildEscapeTapTapHoldRule,
  buildHomeEndRule,
  buildHyperLauncherRules,
  buildLeftCommandRule,
  buildOnePieceClickEnterRule,
  buildPasswordsQuickFillRule,
  buildShiftRules,
  buildSkimCommandRemapRule,
  buildWordPrivilegesRule,
  buildZenCommandRemapRule,
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

  // LEFT COMMAND - Tap (pass-through), double-tap (last app), hold (f13)
  buildLeftCommandRule(),

  // ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)
  buildEscapeTapTapHoldRule(),

  // LEFT CONTROL + ESCAPE - Activity Monitor (tap), Process Spy (hold)
  buildCtrlEscapeMonitorRule(),

  // Mouse mappings — all G502X bindings (tap-hold/remap + left-button double-tap)
  // flow through the same Binding[] + defineBindings engine as keys.
  ...defineBindings(mouseBindings),

  // ONEPIECE - Left click submits with Enter inside the app
  buildOnePieceClickEnterRule(),

  // CAPS LOCK - Multiple behaviors
  buildCapsLockRule(),

  // HOME/END - Make them work properly on macOS
  ...buildHomeEndRule(),

  // vmCOC_ + _ - Grouped virtual-mod shortcuts
  ...buildHyperLauncherRules(),

  // ENTER/RETURN - Hold for quick format (except Excel), hold for F2 in Excel
  ...buildEnterRules(),

  // EQUALS - Hold for Quick Date (both keypad and regular)
  ...buildEqualsRules(),

  // CMD+Q double-tap protection (simplified - no optional any support in map())
  buildCmdQRule(),

  // Right_Option + __ - App launch or focus
  // Superceded by RCMD rules
  //   ...buildRightOptionLauncherRules(),

  // DISABLE - CMD+H / CMD+OPT+H / CMD+M / CMD+OPT+M (empty to events = disabled)
  ...buildDisableHideMinimizeRule(),

  // WORD - CMD+/ copy document name and elevate privileges
  buildWordPrivilegesRule(),

  // PASSWORDS - CMD+/ quick fill dialogue (in SecurityAgent only)
  buildPasswordsQuickFillRule(),

  // SKIM - CMD+H/U remapping
  ...buildSkimCommandRemapRule(),

  // ZEN - CMD+SHIFT+H/U remapping
  ...buildZenCommandRemapRule(),

  // ANTINOTE - CMD+D double-tap to delete note
  ...buildAntinoteRules(),

  // SHIFT - Shift key rules
  ...buildShiftRules(),
];

// ============================================================================
// DEVICE-SPECIFIC SIMPLE MODIFICATIONS
// ============================================================================

const deviceConfigs: DeviceConfig[] = [
  {
    identifiers: karabinerDeviceId(DEVICE_IDENTIFIERS.appleNumericKeypad),
    simple_modifications: [...APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS],
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
    const raw = readFileSync(Paths.karabinerConfig.name, "utf8");
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
