import type { Modifier } from "karabiner.ts";
import type { TriggerModifiers } from "../../data";
import { MODKEY_CODES, VMOD, type ModComboAlias } from "../../data/constants/keys";

const VMOD_ALIAS_LOWER = new Map<string, ModComboAlias>(
  Object.keys(VMOD).map((key) => [
    key.toLowerCase(),
    key as ModComboAlias,
  ]),
);

export function getModComboAliasCanonicalKey(
  alias: string,
): ModComboAlias | undefined {
  return VMOD_ALIAS_LOWER.get(alias.toLowerCase());
}

export function resolveModComboAlias(alias: string): Modifier[] | undefined {
  const canonical = getModComboAliasCanonicalKey(alias);
  return canonical ? [...VMOD[canonical]] : undefined;
}

export function isModComboAlias(alias: string): boolean {
  return Boolean(getModComboAliasCanonicalKey(alias));
}

/**
 * Resolves key/modifier aliases to standard Karabiner key_code or modifier strings.
 * E.g.:
 * - `cmd` → `"command"`
 * - `opt` → `"option"`
 * - `ctrl` → `"control"`
 * - `L.cmd` / `L_cmd` → `"left_command"`
 * - `R.cmd` / `R_cmd` → `"right_command"`
 * - `L.opt` / `L_opt` → `"left_option"`
 * - `R.opt` / `R_opt` → `"right_option"`
 * - `L.ctrl` / `L_ctrl` → `"left_control"`
 * - `R.ctrl` / `R_ctrl` → `"right_control"`
 * - `L.shift` / `L_shift` → `"left_shift"`
 * - `R.shift` / `R_shift` → `"right_shift"`
 */
export function resolveKeyAlias(key: string): string {
  if (!key) return key;

  let sidePrefix = "";
  let baseKey = key;

  if (/^[LR][._]/i.test(key)) {
    const prefixChar = key[0]!.toLowerCase();
    sidePrefix = prefixChar === "l" ? "left_" : "right_";
    baseKey = key.slice(2);
  } else if (/^(left|right)_/i.test(key)) {
    const match = key.match(/^(left|right)_/i);
    if (match) {
      sidePrefix = match[0].toLowerCase();
      baseKey = key.slice(sidePrefix.length);
    }
  }

  if (baseKey === "cmd") {
    baseKey = "command";
  } else if (baseKey === "opt") {
    baseKey = "option";
  } else if (baseKey === "ctrl") {
    baseKey = "control";
  }

  return `${sidePrefix}${baseKey}`;
}

export function isModifierKey(key: string): boolean {
  return MODKEY_CODES.has(resolveKeyAlias(key));
}

/**
 * Resolve a trigger's modifier specification into expanded arrays of mandatory
 * and optional Karabiner modifier names.
 */
export function resolveModifiers(m?: TriggerModifiers): {
  mandatory: string[];
  optional: string[];
} {
  if (!m) {
    return { mandatory: [], optional: [] };
  }
  const resolveList = (list: string[]) => {
    const expanded: string[] = [];
    const seen = new Set<string>();
    for (const mod of list) {
      for (const raw of resolveModComboAlias(mod) ?? [mod]) {
        const resolved = resolveKeyAlias(raw);
        if (!seen.has(resolved)) {
          seen.add(resolved);
          expanded.push(resolved);
        }
      }
    }
    return expanded;
  };

  if (Array.isArray(m)) {
    return {
      mandatory: resolveList(m),
      optional: [],
    };
  }
  return {
    mandatory: resolveList(m.mandatory ?? []),
    optional: resolveList(m.optional ?? []),
  };
}

/**
 * Normalize a Karabiner modifier token to its short form for use in derived
 * variable names (e.g. `guard_cmd_q`): strip a leading `left_`/`right_` prefix,
 * then alias `command→cmd`, `control→ctrl`, `option→opt`. Anything else (e.g.
 * `shift`, `fn`) passes through unchanged.
 */
export function normalizeModifier(mod: string): string {
  const resolved = resolveKeyAlias(mod);
  return resolved
    .replace(/^(left|right)_/, "")
    .replace("command", "cmd")
    .replace("control", "ctrl")
    .replace("option", "opt");
}
