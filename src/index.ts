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

import { ifApp, ifVar, map, rule, toKey, toSetVar, writeToProfile } from 'karabiner.ts';
import { cmd, tapHold } from './lib/builders';
import type { DeviceConfig, SubLayerConfig, TapHoldConfig } from './lib/functions';
import { generateEscapeRule, generateSpaceLayerRules, generateTapHoldRules, updateDeviceConfigurations } from './lib/functions';
import { HYPER, L, SUPER } from './lib/mods';

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
  a: { description: 'RaycastAI hotkey',       hold: [ toKey('a', SUPER, { repeat: false })], },
  d: { description: 'Quick format date',      hold: [
        toKey('left_arrow', ['option', 'shift']),
        toKey('x', ['command']), cmd('python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py quick_date --source clipboard --dest paste'),
      ], },
  f: { description: 'ProFind',    hold: [toKey('f17', HYPER, { repeat: false })], },
  g: { description: 'ChatGPT',                hold: [cmd('open -b com.openai.chat')], },
  h: { description: 'HS console',    hold: [cmd("/opt/homebrew/bin/hs -c 'hs.openConsole()'")], },
  i: { description: 'indent line',            hold: [cmd("/opt/homebrew/bin/hs -c 'local ev=require(\"hs.eventtap\"); local t=require(\"hs.timer\"); ev.keyStroke({}, \"home\"); t.usleep(120000); ev.keyStroke({}, \"tab\"); t.usleep(120000); ev.keyStroke({}, \"end\")'")], },
  m: { description: 'Deminimize',  hold: [toKey('f20', SUPER, { repeat: false })], },
  q: { description: 'QSpace Pro',             hold: [cmd("open -a '/System/Volumes/Data/Applications/QSpace Pro.app'")], },
  r: { description: 'Last d/l',        hold: [cmd('latest=$(ls -t "$HOME/Downloads" | head -n1); [ -n "$latest" ] && open -R "$HOME/Downloads/$latest"')], },
  s: { description: 'RaycastAI',       hold: [toKey('s', SUPER, { repeat: false })], },
  t: { description: 'iTerm2',                 hold: [cmd('osascript ~/Scripts/Application_Specific/iterm2/iterm2_openHere.applescript')], timeoutMs: 300, thresholdMs: 300, },
  v: { description: 'Maccy',                  hold: [toKey('grave_accent_and_tilde', ['control'], { halt: true, repeat: false })], timeoutMs: 300, thresholdMs: 300, },
  w: { description: 'Writing Tools',          hold: [toKey('w', ['command', 'shift'], { repeat: false })], },
  '8': { description: '8x8',                  hold: [cmd('open -b com.electron.8x8---virtual-office')], },
  slash: { description: 'search for files',   hold: [toKey('f17', HYPER, { repeat: false })], },
  tab: { description: 'Mission Control',      hold: [toKey('mission_control', [], { halt: true, repeat: true })], timeoutMs: 300, thresholdMs: 300, },
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
    layerKey: 'a',
    layerName: 'Applications',
    mappings: {
      8: { description: '8x8', command: 'open -b com.electron.8x8---virtual-office' },
      c: { description: 'ChatGPT', command: 'open -b com.openai.chat' },
      d: { description: 'Dia', command: "open -a '/System/Volumes/Data/Applications/Dia.app'" },
      f: { description: 'QSpace Pro', command: "open -a '/System/Volumes/Data/Applications/QSpace Pro.app'" },
      m: { description: 'Messages', command: 'open -a "Messages"' },
      o: { description: 'Microsoft Outlook', command: 'open -a "Microsoft Outlook"' },
      q: { description: 'QSpace Pro', command: "open -a '/System/Volumes/Data/Applications/QSpace Pro.app'" },
      s: { description: 'Safari', command: 'open -a Safari' },
      t: { description: 'Microsoft Teams', command: 'open -a "Microsoft Teams"' },
      v: { description: 'VS Code Insiders', command: 'open -a "Visual Studio Code - Insiders"' },
      w: { description: 'Microsoft Word', command: 'open -a "Microsoft Word"' },
    },
  },
  {
    layerKey: 'c',
    layerName: 'Cursor',
    releaseLayer: false,        // Keep layer active until space released for continuous cursor movement
    mappings: {
      j: { description: 'Left', key: 'left_arrow', passModifiers: true },
      k: { description: 'Down', key: 'down_arrow', passModifiers: true },
      i: { description: 'Up', key: 'up_arrow', passModifiers: true },
      l: { description: 'Right', key: 'right_arrow', passModifiers: true },
      u: { description: 'Home', key: 'home', passModifiers: true },
      o: { description: 'End', key: 'end', passModifiers: true },
      p: { description: 'Page Up', key: 'page_up', passModifiers: true },
      ";": { description: 'Page Down', key: 'page_down', passModifiers: true },
    },
  },
  {
    layerKey: 'd',
    layerName: 'Downloads',
    mappings: {
      p: { description: 'PDFs', path: '/Users/jason/Downloads/PDFs' },
      a: { description: 'Archives', path: '/Users/jason/Downloads/Archives' },
      o: { description: 'Office', path: '/Users/jason/Downloads/Office' },
      '3': { description: '3dPrinting', path: '/Users/jason/Downloads/3dPrinting' },
      i: { description: 'Installs', path: '/Users/jason/Downloads/Installs' },
    },
  },
  {
    layerKey: 'f',
    layerName: 'Folders',
    mappings: {
      "`": { description: 'Home', path: '/Users/jason/' },
      s: { description: 'Scripts', path: '/Users/jason/Scripts' },
      a: { description: 'Applications', path: '/Users/jason/Applications' },
      d: { description: 'Downloads', path: '/Users/jason/Downloads' },
      p: { description: 'Proton Drive', path: '/Users/jason/Library/CloudStorage/ProtonDrive-jason.j.knox@pm.me-folder' },
      v: { description: 'Videos', path: '/Users/jason/Videos' },
      w: { description: 'Work OneDrive', path: '/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP' },
      o: { description: 'Personal OneDrive', path: '/Users/jason/Library/CloudStorage/OneDrive-Personal' },
    },
  },
  {
    layerKey: 's',
    layerName: 'screenshots',
    mappings: {
      o: { description: 'OCR', command: 'open "cleanshot://capture-text?linebreaks=false"' },
      a: { description: 'Capture Area', command: 'open "cleanshot://capture-area"' },
      w: { description: 'Capture Window', command: 'open "cleanshot://capture-window"' },
      s: { description: 'Capture Screen', command: 'open "cleanshot://capture-fullscreen"' },
      r: { description: 'Record Screen', command: 'open "cleanshot://record-screen"' },
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

  // CAPS LOCK - Multiple behaviors
  rule('CAPS - HSLAUNCHER (alone), HYPER (hold), SUPER (with shift), MEH (with ctrl)').manipulators([
    // Base caps_lock behavior (hold = hyper)
    ...map('caps_lock')
      .to(toSetVar('caps_lock_pressed', 1))
      .to(toKey(L.cmd, [L.ctrl, L.opt]))
      .toAfterKeyUp(toSetVar('caps_lock_pressed', 0))
      .toIfAlone(toKey('f15', HYPER))
      .description('CAPS - HSLAUNCHER (alone), HYPER (hold)')
      .build(),
    // Caps with shift = SUPER
    ...map('caps_lock', 'left_shift')
      .to(toKey(L.shift, [L.cmd, L.opt, L.ctrl]))
      .description('CAPS + Shift = SUPER')
      .build(),
    // Caps with ctrl = MEH
    ...map('caps_lock', 'left_control')
      .to(toKey(L.cmd, [L.opt, L.shift]))
      .description('CAPS + Ctrl = MEH')
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
  rule('HOME/END - Mac-style navigation').manipulators([
    ...map('home').to(toKey('left_arrow', ['command'])).build(),
    ...map('home', 'shift').to(toKey('left_arrow', ['command', 'shift'])).build(),
    ...map('end').to(toKey('right_arrow', ['command'])).build(),
    ...map('end', 'shift').to(toKey('right_arrow', ['command', 'shift'])).build(),
  ]),

  // ENTER/RETURN - Hold for quick format (both keypad and regular)
  ...['keypad_enter', 'return_or_enter'].map(key =>
    rule(`${key} hold -> quick format`).manipulators([
      tapHold({
        key,
        alone: [toKey(key as any, [], { halt: true })],
        hold: [cmd("/opt/homebrew/bin/hs -c 'FormatCutSeed()'")],
      })
    ])
  ),

  // EQUALS - Hold for Quick Date (both keypad and regular)
  ...['keypad_equal_sign', 'equal_sign'].map(key =>
    rule(`${key} hold -> Quick Date`).manipulators([
      tapHold({
        key,
        alone: [toKey(key === 'equal_sign' ? 'keypad_equal_sign' : key as any, [], { halt: true })],
        hold: [
          toKey('left_arrow', ['shift', 'option']),
          toKey('c', ['command']),
          cmd('/usr/bin/env python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py quick_date --source clipboard --dest paste'),
        ],
      })
    ])
  ),

  // CMD alone -> CMD+OPT+CTRL+L
  rule('CMD alone -> CMD+OPT+CTRL+L').manipulators([
    ...map('left_command')
      .to(toKey('left_command'))
      .toIfAlone(toKey('l', ['command', 'option', 'control']))
      .description('Left CMD alone -> CMD+OPT+CTRL+L')
      .build(),
    ...map('right_command')
      .to(toKey('right_command'))
      .toIfAlone(toKey('l', ['command', 'option', 'control']))
      .description('Right CMD alone -> CMD+OPT+CTRL+L')
      .build(),
  ]),

  // CMD+Q double-tap protection (simplified - no optional any support in map())
  rule('CMD-Q requires double-tap (300ms window)').manipulators([
    // When variable is set (within window), allow quit
    ...map('q', 'command')
      .condition(ifVar('command_q_pressed', 1))
      .to(toKey('q', ['command']))
      .to(toSetVar('command_q_pressed', 0))
      .build(),
    // First press sets variable with timeout
    ...map('q', 'command')
      .parameters({ 'basic.to_delayed_action_delay_milliseconds': 300 })
      .to(toSetVar('command_q_pressed', 1))
      .toDelayedAction(
        [toSetVar('command_q_pressed', 0)],
        [toSetVar('command_q_pressed', 0)]
      )
      .build(),
  ]),

  // CTRL+OPT+ESC - Activity Monitor (tap) or Force Quit (tap-tap)
  rule('CTRL+OPT+ESC - Activity Monitor (tap) or Force Quit (tap-tap)').manipulators([
    // When first tap variable set, second tap = Force Quit
    ...map('escape', ['left_control', 'left_option'])
      .condition(ifVar('ctrl_opt_esc_first', 1))
      .to(toSetVar('ctrl_opt_esc_first', 0))
      .to(toKey('escape', ['command', 'option']))
      .build(),
    // First tap sets variable with delayed action
    ...map('escape', ['left_control', 'left_option'])
      .parameters({ 'basic.to_delayed_action_delay_milliseconds': 300 })
      .to(toSetVar('ctrl_opt_esc_first', 1))
      .toDelayedAction(
        [toSetVar('ctrl_opt_esc_first', 0)],
        [cmd('/Users/jason/Scripts/Metascripts/kill_unresponsive.jxa'), toSetVar('ctrl_opt_esc_first', 0)]
      )
      .build(),
  ]),

  // CMD+SHIFT+K - Delete line (except in VSCode Insiders)
  rule('CMD+SHIFT+K - delete line').manipulators([
    ...map('k', ['left_command', 'left_shift'])
      .condition(ifApp(/^com\.microsoft\.VSCodeInsiders$/).unless())
      .to(toKey('a', [L.ctrl], { repeat: false }))
      .to(toKey('k', [L.ctrl], { repeat: false }))
      .to(toKey('delete_or_backspace', [], { repeat: false }))
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
  rule('DISABLE - Hide/Minimize shortcuts').manipulators([
    ...map('h', ['command', 'option']).build(),
    ...map('m', ['command', 'option']).build(),
    ...map('h', 'command').build(),
  ]),

  // PASSWORDS - CMD+/ quick fill dialogue (in SecurityAgent only)
  rule('PASSWORDS - CMD+/ quick fill').manipulators([
    ...map('slash', L.cmd)
      .condition(ifApp(/^com\.apple\.SecurityAgent$/))
      .to(cmd('/Applications/Privileges.app/Contents/MacOS/privilegescli -a && sleep 2'))
      .to(toKey('a', [L.cmd]))
      .to(toKey('j', [L.shift]))
      .to(toKey('a'))
      .to(toKey('s'))
      .to(toKey('o'))
      .to(toKey('n'))
      .to(toKey('tab'))
      .to(toKey('slash', HYPER, { repeat: false }))
      .build(),
  ]),

  // SKIM - CMD+H/U remapping
  rule('SKIM - CMD+H/U').manipulators([
    ...map('h', 'command')
      .condition(ifApp(/^net\.sourceforge\.skim/))
      .to(toKey('h', [L.cmd, L.ctrl]))
      .build(),
    ...map('u', 'command')
      .condition(ifApp(/^net\.sourceforge\.skim-app\.skim$/))
      .to(toKey('u', [L.cmd, L.ctrl]))
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
  rule('ANTINOTE - CMD+D+D to delete note').manipulators([
    // When ready variable set, execute delete
    ...map('d', 'command')
      .condition(ifApp([/^com\.chabomakers\.Antinote-setapp$/, /^com\.chabomakers\.Antinote$/]))
      .condition(ifVar('cmd_d_ready', 1))
      .to(toKey('d', ['command']))
      .to(toSetVar('cmd_d_ready', 0))
      .build(),
    // First press sets ready variable with delay
    ...map('d', 'command')
      .condition(ifApp([/^com\.chabomakers\.Antinote-setapp$/, /^com\.chabomakers\.Antinote$/]))
      .condition(ifVar('cmd_d_ready', 0))
      .to(toSetVar('cmd_d_ready', 1))
      .toDelayedAction(
        [toSetVar('cmd_d_ready', 0)],
        [toSetVar('cmd_d_ready', 0)]
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
      { from: { key_code: 'keypad_asterisk' }, to: [{ key_code: 'keypad_hyphen' }] },
      { from: { key_code: 'keypad_equal_sign' }, to: [{ key_code: 'keypad_slash' }] },
      { from: { key_code: 'keypad_hyphen' }, to: [{ key_code: 'keypad_plus' }] },
      { from: { key_code: 'keypad_plus' }, to: [{ key_code: 'keypad_equal_sign' }] },
      { from: { key_code: 'keypad_slash' }, to: [{ key_code: 'keypad_asterisk' }] },
      { from: { key_code: 'left_control' }, to: [{ key_code: 'fn' }] },
      { from: { key_code: 'fn' }, to: [{ key_code: 'left_control' }] },
    ],
  },
];

// ============================================================================
// WRITE TO PROFILE
// ============================================================================

// First, write the complex_modifications rules
writeToProfile('Karabiner.ts', rules);

// Wait for writeToProfile to complete, then add device configurations
setTimeout(() => {
  updateDeviceConfigurations('Karabiner.ts', deviceConfigs);
}, 1000);
