import { recentDownloadsCommand } from "../core/scripts";
import { appRegistry, raycastRegistry } from "../data";
import { cleanShotRegistry } from "../data/cleanshot";
import { rectangleActionUrl } from "../data/rectangle";
import { holdKey, type Binding } from "../engine";

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
//////     slash: Houdah
//////     tab: Mission Control
//////     fn: Dictation via Spokenly
//////     application: Reflow pinned app (tap), Pin app (hold)

export const singleKeyTapHoldBindings: Binding[] = [
  // NOTE: "8" is kept first to preserve the historical rule order (the old
  // Record hoisted integer-like keys to the front). It has no special meaning.
  holdKey("8", [{ type: "app", ref: appRegistry.ringCentral, mode: "shell" }]),
  holdKey("a", [
    { type: "key", key: "f18", modifiers: ["vmCOC_"], options: { repeat: false } },
  ]),
  holdKey("c", [
    { type: "key", key: "7", modifiers: ["vmCO_S"], options: { repeat: false } },
  ]),
  holdKey("d", [
    { type: "key", key: "f1", modifiers: ["vmCO_S"], options: { repeat: false } },
  ]),
  holdKey("f", [{ type: "actHere", action: "qspace" }]),
  holdKey("g", [{ type: "app", ref: appRegistry.claude, mode: "shell" }]),
  holdKey("h", [{ type: "raycast", ref: raycastRegistry.hereToThereActiveToTarget }]),
  holdKey("j", [{ type: "raycast", ref: raycastRegistry.recentDownloads }]),
  holdKey("k", [{ type: "app", ref: appRegistry.kitty }]),
  holdKey("n", [
    {
      type: "url",
      url: "sidenotes://add-note-with-text/DATE%3A%20%0ACLIENT%3A%20%0ATOPIC%3A%20%0A%0A",
      background: true,
    },
  ]),
  holdKey("o", [{ type: "cleanShot", ref: cleanShotRegistry.captureTextNoLinebreaks }]),
  holdKey("p", [
    { type: "key", key: "f9", modifiers: ["vmCOCS"], options: { repeat: false } },
  ]),
  holdKey("q", [{ type: "app", ref: appRegistry.qspace, mode: "focus" }]),
  holdKey("r", [{ type: "shell", command: recentDownloadsCommand() }]),
  holdKey("s", [{ type: "cleanShot", ref: cleanShotRegistry.captureArea }]),
  holdKey(
    "s",
    [{ type: "cleanShot", ref: cleanShotRegistry.captureWindow }],
    { modifiers: ["shift"] },
  ),
  holdKey("t", [
    { type: "key", key: "f11", modifiers: ["vm_OCS"], options: { repeat: false } },
  ]),
  holdKey("v", [{ type: "raycast", ref: raycastRegistry.clipboardHistory }]),
  holdKey("x", [{ type: "actHere", action: "copy" }]),
  holdKey("y", [{ type: "actHere", action: "copy" }]),
  holdKey("z", [{ type: "raycast", ref: raycastRegistry.zoxideSearchDirectories }]),
  holdKey("keypad_0", [
    { type: "url", url: rectangleActionUrl("unstash-all"), background: true },
  ]),
  holdKey("keypad_2", [
    { type: "url", url: rectangleActionUrl("stash-down"), background: true },
  ]),
  holdKey("keypad_4", [
    { type: "url", url: rectangleActionUrl("stash-left"), background: true },
  ]),
  holdKey("keypad_5", [
    { type: "url", url: rectangleActionUrl("unstash"), background: true },
  ]),
  holdKey("keypad_6", [
    { type: "url", url: rectangleActionUrl("stash-right"), background: true },
  ]),
  holdKey("keypad_8", [
    { type: "url", url: rectangleActionUrl("stash-up"), background: true },
  ]),
  holdKey("f1", [{ type: "key", key: "display_brightness_decrement", options: { repeat: true } }]),
  holdKey("f2", [{ type: "key", key: "display_brightness_increment", options: { repeat: true } }]),
  holdKey("f3", [{ type: "key", key: "mission_control", options: { repeat: false } }]),
  holdKey("f4", [{ type: "key", key: "launchpad", options: { repeat: false } }]),
  holdKey("f5", [
    { type: "key", key: "f5", modifiers: ["vmCOC_"], options: { repeat: false } },
  ]),
  holdKey("f7", [{ type: "key", key: "rewind", options: { repeat: true } }]),
  holdKey("f8", [{ type: "key", key: "play_or_pause", options: { repeat: false } }]),
  holdKey("f9", [{ type: "key", key: "fastforward", options: { repeat: true } }]),
  holdKey("f10", [{ type: "key", key: "mute", options: { repeat: false } }]),
  holdKey("f11", [{ type: "key", key: "volume_decrement", options: { repeat: true } }]),
  holdKey("f12", [{ type: "key", key: "volume_increment", options: { repeat: true } }]),
  holdKey("slash", [
    { type: "key", key: "h", modifiers: ["vmCOCS"], options: { repeat: false } },
  ]),
  holdKey("grave_accent_and_tilde", [
    { type: "key", key: "f9", modifiers: ["vmCOCS"], options: { halt: true, repeat: false } },
  ]),
  holdKey("tab", [
    { type: "key", key: "mission_control", options: { halt: true, repeat: true } },
  ]),
  holdKey("fn", [
    { type: "key", key: "f5", modifiers: ["vmCOC_"], options: { repeat: false } },
  ]),
];
