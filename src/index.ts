/**
 * Karabiner-Elements Configuration
 *
 * This configuration file uses karabiner.ts to generate Karabiner-Elements rules
 * in a type-safe, maintainable way. The configuration is organized into several
 * major sections:
 *
 * 1. Tap-Hold Keys: Single keys that perform different actions when tapped vs held
 * 2. Space Layer: Space bar as a layer key for accessing sublayers (Downloads, Apps, Folders)
 * 3. Caps Lock: Multiple modifier behaviors based on how it's pressed
 * 4. Special Rules: CMD+Q protection, HOME/END fixes, app-specific behaviors
 *
 * Custom Modifiers:
 * - HYPER: Command + Option + Control
 * - SUPER: Command + Option + Control + Shift
 * - MEH: Command + Option + Shift
 */

import { map, toKey, writeToProfile } from "karabiner.ts";
import { readFileSync } from "node:fs";
import {
  emitLayerDefinitions,
  generateEscapeRule,
  generateTapHoldRules,
  updateDeviceConfigurations,
} from "./generators";
import type { DeviceConfig } from "./generators/device-config";
import { getOpenFolderCommand } from "./lib/folder-opener";
import { generateLayerRules } from "./lib/leader";
import {
  mouseDeviceMappings,
  SPACE_LAYER_DEBUG,
  SPACE_LAYER_DEBUG_LOG_PATH,
  SPACE_LAYER_INDICATOR_ROOT,
  SPACE_LAYER_LABEL,
  SPACE_LAYER_LEADER_KEY,
  SPACE_LAYER_PREFIX,
  spaceLayerDefinitions,
  tapHoldMappings,
} from "./mappings";
import {
  buildAntinoteDeleteRule,
  buildCapsLockRule,
  buildCmdQRule,
  buildCtrlEscapeMonitorRule,
  buildDisableHideMinimizeRule,
  buildEnterRules,
  buildEqualsRules,
  buildEscapeTapTapHoldRule,
  buildGraveAccentHoldRule,
  buildHomeEndRule,
  buildHyperPlusRules,
  buildLeftCommandRule,
  buildMouseRules,
  buildOnePieceClickEnterRule,
  buildPasswordsQuickFillRule,
  buildRightOptionAppsRule,
  buildSkimCommandRemapRule,
  buildWordPrivilegesRule,
} from "./rules";

const spaceLayers = spaceLayerDefinitions;

// Generate tap-hold rules with automatic conflict prevention
const tapHoldRules = generateTapHoldRules(tapHoldMappings, spaceLayers);

// Emit layer definitions for Hammerspoon (enable debug mode via KARABINER_DEBUG env var)
const debugMode = process.env.KARABINER_DEBUG === "true";
emitLayerDefinitions(spaceLayers, undefined, debugMode);

// ============================================================================
// SPECIAL RULES
// ============================================================================

