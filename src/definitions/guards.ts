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
  from("q", ["L.cmd"]),
  to(guard(key("q", ["L.cmd"]))),
);

export const antinoteGuardBinding: Binding = bind(
  from("d", ["L.cmd"]),
  to(guard(key("d", ["L.cmd"]))),
  when(ifApp(APP_ID.antinote)),
);

export const guardBindings: Binding[] = [
  globalGuardBinding,
  antinoteGuardBinding,
];
