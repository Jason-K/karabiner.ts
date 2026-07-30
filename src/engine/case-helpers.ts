import type { Action, ActionKeyModifier, ActionSpec, AppTarget } from "../core/action-dsl";
import type { AppRef, CommandRef, DeviceSpec, ExternalHkRef, PathRef, UrlRef, VarSpec } from "../data";
import type { Binding, Case, Condition, Phase, SimOrder, Trigger, TriggerModifiers } from "./binding";

/** Known standard Karabiner key codes for auto-completion. */
export type StandardKeyCode =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12"
  | "f13" | "f14" | "f15" | "f16" | "f17" | "f18" | "f19" | "f20" | "f21" | "f22" | "f23" | "f24"
  | "return_or_enter" | "escape" | "delete_or_backspace" | "delete_forward" | "tab" | "spacebar"
  | "hyphen" | "equal_sign" | "open_bracket" | "close_bracket" | "backslash" | "non_us_pound"
  | "semicolon" | "quote" | "grave_accent_and_tilde" | "comma" | "period" | "slash"
  | "caps_lock" | "print_screen" | "scroll_lock" | "pause" | "insert" | "home" | "page_up"
  | "end" | "page_down" | "right_arrow" | "left_arrow" | "down_arrow" | "up_arrow"
  | "keypad_num_lock" | "keypad_slash" | "keypad_asterisk" | "keypad_hyphen" | "keypad_plus"
  | "keypad_enter" | "keypad_1" | "keypad_2" | "keypad_3" | "keypad_4" | "keypad_5"
  | "keypad_6" | "keypad_7" | "keypad_8" | "keypad_9" | "keypad_0" | "keypad_period"
  | "keypad_equal_sign" | "left_control" | "left_shift" | "left_option" | "left_command"
  | "right_control" | "right_shift" | "right_option" | "right_command" | "fn";

/** Key code string type with IntelliSense auto-completion for standard keys. */
export type KeyCode = StandardKeyCode | (string & {});

/** Known mouse button aliases for auto-completion. */
export type KnownPointerButton =
  | "button1" | "button2" | "button3" | "button4" | "button5"
  | "shift_button" | "wheel" | "wheelLeft" | "wheelRight"
  | "leftBack" | "leftForward" | "middleBack"
  | "left" | "right" | "back" | "forward";

/** Pointer button string type with IntelliSense auto-completion for known mouse button aliases. */
export type PointerButtonAlias = KnownPointerButton | (string & {});

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

    if (conditions) {
      this.when(conditions);
    }
  }

  /**
   * Add one or more conditions to this case.
   *
   * @example
   * press(key("down_arrow")).when(condVar(mouseVars.rightButtonPressed, 1))
   */
  when(...conditions: (Condition | Condition[])[]): this {
    const flat = conditions.flat();
    if (flat.length > 0) {
      this.conditions = this.conditions ? [...this.conditions, ...flat] : flat;
    }
    return this;
  }

  /**
   * Set tap count requirement (e.g. 2 for double tap).
   *
   * @example
   * release(openUrl(URLS.rayClipboard)).withTapCount(2)
   */
  withTapCount(count: number): this {
    this.tapCount = count;
    return this;
  }

  /**
   * Alias for `withTapCount`.
   */
  taps(count: number): this {
    return this.withTapCount(count);
  }

  /**
   * Suppress trigger fallback for this case channel.
   */
  withSuppress(suppress = true): this {
    this.suppress = suppress;
    return this;
  }

  /**
   * Route tap1 release as a delayed single tap instead of immediate.
   */
  withDelayed(delayed = true): this {
    this.delayed = delayed;
    return this;
  }

  /**
   * Override description fragment for this case.
   */
  describe(desc: string): this {
    this.description = desc;
    return this;
  }
}

// ---------------------------------------------------------------------------
// Standalone Phase Helpers
// ---------------------------------------------------------------------------

/**
 * Defines a case triggered when a key or button is pressed (tap or immediate press).
 *
 * @param actions Action or array of actions to execute.
 * @param conditions Optional conditions for this specific case.
 *
 * @example
 * press(openApp(APP_ID.claude))
 * press(key("down_arrow", ["control"])).when(condVar(mouseVars.rightButtonPressed, 1))
 */
