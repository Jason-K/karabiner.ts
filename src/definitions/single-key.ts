import { recentDownloadsCommand } from "../core/scripts";
import { rectangleActionUrl } from "../data/rectangle";
import type { TapHoldConfig } from "../engine";

//   SINGLE KEY TAP/HOLD RULES
//
////   LETTERS:
////
//////     a: Raycast AI-quick search
//////     c: Calendar
//////     f: QSSpace
//////     g: Claude
//////     h: Here2There
//////     j: Last d/l
//////     k: Kitty
//////     o: OCR
//////     p: Popclip
//////     r: Last d/l
//////     s: Screenshot
//////     t: Todoist
//////     v: Maccy
//////     x: Copy file (actHere)
//////     y: Yank file (actHere)
//////     z: Zoxide
////
////   NUMBERS:
////
//////     8: RingCentral
//////     keypad_0: Unstash all via rectangle
//////     keypad_2: Stash down via rectangle
//////     keypad_4: Stash left via rectangle
//////     keypad_5: Unstash via rectangle
//////     keypad_6: Stash right via rectangle
//////     keypad_8: Stash up via rectangle
////
////   FUNCTION KEYS:
////
//////     f1: Brightness decrement
//////     f2: Increase brightness
//////     f3: Mission Control
//////     f4: Launchpad
//////     f5: Dictation
//////     f7: Rewind
//////     f8: Play/Pause
//////     f9: Fast Forward
//////     f10: Mute
//////     f11: Volume Down
//////     f12: Volume Up
////
////   OTHER KEYS:
////
//////     slash: Houdah
//////     tab: Mission Control
//////     fn: Dictation via Spokenly
//////     application: Reflow pinned app (tap), Pin app (hold)
//
//====================================================================
// CONFIG OPTIONS:
//
// triggerKey: {
//   description:     string;
//   alone?:          ActionConfig[]; // Action(s) to fire on tap
//   hold:            ActionConfig[]; // Action(s) to fire on hold (after timeout)
//   timeoutMs?:      number; // Time to wait for a hold before firing alone action
//   thresholdMs?:    number; // Minimum hold time to fire hold action instead of alone action
// }
//
// ACTION OPTIONS:
//        { type: "key"; key: string; modifiers?: string[]; options?: { repeat?: boolean; halt?: boolean } } |
//        { type: "url"; url: string; background?: boolean } | { type: "shell"; command: string } |
//        { type: "app"; ref: string; mode?: "frontmost" | "shell" } |
//        { type: "raycast"; ref: string } |
//        { type: "actHere"; action: string } |
//        { type: "cleanShot"; ref: string } |
//        { type: "osascript"; scriptPath: string }

