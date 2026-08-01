import { APP_ID } from "../data";
import { bind, from, ifApp, noop, press, to, when, type Binding } from "../engine";

// Disabled shortcuts swallow the chord entirely (noop = no `to` events).
export const disabledHotkeys: Binding[] = [
  bind(from("h", ["L.cmd"]),
    to(press(noop()))),
  bind(from("h", ["L.cmd", "L.opt"]),
    to(press(noop()))),
  bind(from("m", ["L.cmd", "L.opt"]),
    to(press(noop()))),
  bind(
    from("d", ["L.cmd"]),
    to(press(noop())),
    when(ifApp(APP_ID.antinote)),
  ),
];

