import type { BaseSpec } from "./base";

export interface PathSpec extends BaseSpec {
  type: "path";
  /** File path string */
  path: string;
}
