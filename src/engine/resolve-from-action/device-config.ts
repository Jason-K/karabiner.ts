export type SimpleModification = {
  from: { key_code: string };
  to: ReadonlyArray<{ key_code: string }>;
};
export type DeviceConfigSetting = {
  mouse_flip_vertical_wheel?: boolean;
  mouse_flip_horizontal_wheel?: boolean;
  pointing_motion_xy_multiplier?: number;
  pointing_motion_wheels_multiplier?: number;
  mouse_modify_events?: boolean;
  ignore_vendor_events?: boolean;
  ignore?: boolean;
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

import type { DeviceSpec } from "../../data/refs";

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
  if (spec.mouse_flip_vertical_wheel !== undefined) settings.mouse_flip_vertical_wheel = spec.mouse_flip_vertical_wheel;
  if (spec.mouse_flip_horizontal_wheel !== undefined) settings.mouse_flip_horizontal_wheel = spec.mouse_flip_horizontal_wheel;
  if (spec.pointing_motion_xy_multiplier !== undefined) settings.pointing_motion_xy_multiplier = spec.pointing_motion_xy_multiplier;
  if (spec.pointing_motion_wheels_multiplier !== undefined) settings.pointing_motion_wheels_multiplier = spec.pointing_motion_wheels_multiplier;
  if (spec.mouse_modify_events !== undefined) settings.mouse_modify_events = spec.mouse_modify_events;
  if (spec.modify_events !== undefined) settings.modify_events = spec.modify_events;
  if (spec.manipulate_caps_lock_led !== undefined) settings.manipulate_caps_lock_led = spec.manipulate_caps_lock_led;
  if (spec.ignore_vendor_events !== undefined) settings.ignore_vendor_events = spec.ignore_vendor_events;
  if (spec.ignore !== undefined) settings.ignore = spec.ignore;

  const config: DeviceConfig = { identifiers: karabinerDeviceId(spec) };
  if (simple_modifications !== undefined) config.simple_modifications = simple_modifications;
  if (Object.keys(settings).length > 0) config.settings = settings;
  return config;
}



/**
 * Generate a unique key for a device identifier distinguishing pointing device vs keyboard.
 */
export function getDeviceKey(identifiers: DeviceConfig["identifiers"]): string {
  const type = identifiers.is_pointing_device
    ? "pointing"
    : identifiers.is_keyboard
    ? "keyboard"
    : "generic";
  return `${identifiers.vendor_id}_${identifiers.product_id}_${type}`;
}

/**
 * Expands a list of `DeviceConfig` entries.
 * Pointing devices automatically emit both their pointing device entry
 * and a companion keyboard entry with `ignore: true` (if one was not already explicitly provided).
 */
export function expandDeviceConfigs(configs: ReadonlyArray<DeviceConfig>): DeviceConfig[] {
  const expanded: DeviceConfig[] = [];
  for (const config of configs) {
    expanded.push(config);
    if (config.identifiers.is_pointing_device) {
      const hasKeyboardConfig = configs.some(
        (c) =>
          c.identifiers.vendor_id === config.identifiers.vendor_id &&
          c.identifiers.product_id === config.identifiers.product_id &&
          c.identifiers.is_keyboard === true,
      );
      if (!hasKeyboardConfig) {
        expanded.push({
          identifiers: {
            vendor_id: config.identifiers.vendor_id,
            product_id: config.identifiers.product_id,
            is_keyboard: true,
          },
          settings: {
            ignore: true,
          },
        });
      }
    }
  }
  return expanded;
}

export function updateDeviceConfigurations(profileName: string, deviceConfigs: DeviceConfig[]): void {
  const allDeviceConfigs = expandDeviceConfigs(deviceConfigs);

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
              allDeviceConfigs.map((d) => getDeviceKey(d.identifiers)),
            );

            profile.devices = [
              ...allDeviceConfigs.map((device) => ({
                identifiers: device.identifiers,
                ...(device.simple_modifications !== undefined && {
                  simple_modifications: device.simple_modifications,
                }),
                ...device.settings,
              })),
              ...existingDevices
                .filter((d: any) => {
                  const key = getDeviceKey(d.identifiers);
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