let rules: any[] = [
  // All tap-hold rules generated from configuration
  ...tapHoldRules,

  // LEFT COMMAND - Tap (pass-through), double-tap (last app), hold (f13)
  buildLeftCommandRule(),

  // ESCAPE - ESC (tap), kill foreground (hold), kill unresponsive (tap-tap-hold)
  buildEscapeTapTapHoldRule(),

  // LEFT CONTROL + ESCAPE - Activity Monitor (tap), Process Spy (hold)
  buildCtrlEscapeMonitorRule(),

  // Mouse mappings (declarative per-device rules)
  ...buildMouseRules(mouseDeviceMappings),

  // ONEPIECE - Left click submits with Enter inside the app
  buildOnePieceClickEnterRule(),

  // CAPS LOCK - Multiple behaviors
  buildCapsLockRule(),

  // Generate space layer rules with sublayer persistence
  ...generateLayerRules(spaceLayers, {
    leaderKey: SPACE_LAYER_LEADER_KEY,
    layerPrefix: SPACE_LAYER_PREFIX,
    leaderLabel: SPACE_LAYER_LABEL,
    indicatorRootLayer: SPACE_LAYER_INDICATOR_ROOT,
    leaderHoldEvents: [toKey("c", ["left_command"], { repeat: false })],
    debugSwallowedKeys: SPACE_LAYER_DEBUG,
    debugLogPath: SPACE_LAYER_DEBUG_LOG_PATH,
  }),

  // ============================================================================
  // SPECIAL RULES - SYSTEM & APPLICATION BEHAVIORS
  // ============================================================================
  /**
   * This section contains miscellaneous rules that enhance macOS behavior:
   *
   * KEYBOARD IMPROVEMENTS:
   * - HOME/END: Mac-style navigation (CMD+Left/Right instead of default)
   * - ENTER/RETURN: Tap for enter, hold for quick format (Hammerspoon)
   * - EQUALS: Tap for equals, hold for Quick Date (Python script)
   * - CMD alone: Tapping either CMD key sends CMD+OPT+CTRL+L
   *
   * SAFETY FEATURES:
   * - CMD+Q: Double-tap protection (300ms window prevents accidental app quit)
   * - CTRL+OPT+ESC: Single tap for Activity Monitor, double tap for Force Quit
   *
   * APPLICATION-SPECIFIC:
   * - CMD+SHIFT+K: Delete line (disabled in VSCode Insiders - native shortcut)
   */

  // HOME/END - Make them work properly on macOS
  ...buildHomeEndRule(),

  // HYPER + _ - Grouped hyper shortcuts
  ...buildHyperPlusRules(),

  // GRAVE ACCENT & TILDE - Tap sends tilde, hold sends hyper+f5 with deferred release
  buildGraveAccentHoldRule(),

  // ENTER/RETURN - Hold for quick format (except Excel), hold for F2 in Excel
  ...buildEnterRules(),

  // EQUALS - Hold for Quick Date (both keypad and regular)
  ...buildEqualsRules(),

  // CMD+Q double-tap protection (simplified - no optional any support in map())
  buildCmdQRule(),

  // Right_Option + __ - App launch or focus
  ...buildRightOptionAppsRule(getOpenFolderCommand),
  // Generate escape rule to reset all variables
  ...generateEscapeRule(spaceLayers),

  // ============================================================================
  // SECURITY & SYSTEM ACCESS RULES
  // ============================================================================
  /**
   * These rules handle privileged operations and security dialogs:
   *
   * DISABLED SHORTCUTS:
   * - CMD+H, CMD+OPT+H, CMD+OPT+M: Hide/Minimize shortcuts disabled (empty to events)
   *
   * PASSWORD AUTOMATION (SecurityAgent only):
   * - CMD+/: Auto-fill admin password using Privileges.app + Hammerspoon
   *
   * APPLICATION-SPECIFIC OVERRIDES:
   * - Skim: Remap CMD+H and CMD+U to use CTRL modifier for Skim-specific functions
   */

  // DISABLE - CMD+H / CMD+OPT+H / CMD+M / CMD+OPT+M (empty to events = disabled)
  ...buildDisableHideMinimizeRule(),

  // WORD - CMD+/ copy document name and elevate privileges
  buildWordPrivilegesRule(),

  // PASSWORDS - CMD+/ quick fill dialogue (in SecurityAgent only)
  buildPasswordsQuickFillRule(),

  // SKIM - CMD+H/U remapping
  ...buildSkimCommandRemapRule(),

  // ============================================================================
  // APPLICATION-SPECIFIC RULES
  // ============================================================================
  /**
   * Rules that modify behavior in specific applications:
   *
   * ANTINOTE:
   * - CMD+D: Double-tap protection for deleting notes (300ms window)
   * - Prevents accidental deletion of notes
   *
   * These rules use bundle ID matching to target specific apps.
   */

  // ANTINOTE - CMD+D double-tap to delete note
  buildAntinoteDeleteRule(),
];

// ============================================================================
// DEVICE-SPECIFIC SIMPLE MODIFICATIONS
// ============================================================================

const deviceConfigs: DeviceConfig[] = [
  {
    identifiers: {
      vendor_id: 76,
      product_id: 802,
      is_keyboard: true,
    },
    simple_modifications: [
      {
        from: { key_code: "keypad_asterisk" },
        to: [{ key_code: "keypad_hyphen" }],
      },
      {
        from: { key_code: "keypad_equal_sign" },
        to: [{ key_code: "keypad_slash" }],
      },
      {
        from: { key_code: "keypad_hyphen" },
        to: [{ key_code: "keypad_plus" }],
      },
      {
        from: { key_code: "keypad_plus" },
        to: [{ key_code: "keypad_equal_sign" }],
      },
      {
        from: { key_code: "keypad_slash" },
        to: [{ key_code: "keypad_asterisk" }],
      },
      { from: { key_code: "left_control" }, to: [{ key_code: "fn" }] },
      { from: { key_code: "fn" }, to: [{ key_code: "left_control" }] },
    ],
  },
];

// ============================================================================
// WRITE TO PROFILE
// ============================================================================

// Detect CI/Linux environment and avoid writing to ~/.config/karabiner
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const isDarwin = process.platform === "darwin";
const canWriteProfile = isDarwin && !isCI;
const DEFAULT_PROFILE_NAME = "Default profile";
const PREFERRED_PROFILE_NAME = "JJK_Default";

function resolveTargetProfileName(): string {
  if (!isDarwin) {
    return PREFERRED_PROFILE_NAME;
  }

  try {
    const raw = readFileSync("/Users/jason/.config/karabiner/karabiner.json", "utf8");
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
