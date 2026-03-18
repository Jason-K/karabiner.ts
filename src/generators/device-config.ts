export type SimpleModification = {
  from: { key_code: string };
  to: Array<{ key_code: string }>;
};

export type DeviceConfig = {
  identifiers: {
    vendor_id: number;
    product_id: number;
    is_keyboard?: boolean;
  };
  simple_modifications: SimpleModification[];
};

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
                simple_modifications: device.simple_modifications,
                ignore: false,
                manipulate_caps_lock_led: false,
                disable_built_in_keyboard_if_exists: false,
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

            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
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
