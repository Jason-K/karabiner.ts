import { ifApp, ifDevice } from "../karabiner-helpers";
import type { Condition } from "../../data";
import { karabinerDeviceId } from "../resolve-trigger/device-config";


/**
 * Resolve a high-level Condition specification (app, var, device) into a
 * Karabiner-native manipulator condition object.
 */
export function resolveCondition(c: Condition): unknown {
  if ("app" in c) {
    const refs = Array.isArray(c.app) ? c.app : [c.app];
    const bundleIds: string[] = [];
    const filePaths: string[] = [];
    for (const r of refs) {
      if (typeof r === "string") {
        if (r.startsWith("/") || r.endsWith(".app")) {
          filePaths.push(r);
        } else {
          bundleIds.push(r);
        }
      } else if (r.type === "path") {
        const p = r.path ?? (r as any).name;
        if (p) filePaths.push(...(Array.isArray(p) ? p : [p]));
      } else {
        if (r.bundleId) {
          const ids = Array.isArray(r.bundleId) ? r.bundleId : [r.bundleId];
          bundleIds.push(...ids);
        }
        if (r.path) {
          const paths = Array.isArray(r.path) ? r.path : [r.path];
          filePaths.push(...paths);
        }
        if (!r.bundleId && !r.path && (r as any).name) {
          const names = Array.isArray((r as any).name) ? (r as any).name : [(r as any).name];
          bundleIds.push(...names);
        }
      }
    }
    const builder =
      filePaths.length > 0 && bundleIds.length > 0
        ? ifApp({ bundle_identifiers: bundleIds, file_paths: filePaths })
        : filePaths.length > 0
          ? ifApp({ file_paths: filePaths })
          : ifApp(bundleIds);
    return c.unless ? builder.unless().build() : builder.build();
  }
  if ("var" in c) {
    return {
      type: c.unless ? "variable_unless" : "variable_if",
      name: c.var.name,
      value: c.equals,
    };
  }
  // device
  return c.unless
    ? ifDevice(karabinerDeviceId(c.device)).unless().build()
    : ifDevice(karabinerDeviceId(c.device)).build();
}
