import type { BaseSpec } from "./base";

export interface UrlSpec extends BaseSpec {
  type: "url";
  /** The URL or custom URI scheme string to open */
  url: string;
  /** Optional integration category (e.g. 'raycast', 'cleanshot', 'rectangle') */
  category?: string;
}
