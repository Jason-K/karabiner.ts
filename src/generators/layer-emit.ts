import fs from 'fs';
import path from 'path';
import type { SubLayerConfig } from '../lib/leader/types';

export function emitLayerDefinitions(
  spaceLayers: SubLayerConfig[],
  outputPath?: string,
  debugMode: boolean = false,
): void {
  try {
    const finalPath = outputPath || path.join(
      process.env.HOME || '/Users/jason',
      '.config/hammerspoon/karabiner_layer_gui/space_layers.json',
    );

    if (debugMode) {
      console.log(`[LayerEmit Debug] Starting emission to: ${finalPath}`);
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

    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      if (debugMode) {
        console.log(`[LayerEmit Debug] Creating directory: ${dir}`);
      }
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(finalPath, JSON.stringify(layers, null, 2));

    console.log(
      `✓ Emitted ${Object.keys(layers).length} layer definitions to ${finalPath}`,
    );

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
