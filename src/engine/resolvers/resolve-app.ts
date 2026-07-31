import type { ToEvent } from "karabiner.ts";

import type { AppTarget } from "../action-dsl";
import { PATHS } from "../../data/registry-paths";
import { shellSingleQuote } from "../utils";

export interface OpenAppOpts {
  bundleIdentifier?: string;
  filePath?: string;
  historyIndex?: number;
  exclusionBundleIdentifiers?: string[];
  exclusionFilePaths?: string[];
}

export function toApp(opts: OpenAppOpts): ToEvent {
  const openAppConfig: Record<string, unknown> = {};

  if (opts.bundleIdentifier) {
    openAppConfig.bundle_identifier = opts.bundleIdentifier;
  }
  if (opts.filePath) {
    openAppConfig.file_path = opts.filePath;
  }
  if (opts.historyIndex !== undefined) {
    openAppConfig.frontmost_application_history_index = opts.historyIndex;
  }
  if (opts.exclusionBundleIdentifiers) {
    openAppConfig.frontmost_application_history_exclusion_bundle_identifiers =
      opts.exclusionBundleIdentifiers;
  }
  if (opts.exclusionFilePaths) {
    openAppConfig.frontmost_application_history_exclusion_file_paths =
      opts.exclusionFilePaths;
  }

  return {
    software_function: {
      open_application: openAppConfig,
    },
  } as ToEvent;
}

export function toAppId(bundleIdentifier: string): string {
  return `${PATHS.binAppOpen.name} -b ${shellSingleQuote(bundleIdentifier)}`;
}

export function toAppPath(filePath: string): string {
  return `${PATHS.binAppOpen.name} ${shellSingleQuote(filePath)}`;
}

export function resolveName(ref: { name: string | string[] }): string {
  return Array.isArray(ref.name) ? ref.name[0]! : ref.name;
}

/**
 * Resolve an AppTarget ref to the correct openApp() argument shape.
 * - AppRef  (type:"app")  → { bundleIdentifier }
 * - PathRef (type:"path") → { filePath }
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
    return { filePath: resolveName(ref) };
  }
  return { bundleIdentifier: resolveName(ref) };
}
