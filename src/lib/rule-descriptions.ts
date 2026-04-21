export type RuleTrigger = 'tap' | 'hold' | 'multi-tap';

const DESCRIPTION_SEPARATOR = '        →    ';

const KEY_LABEL_OVERRIDES: Record<string, string> = {
  backslash: "\\",
  caps_lock: "CAPS",
  close_bracket: "]",
  comma: ",",
  delete_or_backspace: "DELETE",
  down_arrow: "DOWN",
  end: "END",
  equal_sign: "=",
  escape: "ESC",
  forward_delete: "DEL",
  grave_accent_and_tilde: "~",
  home: "HOME",
  hyphen: "-",
  keypad_asterisk: "*",
  keypad_enter: "RETURN",
  keypad_equal_sign: "PAD =",
  keypad_hyphen: "-",
  keypad_plus: "+",
  keypad_slash: "/",
  left_arrow: "LEFT",
  left_command: "CMD",
  left_control: "CTRL",
  left_option: "OPT",
  left_shift: "SHIFT",
  open_bracket: "[",
  page_down: "PGDN",
  page_up: "PGUP",
  period: ".",
  quote: "'",
  return_or_enter: "RETURN",
  right_arrow: "RIGHT",
  right_command: "CMD",
  right_control: "CTRL",
  right_option: "OPT",
  right_shift: "SHIFT",
  semicolon: ";",
  slash: "/",
  space: "SPACE",
  spacebar: "SPACE",
  tab: "TAB",
  up_arrow: "UP",
};

const MODIFIER_SYMBOLS: Record<string, string> = {
  alt: '⌥',
  command: '⌘',
  cmd: '⌘',
  control: '⌃',
  ctrl: '⌃',
  hyper: '✦',
  option: '⌥',
  opt: '⌥',
  shift: '⇧',
};

function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function splitChordTokens(chord: string | string[]): string[] {
  const parts = Array.isArray(chord) ? chord : chord.split('+');
  return parts.flatMap((part) =>
    part
      .split('+')
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function isModifierToken(token: string): boolean {
  const normalized = normalizeToken(token);
  if (normalized === 'hyper' || normalized === 'super' || normalized === 'meh') {
    return true;
  }

  if (MODIFIER_SYMBOLS[normalized]) {
    return true;
  }

  if (normalized.startsWith('left_') || normalized.startsWith('right_')) {
    const base = normalized.replace(/^(left|right)_/, '');
    return Boolean(MODIFIER_SYMBOLS[base]);
  }

  return false;
}

function modifierTokenToSymbols(token: string): string {
  const normalized = normalizeToken(token);

  if (normalized === 'super') {
    return '✦⇧';
  }

  if (normalized === 'meh') {
    return '⌘⌥⇧';
  }

  if (normalized === 'hyper') {
    return '✦';
  }

  let sidePrefix = '';
  let base = normalized;

  if (normalized.startsWith('left_')) {
    sidePrefix = '←';
    base = normalized.slice('left_'.length);
  } else if (normalized.startsWith('right_')) {
    sidePrefix = '→';
    base = normalized.slice('right_'.length);
  }

  return `${sidePrefix}${MODIFIER_SYMBOLS[base] ?? base.toUpperCase()}`;
}

function keyTokenToLabel(token: string): string {
  const normalized = normalizeToken(token);
  const override = KEY_LABEL_OVERRIDES[normalized];
  if (override) {
    return override;
  }

  if (/^[a-z]$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (/^[0-9]$/.test(normalized)) {
    return normalized;
  }

  if (/^f[0-9]{1,2}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (/^[+\-.,/;'\[\]=`~!@#$%^&*()_{}:"<>?\\]$/.test(token)) {
    return token;
  }

  if (normalized.startsWith('keypad_')) {
    const keypadLabel = keyTokenToLabel(normalized.slice('keypad_'.length));
    if (keypadLabel !== normalized.slice('keypad_'.length).toUpperCase()) {
      return keypadLabel;
    }
  }

  return normalized.replace(/_/g, ' ').toUpperCase();
}

function triggerLabel(trigger: RuleTrigger): string {
  switch (trigger) {
    case 'tap':
      return '(on tap)';
    case 'hold':
      return '(on hold)';
    case 'multi-tap':
      return '(on multi-tap)';
  }
}

export function formatRuleDescription(
  chord: string | string[],
  description: string,
  trigger: RuleTrigger,
): string {
  const tokens = splitChordTokens(chord);
  const segments: string[] = [];
  const modifierSymbols: string[] = [];

  let index = 0;
  while (index < tokens.length && isModifierToken(tokens[index])) {
    modifierSymbols.push(modifierTokenToSymbols(tokens[index]));
    index += 1;
  }

  if (modifierSymbols.length > 0) {
    segments.push(`[${modifierSymbols.join('')}]`);
  }

  for (; index < tokens.length; index += 1) {
    segments.push(`[${keyTokenToLabel(tokens[index])}]`);
  }

  if (segments.length === 0) {
    segments.push(`[${description.toUpperCase()}]`);
  }

  return `${segments.join('+')}${DESCRIPTION_SEPARATOR}${description} ${triggerLabel(trigger)}`;
}
