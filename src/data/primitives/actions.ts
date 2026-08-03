import type { ToEvent } from "../../types/karabiner";
import type { AppSpec } from "./apps";
import type { CommandSpec } from "./commands";
import type { MapSpec } from "./maps";
import type { PathSpec } from "./paths";
import type { UrlSpec } from "./urls";
import type { VarSpec } from "./vars";
import type { ModComboAlias, ModKey } from "../constants/keys";

/**
 * Target reference accepted by application actions (`app`).
 * Accepts a typed {@link AppSpec}, a typed {@link PathSpec}, or a raw bundle ID / application file path string.
 */
export type AppTarget = AppSpec | PathSpec | string;

/** Valid modifier key specifier for actions: individual modifier or virtual modifier alias (`"CO__"`, `"COCS"`). */
export type ActionKeyModifier = ModKey | ModComboAlias;

/**
 * High-level action specifications evaluated by the synthesizer into Karabiner `to` events.
 */
export type ActionSpec =
  | {
      /** Execute a named action in context. */
      type: "actHere";
      action: string;
    }
  | {
      /** Launch or focus an application bundle. */
      type: "app";
      ref: AppTarget;
      mode?: "open" | "shell";
      actionDesc?: string;
    }
  | {
      /** Switch application history state by relative index. */
      type: "appHistory";
      index: number;
    }
  | {
      /** Emit a mouse button click. */
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
      /** Apply text case transformation operation on active text selection. */
      type: "caseChange";
      operation: "lowercase" | "sentence_case" | "title_case" | "uppercase";
    }
  | {
      /** Execute a CLI command from registry. */
      type: "command";
      ref: CommandSpec;
      actionDesc?: string;
    }
  | {
      /** Copy active selection to clipboard (`Cmd+C`). */
      type: "copy";
    }
  | {
      /** Cut active selection to clipboard (`Cmd+X`). */
      type: "cut";
    }
  | {
      /** Emit a hotkey map specification. */
      type: "map";
      ref: MapSpec;
      options?: {
        repeat?: boolean;
        halt?: boolean;
        lazy?: boolean;
      };
      actionDesc?: string;
    }
  | {
      /** Open a folder path in Finder. */
      type: "folder";
      ref: PathSpec;
      actionDesc?: string;
    }
  | {
      /** Emit a single key press with optional modifiers and options. */
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
  | {
      /** No-operation (swallows key event without emitting output). */
      type: "noop";
    }
  | {
      /** Execute an AppleScript script file. */
      type: "osascript";
      scriptPath: string;
      args?: string[];
      actionDesc?: string;
    }
  | {
      /** Paste clipboard contents (`Cmd+V`). */
      type: "paste";
    }
  | {
      /** Execute a Python script inside a virtual environment or with arguments. */
      type: "python";
      scriptPath: string;
      venv?: string;
      args?: string[];
      actionDesc?: string;
    }
  | {
      /** Mutate a Karabiner state variable. */
      type: "setVar";
      var: VarSpec;
      value?: number | string | boolean;
      toggle?: boolean;
    }
  | {
      /** Execute a sequential series of actions in order. */
      type: "sequence";
      actions: ActionSpec[];
    }
  | {
      /** Execute a raw shell command string or command primitive. */
      type: "shell";
      command: string | CommandSpec;
      actionDesc?: string;
    }
  | {
      /** Wrap selected text string in delimiter characters (quotes, braces, etc.). */
      type: "wrapString";
      operation:
        | "wrap_braces"
        | "wrap_parentheses"
        | "wrap_quotes"
        | "wrap_brackets";
      delaySeconds?: number;
    }
  | {
      /** Open a URL or custom URI scheme. */
      type: "url";
      url: UrlSpec | string;
      background?: boolean;
      actionDesc?: string;
    };

/** Union of high-level ActionSpec and native Karabiner ToEvent objects. */
export type Action = ActionSpec | ToEvent;