export const singleKeyTapHoldMappings: Record<string, TapHoldConfig> = {
  a: {
    description: "Raycast AI-quick search",
    hold: [
      {
        type: "key",
        key: "f18",
        modifiers: ["vmCOC_"],
        options: { repeat: false },
      },
    ],
  },
  c: {
    description: "Calendar",
    hold: [
      {
        type: "key",
        key: "7",
        modifiers: ["vmCO_S"],
        options: { repeat: false },
      },
    ],
  },
  d: {
    description: "Add to Droppy",
    hold: [
      {
        type: "key",
        key: "f1",
        modifiers: ["vmCO_S"],
        options: { repeat: false },
      },
    ],
  },
  f: {
    description: "QSSpace",
    hold: [{ type: "actHere", action: "qspace" }],
  },
  g: {
    description: "Claude",
    hold: [{ type: "app", ref: "claude", mode: "shell" }],
  },
  h: {
    description: "Here2There",
    hold: [{ type: "raycast", ref: "hereToThereActiveToTarget" }],
  },
  j: {
    description: "Last d/l",
    hold: [{ type: "raycast", ref: "recentDownloads" }],
  },
  k: { description: "Kitty", hold: [{ type: "app", ref: "kitty" }] },
  n: {
    description: "New note",
    hold: [
      {
        type: "url",
        url: "sidenotes://add-note-with-text/DATE%3A%20%0ACLIENT%3A%20%0ATOPIC%3A%20%0A%0A",
        background: true,
      },
    ],
  },
  o: {
    description: "OCR",
    hold: [{ type: "cleanShot", ref: "captureTextNoLinebreaks" }],
  },
  p: {
    description: "Popclip",
    hold: [
      {
        type: "key",
        key: "f9",
        modifiers: ["vmCOCS"],
        options: { repeat: false },
      },
    ],
  },
  q: {
    description: "Launch Qspace",
    hold: [
      {
        type: "app",
        ref: "qspace",
        mode: "focus",
      },
    ],
  },

  r: {
    description: "Last d/l",
    hold: [
      {
        type: "shell",
        command: recentDownloadsCommand(),
      },
    ],
  },
  s: {
    description: "Screenshot",
    hold: [{ type: "cleanShot", ref: "captureArea" }],
  },
  "shift+s": {
    description: "Screenshot Window",
    hold: [{ type: "cleanShot", ref: "captureWindow" }],
  },
  t: {
    description: "Kitty quick terminal",
    hold: [
      {
        type: "key",
        key: "f11",
        modifiers: ["vm_OCS"],
        options: { repeat: false },
      },
    ],
  },
  v: {
    description: "Clipboard manager",
    hold: [
      {
        type: "key",
        key: "v",
        modifiers: ["left_option"],
        options: { halt: true, repeat: false },
      },
    ],
  },
  x: {
    description: "Copy file",
    hold: [{ type: "actHere", action: "copy" }],
  },
  y: {
    description: "Yank file",
    hold: [{ type: "actHere", action: "copy" }],
  },
  z: {
    description: "Zoxide",
    hold: [{ type: "raycast", ref: "zoxideSearchDirectories" }],
  },
  8: {
    description: "RingCentral",
    hold: [{ type: "app", ref: "ringCentral", mode: "shell" }],
  },
  keypad_0: {
    description: "Unstash all via rectangle",
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("unstash-all"),
        background: true,
      },
    ],
  },
  keypad_2: {
    description: "Stash down via rectangle",
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("stash-down"),
        background: true,
      },
    ],
  },
  keypad_4: {
    description: "Stash left via rectangle",
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("stash-left"),
        background: true,
      },
    ],
  },
  keypad_5: {
    description: "Unstash via rectangle",
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("unstash"),
        background: true,
      },
    ],
  },
  keypad_6: {
    description: "Stash right via rectangle",
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("stash-right"),
        background: true,
      },
    ],
  },
  keypad_8: {
    description: "Stash up via rectangle",
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("stash-up"),
        background: true,
      },
    ],
  },
  f1: {
    description: "Decrease brightness",
    hold: [
      {
        type: "key",
        key: "display_brightness_decrement",
        options: { repeat: true },
      },
    ],
  },
  f2: {
    description: "Increase brightness",
    hold: [
      {
        type: "key",
        key: "display_brightness_increment",
        options: { repeat: true },
      },
    ],
  },
  f3: {
    description: "Mission Control",
    hold: [{ type: "key", key: "mission_control", options: { repeat: false } }],
  },
  f4: {
    description: "Launchpad",
    hold: [{ type: "key", key: "launchpad", options: { repeat: false } }],
  },
  f5: {
    description: "Dictation",
    hold: [
      {
        type: "key",
        key: "f5",
        modifiers: ["vmCOC_"],
        options: { repeat: false },
      },
    ],
  },
  f7: {
    description: "Rewind",
    hold: [{ type: "key", key: "rewind", options: { repeat: true } }],
  },
  f8: {
    description: "Play/Pause",
    hold: [{ type: "key", key: "play_or_pause", options: { repeat: false } }],
  },
  f9: {
    description: "Fast Forward",
    hold: [{ type: "key", key: "fastforward", options: { repeat: true } }],
  },
  f10: {
    description: "Mute",
    hold: [{ type: "key", key: "mute", options: { repeat: false } }],
  },
  f11: {
    description: "Volume Down",
    hold: [{ type: "key", key: "volume_decrement", options: { repeat: true } }],
  },
  f12: {
    description: "Volume Up",
    hold: [{ type: "key", key: "volume_increment", options: { repeat: true } }],
  },
  slash: {
    description: "Houdah",
    hold: [
      {
        type: "key",
        key: "h",
        modifiers: ["vmCOCS"],
        options: { repeat: false },
      },
    ],
  },
  grave_accent_and_tilde: {
    description: "Popclip",
    hold: [
      {
        type: "key",
        key: "f9",
        modifiers: ["vmCOCS"],
        options: { halt: true, repeat: false },
      },
    ],
  },
  tab: {
    description: "Mission Control",
    hold: [
      {
        type: "key",
        key: "mission_control",
        options: { halt: true, repeat: true },
      },
    ],
  },
  fn: {
    description: "Dictation via Spokenly",
    hold: [
      {
        type: "key",
        key: "f5",
        modifiers: ["vmCOC_"],
        options: { repeat: false },
      },
    ],
  },
};
