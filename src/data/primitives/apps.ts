import type { BaseSpec } from "./base";

export interface AppSpec extends BaseSpec {
  type: "app";
  /** macOS App Bundle Identifier(s), e.g. "com.apple.finder" */
  bundleId?: string | string[];
  /** Optional file path(s) to application binary/bundle */
  path?: string | string[];
}
