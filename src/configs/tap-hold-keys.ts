import { toKey } from "karabiner.ts";
import type { TapHoldConfig } from "../generators/tap-hold-rules";
import { HYPER, MEH, SUPER } from "../lib/mods";
import { cmd } from "../lib/scripts";
import { openApp } from "../lib/software";

export const tapHoldKeys: Record<string, TapHoldConfig> = {
  a: {
    description: "Antinote",
    hold: [
      cmd(
        "open -u 'antinote://x-callback-url/hotkey' && echo 'Antinote launched'",
      ),
    ],
  },
  b: {
    description: "Search menu apps / Skim note",
    hold: [toKey("b", SUPER, { repeat: false })],
  },
  c: { description: "Calendar", hold: [toKey("7", MEH, { repeat: false })] },
  f: {
    description: "Bloom",
    hold: [
      cmd(
        "/Users/jason/Scripts/Metascripts/take_action_here/take_action_here.sh --action bloom",
      ),
    ],
  },
  g: {
    description: "Claudé for Desktop",
    hold: [
      cmd(
        "/Users/jason/.local/bin/open-app -b 'com.anthropic.claudefordesktop'",
      ),
    ],
  },
  h: {
    description: "Here",
    hold: [
      cmd("open 'raycast://extensions/Jason/here-to-there/activeToTarget'"),
    ],
  },
  j: {
    description: "Recent download",
    hold: [cmd("open 'raycast://extensions/jason/recents/recentDownloads'")],
  },
  k: {
    description: "Kitty",
    hold: [openApp({ bundleIdentifier: "net.kovidgoyal.kitty" })],
  },
  "right_option+k": {
    description: "Kitty here",
    hold: [
      cmd(
        "/Users/jason/Scripts/Metascripts/take_action_here/take_action_here.sh --action kitty",
      ),
    ],
    timeoutMs: 300,
    thresholdMs: 300,
  },
  m: {
    description: "Deminimize",
    hold: [toKey("m", HYPER, { repeat: false })],
  },
  o: {
    description: "OCR",
    hold: [cmd('open "cleanshot://capture-text?linebreaks=false"')],
  },
  p: { description: "Popclip", hold: [toKey("f9", SUPER, { repeat: false })] },
  "left_command+p": {
    description: "Paletro",
    hold: [toKey("p", HYPER, { repeat: false })],
  },
  q: {
    description: "QSpace Pro",
    hold: [
      cmd(
        "/Users/jason/Scripts/Metascripts/take_action_here/take_action_here.sh --action qspace",
      ),
    ],
  },
  r: {
    description: "Last d/l",
    hold: [cmd("/Users/jason/Scripts/Metascripts/recent_dl.sh")],
  },
  s: {
    description: "Screenshot",
    hold: [cmd('open "cleanshot://capture-area"')],
  },
  "right_option+s": {
    description: "Spotify toggle (tap), search (hold)",
    alone: [
      cmd(
        "if pgrep -x 'Spotify' > /dev/null; then open 'raycast://extensions/mattisssa/spotify-player/togglePlayPause'; else /Users/jason/.local/bin/open-app -b 'com.spotify.client'; fi; echo 'Spotify toggled'",
      ),
    ],
    hold: [cmd("open 'raycast://extensions/mattisssa/spotify-player/search'")],
    timeoutMs: 400,
    thresholdMs: 400,
  },
  t: {
    description: "Todoist",
    hold: [
      cmd("/Users/jason/.local/bin/open-app -b 'com.todoist.mac.Todoist'"),
    ],
  },
  "right_option+t": {
    description: "Edit last Typinator expansion",
    hold: [
      cmd(
        "/usr/bin/osascript /Users/jason/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion.scpt",
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
  },
  w: {
    description: "Writing Tools",
    hold: [toKey("w", ["command", "shift"], { repeat: false })],
  },
  x: {
    description: "Copy file",
    hold: [
      cmd(
        "/Users/jason/Scripts/Metascripts/take_action_here/take_action_here.sh --action copy",
      ),
    ],
  },
  y: {
    description: "Yank file",
    hold: [
      cmd(
        "/Users/jason/Scripts/Metascripts/take_action_here/take_action_here.sh --action copy",
      ),
    ],
  },
  z: {
    description: "Zoxide search via Raycast",
    hold: [
      cmd(
        "open 'raycast://extensions/mrpunkin/raycast-zoxide/search-directories'",
      ),
    ],
  },
  "8": {
    description: "RingCentral",
    hold: [cmd("/Users/jason/.local/bin/open-app -b 'com.ringcentral.glip'")],
  },
  f1: {
    description: "Decrease brightness",
    hold: [toKey("display_brightness_decrement", [], { repeat: true })],
  },
  f2: {
    description: "Increase brightness",
    hold: [toKey("display_brightness_increment", [], { repeat: true })],
  },
  f3: {
    description: "Mission Control",
    hold: [toKey("mission_control", [], { repeat: false })],
  },
  f4: {
    description: "Launchpad",
    hold: [toKey("launchpad", [], { repeat: false })],
  },
  f5: {
    description: "Dictation",
    hold: [toKey("f5", ["command", "option", "control"], { repeat: false })],
  },
  f7: { description: "Rewind", hold: [toKey("rewind", [], { repeat: true })] },
  f8: {
    description: "Play/Pause",
    hold: [toKey("play_or_pause", [], { repeat: false })],
  },
  f9: {
    description: "Fast Forward",
    hold: [toKey("fastforward", [], { repeat: true })],
  },
  f10: { description: "Mute", hold: [toKey("mute", [], { repeat: false })] },
  f11: {
    description: "Volume Down",
    hold: [toKey("volume_decrement", [], { repeat: true })],
  },
  f12: {
    description: "Volume Up",
    hold: [toKey("volume_increment", [], { repeat: true })],
  },
  slash: {
    description: "Houdah",
    hold: [toKey("h", SUPER, { repeat: false })],
  },
  tab: {
    description: "Mission Control",
    hold: [toKey("mission_control", [], { halt: true, repeat: true })],
  },
};
