import type { Manipulator, ToEvent } from "karabiner.ts";

/**
 * Encloses a string in single quotes, escaping any internal single quotes for shell execution.
 */
export function shellSingleQuote(str: string): string {
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Encloses a string in double quotes, escaping any internal double quotes for shell execution.
 */
export function shellDoubleQuote(str: string): string {
  return `"${str.replace(/"/g, '\\"')}"`;
}

/**
 * Normalizes a shell file-system path by expanding leading `~/` to `$HOME/`.
 */
export function normalizeShellPath(inputPath: string): string {
  if (inputPath.startsWith("~/")) {
    return `$HOME/${inputPath.slice(2)}`;
  }
  return inputPath;
}

/**
 * Normalizes and double-quotes a file-system path for shell execution.
 * Expands leading `~/` to `$HOME/`.
 */
export function normalizePathForShell(path: string): string {
  return shellDoubleQuote(normalizeShellPath(path));
}

/**
 * Checks whether a shell command token represents a file-system path.
 */
export function isPathToken(token: string): boolean {
  const clean = token.replace(/^['"]+|['"]+$/g, "");
  if (!clean) return false;

  if (
    clean.startsWith("/") ||
    clean.startsWith("~/") ||
    clean === "~" ||
    clean.startsWith("$HOME/") ||
    clean.startsWith("${HOME}/") ||
    clean.startsWith("./") ||
    clean.startsWith("../")
  ) {
    return true;
  }

  if (
    clean.includes("/") &&
    !clean.includes("://") &&
    !clean.startsWith("-") &&
    !/\s\/\s/.test(clean)
  ) {
    return true;
  }

  return false;
}

/**
 * Splits a shell command string into discrete tokens (arguments, operators, whitespace),
 * preserving single and double quoted argument boundaries.
 */
export function tokenizeShellCommand(cmdStr: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < cmdStr.length; i++) {
    const char = cmdStr[i];
    const prevChar = i > 0 ? cmdStr[i - 1] : "";

    if (char === "'" && !inDouble && prevChar !== "\\") {
      inSingle = !inSingle;
      current += char;
    } else if (char === '"' && !inSingle && prevChar !== "\\") {
      inDouble = !inDouble;
      current += char;
    } else if (/\s/.test(char) && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Ensures that any file-system paths in a shell command string are enclosed in a single set of quotes,
 * removing duplicate/nested quoting and adding missing quotes to unquoted paths.
 */
export function ensurePathQuotingInCommand(commandStr: string): string {
  if (!commandStr) return commandStr;

  const tokens = tokenizeShellCommand(commandStr);
  const normalizedTokens = tokens.map((token) => {
    if (/^\s+$/.test(token) || /^(&&|\|\||;|\|)$/.test(token)) {
      return token;
    }

    const leadingMatch = token.match(/^['"]+/);
    const trailingMatch = token.match(/['"]+$/);

    const leadingQuotes = leadingMatch ? leadingMatch[0] : "";
    const trailingQuotes = trailingMatch ? trailingMatch[0] : "";

    const inner = token.slice(
      leadingQuotes.length,
      token.length - trailingQuotes.length
    );

    if (!isPathToken(inner)) {
      return token;
    }

    // Single set of quotes check: exactly 1 leading quote, 1 trailing quote, matching quote char
    if (
      leadingQuotes.length === 1 &&
      trailingQuotes.length === 1 &&
      leadingQuotes === trailingQuotes
    ) {
      return token;
    }

    return `"${inner}"`;
  });

  return normalizedTokens.join("");
}

/**
 * Ensures that any file-system paths in manipulators are enclosed in a single set of quotes.
 */
export function ensurePathQuotingInManipulators<
  T extends Manipulator | Manipulator[]
>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((m) => ensurePathQuotingInManipulators(m)) as T;
  }
  if (!input || typeof input !== "object") return input;

  const result: any = { ...input };

  const updateEvents = (events?: ToEvent[]): ToEvent[] | undefined => {
    if (!events) return events;
    return events.map((event) => {
      if (
        event &&
        typeof event === "object" &&
        "shell_command" in event &&
        typeof (event as any).shell_command === "string"
      ) {
        return {
          ...event,
          shell_command: ensurePathQuotingInCommand(
            (event as any).shell_command
          ),
        };
      }
      return event;
    });
  };

  if (result.to) result.to = updateEvents(result.to);
  if (result.to_if_alone) result.to_if_alone = updateEvents(result.to_if_alone);
  if (result.to_if_held_down)
    result.to_if_held_down = updateEvents(result.to_if_held_down);
  if (result.to_after_key_up)
    result.to_after_key_up = updateEvents(result.to_after_key_up);

  if (result.to_delayed_action) {
    result.to_delayed_action = {
      ...result.to_delayed_action,
      to_if_invoked: updateEvents(result.to_delayed_action.to_if_invoked),
      to_if_canceled: updateEvents(result.to_delayed_action.to_if_canceled),
    };
  }

  return result as T;
}

export const ensurePathQuoting = ensurePathQuotingInManipulators;
