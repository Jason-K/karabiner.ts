import { recentDownloadsCommand } from "../core/scripts";
import { appRegistry, raycastRegistry } from "../data";
import { cleanShotRegistry } from "../data/cleanshot";
import { rectangleActionUrl } from "../data/rectangle";
import type { Binding } from "../engine";

//   SINGLE KEY TAP/HOLD RULES — one binding per key; hold fires the action,
//   tap passes the key through (the engine's default-alone behavior).
//
////   LETTERS:
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
//////     8: RingCentral
//////     keypad_0: Unstash all via rectangle
//////     keypad_2: Stash down via rectangle
//////     keypad_4: Stash left via rectangle
//////     keypad_5: Unstash via rectangle
//////     keypad_6: Stash right via rectangle
//////     keypad_8: Stash up via rectangle
////
////   FUNCTION KEYS:
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
//////     slash: Houdah
//////     tab: Mission Control
//////     fn: Dictation via Spokenly

export const singleKeyTapHoldBindings: Binding[] = [
  // "8" is first to preserve historical rule order (the old Record hoisted
  // integer-like keys to the front); no special meaning.
  {
    trigger: { keys: ["8"] },
    cases: [
      { phase: "hold", do: [{ type: "app", ref: appRegistry.ringCentral, mode: "shell" }] },
    ],
  },
  {
    trigger: { keys: ["a"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f18", modifiers: ["vmCOC_"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["c"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "7", modifiers: ["vmCO_S"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["d"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f1", modifiers: ["vmCO_S"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["f"] },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "qspace" }] }],
  },
  {
    trigger: { keys: ["g"] },
    cases: [{ phase: "hold", do: [{ type: "app", ref: appRegistry.claude, mode: "shell" }] }],
  },
  {
    trigger: { keys: ["h"] },
    cases: [
      { phase: "hold", do: [{ type: "raycast", ref: raycastRegistry.hereToThereActiveToTarget }] },
    ],
  },
  {
    trigger: { keys: ["j"] },
    cases: [{ phase: "hold", do: [{ type: "raycast", ref: raycastRegistry.recentDownloads }] }],
  },
  {
    trigger: { keys: ["k"] },
    cases: [{ phase: "hold", do: [{ type: "app", ref: appRegistry.kitty }] }],
  },
  {
    trigger: { keys: ["n"] },
    cases: [
      {
        phase: "hold",
        do: [
          {
            type: "url",
            url: "sidenotes://add-note-with-text/DATE%3A%20%0ACLIENT%3A%20%0ATOPIC%3A%20%0A%0A",
            background: true,
          },
        ],
      },
    ],
  },
  {
    trigger: { keys: ["o"] },
    cases: [
      { phase: "hold", do: [{ type: "cleanShot", ref: cleanShotRegistry.captureTextNoLinebreaks }] },
    ],
  },
  {
    trigger: { keys: ["p"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f9", modifiers: ["vmCOCS"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["q"] },
    cases: [{ phase: "hold", do: [{ type: "app", ref: appRegistry.qspace, mode: "focus" }] }],
  },
  {
    trigger: { keys: ["r"] },
    cases: [{ phase: "hold", do: [{ type: "shell", command: recentDownloadsCommand() }] }],
  },
  {
    trigger: { keys: ["s"] },
    cases: [{ phase: "hold", do: [{ type: "cleanShot", ref: cleanShotRegistry.captureArea }] }],
  },
  {
    trigger: { keys: ["s"], modifiers: ["shift"] },
    cases: [{ phase: "hold", do: [{ type: "cleanShot", ref: cleanShotRegistry.captureWindow }] }],
  },
  {
    trigger: { keys: ["t"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f11", modifiers: ["vm_OCS"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["v"] },
    cases: [{ phase: "hold", do: [{ type: "raycast", ref: raycastRegistry.clipboardHistory }] }],
  },
  {
    trigger: { keys: ["x"] },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "copy" }] }],
  },
  {
    trigger: { keys: ["y"] },
    cases: [{ phase: "hold", do: [{ type: "actHere", action: "copy" }] }],
  },
  {
    trigger: { keys: ["z"] },
    cases: [
      { phase: "hold", do: [{ type: "raycast", ref: raycastRegistry.zoxideSearchDirectories }] },
    ],
  },
  {
    trigger: { keys: ["keypad_0"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: rectangleActionUrl("unstash-all"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_2"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: rectangleActionUrl("stash-down"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_4"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: rectangleActionUrl("stash-left"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_5"] },
    cases: [
      { phase: "hold", do: [{ type: "url", url: rectangleActionUrl("unstash"), background: true }] },
    ],
  },
  {
    trigger: { keys: ["keypad_6"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "url", url: rectangleActionUrl("stash-right"), background: true }],
      },
    ],
  },
  {
    trigger: { keys: ["keypad_8"] },
    cases: [
      { phase: "hold", do: [{ type: "url", url: rectangleActionUrl("stash-up"), background: true }] },
    ],
  },
  {
    trigger: { keys: ["f1"] },
    cases: [
      { phase: "hold", do: [{ type: "key", key: "display_brightness_decrement", options: { repeat: true } }] },
    ],
  },
  {
    trigger: { keys: ["f2"] },
    cases: [
      { phase: "hold", do: [{ type: "key", key: "display_brightness_increment", options: { repeat: true } }] },
    ],
  },
  {
    trigger: { keys: ["f3"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "mission_control", options: { repeat: false } }] }],
  },
  {
    trigger: { keys: ["f4"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "launchpad", options: { repeat: false } }] }],
  },
  {
    trigger: { keys: ["f5"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f5", modifiers: ["vmCOC_"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["f7"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "rewind", options: { repeat: true } }] }],
  },
  {
    trigger: { keys: ["f8"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "play_or_pause", options: { repeat: false } }] }],
  },
  {
    trigger: { keys: ["f9"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "fastforward", options: { repeat: true } }] }],
  },
  {
    trigger: { keys: ["f10"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "mute", options: { repeat: false } }] }],
  },
  {
    trigger: { keys: ["f11"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "volume_decrement", options: { repeat: true } }] }],
  },
  {
    trigger: { keys: ["f12"] },
    cases: [{ phase: "hold", do: [{ type: "key", key: "volume_increment", options: { repeat: true } }] }],
  },
  {
    trigger: { keys: ["slash"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "h", modifiers: ["vmCOCS"], options: { repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["grave_accent_and_tilde"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f9", modifiers: ["vmCOCS"], options: { halt: true, repeat: false } }],
      },
    ],
  },
  {
    trigger: { keys: ["tab"] },
    cases: [
      { phase: "hold", do: [{ type: "key", key: "mission_control", options: { halt: true, repeat: true } }] },
    ],
  },
  {
    trigger: { keys: ["fn"] },
    cases: [
      {
        phase: "hold",
        do: [{ type: "key", key: "f5", modifiers: ["vmCOC_"], options: { repeat: false } }],
      },
    ],
  },
];
