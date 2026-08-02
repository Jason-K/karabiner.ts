import type {
  Action,
  ActionKeyModifier,
  ActionSpec,
  AppTarget,
  Case,
  CommandSpec,
  Condition,
  KeyCode,
  MapSpec,
  PathSpec,
  Phase,
  UrlSpec,
  VarSpec,
} from "../data";
import { resolveKeyAlias } from "./utils";

/**
 * Fluent builder for `Case` items in Karabiner bindings.
 * Implements `Case` directly so instances can be placed into `cases: [...]` arrays.
 */
export class CaseBuilder implements Case {
  phase?: Phase;
  do: Action[];
  declare conditions?: Condition[];
  declare tapCount?: number;
  declare description?: string;
  declare suppress?: boolean;
  declare delayed?: boolean;
  declare guard?: boolean;

  constructor(
    phase: Phase,
    actions: Action | Action[],
    conditions?: Condition | Condition[],
  ) {
    this.phase = phase;
    this.do = Array.isArray(actions) ? actions : [actions];
    delete this.conditions;
    delete this.tapCount;
    delete this.description;
    delete this.suppress;
    delete this.delayed;
    delete this.guard;

    if (conditions) {
      this.when(conditions);
    }
  }

  /** Add one or more conditions to this case. */
  when(...conditions: (Condition | Condition[])[]): this {
    const flat = conditions.flat();
    if (flat.length > 0) {
      this.conditions = this.conditions ? [...this.conditions, ...flat] : flat;
    }
    return this;
  }

  /** Set tap count requirement (e.g. 2 for double tap). */
  withTapCount(count: number): this {
    this.tapCount = count;
    return this;
  }

  /** Mark action as delayed (multi-tap). */
  withDelayed(isDelayed = true): this {
    this.delayed = isDelayed;
    return this;
  }

  /** Enable double-tap guard protection on this case. */
  guardProtection(isGuarded = true): this {
    this.guard = isGuarded;
    return this;
  }

  /** Set optional action fragment description. */
  describe(text: string): this {
    this.description = text;
    return this;
  }

  /** Suppress trigger fallback (emit only explicit `do`). */
  withSuppress(suppress = true): this {
    this.suppress = suppress;
    return this;
  }
}

export function press(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("press", actions, conditions);
}

export function release(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("release", actions, conditions);
}

export function tap(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return release(actions, conditions);
}

export function hold(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("hold", actions, conditions);
}

export function doubleTap(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return press(actions, conditions).withTapCount(2);
}

export function doubleTapHold(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return hold(actions, conditions).withTapCount(2);
}

export function delayedSingleTap(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return release(actions, conditions).withDelayed(true);
}

export function guard(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return press(actions, conditions).guardProtection(true);
}

export type ToWrapper = {
  kind: "to";
  cases: Case[];
};

export function to(...cases: (Case | Case[])[]): ToWrapper {
  return {
    kind: "to",
    cases: cases.flat(),
  };
}

export function openApp(
  ref: AppTarget,
  mode?: "open" | "shell",
  actionDesc?: string,
): ActionSpec {
  return {
    type: "app",
    ref,
    ...(mode ? { mode } : {}),
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function openUrl(
  url: UrlSpec | string,
  background?: boolean,
  actionDesc?: string,
): ActionSpec {
  return {
    type: "url",
    url,
    ...(background !== undefined ? { background } : {}),
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export type KeyOptions = { repeat?: boolean; halt?: boolean; lazy?: boolean };

export function key(
  keyName: KeyCode,
  modifiersOrOptions?: ActionKeyModifier[] | KeyOptions,
  options?: KeyOptions,
  actionDesc?: string,
): ActionSpec {
  let modifiers: ActionKeyModifier[] | undefined;
  let opts: KeyOptions | undefined;

  if (Array.isArray(modifiersOrOptions)) {
    modifiers = modifiersOrOptions.map((m) => resolveKeyAlias(m as string)) as ActionKeyModifier[];
    opts = options;
  } else {
    opts = modifiersOrOptions;
    modifiers = undefined;
  }

  const finalOptions: KeyOptions = {
    ...opts,
    repeat: opts?.repeat ?? false,
  };

  return {
    type: "key",
    key: resolveKeyAlias(keyName),
    ...(modifiers?.length ? { modifiers } : {}),
    options: finalOptions,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function map(
  ref: MapSpec,
  options?: KeyOptions,
  actionDesc?: string,
): ActionSpec {
  return {
    type: "map",
    ref,
    options: {
      ...options,
      repeat: options?.repeat ?? false,
    },
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function actHere(action: string): ActionSpec {
  return { type: "actHere", action };
}

export function appHistory(index: number): ActionSpec {
  return { type: "appHistory", index };
}

export function openFolder(ref: PathSpec, actionDesc?: string): ActionSpec {
  return {
    type: "folder",
    ref,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function cmd(ref: CommandSpec, actionDesc?: string): ActionSpec {
  return {
    type: "command",
    ref,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function shell(
  command: string | CommandSpec,
  actionDesc?: string,
): ActionSpec {
  return {
    type: "shell",
    command,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function python(
  scriptPath: string,
  options?: { venv?: string; args?: string[]; actionDesc?: string } | string[],
  actionDesc?: string,
): ActionSpec {
  if (Array.isArray(options)) {
    return {
      type: "python",
      scriptPath,
      args: options,
      ...(actionDesc ? { actionDesc } : {}),
    };
  }
  return {
    type: "python",
    scriptPath,
    ...(options ?? {}),
  };
}

export function osascript(
  scriptPath: string,
  args?: string[],
  actionDesc?: string,
): ActionSpec {
  return {
    type: "osascript",
    scriptPath,
    ...(args?.length ? { args } : {}),
    ...(actionDesc ? { actionDesc } : {}),
  };
}

export function noop(): ActionSpec {
  return { type: "noop" };
}

export function setVar(
  varSpec: VarSpec,
  value: number | string | boolean = 1,
  toggle = false,
): ActionSpec {
  return {
    type: "setVar",
    var: varSpec,
    value,
    ...(toggle ? { toggle } : {}),
  };
}

export function cut(): ActionSpec {
  return { type: "cut" };
}

export function copy(): ActionSpec {
  return { type: "copy" };
}

export function paste(): ActionSpec {
  return { type: "paste" };
}

export function sequence(...actions: ActionSpec[]): ActionSpec {
  return { type: "sequence", actions };
}
