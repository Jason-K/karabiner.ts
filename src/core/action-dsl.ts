import type { AppRef } from "../data/apps";
import type { CleanShotRef } from "../data/cleanshot";
import type { FolderRef } from "../data/folders";
import type { ModComboAlias, ModKey } from "../data/key-aliases";
import type { RaycastRef } from "../data/raycast";

export type ActionKeyModifier = ModKey | ModComboAlias;

export type ActionSpec =
  | {
      type: "app";
      ref: AppRef;
      mode?: "open" | "focus" | "shell";
    }
  | {
      type: "appHistory";
      index: number;
    }
  | {
      type: "folder";
      ref: FolderRef;
    }
  | {
      type: "raycast";
      ref: RaycastRef;
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
    }
  | {
      type: "url";
      url: string;
      background?: boolean;
    }
  | {
      type: "shell";
      command: string;
    }
  | {
      type: "python";
      scriptPath: string;
      venv?: string;
      args?: string[];
    }
  | {
      type: "osascript";
      scriptPath: string;
      args?: string[];
    }
  | {
      type: "cut" | "copy" | "paste";
    }
  | { type: "noop" }
  | {
      type: "sequence";
      actions: ActionSpec[];
    };
