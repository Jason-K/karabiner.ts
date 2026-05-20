import type { AppRef } from "./apps";
import type { CleanShotRef } from "./cleanshot";
import type { FolderRef } from "./folders";
import type { RaycastRef } from "./raycast";

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
      type: "takeActionHere";
      action: string;
    }
  | {
      type: "selectionTransform";
      operation: "lowercase" | "sentence_case" | "title_case" | "uppercase";
    }
  | {
      type: "selectionWrap";
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
      modifiers?: string[];
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
      type: "applescript";
      scriptPath: string;
      args?: string[];
    }
  | {
      type: "cut" | "copy" | "paste";
    };
