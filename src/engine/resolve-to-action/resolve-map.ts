import type { Modifier } from "karabiner.ts";
import type { AppSpec, Map, MapSpec, PathSpec } from "../../data";
import { VMOD, type ModComboAlias } from "../../data/constants/keys";
import {
  getModComboAliasCanonicalKey,
  isModComboAlias,
  resolveKeyAlias,
  resolveModComboAlias,
} from "../utils";

export type ComboOpts = {
  app?: AppSpec | PathSpec | string;
  activeAppOnly?: boolean;
  options?: { repeat?: boolean; halt?: boolean; lazy?: boolean };
};

export type HkInput =
  | string
  | [string, string[]]
  | { key?: string; name?: string; modifiers?: string[] };

export function normalizeCombo(input: HkInput): Map {
  if (typeof input === "string") {
    return { key: input, modifiers: [] };
  }
  if (Array.isArray(input)) {
    return { key: input[0], modifiers: input[1] ?? [] };
  }
  return {
    key: input.key ?? input.name ?? "",
    modifiers: input.modifiers ?? [],
  };
}

/* eslint-disable no-redeclare */
export function mapSpec(
  key: string,
  modifiers: string[],
  refDesc: string,
  opts?: ComboOpts,
): MapSpec;
export function mapSpec(
  combos: HkInput[],
  refDesc: string,
  opts?: ComboOpts,
): MapSpec;
export function mapSpec(
  keyOrCombos: string | HkInput[],
  modifiersOrRefDesc: string[] | string,
  refDescOrOpts?: string | ComboOpts,
  optsParam?: ComboOpts,
): MapSpec {
  /* eslint-enable no-redeclare */
  if (Array.isArray(keyOrCombos)) {
    const combos = keyOrCombos.map(normalizeCombo);
    const refDesc = modifiersOrRefDesc as string;
    const opts = refDescOrOpts as ComboOpts | undefined;
    const first = combos[0] ?? { key: "", modifiers: [] };
    return {
      type: "map" as const,
      keyCode: first.key,
      modifiers: first.modifiers,
      combos,
      refDesc,
      ...(opts?.app !== undefined ? { app: opts.app } : {}),
      ...(opts?.activeAppOnly ? { activeAppOnly: true } : {}),
      ...(opts?.options ? { options: opts.options } : {}),
    };
  }
  const key = keyOrCombos;
  const modifiers = modifiersOrRefDesc as string[];
  const refDesc = refDescOrOpts as string;
  const opts = optsParam;
  return {
    type: "map" as const,
    keyCode: key,
    modifiers,
    refDesc,
    ...(opts?.app !== undefined ? { app: opts.app } : {}),
    ...(opts?.activeAppOnly ? { activeAppOnly: true } : {}),
    ...(opts?.options ? { options: opts.options } : {}),
  };
}

export {
  getModComboAliasCanonicalKey,
  isModComboAlias,
  resolveModComboAlias,
} from "../utils";

export function expandModifiers(modifiers: string[]): string[] {
  const expanded: string[] = [];
  const seen = new Set<string>();
  for (const mod of modifiers) {
    for (const raw of resolveModComboAlias(mod) ?? [mod]) {
      const m = resolveKeyAlias(raw);
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
