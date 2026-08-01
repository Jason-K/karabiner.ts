import type { Manipulator } from "../../../types/karabiner";
import { ifDevice } from "../../karabiner-helpers";
import { DEVICES, type Condition, type Trigger } from "../../../data";

import type { ResolvedCase } from "../../resolve-cases";
import { synthesizeManipulatorLabel } from "../../resolve-description/description-synthesizer";
import { karabinerDeviceId } from "../../resolve-trigger/device-config";
import { getTriggerKeys, isPointerButton, resolveButton } from "../../utils";

export function deviceLast(conds: unknown[]): unknown[] {
  if (!conds.length) return conds;
  const rest: unknown[] = [];
  const device: unknown[] = [];
  for (const c of conds) {
    if (
      c &&
      typeof c === "object" &&
      (c as { type?: string }).type === "device_if"
    )
      device.push(c);
    else rest.push(c);
  }
  return device.length ? [...rest, ...device] : rest;
}

/** For a device-specific button alias, add a `device_if` condition to every manipulator. */
export function stampDeviceScope(
  manipulators: Manipulator[],
  trigger: Trigger,
): void {
  const keys = getTriggerKeys(trigger);
  const nameScopes: string[] = [];
  for (const k of keys) {
    if (isPointerButton(k)) {
      const { nameScope } = resolveButton(k);
      if (nameScope && nameScope !== "global") {
        nameScopes.push(...nameScope);
      }
    }
  }
  if (!nameScopes.length) return;
  const ids = nameScopes.map((n) =>
    karabinerDeviceId(DEVICES[n as keyof typeof DEVICES]),
  );
  const cond = ifDevice(ids).build();
  manipulators.forEach((m: any) => {
    m.conditions = [...(m.conditions ?? []), cond];
  });
}

export function attachConditions(
  manipulators: Manipulator[],
  cases: ResolvedCase[],
): void {
  const conds = deviceLast(cases.flatMap((c) => c.conditions));
  if (!conds.length) return;
  manipulators.forEach((m: any) => {
    m.conditions = m.conditions || [];
    m.conditions.push(...conds);
  });
}

export function stampLabel(
  manipulators: Manipulator[],
  conditions: Condition[] | undefined,
): void {
  const label = synthesizeManipulatorLabel(conditions);
  if (!label) return;
  manipulators.forEach((m: any) => {
    m.description = label;
  });
}