export function press(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("press", actions, conditions);
}

/**
 * Defines a case triggered when a key or button is held down beyond the hold threshold.
 *
 * @param actions Action or array of actions to execute while held.
 * @param conditions Optional conditions for this specific case.
 *
 * @example
 * hold(actHere("kitty"))
 * hold(openUrl(URLS.antinoteNewNoteInBackground))
 */
export function hold(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("hold", actions, conditions);
}

/**
 * Defines a case triggered upon key release (tap completed / key released).
 *
 * @param actions Action or array of actions to execute on release.
 * @param conditions Optional conditions for this specific case.
 *
 * @example
 * release(openUrl(URLS.rectWinMaximize, true))
 * release(combo(COMBOS.focusWinRight))
 */
export function release(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("release", actions, conditions);
}

/**
 * Defines a case triggered on a double-tap event.
 *
 * @param actions Action or array of actions to execute on double tap.
 * @param conditions Optional conditions for this specific case.
 *
 * @example
 * doubleTap(shell(CMDS.killAllApps))
 */
export function doubleTap(
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder("press", actions, conditions).withTapCount(2);
}

/**
 * Custom phase case helper.
 */
export function caseOf(
  phase: Phase,
  actions: Action | Action[],
  conditions?: Condition | Condition[],
): CaseBuilder {
  return new CaseBuilder(phase, actions, conditions);
}

// ---------------------------------------------------------------------------
// Trigger & Binding Wrappers
// ---------------------------------------------------------------------------

/**
 * Defines a key trigger with optional modifiers and simultaneous order.
 *
 * @param keys Single key or array of chord keys.
 * @param modifiers Modifier keys (e.g. `["left_command"]`, `["shift"]`, `VMOD.COCS`).
 * @param order Chord order constraints (e.g. `{ down: "strict" }`).
 */
export function triggerKeys(
  keys: KeyCode | KeyCode[],
  modifiers?: TriggerModifiers,
  order?: SimOrder,
): Trigger {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  return {
    keys: keysArray,
    ...(modifiers ? { modifiers } : {}),
    ...(order ? { order } : {}),
  };
}

/**
 * Defines a mouse pointer button trigger.
 *
 * @param pointer Mouse button code (e.g. `"button1"`, `"button2"`) or registered alias (e.g. `"shift_button"`, `"wheelLeft"`).
 * @param modifiers Optional modifier keys.
 */
export function triggerPointer(
  pointer: PointerButtonAlias,
  modifiers?: TriggerModifiers,
): Trigger {
  return {
    pointer,
    ...(modifiers ? { modifiers } : {}),
  };
}

export const keysTrigger = triggerKeys;
export const pointerTrigger = triggerPointer;

/** Input type accepted by the `from()` trigger builder function. */
export type FromInput =
  | Trigger
  | KeyCode
  | PointerButtonAlias
  | (KeyCode | PointerButtonAlias)[]
  | { key: KeyCode; modifiers?: TriggerModifiers }
  | { keys: KeyCode | KeyCode[]; modifiers?: TriggerModifiers; order?: SimOrder }
  | { pointer: PointerButtonAlias; modifiers?: TriggerModifiers };

/**
 * Constructs a normalized Karabiner `Trigger` from single keys, key chords, pointer buttons, or spec objects.
 *
 * @param input Key code (e.g. `"a"`), chord array (e.g. `["j", "k"]`), button alias (e.g. `"shift_button"`), or object spec.
 * @param modifiers Optional modifier keys (e.g. `["left_command"]`, `["shift"]`, `VMOD.COCS`).
 * @param order Optional simultaneous chord order constraints (e.g. `{ down: "strict" }`).
 *
 * @example
 * from("a", ["shift"])
 * from(["j", "k"], ["left_shift"], { down: "strict" })
 * from("shift_button")
 */
export function from(
  input: FromInput,
  modifiers?: TriggerModifiers,
  order?: SimOrder,
): Trigger {
  if (typeof input === "string" || Array.isArray(input)) {
    return triggerKeys(input as KeyCode | KeyCode[], modifiers, order);
  }

  if (typeof input === "object" && input !== null) {
    if ("pointer" in input) {
      return triggerPointer(input.pointer, input.modifiers);
    }
    if ("key" in input) {
      return triggerKeys(input.key, input.modifiers);
    }
    if ("keys" in input) {
      return triggerKeys(input.keys as KeyCode | KeyCode[], input.modifiers, input.order);
    }
  }

  throw new Error(`Invalid trigger input passed to from(): ${JSON.stringify(input)}`);
}

