import type { Manipulator } from "../../types/karabiner";

/**
 * Encloses a string in quotes (single or double), escaping internal quote characters.
 */
export function wrapQuotes(str: string, useSingle: boolean = false): string {
  if (useSingle) {
    return `'${str.replace(/'/g, "'\"'\"'")}'`;
  }
  return `"${str.replace(/"/g, '\\"')}"`;
}

/** Helper to format path strings containing $HOME or ${HOME} so the env var is outside quotes. */
export function formatPathWithHome(pathStr: string): string {
  let clean = pathStr;
  if (clean.startsWith("~/")) {
    clean = `$HOME/${clean.slice(2)}`;
  }
  if (!clean.includes("$HOME") && !clean.includes("${HOME}")) {
    return wrapQuotes(clean, true);
  }
  let quoted = `'${clean.replace(/'/g, "'\"'\"'")}'`;
  quoted = quoted
    .replace(/\$HOME/g, "'$HOME'")
    .replace(/\$\{HOME\}/g, "'${HOME}'")
    .replace(/^''/, "")
    .replace(/''$/, "")
    .replace(/''/g, "");
  return quoted;
}

/** Encloses a string in single quotes, escaping internal single quotes. */
export function shellSingleQuote(str: string): string {
  const norm = normalizeShellPath(str);
  if (norm.includes("$HOME") || norm.includes("${HOME}")) {
    return formatPathWithHome(norm);
  }
  return wrapQuotes(norm, true);
}

/** Encloses a string in double quotes, escaping internal double quotes. */
export function shellDoubleQuote(str: string): string {
  return wrapQuotes(str, false);
}

/** Normalizes a shell file-system path by expanding leading `~/` to `$HOME/`. */
export function normalizeShellPath(inputPath: string): string {
  if (inputPath.startsWith("~/")) {
    return `$HOME/${inputPath.slice(2)}`;
  }
  return inputPath;
}

/** Normalizes and quotes a file-system path for shell execution. */
export function normalizePathForShell(path: string): string {
  const norm = normalizeShellPath(path);
  if (norm.includes("$HOME") || norm.includes("${HOME}")) {
    return formatPathWithHome(norm);
  }
  return shellDoubleQuote(norm);
}

/** Checks whether a shell command token represents a file-system path. */
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
    const char = cmdStr[i]!;
    const prevChar = i > 0 ? cmdStr[i - 1]! : "";

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

    let inner = token.slice(
      leadingQuotes.length,
      token.length - trailingQuotes.length
    );

    if (!isPathToken(inner) && !isPathToken(token)) {
      return token;
    }

    if (inner.includes("$HOME") || inner.includes("${HOME}") || inner.startsWith("~/")) {
      return formatPathWithHome(inner);
    }

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
 * Recursively visits all `shell_command` properties across any data structure
 * (Manipulators, ToEvents, Actions, Cases, Bindings) and applies the transformer.
 */
export function transformShellCommands<T>(
  node: T,
  transformer: (cmd: string) => string,
): T {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map((item) => transformShellCommands(item, transformer)) as unknown as T;
  }

  const result: any = { ...node };
  for (const key of Object.keys(result)) {
    if (key === "shell_command" && typeof result[key] === "string") {
      result[key] = transformer(result[key]);
    } else if (result[key] && typeof result[key] === "object") {
      result[key] = transformShellCommands(result[key], transformer);
    }
  }

  return result as T;
}

/**
 * Ensures that any file-system paths in manipulators (or any AST nodes) are enclosed in a single set of quotes.
 */
export function ensurePathQuotingInManipulators<
  T extends Manipulator | Manipulator[]
>(input: T): T {
  return transformShellCommands(input, ensurePathQuotingInCommand);
}

export const ensurePathQuoting = ensurePathQuotingInManipulators;
