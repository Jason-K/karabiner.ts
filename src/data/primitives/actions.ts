import type { ToEvent } from "karabiner.ts";
import type { AppSpec } from "./apps";
import type { CommandSpec } from "./commands";
import type { MapSpec } from "./maps";
import type { PathSpec } from "./paths";
import type { UrlSpec } from "./urls";
import type { VarSpec } from "./vars";
import type { ModComboAlias, ModKey } from "../constants/keys";

/** Ref accepted by the "app" action: a typed AppSpec (bundle ID/path), a typed
 * PathSpec (file path to .app), or a raw string (bundle ID or /path/to/Foo.app). */
export type AppTarget = AppSpec | PathSpec | string;

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
  | {
    type: "command";
    ref: CommandSpec;
    actionDesc?: string;
  }
  | { type: "copy"; }
  | { type: "cut"; }
  | {
    type: "map";
    ref: MapSpec;
    options?: {
      repeat?: boolean;
      halt?: boolean;
      lazy?: boolean;
    };
    actionDesc?: string;
  }
  | { type: "folder"; ref: PathSpec; actionDesc?: string; }
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
  | {
    type: "shell";
    command: string | CommandSpec;
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
    url: UrlSpec | string;
    background?: boolean;
    actionDesc?: string;
  };

export type Action = ActionSpec | ToEvent;