export const fromKeys = triggerKeys;
export const fromPointer = triggerPointer;

/** Container for `to()` output cases wrapper. */
export type ToWrapper = {
  kind: "to";
  cases: Case[];
};

/**
 * Wraps output cases (`press`, `hold`, `release`, `doubleTap`) for a binding.
 *
 * @param cases One or more case specifications or arrays of cases.
 *
 * @example
 * to(press(openApp(APP_ID.systemSettings)))
 * to(
 *   release(shell(CMDS.winLeftOrTop)),
 *   hold(openUrl(URLS.rectAppPrevDisplay, true))
 * )
 */
export function to(...cases: (Case | Case[])[]): ToWrapper {
  return {
    kind: "to",
    cases: cases.flat(),
  };
}

/** Container for `when()` conditions wrapper. */
export type WhenWrapper = {
  kind: "when";
  conditions: Condition[];
};

/**
 * Wraps binding-level conditions (`condApp`, `condVar`, `condDevice`).
 *
 * @param conditions One or more condition specifications.
 *
 * @example
 * when(condApp(APP_ID.skim))
 * when(condDevice(DEVICES.g502X), condVar(mouseVars.rightButtonPressed, 1))
 */
export function when(...conditions: (Condition | Condition[])[]): WhenWrapper {
  return {
    kind: "when",
    conditions: conditions.flat(),
  };
}

/** Options specification type for Karabiner bindings. */
export type BindingOptionsSpec = Partial<Omit<Binding, "trigger" | "cases">>;

/** Container for `options()` wrapper. */
export type OptionsWrapper = {
  kind: "options";
  opts: BindingOptionsSpec;
};

/**
 * Specifies binding-level options (`timing`, `whileHoldVar`, `multiTap`, `suppressCancelFallback`, `eventOptions`, etc.).
 *
 * @param opts Binding options object.
 *
 * @example
 * options({
 *   whileHoldVar: mouseVars.rightButtonPressed,
 *   timing: { aloneMs: 250, heldThresholdMs: 250 }
 * })
 */
export function options(opts: BindingOptionsSpec): OptionsWrapper {
  return {
    kind: "options",
    opts,
  };
}

/**
 * Specifies timing parameters (`aloneMs`, `heldThresholdMs`, `delayedMs`, `simultaneousMs`).
 *
 * @param opts Timing parameters object.
 *
 * @example
 * timing({ aloneMs: 250, heldThresholdMs: 250 })
 */
export function timing(opts: Binding["timing"]): OptionsWrapper {
  return options({ timing: opts });
}

export type BindingOptions = BindingOptionsSpec & {
  modifiers?: TriggerModifiers;
};

function isCase(val: any): boolean {
  return (
    typeof val === "object" &&
    val !== null &&
    ("do" in val || "phase" in val || val instanceof CaseBuilder)
  );
}

function isCondition(val: any): boolean {
  return (
    typeof val === "object" &&
    val !== null &&
    ("app" in val || "var" in val || "device" in val)
  );
}

function isTriggerModifiers(val: any): val is TriggerModifiers {
  return (
    Array.isArray(val) ||
    (typeof val === "object" &&
      val !== null &&
      ("mandatory" in val || "optional" in val))
  );
}

/** Argument types accepted by `bind()`. */
export type BindArg =
  | ToWrapper
  | WhenWrapper
  | OptionsWrapper
  | Case
  | Case[]
  | Condition
  | Condition[]
  | BindingOptionsSpec;

