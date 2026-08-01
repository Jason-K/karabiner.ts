/**
 * Local profile loader and JSON generator replacing writeToProfile from karabiner.ts.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { KarabinerConfig, Rule } from "../types/karabiner";

export type WriteToProfileOptions = {
  name?: string;
  karabinerJsonPath?: string;
  dryRun?: boolean;
};

export function writeToProfile(
  target: string | WriteToProfileOptions,
  rulesInput: (Rule | { build: () => Rule })[],
  parameters?: Record<string, any>,
  extraProps?: { simple_modifications?: any[] },
): void {
  const options: WriteToProfileOptions =
    typeof target === "string"
      ? { name: target, dryRun: target === "--dry-run" }
      : target;

  const profileName = options.name ?? "Default profile";
  const jsonPath =
    options.karabinerJsonPath ?? join(homedir(), ".config", "karabiner", "karabiner.json");

  const rules: Rule[] = rulesInput.map((r) => (typeof (r as any).build === "function" ? (r as any).build() : r));

  if (options.dryRun) {
    console.log(`[dry-run] Generated ${rules.length} rules for profile '${profileName}'`);
    return;
  }

  try {
    const raw = readFileSync(jsonPath, "utf8");
    const config: KarabinerConfig = JSON.parse(raw);

    const profile = config.profiles.find((p) => p.name === profileName);
    if (!profile) {
      console.warn(`⚠️ Profile '${profileName}' not found in ${jsonPath}`);
      return;
    }

    profile.complex_modifications = {
      ...(parameters ? { parameters } : {}),
      rules,
    };

    if (extraProps?.simple_modifications) {
      const simpleMods = extraProps.simple_modifications.map((item: any) => {
        if (typeof item?.build === "function") {
          const built = item.build();
          return { from: built.from, to: built.to };
        }
        if (item?.manipulator) {
          return { from: item.manipulator.from, to: item.manipulator.to };
        }
        if (item?.[0]) {
          return { from: item[0].from, to: item[0].to };
        }
        return item;
      });
      profile.simple_modifications = simpleMods;
    }

    writeFileSync(jsonPath, JSON.stringify(config, null, 2));
    console.log(`✓ Successfully updated profile '${profileName}' in ${jsonPath}`);
  } catch (err) {
    console.error(`✗ Failed to write to profile '${profileName}':`, err);
  }
}
