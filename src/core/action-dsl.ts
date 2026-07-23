import type { AppRef } from "../data/apps";
import type { CleanShotRef } from "../data/cleanshot";
import type { CommandRef } from "../data/commands";
import type { FolderRef } from "../data/folders";
import type { ModComboAlias, ModKey } from "../data/key-aliases";
import type { RaycastRef } from "../data/raycast";

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
      type: "raycast";
      ref: RaycastRef;
      actionDesc?: string;
    }
  | {
      type: "cleanShot";
      ref: CleanShotRef;
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
      url: string;
      background?: boolean;
      actionDesc?: string;
    }
  | {
      type: "command";
      ref: CommandRef;
      actionDesc?: string;
    }
  | {
      type: "shell";
      command: string;
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
      type: "sequence";
      actions: ActionSpec[];
    };
