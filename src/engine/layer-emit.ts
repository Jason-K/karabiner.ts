import fs from 'fs';
import path from 'path';
import type { SubLayerConfig } from '../core/leader/types';
import { HOME_DIR } from "../data";

function getDefaultOutputPaths(home: string, prefix: string): string[] {
  const filename = `${prefix}_layers.json`;
  const candidates = [
    path.join(home, `.config/hammerspoon/modules/karabiner_layer_gui/${filename}`),
    path.join(home, `.hammerspoon/karabiner_layer_gui/${filename}`),
  ];

  const existingDirCandidates = candidates.filter((candidate) =>
    fs.existsSync(path.dirname(candidate)),
  );

  if (existingDirCandidates.length > 0) {
    return existingDirCandidates;
  }

  return [candidates[0]];
}

export function emitLayerDefinitions(
  prefix: string,
  label: string,
  layers: SubLayerConfig[],
  outputPath?: string,
  debugMode: boolean = false,
): void {
  try {
    const home = HOME_DIR;
    const outputPaths = outputPath ? [outputPath] : getDefaultOutputPaths(home, prefix);
    const finalPath = outputPaths[0];

    if (debugMode) {
      console.log(`[LayerEmit Debug] Starting emission to: ${outputPaths.join(', ')}`);
    }

    const layerMap: Record<string, any> = {};

    layerMap[prefix] = {
      label,
      keys: layers.map((layer) => ({
        key: layer.layerKey.toUpperCase(),
        desc: layer.layerName,
      })),
      widthHintPx: 235,
    };

    layers.forEach(({ layerKey, layerName, mappings, subLayers }) => {
      const layerId = `${prefix}_${layerKey.toUpperCase()}`;
      const keys = Object.entries(mappings).map(([key, config]) => ({
        key: key.toUpperCase(),
        desc: config.description,
      }));

      (subLayers || []).forEach((subLayer) => {
        keys.push({
          key: subLayer.layerKey.toUpperCase(),
          desc: subLayer.layerName,
        });
      });

      layerMap[layerId] = {
        label: layerKey.toUpperCase(),
        keys,
        widthHintPx: 235,
      };

      if (debugMode) {
        console.log(
          `[LayerEmit Debug] Emitted layer ${layerId} with ${keys.length} keys`,
        );
      }

      (subLayers || []).forEach((subLayer) => {
        const nestedId = `${prefix}_${layerKey.toUpperCase()}_${subLayer.layerKey.toUpperCase()}`;
        const nestedKeys = Object.entries(subLayer.mappings).map(([key, config]) => ({
          key: key.toUpperCase(),
          desc: config.description,
        }));

        layerMap[nestedId] = {
          label: `${layerKey.toUpperCase()}${subLayer.layerKey.toUpperCase()}`,
          keys: nestedKeys,
          widthHintPx: 235,
        };

        if (debugMode) {
          console.log(
            `[LayerEmit Debug] Emitted layer ${nestedId} with ${nestedKeys.length} keys`,
          );
        }
      });
    });

    const serialized = JSON.stringify(layerMap, null, 2);

    outputPaths.forEach((targetPath) => {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        if (debugMode) {
          console.log(`[LayerEmit Debug] Creating directory: ${dir}`);
        }
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(targetPath, serialized);

      console.log(
        `✓ Emitted ${Object.keys(layerMap).length} layer definitions to ${targetPath}`,
      );
    });

    if (debugMode) {
      console.log('[LayerEmit Debug] Emission complete. Layers:', Object.keys(layerMap));
    }
  } catch (error) {
    console.error('✗ Failed to emit layer definitions:', error);
    if (debugMode) {
      console.error('[LayerEmit Debug] Full error:', error);
    }
  }
}
