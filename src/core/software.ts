import type { ToEvent } from 'karabiner.ts';

export interface OpenAppOpts {
  bundleIdentifier?: string;
  filePath?: string;
  historyIndex?: number;
  exclusionBundleIdentifiers?: string[];
  exclusionFilePaths?: string[];
}

export function openApp(opts: OpenAppOpts): ToEvent {
  const openAppConfig: any = {};

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
    openAppConfig.frontmost_application_history_exclusion_bundle_identifiers = opts.exclusionBundleIdentifiers;
  }
  if (opts.exclusionFilePaths) {
    openAppConfig.frontmost_application_history_exclusion_file_paths = opts.exclusionFilePaths;
  }

  return {
    software_function: {
      open_application: openAppConfig,
    },
  } as ToEvent;
}
