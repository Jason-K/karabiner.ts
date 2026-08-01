import type { Case, Condition } from "../../data";
import { resolveCondition } from "../resolve-conditions";
import { resolveActionToEvents } from "../resolve-to-action";
import type { CaseGroup, ResolvedCase } from "./types";

export function resolveCases(
  cases: Case[],
  shared: Condition[] | undefined,
): ResolvedCase[] {
  return cases.map((c) => {
    const rawConditions = [...(shared ?? []), ...(c.conditions ?? [])];
    return {
      tapCount: c.tapCount ?? 1,
      phase: c.phase ?? "press",
      delayed: c.delayed ?? false,
      guard: c.guard ?? false,
      conditions: rawConditions.map(resolveCondition),
      rawConditions,
      do: (c.do ?? []).flatMap(resolveActionToEvents),
    };
  });
}

/** Group cases that share the same condition signature into one manipulator. */
export function groupByConditions(cases: ResolvedCase[]): CaseGroup[] {
  const groups = new Map<string, CaseGroup>();
  for (const c of cases) {
    const key = JSON.stringify(c.conditions);
    if (!groups.has(key)) {
      groups.set(key, {
        conditions: c.conditions,
        rawConditions: c.rawConditions,
        pressDo: [],
        releaseDo: [],
        holdDo: [],
        hasRelease: false,
        hasHold: false,
      });
    }
    const g = groups.get(key)!;
    if (c.phase === "press") g.pressDo.push(...c.do);
    if (c.phase === "release") {
      g.releaseDo.push(...c.do);
      g.hasRelease = true;
    }
    if (c.phase === "hold") {
      g.holdDo.push(...c.do);
      g.hasHold = true;
    }
  }
  return [...groups.values()];
}

/**
 * Fold an unconditional release-only (tap) group into the conditional hold
 * groups.
 */
export function distributeUnconditionalTap(groups: CaseGroup[]): CaseGroup[] {
  if (groups.length < 2) return groups;
  const defaultIdx = groups.findIndex(
    (g) =>
      g.conditions.length === 0 &&
      g.hasRelease &&
      !g.hasHold &&
      g.pressDo.length === 0,
  );
  if (defaultIdx < 0) return groups;
  const defaultTap = groups[defaultIdx]!.releaseDo;
  const isHoldOnly = (g: CaseGroup) =>
    g.conditions.length > 0 && g.hasHold && !g.hasRelease;
  if (!groups.some(isHoldOnly)) return groups;
  return groups
    .filter((_, i) => i !== defaultIdx)
    .map((g) =>
      isHoldOnly(g) ? { ...g, releaseDo: defaultTap, hasRelease: true } : g,
    );
}

export function groupMultiTapCases(cases: ResolvedCase[]): {
  conditions: unknown[];
  cases: ResolvedCase[];
}[] {
  const groups = new Map<
    string,
    { conditions: unknown[]; cases: ResolvedCase[] }
  >();
  for (const c of cases) {
    const sig = JSON.stringify(c.conditions);
    if (!groups.has(sig))
      groups.set(sig, { conditions: c.conditions, cases: [] });
    groups.get(sig)!.cases.push(c);
  }
  return [...groups.values()];
}

export function unionRawConditions(cases: ResolvedCase[]): Condition[] {
  const seen = new Set<string>();
  const out: Condition[] = [];
  for (const c of cases) {
    for (const cond of c.rawConditions) {
      const key = JSON.stringify(cond);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(cond);
      }
    }
  }
  return out;
}
