import type {
  Binding,
  Case,
  Condition,
  KeyCode,
  PointerButtonAlias,
  TriggerModifiers,
} from "../data";
import type { AcceptUndefined } from "../types/util";
import type { WhenWrapper } from "./condition-wrappers";
import { conditionKind } from "./resolve-conditions";
import { from, type FromInput, triggerKeys, triggerPointer } from "./from-action-wrappers";
import { CaseBuilder, type ToWrapper } from "./to-action-wrappers";

export type BindingOptionsSpec = Partial<Omit<Binding, "trigger" | "cases">>;

export type OptionsWrapper = {
  kind: "options";
  opts: BindingOptionsSpec;
};

export function options(opts: BindingOptionsSpec): OptionsWrapper {
  return {
    kind: "options",
    opts,
  };
}

export function timing(opts: AcceptUndefined<NonNullable<Binding["timing"]>>): OptionsWrapper {
  return options({ timing: opts });
}

export type BindingOptions = BindingOptionsSpec & {
  modifiers?: TriggerModifiers;
};

/**
 * Every key `BindingOptionsSpec` accepts.
 *
 * `satisfies Record<keyof BindingOptionsSpec, true>` makes this exhaustive: add
 * a field to `Binding` and the compiler demands it be listed here. That is what
 * lets {@link bind} reject a misspelled option instead of silently dropping it —
 * `BindingOptionsSpec` is fully optional, so *any* object literal satisfies it
 * and the type system alone cannot catch `timings:` for `timing:`.
 */
const BINDING_OPTION_KEYS = {
  description: true,
  timing: true,
  conditions: true,
  eventOptions: true,
  multiTap: true,
  afterKeyUp: true,
  whileHoldVar: true,
  suppress: true,
  suppressCancelFallback: true,
  modWhileDown: true,
  guardVar: true,
  guardMs: true,
} satisfies Record<keyof BindingOptionsSpec, true>;

function isCase(val: unknown): val is Case {
  return (
    typeof val === "object" &&
    val !== null &&
    ("do" in val || "phase" in val || val instanceof CaseBuilder)
  );
}

/**
 * Validate a bare options object, which is the one `BindArg` variant the type
 * system cannot check. Throws naming the offending key.
 */
function assertKnownOptions(value: object): BindingOptionsSpec {
  const unknown = Object.keys(value).filter(
    (k) => !(k in BINDING_OPTION_KEYS),
  );
  if (unknown.length) {
    throw new Error(
      `bind(): unknown option${unknown.length > 1 ? "s" : ""} ${unknown
        .map((k) => `"${k}"`)
        .join(", ")}. Valid options: ${Object.keys(BINDING_OPTION_KEYS).sort().join(", ")}.`,
    );
  }
  return value as BindingOptionsSpec;
}

function isCondition(val: unknown): val is Condition {
  if (typeof val !== "object" || val === null) return false;
  try {
    conditionKind(val as Condition);
    return true;
  } catch {
    return false;
  }
}

function isTriggerModifiers(val: any): val is TriggerModifiers {
  return (
    Array.isArray(val) ||
    (typeof val === "object" &&
      val !== null &&
      ("mandatory" in val || "optional" in val))
  );
}

export type BindArg =
  | ToWrapper
  | WhenWrapper
  | OptionsWrapper
  | Case
  | Case[]
  | Condition
  | Condition[]
  | BindingOptionsSpec;

export function bind(
  trigger: FromInput,
  ...args: BindArg[]
): Binding {
  const trg = from(trigger);
  const cases: Case[] = [];
  const hoistedConditions: Condition[] = [];
  let mergedOptions: BindingOptionsSpec = {};

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "object" && "kind" in arg) {
      const wrapper = arg as ToWrapper | WhenWrapper | OptionsWrapper;
      if (wrapper.kind === "to") {
        cases.push(...wrapper.cases);
        continue;
      }
      if (wrapper.kind === "when") {
        hoistedConditions.push(...wrapper.conditions);
        continue;
      }
      if (wrapper.kind === "options") {
        mergedOptions = { ...mergedOptions, ...wrapper.opts };
        continue;
      }
    }

    if (Array.isArray(arg)) {
      // Classify every element, not just the first: a mixed array would
      // otherwise be silently filed under whatever `arg[0]` happened to be.
      const conditions = arg.filter(isCondition);
      const caseItems = arg.filter(isCase);
      if (conditions.length + caseItems.length !== arg.length) {
        throw new Error(
          `bind(): array argument contains ${arg.length - conditions.length - caseItems.length} ` +
            "entr(y|ies) that are neither a case nor a condition.",
        );
      }
      hoistedConditions.push(...conditions);
      cases.push(...caseItems);
      continue;
    }

    if (isCase(arg)) {
      cases.push(arg);
      continue;
    }

    if (isCondition(arg)) {
      hoistedConditions.push(arg);
      continue;
    }

    mergedOptions = { ...mergedOptions, ...assertKnownOptions(arg) };
  }

  const finalConditions = [
    ...(hoistedConditions.length ? hoistedConditions : []),
    ...(mergedOptions.conditions ?? []),
  ];

  return {
    trigger: trg,
    cases,
    ...mergedOptions,
    ...(finalConditions.length ? { conditions: finalConditions } : {}),
  };
}

export function bindKeys(
  keys: KeyCode | KeyCode[],
  cases: Case | Case[],
  modifiersOrOptions?: TriggerModifiers | BindingOptions,
  options?: BindingOptions,
): Binding {
  let modifiers: TriggerModifiers | undefined;
  let opts: BindingOptions | undefined;

  if (isTriggerModifiers(modifiersOrOptions)) {
    modifiers = modifiersOrOptions;
    opts = options;
  } else {
    opts = modifiersOrOptions;
    modifiers = opts?.modifiers;
  }

  const { modifiers: _m, ...restOpts } = opts ?? {};
  return bind(triggerKeys(keys, modifiers), cases, restOpts);
}

export function bindPointer(
  pointer: PointerButtonAlias,
  cases: Case | Case[],
  modifiersOrOptions?: TriggerModifiers | BindingOptions,
  options?: BindingOptions,
): Binding {
  let modifiers: TriggerModifiers | undefined;
  let opts: BindingOptions | undefined;

  if (isTriggerModifiers(modifiersOrOptions)) {
    modifiers = modifiersOrOptions;
    opts = options;
  } else {
    opts = modifiersOrOptions;
    modifiers = opts?.modifiers;
  }

  const { modifiers: _m, ...restOpts } = opts ?? {};
  return bind(triggerPointer(pointer, modifiers), cases, restOpts);
}
