import type { TapHoldConfig } from "../generators/tap-hold-rules";
import {
  rectangleActionByFocusedWindowOrientationCommand,
  rectangleActionUrl,
  rectangleMaxOrRestoreCommand,
} from "./rectangle";

const RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("left-half", "top-half");

const RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("right-half", "bottom-half");

const RECTANGLE_FILL_LEFT_OR_TOP_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-left", "top-half");

const RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION =
  rectangleActionByFocusedWindowOrientationCommand("fill-right", "bottom-half");

export const tapHoldMappings: Record<string, TapHoldConfig> = {
  a: {
    description: "Raycast AI-quick search",
    hold: [
      {
        type: "key",
        key: "f18",
        modifiers: ["command", "option", "control"],
        options: { repeat: false },
      },
    ],
  },
  "hyper+a": {
    description: "Raycast AI-chat",
    hold: [
      {
        type: "key",
        key: "f18",
        modifiers: ["command", "option", "control", "shift"],
        options: { repeat: false },
      },
    ],
  },
  "shift+a": {
    description: "Antinote",
    hold: [{ type: "url", url: "antinote://", background: true }],
  },
  c: {
    description: "Calendar",
    hold: [
      {
        type: "key",
        key: "7",
        modifiers: ["command", "option", "shift"],
        options: { repeat: false },
      },
    ],
  },
  f: {
    description: "Bloom",
    hold: [{ type: "takeActionHere", action: "bloom" }],
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
  "cmd+m": {
    description: "Deminimize",
    hold: [
      {
        type: "key",
        key: "m",
        modifiers: ["option", "control"],
        options: { repeat: false },
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
        modifiers: ["command", "option", "control", "shift"],
        options: { repeat: false },
      },
    ],
  },
  "hyper+q": {
    description: "Rectangle Pro left",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("left-half"),
        background: true,
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("fill-left"),
        background: true,
      },
    ],
  },
  "hyper+left_arrow": {
    description: "Rectangle fill-left / previous-display",
    alone: [
      {
        type: "shell",
        command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION,
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("previous-display"),
        background: true,
      },
    ],
  },
  "hyper+right_arrow": {
    description: "Rectangle fill-right / next-display",
    alone: [
      {
        type: "shell",
        command: RECTANGLE_FILL_RIGHT_OR_BOTTOM_HALF_BY_ORIENTATION,
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("next-display"),
        background: true,
      },
    ],
  },
  "hyper+spacebar": {
    description: "Rectangle maximize / restore",
    alone: [{ type: "shell", command: rectangleMaxOrRestoreCommand() }],
  },
  "hyper+tab": {
    description: "Rectangle next-display / previous-display",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("next-display"),
        background: true,
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("previous-display"),
        background: true,
      },
    ],
  },
  "hyper+1": {
    description: "Rectangle left-half/top-half by orientation",
    alone: [{ type: "shell", command: RECTANGLE_LEFT_OR_TOP_BY_ORIENTATION }],
  },
  "hyper+2": {
    description: "Rectangle right-half/bottom-half by orientation",
    alone: [
      { type: "shell", command: RECTANGLE_RIGHT_OR_BOTTOM_BY_ORIENTATION },
    ],
  },
  "hyper+3": {
    description: "Rectangle first-third",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("first-third"),
        background: true,
      },
    ],
  },
  "hyper+4": {
    description: "Rectangle first-fourth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("first-fourth"),
        background: true,
      },
    ],
  },
  "hyper+keypad_1": {
    description: "Rectangle bottom-left-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-left-eighth"),
        background: true,
      },
    ],
  },
  "hyper+keypad_3": {
    description: "Rectangle bottom-right-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("bottom-right-eighth"),
        background: true,
      },
    ],
  },
  "hyper+keypad_5": {
    description: "Rectangle maximize",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("maximize"),
        background: true,
      },
    ],
  },
  "hyper+keypad_7": {
    description: "Rectangle top-left-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-left-eighth"),
        background: true,
      },
    ],
  },
  "hyper+keypad_9": {
    description: "Rectangle top-right-eighth",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("top-right-eighth"),
        background: true,
      },
    ],
  },
  r: {
    description: "Last d/l",
    hold: [
      {
        type: "shell",
        command: "/Users/jason/Scripts/filesystem/recent_changes/recent_dl.sh",
      },
    ],
  },
  s: {
    description: "Screenshot",
    hold: [{ type: "cleanShot", ref: "captureArea" }],
  },
  t: {
    description: "Todoist",
    hold: [{ type: "app", ref: "todoist", mode: "shell" }],
  },
  v: {
    description: "Maccy",
    hold: [
      {
        type: "key",
        key: "grave_accent_and_tilde",
        modifiers: ["control"],
        options: { halt: true, repeat: false },
      },
    ],
  },
  "hyper+w": {
    description: "Rectangle Pro right",
    alone: [
      {
        type: "url",
        url: rectangleActionUrl("right-half"),
        background: true,
      },
    ],
    hold: [
      {
        type: "url",
        url: rectangleActionUrl("fill-right"),
        background: true,
      },
    ],
  },
  x: {
    description: "Copy file",
    hold: [{ type: "takeActionHere", action: "copy" }],
  },
  y: {
    description: "Yank file",
    hold: [{ type: "takeActionHere", action: "copy" }],
  },
  z: {
    description: "Zoxide",
    hold: [{ type: "raycast", ref: "zoxideSearchDirectories" }],
  },
  "8": {
    description: "RingCentral",
    hold: [{ type: "app", ref: "ringCentral", mode: "shell" }],
  },
  f1: {
    description: "Brightness rightness",
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
        modifiers: ["command", "option", "control"],
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
        modifiers: ["command", "option", "control", "shift"],
        options: { repeat: false },
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
        modifiers: ["left_command", "left_option", "left_control"],
        options: { repeat: false },
      },
    ],
  },
  "left_command+p": {
    description: "Paletro",
    hold: [
      {
        type: "key",
        key: "p",
        modifiers: ["command", "option", "control"],
        options: { repeat: false },
      },
    ],
  },
  "right_option+k": {
    description: "Kitty here",
    hold: [{ type: "takeActionHere", action: "kitty" }],
    timeoutMs: 300,
    thresholdMs: 300,
  },
  "right_option+s": {
    description: "Spotify toggle (tap), search (hold)",
    alone: [
      {
        type: "shell",
        command:
          "if pgrep -x 'Spotify' > /dev/null; then open 'raycast://extensions/mattisssa/spotify-player/togglePlayPause'; else ~/.local/bin/open-app -b 'com.spotify.client'; fi; echo 'Spotify toggled'",
      },
    ],
    hold: [{ type: "raycast", ref: "spotifySearch" }],
    timeoutMs: 400,
    thresholdMs: 400,
  },
  "right_option+t": {
    description: "Edit last Typinator expansion",
    hold: [
      {
        type: "applescript",
        scriptPath:
          "/Users/jason/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion.applescript",
      },
    ],
    timeoutMs: 300,
    thresholdMs: 300,
  },
};
