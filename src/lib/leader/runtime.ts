import type { SubLayerConfig } from './types';

export function getSublayerVarName(prefix: string, layerKey: string): string {
  return `${prefix}_${layerKey}_sublayer`;
}

export function getNestedSublayerVarName(prefix: string, layerKey: string, nestedLayerKey: string): string {
  return `${prefix}_${layerKey}_${nestedLayerKey}_sublayer`;
}

function normalizeShellPath(inputPath: string): string {
  if (inputPath.startsWith('~/')) {
    return `$HOME/${inputPath.slice(2)}`;
  }
  return inputPath;
}

function shellDoubleQuote(input: string): string {
  return `"${input.replace(/"/g, '\\"')}"`;
}

export function buildSpaceLayerDebugLogCommand(message: string, logPath: string): string {
  const resolvedPath = normalizeShellPath(logPath);
  const escapedMessage = message.replace(/"/g, '\\"');
  const quotedPath = shellDoubleQuote(resolvedPath);

  return [
    `mkdir -p "$(dirname ${quotedPath})"`,
    `printf '%s ${escapedMessage}\\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> ${quotedPath}`,
  ].join(' && ');
}

export function getAllSublayerVars(spaceLayers: SubLayerConfig[], prefix: string = 'space'): string[] {
  const vars: string[] = [];

  spaceLayers.forEach((layer) => {
    vars.push(getSublayerVarName(prefix, layer.layerKey));
    (layer.subLayers || []).forEach((subLayer) => {
      vars.push(getNestedSublayerVarName(prefix, layer.layerKey, subLayer.layerKey));
    });
  });

  return vars;
}
