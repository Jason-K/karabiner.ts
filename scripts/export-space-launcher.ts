/// <reference types="node" />

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { NestedLayerConfig, SubLayerConfig } from "../src/core/leader/types";
import { appRegistry, folderRegistry } from "../src/data";
import { spaceLayerDefinitions } from "../src/definitions";

type SpaceLauncherAction =
  | { openApp: { hideAppIfRunning: boolean; path: string } }
  | { openFolder: { folderPath: string } };

type SpaceLauncherKeyBinding = {
  action: SpaceLauncherAction;
  applicationScope: { allBut: { paths: string[] } };
  enabled: boolean;
  id: string;
  keys: number[];
  leaderKey: {
    hold: {
      info: {
        keepsTapFunction: boolean;
        keyCode: number;
      };
    };
  };
  description: string;
};

type SpaceLauncherExport = {
  appVersion: string;
  exportedAt: string;
  format: string;
  keyBindings: SpaceLauncherKeyBinding[];
  version: number;
};

const DEFAULT_OUTPUT_PATH = "/Users/jason/.config/karabiner/space-layer.slbindings";
const SPACE_LAUNCHER_APP_VERSION = process.env.SPACE_LAUNCHER_APP_VERSION ?? "3.0.11 (151)";
const SPACE_LAUNCHER_FORMAT = "name.guoc.SpaceLauncher.key-bindings";
const LEADER_KEY_CODE = 49;

const KEY_CODES: Record<string, number> = {
  a: 0,
  b: 11,
  c: 8,
  d: 2,
  e: 14,
  f: 3,
  g: 5,
  h: 4,
  i: 34,
  j: 38,
  k: 40,
  l: 37,
  m: 46,
  n: 45,
  o: 31,
  p: 35,
  q: 12,
  r: 15,
  s: 1,
  t: 17,
  u: 32,
  v: 9,
  w: 13,
  x: 7,
  y: 16,
  z: 6,
  "0": 29,
  "1": 18,
  "2": 19,
  "3": 20,
  "4": 21,
  "5": 23,
  "6": 22,
  "7": 26,
  "8": 28,
  "9": 25,
  "=": 24,
  ".": 47,
  tab: 48,
};

const appPathCache = new Map<string, string | null>();

type RecursiveLayerConfig = SubLayerConfig & {
  subLayers?: RecursiveLayerConfig[];
};

function resolveAppPath(bundleIdentifier: string): string | null {
  if (appPathCache.has(bundleIdentifier)) {
    return appPathCache.get(bundleIdentifier) ?? null;
  }

  try {
    const output = execFileSync(
      "mdfind",
      [`kMDItemCFBundleIdentifier == '${bundleIdentifier}'`],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    const lines = output.split("\n");
    const appPath =
      lines.map((line: string): string => line.trim()).find((line: string): boolean =>
        line.endsWith(".app"),
      ) ?? null;

    appPathCache.set(bundleIdentifier, appPath);
    return appPath;
  } catch {
    appPathCache.set(bundleIdentifier, null);
    return null;
  }
}

function keyCodeFor(key: string): number {
  const keyCode = KEY_CODES[key];

  if (keyCode === undefined) {
    throw new Error(`Unsupported SpaceLauncher key: ${key}`);
  }

  return keyCode;
}

function formatSequence(pathKeys: string[]): string {
  return ["Space", ...pathKeys.map((key) => key.toUpperCase())].join("+");
}

function formatDescription(pathKeys: string[], description: string): string {
  return `${formatSequence(pathKeys)} → ${description}`;
}

function buildBinding(
  pathKeys: string[],
  action: SpaceLauncherAction,
  description: string,
): SpaceLauncherKeyBinding {
  return {
    action,
    applicationScope: { allBut: { paths: [] } },
    enabled: true,
    id: randomUUID().toUpperCase(),
    keys: pathKeys.map(keyCodeFor),
    leaderKey: {
      hold: {
        info: {
          keepsTapFunction: true,
          keyCode: LEADER_KEY_CODE,
        },
      },
    },
    description: formatDescription(pathKeys, description),
  };
}

function resolvePortableAction(
  action: SubLayerConfig["mappings"][string]["action"],
): SpaceLauncherAction | null {
  if (!action) {
    return null;
  }

  if (action.type === "folder") {
    return {
      openFolder: {
        folderPath: folderRegistry[action.ref],
      },
    };
  }

  if (action.type !== "app") {
    return null;
  }

  const bundleIdentifier =
    action.ref === "folderOpener" ? appRegistry.qspace : appRegistry[action.ref];
  const appPath = resolveAppPath(bundleIdentifier);

  if (!appPath) {
    return null;
  }

  return {
    openApp: {
      hideAppIfRunning: false,
      path: appPath,
    },
  };
}

function collectBindings(
  layers: RecursiveLayerConfig[],
  prefixKeys: string[] = [],
): { bindings: SpaceLauncherKeyBinding[]; skipped: string[] } {
  const bindings: SpaceLauncherKeyBinding[] = [];
  const skipped: string[] = [];

  for (const layer of layers) {
    const nextPrefix = [...prefixKeys, layer.layerKey];

    for (const [key, config] of Object.entries(layer.mappings)) {
      const portableAction = resolvePortableAction(config.action);
      const sequence = [...nextPrefix, key];

      if (!portableAction) {
        skipped.push(formatDescription(sequence, config.description));
        continue;
      }

      bindings.push(buildBinding(sequence, portableAction, config.description));
    }

    for (const subLayer of layer.subLayers ?? []) {
      const nested = collectBindings([subLayer as NestedLayerConfig], nextPrefix);
      bindings.push(...nested.bindings);
      skipped.push(...nested.skipped);
    }
  }

  return { bindings, skipped };
}

function buildExport(): SpaceLauncherExport {
  const { bindings, skipped } = collectBindings(spaceLayerDefinitions);

  if (skipped.length > 0) {
    console.warn("[space-launcher] skipped non-portable bindings:");
    for (const entry of skipped) {
      console.warn(`  - ${entry}`);
    }
  }

  return {
    appVersion: SPACE_LAUNCHER_APP_VERSION,
    exportedAt: new Date().toISOString(),
    format: SPACE_LAUNCHER_FORMAT,
    keyBindings: bindings,
    version: 1,
  };
}

function main(): void {
  const outputPath = process.argv[2] ?? DEFAULT_OUTPUT_PATH;
  const exportData = buildExport();
  const serialized = `${JSON.stringify(exportData, null, 2)}\n`;

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");

  console.log(
    `[space-launcher] wrote ${exportData.keyBindings.length} bindings to ${outputPath}`,
  );
}

main();