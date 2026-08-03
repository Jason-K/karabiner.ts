import { APPS } from "../data";
import {
  bind,
  from,
  guard,
  ifApp,
  to,
  type Binding,
} from "../engine";

export const globalGuardBinding: Binding = bind(
  from("q", ["L.cmd"]),
  to(guard()),
);

export const antinoteGuardBinding: Binding = bind(
  from("d", ["L.cmd"]),
  to(guard(ifApp(APPS.antinote))),
);

export const guardBindings: Binding[] = [
  globalGuardBinding,
  antinoteGuardBinding,
];
