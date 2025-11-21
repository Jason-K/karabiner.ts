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

import {
  ifApp,
  ifVar,
  map,
  rule,
  toKey,
  toSetVar,
  writeToProfile,
} from "karabiner.ts";
import { cmd, openApp, tapHold, varTapTapHold } from "./lib/builders";
import type {
  DeviceConfig,
  SubLayerConfig,
  TapHoldConfig,
} from "./lib/functions";
import {
  generateEscapeRule,
  generateSpaceLayerRules,
  generateTapHoldRules,
  updateDeviceConfigurations,
} from "./lib/functions";
import { HYPER, L, MEH, SUPER } from "./lib/mods";

// ============================================================================
// TAP-HOLD KEY DEFINITIONS
// ============================================================================
/**
 * - Tap: Send the key normally (with halt to prevent accidental holds)
 * - Hold: Execute a custom action (open app, trigger hotkey, etc.)
 *
 * Default timing: 400ms for both timeout and threshold
 *
 * Configuration is declarative - just add entries to the object below.
 */

const tapHoldKeys: Record<string, TapHoldConfig> = {
  a: {
    description: "Launcher",
    hold: [openApp({ bundleIdentifier: "com.apple.apps.launcher" })],
  },
  b: {
    description: "Search menu apps / Skim note",
    hold: [toKey("b", SUPER, { repeat: false })],
    appOverrides: [
      {
        app: /^net\.sourceforge\.skim-app\.skim$/,
        hold: [
          cmd(
            "osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-create-anchored-note.applescript"
          ),
        ],
      },
    ],
  },
  c: {
    description: "OCR",
    hold: [cmd('open "cleanshot://capture-text?linebreaks=false"')],
  },
  d: { description: "Dato", hold: [toKey("d", MEH, { repeat: false })] },
  e: { description: "New event", hold: [toKey("e", MEH, { repeat: false })] },
  f: { description: "Houdah", hold: [toKey("h", SUPER, { repeat: false })] },
  g: {
    description: "ChatGPT",
    hold: [openApp({ bundleIdentifier: "com.openai.chat" })],
  },
  h: {
    description: "HS console / Skim heading",
    hold: [cmd("/opt/homebrew/bin/hs -c 'hs.openConsole()'")],
    appOverrides: [
      {
        app: /^net\.sourceforge\.skim-app\.skim$/,
        hold: [
          cmd(
            "osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-add-heading-to-anchored-note.applescript"
          ),
        ],
      },
    ],
  },
  i: {
    description: "Indent",
    hold: [
      cmd(
        '/opt/homebrew/bin/hs -c \'local ev=require("hs.eventtap"); local t=require("hs.timer"); ev.keyStroke({}, "home"); t.usleep(120000); ev.keyStroke({}, "tab"); t.usleep(120000); ev.keyStroke({}, "end")\''
      ),
    ],
  },
  m: {
    description: "Deminimize",
    hold: [toKey("m", HYPER, { repeat: false })],
  },
  n: {
    description: "New note / Skim highlight",
    hold: [toKey("n")],
    appOverrides: [
      {
        app: /^net\.sourceforge\.skim-app\.skim$/,
        hold: [
          cmd(
            "osascript ~/Scripts/Application_Specific/Skim/skim_bookmarker/skim-add-extended-text-to-anchored-note.applescript"
          ),
        ],
      },
    ],
  },
  p: { description: "Paletro", hold: [toKey("p", HYPER, { repeat: false })] },
  q: {
    description: "QSpace Pro",
    hold: [
      openApp({ filePath: "/System/Volumes/Data/Applications/QSpace Pro.app" }),
    ],
  },
  r: {
    description: "Last d/l",
    hold: [
      cmd(
        'latest=$(ls -t "$HOME/Downloads" | head -n1); [ -n "$latest" ] && open -R "$HOME/Downloads/$latest"'
      ),
    ],
  },
  s: {
    description: "Screenshot",
    hold: [cmd('open "cleanshot://capture-area"')],
  },
  t: {
    description: "iTerm2",
    hold: [
      cmd(
        "osascript ~/Scripts/Application_Specific/iterm2/iterm2_openHere.applescript"
      ),
    ],
    timeoutMs: 300,
    thresholdMs: 300,
  },
  v: {
    description: "Maccy",
    hold: [
      toKey("grave_accent_and_tilde", ["control"], {
        halt: true,
        repeat: false,
      }),
    ],
    timeoutMs: 300,
    thresholdMs: 300,
  },
  w: {
    description: "Writing Tools",
    hold: [toKey("w", ["command", "shift"], { repeat: false })],
  },
  "8": {
    description: "8x8",
    hold: [openApp({ bundleIdentifier: "com.electron.8x8---virtual-office" })],
  },
  escape: {
    description: "Escape",
    hold: [openApp({ bundleIdentifier: "com.itone.ProcessSpy" })],
  },
  slash: {
    description: "search for files",
    hold: [toKey("f17", HYPER, { repeat: false })],
  },
  tab: {
    description: "Mission Control",
    hold: [toKey("mission_control", [], { halt: true, repeat: true })],
    timeoutMs: 300,
    thresholdMs: 300,
  },
};