/**
 * Binds a trigger (`from`) to output cases (`to`), conditions (`when`), and binding options (`options` or `timing`).
 *
 * @param trigger Trigger input created via `from("key")`, `from(["j", "k"])`, or raw string key/chord.
 * @param args Composition of `to(...)`, `when(...)`, `options(...)`, `timing(...)`, cases, or conditions.
 *
 * @example
 * // Single action with app condition
 * bind(
 *   from("h", ["left_command"]),
 *   to(press(combo(COMBOS.skimHighlight))),
 *   when(condApp(APP_ID.skim))
 * )
 *
 * @example
 * // Multi-case tap & hold with custom timing
 * bind(
 *   from("left_arrow", ["COCS"]),
 *   to(
 *     release(shell(CMDS.winLeftOrTop)),
 *     hold(openUrl(URLS.rectAppPrevDisplay, true))
 *   ),
 *   timing({ aloneMs: 250, heldThresholdMs: 250 })
 * )
 */
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
      if (arg.length > 0) {
        const first = arg[0];
        if (isCondition(first)) {
          hoistedConditions.push(...(arg as Condition[]));
        } else {
          cases.push(...(arg as Case[]));
        }
      }
      continue;
    }

    if (isCase(arg)) {
      cases.push(arg as Case);
      continue;
    }

    if (isCondition(arg)) {
      hoistedConditions.push(arg as Condition);
      continue;
    }

    mergedOptions = { ...mergedOptions, ...(arg as BindingOptionsSpec) };
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

/** Legacy `bindKeys` function for backwards compatibility. */
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

/** Legacy `bindPointer` function for backwards compatibility. */
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

// ---------------------------------------------------------------------------
// ActionSpec Wrappers
// ---------------------------------------------------------------------------

/**
 * Creates an action that opens an application.
 *
 * @param ref App reference identifier (`APP_ID.kitty`, `APP_ID.claude`, etc.).
 * @param mode Optional execution mode (`"open"` or `"shell"`).
 * @param actionDesc Optional human-readable action description.
 *
 * @example
 * openApp(APP_ID.ringCentral)
 * openApp(APP_ID.claude, "shell")
 */
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

/**
 * Creates an action that opens a URL or deep-link protocol URL.
 *
 * @param url URL string or `URLRef` constant.
 * @param background If true, opens URL in background without raising browser.
 * @param actionDesc Optional human-readable action description.
 *
 * @example
 * openUrl(URLS.rectWinMaximize, true)
 */
