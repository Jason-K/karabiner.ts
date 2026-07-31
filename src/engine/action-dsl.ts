import type { ToEvent } from "karabiner.ts";
import type { AppRef } from "../data/registry-app-ids";
import type { CommandRef } from "../data/registry-cmds";
import type { ModComboAlias, ModKey } from "../data/settings-keys";
import type { PathRef } from "../data/registry-paths";
import type { MapRef, VarSpec } from "../data/refs";
import type { UrlRef } from "../data/registry-urls";

/** Ref accepted by the "app" action: a typed AppRef (bundle ID), a typed
 * PathRef (file path to .app), or a raw string (bundle ID or /path/to/Foo.app). */
export type AppTarget = AppRef | PathRef | string;

export type ActionKeyModifier = ModKey | ModComboAlias;

export type ActionSpec =
  | {
    type: "actHere";
    action: string;
  }
  | {
    type: "app";
    ref: AppTarget;
    mode?: "open" | "shell";
    actionDesc?: string;
  }
  | {
    type: "appHistory";
    index: number;
  }
  | {
    type: "button";
    button: string;
    modifiers?: ActionKeyModifier[];
    options?: {
      repeat?: boolean;
      halt?: boolean;
      lazy?: boolean;
    };
    actionDesc?: string;
  }
  | {
    type: "caseChange";
    operation: "lowercase" | "sentence_case" | "title_case" | "uppercase";
  }
  | { type: "command"; ref: CommandRef; actionDesc?: string; }
  | { type: "copy"; }
  | { type: "cut"; }
  | {
    type: "map";
    ref: MapRef;
    options?: {
      repeat?: boolean;
      halt?: boolean;
      lazy?: boolean;
    };
    actionDesc?: string;
  }
  | { type: "folder"; ref: PathRef; actionDesc?: string; }
  | {
    type: "key";
    key: string;
    modifiers?: ActionKeyModifier[];
    options?: {
      repeat?: boolean;
      halt?: boolean;
      lazy?: boolean;
    };
    actionDesc?: string;
  }
  | { type: "noop" }
  | {
    type: "osascript";
    scriptPath: string;
    args?: string[];
    actionDesc?: string;
  }
  | { type: "paste"; }
  | {
    type: "python";
    scriptPath: string;
    venv?: string;
    args?: string[];
    actionDesc?: string;
  }
  | {
    type: "setVar";
    var: VarSpec;
    value?: number | string | boolean;
    toggle?: boolean;
  }
  | {
    type: "sequence";
    actions: ActionSpec[];
  }
  // Accepts an arbitrary shell string OR a CommandRef. A CommandRef auto-resolves
  // .name for the event and describes via .refDesc, so registry commands need no
  // manual `description` (paralleling how `url` accepts `UrlRef | string`).
  | {
    type: "shell";
    command: string | CommandRef;
    actionDesc?: string;
  }
  | {
    type: "wrapString";
    operation:
    | "wrap_braces"
    | "wrap_parentheses"
    | "wrap_quotes"
    | "wrap_brackets";
    delaySeconds?: number;
  }
  | {
    type: "url";
    url: UrlRef | string;
    background?: boolean;
    actionDesc?: string;
  };

/**
 * A case `do` entry: either a typed {@link ActionSpec} or a raw Karabiner
 * `ToEvent` passed through verbatim (mouse mappings author heterogeneous
 * events — pointing_button, shell_command, set_variable, from_event — that have
 * no natural ActionSpec representation). Raw ToEvents are resolved as-is and
 * described by shape.
 */
export type Action = ActionSpec | ToEvent;
