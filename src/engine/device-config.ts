export type SimpleModification = {
  from: { key_code: string };
  to: ReadonlyArray<{ key_code: string }>;
};
export type DeviceConfigSetting = {
  mouse_flip_wheel_vertical?: boolean;
  mouse_flip_wheel_horizontal?: boolean;
  mouse_xy_multiplier?: number;
  mouse_wheel_multiplier?: number;
  mouse_modify_events?: boolean;
  ignore_vendor_events?: boolean;
  ignore_device?: boolean;
  modify_events?: boolean;
  manipulate_caps_lock_led?: boolean;
};

export type DeviceConfig = {
  identifiers: {
    vendor_id: number;
    product_id: number;
    is_keyboard?: boolean;
    is_pointing_device?: boolean;
  };
  simple_modifications?: ReadonlyArray<SimpleModification>;
  settings?: DeviceConfigSetting;
};

import type { DeviceSpec } from "../data/refs";

/**
 * Strip a `DeviceSpec` to the shape Karabiner accepts as a device identifier.
 * Prevents the `name`/`deviceDesc` metadata from leaking into Karabiner's `identifiers[]`.
 */
export function karabinerDeviceId(spec: DeviceSpec): DeviceConfig["identifiers"] {
  const id: DeviceConfig["identifiers"] = {
    product_id: spec.product_id,
    vendor_id: spec.vendor_id,
  };
  if (spec.is_keyboard) id.is_keyboard = true;
  if (spec.is_pointing_device) id.is_pointing_device = true;
  return id;
}

/**
 * Build a `DeviceConfig` from a `DeviceSpec`, extracting both identifiers and
 * any device-specific settings declared on the spec.
 */
export function buildDeviceConfig(
  spec: DeviceSpec,
  simple_modifications?: ReadonlyArray<SimpleModification>,
): DeviceConfig {
  const settings: DeviceConfigSetting = {};
  if (spec.mouse_flip_wheel_vertical !== undefined) settings.mouse_flip_wheel_vertical = spec.mouse_flip_wheel_vertical;
  if (spec.mouse_flip_wheel_horizontal !== undefined) settings.mouse_flip_wheel_horizontal = spec.mouse_flip_wheel_horizontal;
  if (spec.mouse_xy_multiplier !== undefined) settings.mouse_xy_multiplier = spec.mouse_xy_multiplier;
  if (spec.mouse_wheel_multiplier !== undefined) settings.mouse_wheel_multiplier = spec.mouse_wheel_multiplier;
  if (spec.mouse_modify_events !== undefined) settings.mouse_modify_events = spec.mouse_modify_events;
  if (spec.modify_events !== undefined) settings.modify_events = spec.modify_events;
  if (spec.manipulate_caps_lock_led !== undefined) settings.manipulate_caps_lock_led = spec.manipulate_caps_lock_led;
  if (spec.ignore_vendor_events !== undefined) settings.ignore_vendor_events = spec.ignore_vendor_events;
  if (spec.ignore_device !== undefined) settings.ignore_device = spec.ignore_device;

  const config: DeviceConfig = { identifiers: karabinerDeviceId(spec) };
  if (simple_modifications !== undefined) config.simple_modifications = simple_modifications;
  if (Object.keys(settings).length > 0) config.settings = settings;
  return config;
}


export function updateDeviceConfigurations(profileName: string, deviceConfigs: DeviceConfig[]): void {
  import('fs').then((fs) => {
    import('os').then((os) => {
      import('path').then((path) => {
        try {
          const configPath = path.join(os.homedir(), '.config', 'karabiner', 'karabiner.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

          const profile = config.profiles.find((p: any) => p.name === profileName);
          if (profile) {
            const existingDevices = profile.devices || [];

            const definedDeviceKeys = new Set(
              deviceConfigs.map((d) => `${d.identifiers.vendor_id}_${d.identifiers.product_id}`),
            );

            profile.devices = [
              ...deviceConfigs.map((device) => ({
                identifiers: device.identifiers,
                ...(device.simple_modifications !== undefined && {
                  simple_modifications: device.simple_modifications,
                }),
                ...device.settings,
              })),
              ...existingDevices
                .filter((d: any) => {
                  const key = `${d.identifiers.vendor_id}_${d.identifiers.product_id}`;
                  return !definedDeviceKeys.has(key);
                })
                .map((d: any) => ({
                  ...d,
                  modify_events: false,
                })),
            ];

            const tmpPath = `${configPath}.tmp`;
            fs.writeFileSync(tmpPath, JSON.stringify(config, null, 4));
            fs.renameSync(tmpPath, configPath);
            console.log('✓ Device-specific simple_modifications updated.');
          } else {
            console.error(`✗ ${profileName} profile not found`);
          }
        } catch (error) {
          console.error('Error updating device configurations:', error);
        }
      });
    });
  });
}
