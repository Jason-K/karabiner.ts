import { APP_ID } from "../data";
import { bind, condApp, from, noop, press, to, when, type Binding } from "../engine";

// Disabled shortcuts swallow the chord entirely (noop = no `to` events).
export const disabledHotkeys: Binding[] = [
  bind(from("h", ["left_command"]), to(press(noop()))),
  bind(from("h", ["left_command", "option"]), to(press(noop()))),
  bind(from("m", ["left_command", "option"]), to(press(noop()))),
  bind(
    from("d", ["left_command"]),
    to(press(noop())),
    when(condApp(APP_ID.antinote)),
  ),
];

