import type { BaseSpec } from "./base";

export interface CommandSpec extends BaseSpec {
  type: "command";
  /** Shell command string */
  command: string;
}
