import { APP_BUNDLES } from "../data";
import { bind, condApp, defineBindings, from, noop, press, type Binding } from "../engine";

// Disabled shortcuts swallow the chord entirely (noop = no `to` events).
export const disabledHotkeys: Binding[] = [
  bind(from("h", ["left_command"]), press(noop())),
  bind(from("h", ["left_command", "option"]), press(noop())),
  bind(from("m", ["left_command", "option"]), press(noop())),
  bind(from("d", ["left_command"]), press(noop()), {
    conditions: [condApp(APP_BUNDLES.antinote)],
  }),
];

export const buildDisabledHotkeys = () => defineBindings(disabledHotkeys);
