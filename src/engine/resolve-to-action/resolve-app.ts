import type {
  SoftwareFunctionOpenApplication,
  ToEvent,
} from "../../types/karabiner";

import type { AppTarget } from "../../data";
import { PATHS } from "../../data/registries/paths";
import { shellSingleQuote } from "../utils";

export interface OpenAppOpts {
  bundleIdentifier?: string;
  filePath?: string;
  historyIndex?: number;
  exclusionBundleIdentifiers?: string[];
  exclusionFilePaths?: string[];
}

/**
 * Build a `software_function.open_application` event.
 *
 * Karabiner resolves the target by priority: bundle identifier, then file path,
 * then frontmost-application history index.
 */
export function toApp(opts: OpenAppOpts): ToEvent {
  const target: SoftwareFunctionOpenApplication | undefined = opts.bundleIdentifier
    ? { bundle_identifier: opts.bundleIdentifier }
    : opts.filePath
      ? { file_path: opts.filePath }
      : opts.historyIndex !== undefined
        ? { frontmost_application_history_index: opts.historyIndex }
        : undefined;

  if (!target) {
    throw new Error(
      "toApp() needs a bundleIdentifier, filePath, or historyIndex to open.",
    );
  }

  return {
    software_function: {
      open_application: {
        ...target,
        ...(opts.exclusionBundleIdentifiers
          ? {
              frontmost_application_history_exclusion_bundle_identifiers:
                opts.exclusionBundleIdentifiers,
            }
          : {}),
        ...(opts.exclusionFilePaths
          ? {
              frontmost_application_history_exclusion_file_paths:
                opts.exclusionFilePaths,
            }
          : {}),
      },
    },
  };
}

export function toAppId(bundleIdentifier: string): string {
  return `${PATHS.binAppOpen.path} -b ${shellSingleQuote(bundleIdentifier)}`;
}

export function toAppPath(filePath: string): string {
  return `${PATHS.binAppOpen.path} ${shellSingleQuote(filePath)}`;
}

/**
 * Resolve an AppTarget ref to the correct app() argument shape.
 * - AppSpec  (type:"app")  → { bundleIdentifier } or { filePath }
 * - PathSpec (type:"path") → { filePath }
 * - raw string starting with "/" or ending with ".app" → { filePath }
 * - raw string otherwise → { bundleIdentifier } (treated as a bundle ID)
 */
export function resolveAppTarget(
  ref: AppTarget,
): { bundleIdentifier: string } | { filePath: string } {
  if (typeof ref === "string") {
    return ref.startsWith("/") || ref.endsWith(".app")
      ? { filePath: ref }
      : { bundleIdentifier: ref };
  }
  if (ref.type === "path") {
    const p = ref.path ?? (ref as any).name;
    return { filePath: Array.isArray(p) ? p[0]! : p };
  }
  if (ref.path) {
    const p = Array.isArray(ref.path) ? ref.path[0]! : ref.path;
    return { filePath: p };
  }
  if (ref.bundleId) {
    const b = Array.isArray(ref.bundleId) ? ref.bundleId[0]! : ref.bundleId;
    return { bundleIdentifier: b };
  }
  if ((ref as any).name) {
    const n = Array.isArray((ref as any).name) ? (ref as any).name[0]! : (ref as any).name;
    return n.startsWith("/") || n.endsWith(".app")
      ? { filePath: n }
      : { bundleIdentifier: n };
  }
  throw new Error(`Invalid AppSpec: missing bundleId or path`);
}
