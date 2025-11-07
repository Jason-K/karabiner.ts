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

import type { ToEvent } from 'karabiner.ts';
import { ifApp, ifVar, map, rule, toKey, toSetVar, toStickyModifier, writeToProfile } from 'karabiner.ts';
import { cmd, tapHold } from './lib/builders';
import { HYPER, L, SUPER } from './lib/mods';

// ============================================================================
// TAP-HOLD KEY DEFINITIONS
// ============================================================================
/**
 * Tap-hold keys provide dual functionality:
 * - Tap: Send the key normally (with halt to prevent accidental holds)
 * - Hold: Execute a custom action (open app, trigger hotkey, etc.)
 *
 * Default timing: 400ms for both timeout and threshold
 * Some keys use faster timing (300ms) for more responsive feel
 *
 * Configuration is declarative - just add entries to the object below.
 * The keys are automatically converted to rules with proper conflict prevention.
 */

type TapHoldConfig = {
  hold: ToEvent[];           // Actions to perform when key is held
  description: string;        // Human-readable description for the rule
  timeoutMs?: number;        // How long to wait before considering it "alone" (default: 400)
  thresholdMs?: number;      // How long to hold before triggering hold action (default: 400)
};

const tapHoldKeys: Record<string, TapHoldConfig> = {
  a: {
    hold: [toKey('a', SUPER, { repeat: false })],
    description: 'RaycastAI hotkey',
  },
  d: {
    hold: [
      toKey('left_arrow', ['option', 'shift']),
      toKey('x', ['command']),
      cmd('python3 ~/Scripts/Text_Manipulation/text_processor/interfaces/cli.py quick_date --source clipboard --dest paste'),
    ],
    description: 'Quick format date',
  },
  f: {
    hold: [toKey('f17', HYPER, { repeat: false })],
    description: 'search with ProFind',
  },
  g: {
    hold: [cmd('open -b com.openai.chat')],
    description: 'ChatGPT',
  },
  h: {
    hold: [cmd("/opt/homebrew/bin/hs -c 'hs.openConsole()'")],
    description: 'Hammerspoon console',
  },
  i: {
    hold: [cmd("/opt/homebrew/bin/hs -c 'local ev=require(\"hs.eventtap\"); local t=require(\"hs.timer\"); ev.keyStroke({}, \"home\"); t.usleep(120000); ev.keyStroke({}, \"tab\"); t.usleep(120000); ev.keyStroke({}, \"end\")'")],
    description: 'indent line',
  },
  m: {
    hold: [toKey('f20', SUPER, { repeat: false })],
    description: 'unminimize via 1Piece',
  },
  q: {
    hold: [cmd("open -a '/System/Volumes/Data/Applications/QSpace Pro.app'")],
    description: 'QSpace Pro',
  },
  r: {
    hold: [cmd('latest=$(ls -t "$HOME/Downloads" | head -n1); [ -n "$latest" ] && open -R "$HOME/Downloads/$latest"')],
    description: 'latest Download',
  },
  s: {
    hold: [toKey('s', SUPER, { repeat: false })],
    description: 'RaycastAI hotkey',
  },
  t: {
    hold: [cmd('osascript ~/Scripts/Application_Specific/iterm2/iterm2_openHere.applescript')],
    description: 'iTerm2',
    timeoutMs: 300,
    thresholdMs: 300,
  },
  v: {
    hold: [toKey('grave_accent_and_tilde', ['control'], { halt: true, repeat: false })],
    description: 'Maccy',
    timeoutMs: 300,
    thresholdMs: 300,
  },
  w: {
    hold: [toKey('w', ['command', 'shift'], { repeat: false })],
    description: 'Writing Tools',
  },
  '8': {
    hold: [cmd('open -b com.electron.8x8---virtual-office')],
    description: 'run/open 8x8',
  },
  slash: {
    hold: [toKey('f17', HYPER, { repeat: false })],
    description: 'search for files',
  },
  tab: {
    hold: [toKey('mission_control', [], { halt: true, repeat: true })],
    description: 'Mission Control',
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
 * 3. Space can be released - sublayer stays active
 * 4. Tap an action key to execute and deactivate sublayer
 *
 * Benefits of top-level definition:
 * - Tap-hold rules can detect layer keys and add conflict prevention
 * - Single source of truth for all layer configuration
 * - Easy to add new layers without touching multiple sections
 *
 * Timing:
 * - Space tap → sends spacebar normally
 * - Space + quick key → sends spacebar then key (via to_if_canceled)
 * - Space held → activates layer system
 *
 * All sublayer variables are cleared when:
 * - Space is tapped alone
 * - Space + key pressed before threshold
 * - Any sublayer action completes
 */

type SubLayerConfig = {
  layerKey: string;           // Key to activate this sublayer (e.g., 'd' for Downloads)
  layerName: string;          // Human-readable name for documentation
  releaseLayer?: boolean;     // If true (default), clear layer after each action. If false, layer stays active until space released.
  mappings: Record<string, {  // Key mappings within this sublayer
    path?: string;            // Folder/file path to open
    command?: string;         // Shell command to execute
    key?: string;             // Key to send
    stickyModifier?: 'shift' | 'option' | 'command' | 'control'; // Toggle sticky modifier state
      passModifiers?: boolean;  // If true, pass through modifiers from the source key (e.g., shift+h → shift+left_arrow)
    description: string;      // Description for this action
  }>;
};

const spaceLayers: SubLayerConfig[] = [
  {
    layerKey: 'a',
    layerName: 'Applications',
    mappings: {
      8: { command: 'open -b com.electron.8x8---virtual-office', description: '8x8' },
      c: { command: 'open -b com.openai.chat', description: 'ChatGPT' },
      d: { command: "open -a '/System/Volumes/Data/Applications/Dia.app'", description: 'Dia' },
      f: { command: "open -a '/System/Volumes/Data/Applications/QSpace Pro.app'", description: 'QSpace Pro' },
      m: { command: 'open -a "Messages"', description: 'Messages' },
      o: { command: 'open -a "Microsoft Outlook"', description: 'Microsoft Outlook' },
      q: { command: "open -a '/System/Volumes/Data/Applications/QSpace Pro.app'", description: 'QSpace Pro' },
      s: { command: 'open -a Safari', description: 'Safari' },
      t: { command: 'open -a "Microsoft Teams"', description: 'Microsoft Teams' },
      v: { command: 'open -a "Visual Studio Code - Insiders"', description: 'VS Code Insiders' },
      w: { command: 'open -a "Microsoft Word"', description: 'Microsoft Word' },
    },
  },
  {
    layerKey: 'c',
    layerName: 'Cursor',
    releaseLayer: false,        // Keep layer active until space released for continuous cursor movement
    mappings: {
      j: { key: 'left_arrow', passModifiers: true, description: 'Left' },
      k: { key: 'down_arrow', passModifiers: true, description: 'Down' },
      i: { key: 'up_arrow', passModifiers: true, description: 'Up' },
      l: { key: 'right_arrow', passModifiers: true, description: 'Right' },
      u: { key: 'home', passModifiers: true, description: 'Home' },
      o: { key: 'end', passModifiers: true, description: 'End' },
      p: { key: 'page_up', passModifiers: true, description: 'Page Up' },
      ";": { key: 'page_down', passModifiers: true, description: 'Page Down' },
    },
  },
  {
    layerKey: 'd',
    layerName: 'Downloads',
    mappings: {
      p: { path: '/Users/jason/Downloads/PDFs', description: 'PDFs' },
      a: { path: '/Users/jason/Downloads/Archives', description: 'Archives' },
      o: { path: '/Users/jason/Downloads/Office', description: 'Office' },
      '3': { path: '/Users/jason/Downloads/3dPrinting', description: '3dPrinting' },
      i: { path: '/Users/jason/Downloads/Installs', description: 'Installs' },
    },
  },
  {
    layerKey: 'f',
    layerName: 'Folders',
    mappings: {
      "`": { path: '/Users/jason/', description: 'Home' },
      s: { path: '/Users/jason/Scripts', description: 'Scripts' },
      a: { path: '/Users/jason/Applications', description: 'Applications' },
      d: { path: '/Users/jason/Downloads', description: 'Downloads' },
      p: { path: '/Users/jason/Library/CloudStorage/ProtonDrive-jason.j.knox@pm.me-folder', description: 'Proton Drive' },
      v: { path: '/Users/jason/Videos', description: 'Videos' },
      w: { path: '/Users/jason/Library/CloudStorage/OneDrive-BoxerandGerson,LLP', description: 'Work OneDrive' },
      o: { path: '/Users/jason/Library/CloudStorage/OneDrive-Personal', description: 'Personal OneDrive' },
    },
  },
  {
    layerKey: 's',
    layerName: 'screenshots',
    mappings: {
      o: { command: 'open "cleanshot://capture-text?linebreaks=false"', description: 'OCR' },
      a: { command: 'open "cleanshot://capture-area"', description: 'Capture Area' },
      w: { command: 'open "cleanshot://capture-window"', description: 'Capture Window' },
      s: { command: 'open "cleanshot://capture-fullscreen"', description: 'Capture Screen' },
      r: { command: 'open "cleanshot://record-screen"', description: 'Record Screen' },
    },
  },
];

// Extract layer keys for use in tap-hold conflict prevention
// ============================================================================
// TAP-HOLD RULE GENERATION
// ============================================================================
/**
 * This section generates tap-hold rules dynamically from the tapHoldKeys configuration.
 *
 * DYNAMIC CONFLICT PREVENTION:
 * Space layer activation keys (d, a, f) automatically get a condition that prevents
 * their tap-hold behavior from interfering with the space layer:
 * - When space_mod=1, tap-hold is disabled → space layer keys work immediately
 * - When space_mod=0, tap-hold is enabled → normal dual-function behavior
 *
 * IMPLEMENTATION:
 * 1. Extract layer keys from spaceLayers configuration
 * 2. Generate tap-hold manipulators using builders.tapHold()
 * 3. Dynamically add variable_unless conditions for layer keys
 * 4. Wrap in named rules for clarity in Karabiner UI
 *
 * BENEFITS:
 * - Automatically maintains consistency between space layer and tap-hold
 * - Adding new space sublayers automatically updates conflict prevention
 * - No hardcoded key lists to maintain
 */
const spaceLayerKeys = spaceLayers.map(layer => layer.layerKey);

const tapHoldRules = Object.entries(tapHoldKeys).map(([key, config]) => {
  const manipulators = tapHold({
    key,
    alone: [toKey(key as any, [], { halt: true })],
    hold: config.hold,
    timeoutMs: config.timeoutMs,
    thresholdMs: config.thresholdMs,
  }).build();

  // Add conditions to prevent conflict with space layer
  // All tap-hold keys should be disabled when space layer or any sublayer is active
  const spaceModVar = 'space_mod';
  const allSublayerVars = spaceLayers.map(({ layerKey }) => `space_${layerKey}_sublayer`);

  manipulators.forEach((m: any) => {
    m.conditions = m.conditions || [];

    // Disable tap-hold when space_mod is active
    m.conditions.push({
      type: 'variable_unless',
      name: spaceModVar,
      value: 1
    });

    // Disable tap-hold when any sublayer is active
    allSublayerVars.forEach(sublayerVar => {
      m.conditions.push({
        type: 'variable_unless',
        name: sublayerVar,
        value: 1
      });
    });
  });

  return rule(`${key.toUpperCase()} hold -> ${config.description}`).manipulators(manipulators);
});

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

// ============================================================================
// SPACE LAYER IMPLEMENTATION
// ============================================================================
/**
 * This section creates the space layer system with persistent sublayers.
 *
 * ARCHITECTURE:
 * 1. Space key: tap=space, hold=activate layer (space_mod=1)
 * 2. Layer activation: press space+d/a/f to activate sublayer
 * 3. Sublayer persistence: sublayer stays active after releasing space
 * 4. Key execution: press keys in sublayer → open file/run command → clear sublayer
 * 5. Manual exit: releasing space clears all layer/sublayer variables
 *
 * VARIABLE LIFECYCLE:
 * - space_mod: Set to 1 when space held, cleared when released/tapped
 * - space_d_sublayer/space_a_sublayer/space_f_sublayer: Set to 1 when layer activated,
 *   cleared when action executed or space released
 *
 * TIMING BEHAVIOR:
 * - to_if_alone_timeout: 200ms (tap vs hold detection for space)
 * - to_if_held_down_threshold: 200ms (when to activate space_mod)
 * - to_delayed_action: Handles double-tap space case
 *
 * CONSOLIDATED RULES:
 * Each sublayer generates ONE rule containing ALL manipulators:
 * - Sublayer activation manipulator
 * - All key mapping manipulators
 * This reduces rule count and improves Karabiner performance.
 *
 * EXAMPLE USAGE:
 * - Space tap → " " (space character)
 * - Space hold, d, release space, j → Opens Downloads folder
 * - Space hold, a, release space, c → Opens Calendar app
 */

  // SPACE layer - simple implementation with sublayer persistence
  ...(() => {
    const rules: any[] = [];
    const spaceModVar = 'space_mod';

    // Collect all sublayer variable names
    const allSublayerVars = spaceLayers.map(({ layerKey }) => `space_${layerKey}_sublayer`);

    // Space key activates the layer
    const spaceManipulator = map('spacebar')
      .toIfAlone([
        toKey('spacebar', [], { halt: true }),
        toSetVar(spaceModVar, 0),
        ...allSublayerVars.map(v => toSetVar(v, 0))
      ])
      .toIfHeldDown(toSetVar(spaceModVar, 1))
      .toAfterKeyUp([
        toSetVar(spaceModVar, 0),
        ...allSublayerVars.map(v => toSetVar(v, 0)),
        // Ensure sticky modifiers are cleared when leaving space mode
        toStickyModifier(L.shift, 'off'),
        toStickyModifier(L.opt, 'off'),
        toStickyModifier(L.cmd, 'off'),
        toStickyModifier(L.ctrl, 'off'),
      ])
      .toDelayedAction(
        [],
        [
          toKey('spacebar'),
          toSetVar(spaceModVar, 0),
          ...allSublayerVars.map(v => toSetVar(v, 0))
        ]
      )
      .parameters({
        'basic.to_if_alone_timeout_milliseconds': 200,
        'basic.to_if_held_down_threshold_milliseconds': 200,
      });

    rules.push(rule('SPACE - tap for space, hold for layer').manipulators(spaceManipulator.build()));

    // Generate sublayer rules
    spaceLayers.forEach(({ layerKey, layerName, mappings, releaseLayer = true }) => {
      const sublayerVar = `space_${layerKey}_sublayer`;
      const allManipulators: any[] = [];

      // Sublayer activation - pressing layerKey while space is held
      allManipulators.push(
        ...map(layerKey as any)
          .condition(ifVar(spaceModVar, 1))
          .to([
            toSetVar(sublayerVar, 1),
            toSetVar(spaceModVar, 0)
          ])
          .build()
      );

      // Sublayer key mappings
      Object.entries(mappings).forEach(([key, config]) => {
        const events: ToEvent[] = [];

        if (config.path) {
          events.push(cmd(`open '${config.path}'`));
        } else if (config.command) {
          events.push(cmd(config.command));
        } else if (config.stickyModifier) {
          // Toggle sticky modifier using a/s/d/f
          const modMap: Record<string, string> = {
            shift: L.shift,
            option: L.opt,
            command: L.cmd,
            control: L.ctrl,
          } as any;
          const stickyKey = modMap[config.stickyModifier];
          events.push(toStickyModifier(stickyKey as any, 'toggle'));
        } else if (config.key) {
          // If passModifiers is true, use 'any' modifiers to pass through from source key
          if (config.passModifiers) {
            events.push(toKey(config.key as any, 'any' as any));
          } else {
            events.push(toKey(config.key as any));
          }
        }

        // Clear the sublayer variable after action only if releaseLayer is true and this is not a sticky toggle
        if (releaseLayer && !config.stickyModifier) {
          events.push(toSetVar(sublayerVar, 0));
        }

        const mappingBuilder = (config.passModifiers
          ? (map as any)(key as any, '??' as any)
          : map(key as any)
        ).condition(ifVar(sublayerVar, 1)).to(events);

        allManipulators.push(
          ...mappingBuilder.build()
        );
      });

      // Add single rule with all manipulators for this sublayer
      rules.push(
        rule(`SPACE+${layerKey.toUpperCase()} - ${layerName} layer`).manipulators(allManipulators)
      );
    });

    return rules;
  })(),

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
 * - Brave specific bindings (pending implementation)
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

  // ESCAPE - Reset all variables and send escape
  ...(() => {
    // Collect all layer variables dynamically from spaceLayers config
    const spaceModVar = 'space_mod';
    const allSublayerVars = spaceLayers.map(({ layerKey }) => `space_${layerKey}_sublayer`);

    // Static variables used elsewhere (caps lock, double-tap protection)
    const otherVars = [
      'caps_lock_pressed',
      'command_q_pressed',
      'ctrl_opt_esc_first',
      'cmd_d_ready',
    ];

    return [
      rule('ESCAPE - reset all variables').manipulators([
        ...map('escape')
          .to([
            toKey('escape'),
            toSetVar(spaceModVar, 0),
            ...allSublayerVars.map(v => toSetVar(v, 0)),
            ...otherVars.map(v => toSetVar(v, 0)),
            // Also clear sticky modifiers
            toStickyModifier(L.shift, 'off'),
            toStickyModifier(L.opt, 'off'),
            toStickyModifier(L.cmd, 'off'),
            toStickyModifier(L.ctrl, 'off'),
          ])
          .build(),
      ])
    ];
  })(),

  // ============================================================================
  // SECURITY & SYSTEM ACCESS RULES
  // ============================================================================
  /**
   * These rules handle privileged operations and security dialogs:
   *
   * DISABLED SHORTCUTS:
   * - CMD+H, CMD+OPT+H: Hide/Minimize shortcuts disabled (empty to events)
   * - CMD+M, CMD+OPT+M: Minimize shortcuts disabled
   *
   * PASSWORD AUTOMATION (SecurityAgent only):
   * - CMD+/: Auto-fill admin password using Privileges.app + Hammerspoon
   * - Sequence: Enable admin → select all → type "jason" → tab → trigger password manager
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
/**
 * Device-specific key remappings that apply hardware-level key substitutions.
 * These modifications occur before complex_modifications rules are evaluated.
 *
 * Configuration includes:
 * - Keypad remapping for specific keyboard model (vendor 76, product 802)
 * - Function key ↔ Control key swap for all matching devices
 *
 * Note: karabiner.ts only handles complex_modifications, so we manually
 * update the devices section after writeToProfile() runs.
 */
type SimpleModification = {
  from: { key_code: string };
  to: Array<{ key_code: string }>;
};

type DeviceConfig = {
  identifiers: {
    vendor_id: number;
    product_id: number;
    is_keyboard?: boolean;
  };
  simple_modifications: SimpleModification[];
};

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
/**
 * Deploy all rules to the 'Karabiner.ts' profile.
 * This writes directly to ~/.config/karabiner/karabiner.json
 *
 * To apply changes:
 * 1. npm run build (runs tsx src/index.ts)
 * 2. Karabiner-Elements automatically detects config changes
 *
 * IMPLEMENTATION NOTES:
 * - writeToProfile() only writes complex_modifications
 * - Device-specific simple_modifications are added separately below
 * - We use setTimeout to ensure writeToProfile completes before modifying
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// First, write the complex_modifications rules
writeToProfile('Karabiner.ts', rules);

// Wait for writeToProfile to complete, then add device configurations
setTimeout(() => {
  try {
    const configPath = path.join(os.homedir(), '.config', 'karabiner', 'karabiner.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Find the Karabiner.ts profile
    const profile = config.profiles.find((p: any) => p.name === 'Karabiner.ts');
    if (profile) {
      // Add or update the devices section (Magic Keyboard keypad + Fn swap)
      profile.devices = deviceConfigs.map(device => ({
        identifiers: device.identifiers,
        simple_modifications: device.simple_modifications,
      }));

      // Add profile-level Fn↔Ctrl swap for built-in keyboard and others
      profile.simple_modifications = [
        { from: { key_code: 'left_control' }, to: [{ key_code: 'fn' }] },
        { from: { key_code: 'fn' }, to: [{ key_code: 'left_control' }] },
      ];

      // Write back to file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      console.log('✓ Device-specific simple_modifications updated.');
    } else {
      console.error('✗ Karabiner.ts profile not found');
    }
  } catch (error) {
    console.error('Error updating device configurations:', error);
  }
}, 1000);

