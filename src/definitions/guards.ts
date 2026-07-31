import { APP_ID } from "../data";
import {
  bind,
  from,
  guard,
  ifApp,
  key,
  to,
  when,
  type Binding,
} from "../engine";

export const globalGuardBinding: Binding = bind(
  from("q", ["left_command"]),
  to(guard(key("q", ["left_command"]))),
);

export const antinoteGuardBinding: Binding = bind(
  from("d", ["left_command"]),
  to(guard(key("d", ["left_command"]))),
  when(ifApp(APP_ID.antinote)),
);

export const guardBindings: Binding[] = [
  globalGuardBinding,
  antinoteGuardBinding,
];
