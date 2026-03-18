import { toKey } from "karabiner.ts";
import type { TapHoldConfig } from "../generators/tap-hold-rules";
import { HYPER, MEH, SUPER } from "../lib/mods";
import {
    applescript,
    cleanShotCommand,
    cmd,
    openAppBundleCommand,
    raycastExtensionCommand,
    takeActionHereCommand,
} from "../lib/scripts";
import { openApp } from "../lib/software";

export const tapHoldKeys: Record<string, TapHoldConfig> = {
  a:      { description: "Antinote", hold: [cmd("open -u 'antinote://x-callback-url/hotkey'")],},
  c:      { description: "Calendar", hold: [toKey("7", MEH, { repeat: false })],},
  f:      { description: "Bloom", hold: [cmd(takeActionHereCommand("bloom"))],},
  g:      { description: "Claude", hold: [cmd(openAppBundleCommand("com.anthropic.claudefordesktop"))],},
  h:      { description: "Here2There", hold: [cmd(raycastExtensionCommand("Jason/here-to-there/activeToTarget"))],},
  j:      { description: "Last d/l", hold: [cmd(raycastExtensionCommand("jason/recents/recentDownloads"))],},
  k:      { description: "Kitty", hold: [openApp({ bundleIdentifier: "net.kovidgoyal.kitty" })],},
  m:      { description: "Deminimize", hold: [toKey("m", HYPER, { repeat: false })],},
  o:      { description: "OCR", hold: [cmd(cleanShotCommand("capture-text?linebreaks=false"))],},
  p:      { description: "Popclip", hold: [toKey("f9", SUPER, { repeat: false })],},
  q:      { description: "QSpace Pro", hold: [cmd(takeActionHereCommand("qspace"))],},
  r:      { description: "Last d/l", hold: [cmd("/Users/jason/Scripts/Metascripts/recent_dl.sh")],},
  s:      { description: "Screenshot", hold: [cmd(cleanShotCommand("capture-area"))],},
  t:      { description: "Todoist",hold: [cmd(openAppBundleCommand("com.todoist.mac.Todoist"))],},
  v:      { description: "Maccy", hold: [ toKey("grave_accent_and_tilde", ["control"], { halt: true, repeat: false,}), ],},
  x:      { description: "Copy file", hold: [cmd(takeActionHereCommand("copy"))], },
  y:      { description: "Yank file", hold: [cmd(takeActionHereCommand("copy"))], },
  z:      { description: "Zoxide", hold: [ cmd( raycastExtensionCommand("mrpunkin/raycast-zoxide/search-directories"), ), ],},
  "8":    { description: "RingCentral", hold: [cmd(openAppBundleCommand("com.ringcentral.glip"))], },
  f1:     { description: "Brightness rightness", hold: [toKey("display_brightness_decrement", [], { repeat: true })],},
  f2:     { description: "Increase brightness", hold: [toKey("display_brightness_increment", [], { repeat: true })],},
  f3:     { description: "Mission Control", hold: [toKey("mission_control", [], { repeat: false })],},
  f4:     { description: "Launchpad", hold: [toKey("launchpad", [], { repeat: false })],},
  f5:     { description: "Dictation", hold: [toKey("f5", ["command", "option", "control"], { repeat: false })],},
  f7:     { description: "Rewind", hold: [toKey("rewind", [], { repeat: true })] },
  f8:     { description: "Play/Pause", hold: [toKey("play_or_pause", [], { repeat: false })] },
  f9:     { description: "Fast Forward", hold: [toKey("fastforward", [], { repeat: true })],},
  f10:    { description: "Mute", hold: [toKey("mute", [], { repeat: false })] },
  f11:    { description: "Volume Down", hold: [toKey("volume_decrement", [], { repeat: true })],},
  f12:    { description: "Volume Up", hold: [toKey("volume_increment", [], { repeat: true })],},
  slash:  { description: "Houdah", hold: [toKey("h", SUPER, { repeat: false })] },
  tab:    { description: "Mission Control", hold: [toKey("mission_control", [], { halt: true, repeat: true })],},
  "left_command+p": { description: "Paletro", hold: [toKey("p", HYPER, { repeat: false })],},
  "right_option+k": { description: "Kitty here", hold: [cmd(takeActionHereCommand("kitty"))], timeoutMs: 300, thresholdMs: 300,},
  "right_option+s": {
    description:    "Spotify toggle (tap), search (hold)",
    alone:          [ cmd(`if pgrep -x 'Spotify' > /dev/null; then ${raycastExtensionCommand("mattisssa/spotify-player/togglePlayPause")}; else ${openAppBundleCommand("com.spotify.client")}; fi; echo 'Spotify toggled'`),],
    hold:           [ cmd(raycastExtensionCommand("mattisssa/spotify-player/search"))],
    timeoutMs:      400,
    thresholdMs:    400,
  },
  "right_option+t": {
      description: "Edit last Typinator expansion",
      hold: [
          applescript(
              "/Users/jason/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion.scpt",
            ),
        ],
        timeoutMs: 300,
        thresholdMs: 300,
    },
};