// ============================================================================
// SPACE LAYER CONFIGURATION
// ============================================================================
/**
 * Space layer system provides access to sublayers for quick actions:
 *
 * Usage:
 * 1. Hold Space (200ms threshold)
 * 2. Tap a layer key (d/a/f) to activate that sublayer
 * 3. Tap an action key to execute and deactivate sublayer
 *
 * All sublayer variables are cleared when:
 * - Space is tapped alone
 * - Space + key pressed before threshold
 * - No hardcoded key lists to maintain
 */

const spaceLayers: SubLayerConfig[] = [
  {
    layerKey: "a",
    layerName: "Applications",
    releaseLayer: false,
    mappings: {
      8: {
        description: "8x8",
        openAppOpts: { bundleIdentifier: "com.electron.8x8---virtual-office" },
      },
      a: {
        description: "Apps",
        openAppOpts: { bundleIdentifier: "com.apple.apps.launcher" },
      },
      c: {
        description: "Code",
        openAppOpts: { bundleIdentifier: "com.microsoft.VSCodeInsiders" },
      },
      d: {
        description: "Dia",
        openAppOpts: { bundleIdentifier: "company.thebrowser.dia" },
      },
      f: {
        description: "QSpace",
        openAppOpts: { bundleIdentifier: "com.jinghaoshe.qspace.pro" },
      },
      g: {
        description: "ChatGPT",
        openAppOpts: { bundleIdentifier: "com.openai.chat" },
      },
      m: {
        description: "Messages",
        openAppOpts: { bundleIdentifier: "com.apple.MobileSMS" },
      },
      o: {
        description: "Outlook",
        openAppOpts: { bundleIdentifier: "com.microsoft.Outlook" },
      },
      p: {
        description: "Proton Mail",
        openAppOpts: { bundleIdentifier: "ch.protonmail.desktop" },
      },
      q: {
        description: "QSpace",
        openAppOpts: { bundleIdentifier: "com.jinghaoshe.qspace.pro" },
      },
      s: {
        description: "Safari",
        openAppOpts: { bundleIdentifier: "com.apple.Safari" },
      },
      t: {
        description: "Teams",
        openAppOpts: { bundleIdentifier: "com.microsoft.teams2" },
      },
      v: {
        description: "Code",
        openAppOpts: { bundleIdentifier: "com.microsoft.VSCodeInsiders" },
      },
      w: {
        description: "Word",
        openAppOpts: { bundleIdentifier: "com.microsoft.Word" },
      },
      tab: {
        description: "Last App",
        openAppOpts: { historyIndex: 1 },
        usageCounterVar: "apps_toggle_uses",
      },
    },
  },
  {
    layerKey: "m",
    layerName: "Cursor Movement",
    releaseLayer: false, // Keep layer active until space released for continuous cursor movement
    mappings: {
      ";": { description: "Page Down", key: "page_down", passModifiers: true },
      d: {
        description: "Delete",
        key: "delete_or_backspace",
        passModifiers: true,
      },
      f: {
        description: "Forward Delete",
        key: "delete_forward",
        passModifiers: true,
      },
      i: { description: "Up", key: "up_arrow", passModifiers: true },
      j: { description: "Left", key: "left_arrow", passModifiers: true },
      k: { description: "Down", key: "down_arrow", passModifiers: true },
      l: { description: "Right", key: "right_arrow", passModifiers: true },
      o: { description: "End", key: "end", passModifiers: true },
      p: { description: "Page Up", key: "page_up", passModifiers: true },
      s: { description: "Shift", key: "left_shift", passModifiers: true },
      u: { description: "Home", key: "home", passModifiers: true },
    },
  },
  {
    layerKey: "c",
    layerName: "Case",
    releaseLayer: false,
    mappings: {
      l: {
        description: "lowercase",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py lowercase --source clipboard --dest paste",
          },
        ],
      },
      s: {
        description: "Sentence case",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py sentence_case --source clipboard --dest paste",
          },
        ],
      },
      t: {
        description: "Title Case",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py title_case --source clipboard --dest paste",
          },
        ],
      },
      u: {
        description: "UPPERCASE",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py uppercase --source clipboard --dest paste",
          },
        ],
      },
    },
  },
  {
    layerKey: "d",
    layerName: "Downloads",
    releaseLayer: false,
    mappings: {
      "3": {
        description: "3dPrinting",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Downloads/3dPrinting",
      },
      a: {
        description: "Archives",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Downloads/Archives",
      },
      i: {
        description: "Installs",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Downloads/Installs",
      },
      o: {
        description: "Office",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Downloads/Office",
      },
      p: {
        description: "PDFs",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Downloads/PDFs",
      },
    },
  },
  {
    layerKey: "f",
    layerName: "Folders",
    releaseLayer: false,
    mappings: {
      "`": {
        description: "Home",
        command: "open -b com.jinghaoshe.qspace.pro /Users/jason/",
      },
      a: {
        description: "Applications",
        command: "open -b com.jinghaoshe.qspace.pro  /Applications",
      },
      d: {
        description: "Downloads",
        command: "open -b com.jinghaoshe.qspace.pro /Users/jason/Downloads",
      },
      o: {
        description: "My OneDrive",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Library/CloudStorage/OneDrive-Personal",
      },
      p: {
        description: "Proton Drive",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Library/CloudStorage/ProtonDrive-jason.j.knox@pm.me-folder",
      },
      s: {
        description: "Scripts",
        command: "open -b com.jinghaoshe.qspace.pro /Users/jason/Scripts",
      },
      v: {
        description: "Videos",
        command: "open -b com.jinghaoshe.qspace.pro /Users/jason/Videos",
      },
      w: {
        description: "Work OneDrive",
        command:
          "open -b com.jinghaoshe.qspace.pro /Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP",
      },
    },
  },
  {
    layerKey: "s",
    layerName: "Screenshots",
    releaseLayer: false,
    mappings: {
      a: {
        description: "Capture Area",
        command: 'open "cleanshot://capture-area"',
      },
      o: {
        description: "OCR",
        command: 'open "cleanshot://capture-text?linebreaks=false"',
      },
      r: {
        description: "Record Screen",
        command: 'open "cleanshot://record-screen"',
      },
      s: {
        description: "Capture Screen",
        command: 'open "cleanshot://capture-fullscreen"',
      },
      w: {
        description: "Capture Window",
        command: 'open "cleanshot://capture-window"',
      },
    },
  },
  {
    layerKey: "w",
    layerName: "Wrap",
    releaseLayer: false, // Keep layer active to allow shell commands to complete
    mappings: {
      c: {
        description: "Curly Braces",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_braces --source clipboard --dest paste",
          },
        ],
      },
      p: {
        description: "Parentheses",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_parentheses --source clipboard --dest paste",
          },
        ],
      },
      q: {
        description: "Quotes",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_quotes --source clipboard --dest paste",
          },
        ],
      },
      s: {
        description: "Square Brackets",
        actions: [
          { type: "cut" },
          {
            type: "command",
            value:
              "sleep 0.2 && python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py wrap_brackets --source clipboard --dest paste",
          },
        ],
      },
    },
  },
];

