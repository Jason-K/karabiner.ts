import type {
  AppSpec,
  Condition,
  DeviceSpec,
  PathSpec,
  VarSpec,
  VarValueSpec,
} from "../data";

export type WhenWrapper = {
  kind: "when";
  conditions: Condition[];
};

export function when(...conditions: (Condition | Condition[])[]): WhenWrapper {
  return {
    kind: "when",
    conditions: conditions.flat(),
  };
}

function isVarValueSpec(val: unknown): val is VarValueSpec {
  return (
    typeof val === "object" &&
    val !== null &&
    "ref" in val &&
    "value" in val
  );
}

export function ifUserVar(
  varOrValueSpec: VarSpec | VarValueSpec,
  equalsOrUnless?: string | number | boolean | VarValueSpec | { unless?: boolean },
  unlessOrOpts?: boolean | { unless?: boolean },
): Condition {
  if (isVarValueSpec(varOrValueSpec)) {
    const unless =
      typeof equalsOrUnless === "boolean"
        ? equalsOrUnless
        : (equalsOrUnless as any)?.unless ??
          (typeof unlessOrOpts === "boolean"
            ? unlessOrOpts
            : unlessOrOpts?.unless ?? false);
    return {
      var: varOrValueSpec.ref,
      equals: varOrValueSpec.value,
      ...(unless ? { unless: true } : {}),
      ...(varOrValueSpec.varDesc ? { description: varOrValueSpec.varDesc } : {}),
    };
  }

  let equals: string | number | boolean = (equalsOrUnless as any) ?? 1;
  if (isVarValueSpec(equals)) {
    equals = equals.value;
  }

  const unless =
    typeof unlessOrOpts === "boolean"
      ? unlessOrOpts
      : unlessOrOpts?.unless ?? false;
  return {
    var: varOrValueSpec,
    equals,
    ...(unless ? { unless: true } : {}),
  };
}

export function unlessUserVar(
  varOrValueSpec: VarSpec | VarValueSpec,
  equals?: string | number | boolean | VarValueSpec,
): Condition {
  if (isVarValueSpec(varOrValueSpec)) {
    return ifUserVar(varOrValueSpec, true);
  }
  return ifUserVar(varOrValueSpec, equals, true);
}

export function ifKeVar(
  varOrValueSpec: VarSpec | VarValueSpec,
  equalsOrUnless?: string | number | boolean | VarValueSpec | { unless?: boolean },
  unlessOrOpts?: boolean | { unless?: boolean },
): Condition {
  return ifUserVar(varOrValueSpec, equalsOrUnless, unlessOrOpts);
}

export function unlessKeVar(
  varOrValueSpec: VarSpec | VarValueSpec,
  equals?: string | number | boolean | VarValueSpec,
): Condition {
  return unlessUserVar(varOrValueSpec, equals);
}

export const condVar = ifUserVar;
export const ifVar = ifUserVar;
export const condNotVar = unlessUserVar;

export function condApp(
  app: AppSpec | PathSpec | string | (AppSpec | PathSpec | string)[],
  isForemost = true,
): Condition {
  return {
    app,
    ...(!isForemost ? { unless: true } : {}),
  };
}
export const ifApp = condApp;

export function condNotApp(
  app: AppSpec | PathSpec | string | (AppSpec | PathSpec | string)[],
): Condition {
  return condApp(app, false);
}
export const unlessApp = condNotApp;

export function condDevice(
  device: DeviceSpec,
  unlessOrOpts?: boolean | { unless?: boolean },
): Condition {
  const unless =
    typeof unlessOrOpts === "boolean"
      ? unlessOrOpts
      : unlessOrOpts?.unless ?? false;
  return {
    device,
    ...(unless ? { unless } : {}),
  };
}
export const ifDevice = condDevice;
