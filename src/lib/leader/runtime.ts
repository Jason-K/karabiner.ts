import type { SubLayerConfig } from './types';

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

export function getAllSublayerVars(spaceLayers: SubLayerConfig[]): string[] {
  const vars: string[] = [];

  spaceLayers.forEach((layer) => {
    vars.push(`space_${layer.layerKey}_sublayer`);
    (layer.subLayers || []).forEach((subLayer) => {
      vars.push(`space_${layer.layerKey}_${subLayer.layerKey}_sublayer`);
    });
  });

  return vars;
}