// Generate tap-hold rules with automatic conflict prevention
const tapHoldRules = generateTapHoldRules(tapHoldKeys, spaceLayers);

// ============================================================================
// SPECIAL RULES
// ============================================================================

let rules: any[] = [
  // All tap-hold rules generated from configuration
  ...tapHoldRules,

    // LEFT COMMAND - Tap/Double-Tap/Hold pattern using varTapTapHold
  rule("LCMD - CMD (tap), Last app (double-tap), CMD+TAB (tap-tap-hold)").manipulators(
    varTapTapHold({
      key: "left_command",
      firstVar: "lcmd_first_tap",
      aloneEvents: [openApp({ historyIndex: 1 })],
      holdEvents: [toKey("tab", ["left_command"], { repeat: false })],
      thresholdMs: 250,
      description: "Left CMD tap/double-tap/hold",
    })
  ),

  // LEFT SHIFT - Last app (tap alone)
  rule("LSHIFT alone - Last app").manipulators([
    ...map("left_shift")
      .to(toKey("left_shift"))
      .toIfAlone([openApp({ historyIndex: 1 })])
      .description("Left SHIFT alone - Last app")
      .build(),
  ]),

  // CAPS LOCK - Multiple behaviors
  rule(
    "CAPS - HSLAUNCHER (alone), HYPER (hold), SUPER (with shift), MEH (with ctrl)"
  ).manipulators([
    // Base caps_lock behavior (hold = hyper)
    ...map("caps_lock")
      .to(toSetVar("caps_lock_pressed", 1))
      .to(toKey(L.cmd, [L.ctrl, L.opt]))
      .toAfterKeyUp(toSetVar("caps_lock_pressed", 0))
      .toIfAlone(toKey("f15", HYPER))
      .description("CAPS - HSLAUNCHER (alone), HYPER (hold)")
      .build(),
    // Caps with shift = SUPER
    ...map("caps_lock", "left_shift")
      .to(toKey(L.shift, [L.cmd, L.opt, L.ctrl]))
      .description("CAPS + Shift = SUPER")
      .build(),
    // Caps with ctrl = MEH
    ...map("caps_lock", "left_control")
      .to(toKey(L.cmd, [L.opt, L.shift]))
      .description("CAPS + Ctrl = MEH")
      .build(),
  ]),

  // Generate space layer rules with sublayer persistence
  ...generateSpaceLayerRules(spaceLayers),

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
  rule("HOME/END - Mac-style navigation").manipulators([
    ...map("home")
      .to(toKey("left_arrow", ["command"]))
      .build(),
    ...map("home", "shift")
      .to(toKey("left_arrow", ["command", "shift"]))
      .build(),
    ...map("end")
      .to(toKey("right_arrow", ["command"]))
      .build(),
    ...map("end", "shift")
      .to(toKey("right_arrow", ["command", "shift"]))
      .build(),
  ]),

  // ENTER/RETURN - Hold for quick format (both keypad and regular)
  ...["keypad_enter", "return_or_enter"].map((key) =>
    rule(`${key} hold -> quick format`).manipulators([
      tapHold({
        key,
        alone: [toKey(key as any, [], { halt: true })],
        hold: [cmd("/opt/homebrew/bin/hs -c 'FormatCutSeed()'")],
      }),
    ])
  ),

  // EQUALS - Hold for Quick Date (both keypad and regular)
  ...["keypad_equal_sign", "equal_sign"].map((key) =>
    rule(`${key} hold -> Quick Date`).manipulators([
      tapHold({
        key,
        alone: [
          toKey(key === "equal_sign" ? "keypad_equal_sign" : (key as any), [], {
            halt: true,
          }),
        ],
        hold: [
          toKey("left_arrow", ["shift", "option"]),
          toKey("c", ["command"]),
          cmd(
            "/usr/bin/env python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py quick_date --source clipboard --dest paste"
          ),
        ],
      }),
    ])
  ),

  // CTRL alone -> CMD+OPT+CTRL+L
  rule("CTRL alone -> CMD+OPT+CTRL+L").manipulators([
    ...map("left_control")
      .to(toKey("left_control"))
      .toIfAlone(toKey("l", ["command", "option", "control"]))
      .description("Left CTRL alone -> CMD+OPT+CTRL+L")
      .build(),
  ]),

  // CMD+Q double-tap protection (simplified - no optional any support in map())
  rule("CMD-Q requires double-tap (300ms window)").manipulators([
    // When variable is set (within window), allow quit
    ...map("q", "command")
      .condition(ifVar("command_q_pressed", 1))
      .to(toKey("q", ["command"]))
      .to(toSetVar("command_q_pressed", 0))
      .build(),
    // First press sets variable with timeout
    ...map("q", "command")
      .parameters({ "basic.to_delayed_action_delay_milliseconds": 300 })
      .to(toSetVar("command_q_pressed", 1))
      .toDelayedAction(
        [toSetVar("command_q_pressed", 0)],
        [toSetVar("command_q_pressed", 0)]
      )
      .build(),
  ]),

  // CTRL+OPT+ESC - Activity Monitor (tap) or Force Quit (tap-tap)
  rule(
    "CTRL+OPT+ESC - Activity Monitor (tap) or Force Quit (tap-tap)"
  ).manipulators([
    // When first tap variable set, second tap = Force Quit
    ...map("escape", ["left_control", "left_option"])
      .condition(ifVar("ctrl_opt_esc_first", 1))
      .to(toSetVar("ctrl_opt_esc_first", 0))
      .to(toKey("escape", ["command", "option"]))
      .build(),
    // First tap sets variable with delayed action
    ...map("escape", ["left_control", "left_option"])
      .parameters({ "basic.to_delayed_action_delay_milliseconds": 300 })
      .to(toSetVar("ctrl_opt_esc_first", 1))
      .toDelayedAction(
        [toSetVar("ctrl_opt_esc_first", 0)],
        [
          cmd("/Users/jason/Scripts/Metascripts/kill_unresponsive.jxa"),
          toSetVar("ctrl_opt_esc_first", 0),
        ]
      )
      .build(),
  ]),

  // CMD+SHIFT+K - Delete line (except in VSCode Insiders)
  rule("CMD+SHIFT+K - delete line").manipulators([
    ...map("k", ["left_command", "left_shift"])
      .condition(ifApp(/^com\.microsoft\.VSCodeInsiders$/).unless())
      .to(toKey("a", [L.ctrl], { repeat: false }))
      .to(toKey("k", [L.ctrl], { repeat: false }))
      .to(toKey("delete_or_backspace", [], { repeat: false }))
      .build(),
  ]),

  // RCMD + __ - App launch or focus
  rule("RCMD + Key - App launch or focus").manipulators([
    ...map("a", "right_command")
      .to([openApp({ bundleIdentifier: "com.adobe.Acrobat.Pro" })])
      .build(),
    ...map("c", "right_command")
      .to([openApp({ bundleIdentifier: "com.microsoft.VSCodeInsiders" })])
      .build(),
    ...map("d", "right_command")
      .to([openApp({ bundleIdentifier: "company.thebrowser.dia" })])
      .build(),
    ...map("e", "right_command")
      .to([openApp({ bundleIdentifier: "ch.protonmail.desktop" })])
      .build(),
    ...map("f", "right_command")
      .to([openApp({ bundleIdentifier: "com.jinghaoshe.qspace.pro" })])
      .build(),
    ...map("m", "right_command")
      .to([openApp({ bundleIdentifier: "com.apple.MobileSMS" })])
      .build(),
    ...map("o", "right_command")
      .to([openApp({ bundleIdentifier: "com.microsoft.Outlook" })])
      .build(),
    ...map("p", "right_command")
      .to([openApp({ bundleIdentifier: "net.sourceforge.skim-app.skim" })])
      .build(),
    ...map("q", "right_command")
      .to([openApp({ bundleIdentifier: "com.jinghaoshe.qspace.pro" })])
      .build(),
    ...map("r", "right_command")
      .to([openApp({ bundleIdentifier: "com.ringcentral.glip" })])
      .build(),
    ...map("s", "right_command")
      .to([openApp({ bundleIdentifier: "com.apple.Safari" })])
      .build(),
    ...map("t", "right_command")
      .to([openApp({ bundleIdentifier: "com.microsoft.teams2" })])
      .build(),
    ...map("w", "right_command")
      .to([openApp({ bundleIdentifier: "com.microsoft.Word" })])
      .build(),
    ...map("8", "right_command")
      .to([openApp({ bundleIdentifier: "com.electron.8x8---virtual-office" })])
      .build(),
  ]),
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
  rule("DISABLE - Hide/Minimize shortcuts").manipulators([
    ...map("h", ["command", "option"]).build(),
    ...map("m", ["command", "option"]).build(),
    ...map("h", "command").build(),
  ]),

  // PASSWORDS - CMD+/ quick fill dialogue (in SecurityAgent only)
  rule("PASSWORDS - CMD+/ quick fill").manipulators([
    ...map("slash", L.cmd)
      .condition(ifApp(/^com\.apple\.SecurityAgent$/))
      .to(
        cmd(
          "/Applications/Privileges.app/Contents/MacOS/privilegescli -a && sleep 2"
        )
      )
      .to(toKey("a", [L.cmd]))
      .to(toKey("j", [L.shift]))
      .to(toKey("a"))
      .to(toKey("s"))
      .to(toKey("o"))
      .to(toKey("n"))
      .to(toKey("tab"))
      .to(toKey("slash", HYPER, { repeat: false }))
      .build(),
  ]),

  // SKIM - CMD+H/U remapping
  rule("SKIM - CMD+H/U").manipulators([
    ...map("h", "command")
      .condition(ifApp(/^net\.sourceforge\.skim/))
      .to(toKey("h", [L.cmd, L.ctrl]))
      .build(),
    ...map("u", "command")
      .condition(ifApp(/^net\.sourceforge\.skim-app\.skim$/))
      .to(toKey("u", [L.cmd, L.ctrl]))
      .build(),
  ]),

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
  rule("ANTINOTE - CMD+D+D to delete note").manipulators([
    // When ready variable set, execute delete
    ...map("d", "command")
      .condition(
        ifApp([
          /^com\.chabomakers\.Antinote-setapp$/,
          /^com\.chabomakers\.Antinote$/,
        ])
      )
      .condition(ifVar("cmd_d_ready", 1))
      .to(toKey("d", ["command"]))
      .to(toSetVar("cmd_d_ready", 0))
      .build(),
    // First press sets ready variable with delay
    ...map("d", "command")
      .condition(
        ifApp([
          /^com\.chabomakers\.Antinote-setapp$/,
          /^com\.chabomakers\.Antinote$/,
        ])
      )
      .condition(ifVar("cmd_d_ready", 0))
      .to(toSetVar("cmd_d_ready", 1))
      .toDelayedAction(
        [toSetVar("cmd_d_ready", 0)],
        [toSetVar("cmd_d_ready", 0)]
      )
      .build(),
  ]),
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

// First, write the complex_modifications rules
writeToProfile("Karabiner.ts", rules);

// Wait for writeToProfile to complete, then add device configurations
setTimeout(() => {
  updateDeviceConfigurations("Karabiner.ts", deviceConfigs);
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
