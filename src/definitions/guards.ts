import { APP_ID } from "../data";
import {
  bind,
  condApp,
  doubleTap,
  from,
  key,
  to,
  when,
  type Binding,
} from "../engine";

export const globalGuardBinding: Binding = bind(
  from("q", ["left_command"]),
  to(doubleTap(key("q", ["left_command"]))),
);

export const antinoteGuardBinding: Binding = bind(
  from("d", ["left_command"]),
  to(doubleTap(key("d", ["left_command"]))),
  when(condApp(APP_ID.antinote)),
);

export const guardBindings: Binding[] = [
  globalGuardBinding,
  antinoteGuardBinding,
];