export function openUrl(
  url: UrlRef | string,
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

/**
 * Creates an action that emits a key press.
 *
 * @param keyName Key code to emit (e.g. `"f18"`, `"down_arrow"`, `"tab"`).
 * @param modifiersOrOptions Optional modifiers array or key options.
 * @param options Key options (`repeat`, `halt`, `lazy`).
 * @param actionDesc Optional human-readable description.
 *
 * @example
 * key("f18", ["COC_"], { repeat: false })
 * key("down_arrow", ["control"])
 */
export function key(
  keyName: KeyCode,
  modifiersOrOptions?: ActionKeyModifier[] | KeyOptions,
  options?: KeyOptions,
  actionDesc?: string,
): ActionSpec {
  let modifiers: ActionKeyModifier[] | undefined;
  let opts: KeyOptions | undefined;

  if (Array.isArray(modifiersOrOptions)) {
    modifiers = modifiersOrOptions;
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
    key: keyName,
    ...(modifiers?.length ? { modifiers } : {}),
    options: finalOptions,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

/**
 * Creates an action that triggers an external hotkey (combo).
 *
 * @param ref External hotkey reference (`COMBOS.focusWinRight`, `COMBOS.showPopclip`, etc.).
 * @param options Key execution options.
 * @param actionDesc Optional description.
 *
 * @example
 * combo(COMBOS.focusWinRight)
 */
export function combo(
  ref: ExternalHkRef,
  options?: KeyOptions,
  actionDesc?: string,
): ActionSpec {
  return {
    type: "externalHk",
    ref,
    options: {
      ...options,
      repeat: options?.repeat ?? false,
    },
    ...(actionDesc ? { actionDesc } : {}),
  };
}

/**
 * Creates an action targeting the current app context.
 *
 * @example
 * actHere("kitty")
 */
export function actHere(action: string): ActionSpec {
  return { type: "actHere", action };
}

/**
 * Creates an action targeting window/app history navigation.
 */
export function appHistory(index: number): ActionSpec {
  return { type: "appHistory", index };
}

/**
 * Creates an action that opens a folder in Finder.
 *
 * @example
 * openFolder(PATHS.scriptNewDLs)
 */
export function openFolder(ref: PathRef, actionDesc?: string): ActionSpec {
  return {
    type: "folder",
    ref,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

/**
 * Creates an action that executes a system or application command.
 *
 * @example
 * cmd(CMDS.wordPrint)
 */
export function cmd(ref: CommandRef, actionDesc?: string): ActionSpec {
  return {
    type: "command",
    ref,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

/**
 * Creates an action that executes a shell command string or command reference.
 *
 * @example
 * shell(CMDS.hsFormatSelection)
 * shell("osascript -e 'tell application \"Popclip\" to appear'")
 */
export function shell(
  command: string | CommandRef,
  actionDesc?: string,
): ActionSpec {
  return {
    type: "shell",
    command,
    ...(actionDesc ? { actionDesc } : {}),
  };
}

/**
 * Creates an action that executes a Python script.
 *
 * @example
 * python("/path/to/script.py", ["arg1"])
 */
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

/**
 * Creates an action that executes an AppleScript file via osascript.
 */
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

/**
 * Creates a no-op action (swallows input without triggering any output).
 *
 * @example
 * press(noop())
 */
export function noop(): ActionSpec {
  return { type: "noop" };
}

/**
 * Creates an action that sets or toggles a Karabiner variable.
 *
 * @example
 * setVar(mouseVars.rightButtonPressed, 1)
 */
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

/** Emits standard Clipboard Cut action (Cmd+X). */
export function cut(): ActionSpec {
  return { type: "cut" };
}

/** Emits standard Clipboard Copy action (Cmd+C). */
export function copy(): ActionSpec {
  return { type: "copy" };
}

/** Emits standard Clipboard Paste action (Cmd+V). */
export function paste(): ActionSpec {
  return { type: "paste" };
}

/** Sequence wrapper executing multiple actions in order. */
export function sequence(...actions: ActionSpec[]): ActionSpec {
  return { type: "sequence", actions };
}

// ---------------------------------------------------------------------------
// Condition Wrappers
// ---------------------------------------------------------------------------

/**
 * Creates a variable condition (requires variable to equal specified value).
 *
 * @param varSpec Variable specification object.
 * @param equals Required value (default 1).
 * @param unlessOrOpts If true or `{ unless: true }`, condition is inverted (unless variable equals value).
 *
 * @example
 * condVar(mouseVars.rightButtonPressed, 1)
 */
export function condVar(
  varSpec: VarSpec,
  equals: string | number = 1,
  unlessOrOpts?: boolean | { unless?: boolean },
): Condition {
  const unless =
    typeof unlessOrOpts === "boolean"
      ? unlessOrOpts
      : unlessOrOpts?.unless ?? false;
  return {
    var: varSpec,
    equals,
    ...(unless ? { unless } : {}),
  };
}

/**
 * Creates an inverted variable condition (rule applies unless variable equals specified value).
 *
 * @example
 * condNotVar(mouseVars.wheelDown, 1)
 */
export function condNotVar(
  varSpec: VarSpec,
  equals: string | number = 1,
): Condition {
  return condVar(varSpec, equals, true);
}

/**
 * Creates an app condition (rule applies only when specified app is active/foremost).
 *
 * @param app App bundle identifier or array of apps.
 * @param isForemost If true (default), applies when foremost; if false, applies when NOT foremost.
 *
 * @example
 * condApp(APP_ID.skim)
 * condApp(APP_ID.word)
 */
export function condApp(
  app: AppRef | PathRef | (AppRef | PathRef)[],
  isForemost = true,
): Condition {
  return {
    app,
    ...(!isForemost ? { unless: true } : {}),
  };
}

/**
 * Creates an inverted app condition (rule applies unless specified app is active).
 *
 * @example
 * condNotApp(APP_ID.excel)
 */
export function condNotApp(
  app: AppRef | PathRef | (AppRef | PathRef)[],
): Condition {
  return condApp(app, false);
}

/**
 * Creates a device condition (rule applies only to specified hardware device).
 *
 * @param device Device specification object (`DEVICES.g502X`, etc.).
 * @param unlessOrOpts If true or `{ unless: true }`, condition is inverted.
 *
 * @example
 * condDevice(DEVICES.g502X)
 */
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

/**
 * Creates an inverted device condition (applies unless hardware device matches).
 */
export function condNotDevice(device: DeviceSpec): Condition {
  return condDevice(device, true);
}

