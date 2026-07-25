import type { ToEvent } from "karabiner.ts";
import type { AppRef } from "../data/apps";
import type { CommandRef } from "../data/commands";
import type { FolderRef } from "../data/folders";
import type { ModComboAlias, ModKey } from "../data/key-aliases";
import type { VarSpec } from "../data/refs";
import type { UrlRef } from "../data/urls";

export type ActionKeyModifier = ModKey | ModComboAlias;

export type ActionSpec =
  | {
      type: "app";
      ref: AppRef;
      mode?: "open" | "focus" | "shell";
      actionDesc?: string;
    }
  | {
      type: "appHistory";
      index: number;
    }
  | {
      type: "folder";
      ref: FolderRef;
      actionDesc?: string;
    }
  | {
      type: "actHere";
      action: string;
    }
  | {
      type: "caseChange";
      operation: "lowercase" | "sentence_case" | "title_case" | "uppercase";
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
      type: "url";
      url: UrlRef | string;
      background?: boolean;
      actionDesc?: string;
    }
  | {
      type: "command";
      ref: CommandRef;
      actionDesc?: string;
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
      type: "python";
      scriptPath: string;
      venv?: string;
      args?: string[];
      actionDesc?: string;
    }
  | {
      type: "osascript";
      scriptPath: string;
      args?: string[];
      actionDesc?: string;
    }
  | {
      type: "cut" | "copy" | "paste";
    }
  | { type: "noop" }
  | {
      type: "setVar";
      var: VarSpec;
      value?: number | string | boolean;
      toggle?: boolean;
    }
  | {
      type: "sequence";
      actions: ActionSpec[];
    };

/**
 * A case `do` entry: either a typed {@link ActionSpec} or a raw Karabiner
 * `ToEvent` passed through verbatim (mouse mappings author heterogeneous
 * events — pointing_button, shell_command, set_variable, from_event — that have
 * no natural ActionSpec representation). Raw ToEvents are resolved as-is and
 * described by shape.
 */
export type Action = ActionSpec | ToEvent;
