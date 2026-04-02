import fs from 'fs';
import path from 'path';
import type { SubLayerConfig } from '../lib/leader/types';

function getDefaultOutputPaths(home: string): string[] {
  const candidates = [
    path.join(
      home,
      ".config/hammerspoon/modules/karabiner_layer_gui/space_layers.json",
    ),
    path.join(home, ".hammerspoon/karabiner_layer_gui/space_layers.json"),
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
  spaceLayers: SubLayerConfig[],
  outputPath?: string,
  debugMode: boolean = false,
): void {
  try {
    const home = process.env.HOME || '/Users/jason';
    const outputPaths = outputPath ? [outputPath] : getDefaultOutputPaths(home);
    const finalPath = outputPaths[0];

    if (debugMode) {
      console.log(`[LayerEmit Debug] Starting emission to: ${outputPaths.join(', ')}`);
    }

    const layers: Record<string, any> = {};

    layers.space = {
      label: '␣',
      keys: spaceLayers.map((layer) => ({
        key: layer.layerKey.toUpperCase(),
        desc: layer.layerName,
      })),
      widthHintPx: 235,
    };

    spaceLayers.forEach(({ layerKey, layerName, mappings, subLayers }) => {
      const layerId = `space_${layerKey.toUpperCase()}`;
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

      layers[layerId] = {
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
        const nestedId = `space_${layerKey.toUpperCase()}_${subLayer.layerKey.toUpperCase()}`;
        const nestedKeys = Object.entries(subLayer.mappings).map(([key, config]) => ({
          key: key.toUpperCase(),
          desc: config.description,
        }));

        layers[nestedId] = {
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

    const serialized = JSON.stringify(layers, null, 2);

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
        `✓ Emitted ${Object.keys(layers).length} layer definitions to ${targetPath}`,
      );
    });

    if (debugMode) {
      console.log('[LayerEmit Debug] Emission complete. Layers:', Object.keys(layers));
    }
  } catch (error) {
    console.error('✗ Failed to emit layer definitions:', error);
    if (debugMode) {
      console.error('[LayerEmit Debug] Full error:', error);
    }
  }
}
