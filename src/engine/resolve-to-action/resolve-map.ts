import type { Modifier } from "karabiner.ts";
import { VMOD, type ModComboAlias } from "../../data/settings-keys";

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

export function expandModifiers(modifiers: string[]): string[] {
  const expanded: string[] = [];
  const seen = new Set<string>();
  for (const mod of modifiers) {
    for (const m of resolveModComboAlias(mod) ?? [mod]) {
      if (!seen.has(m)) {
        seen.add(m);
        expanded.push(m);
      }
    }
  }
  return expanded;
}

export {
  ensurePathQuoting,
  ensurePathQuotingInCommand,
  ensurePathQuotingInManipulators,
} from "../utils";
