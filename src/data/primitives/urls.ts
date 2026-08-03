import type { BaseSpec } from "./base";

/**
 * Registry specification for URLs and custom URI schemes.
 * Used for web browsing and deep-link launcher actions (`url`).
 *
 * @example
 * ```ts
 * const spotifyPlay: UrlSpec = {
 *   type: "url",
 *   url: "raycast://extensions/raycast/spotify-player/play-pause",
 *   category: "raycast",
 *   refDesc: "Toggle Spotify playback via Raycast",
 * };
 * ```
 */
export interface UrlSpec extends BaseSpec {
  /** Discriminator identifying this primitive as a URL specification. */
  type: "url";

  /**
   * The web URL or custom URI scheme string to open.
   *
   * @example "https://github.com"
   * @example "rectangle-pro://execute-action?name=maximize"
   */
  url: string;

  /**
   * Optional integration category or vendor tag.
   *
   * @example "raycast"
   * @example "rectangle"
   * @example "cleanshot"
   */
  category?: string;
}
