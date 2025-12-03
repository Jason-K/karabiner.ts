import type { ToEvent } from 'karabiner.ts';

/**
 * Consumer (media) key helpers.
 *
 * Karabiner uses `consumer_key_code` values like `al_dictionary` for the system Dictation key.
 * To keep naming consistent with other virtual keys, expose a helper that maps
 * the virtual name `vk_consumer_dictation` to the underlying `consumer_key_code`.
 */

/** Return a ToEvent for the system Dictation consumer key. */
export function vkConsumerDictation(): ToEvent {
  return { consumer_key_code: 'al_dictionary' } as any;
}

/**
 * Generic consumer key helper with a small alias map.
 * Extend this map as you add more consumer keys.
 */
const CONSUMER_ALIAS: Record<string, string> = {
  // virtual name -> karabiner consumer_key_code
  vk_consumer_dictation: 'al_dictation',
  vk_consumer_dictionary: 'al_dictionary',
};

export function consumerKey(virtualName: keyof typeof CONSUMER_ALIAS): ToEvent {
  const code = CONSUMER_ALIAS[virtualName];
  if (!code) throw new Error(`Unknown consumer key alias: ${virtualName}`);
  return { consumer_key_code: code } as any;
}
