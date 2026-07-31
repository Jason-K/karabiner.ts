import type { Modifier } from "karabiner.ts";

// All valid Karabiner-native modifier keys
export type ModKey = Modifier;

// Expansion map for ActionSpec key modifiers — consumed by action-resolver.ts
// Virtual modifiers use fixed slots in COCS order:
// Cmd, Opt, Ctrl, Shift. Missing modifiers are represented by "_".
export const VMOD = {
    CO__: ["command", "option"],
    C_C_: ["command", "control"],
    C__S: ["command", "shift"],
    _OC_: ["option", "control"],
    _O_S: ["option", "shift"],
    __CS: ["control", "shift"],
    COC_: ["command", "option", "control"],
    CO_S: ["command", "option", "shift"],
    C_CS: ["command", "control", "shift"],
    _OCS: ["option", "control", "shift"],
    COCS: ["command", "option", "control", "shift"],
} as const satisfies Record<string, Modifier[]>;

export type ModComboAlias = keyof typeof VMOD;


export { MODIFIER_KEY_CODES, isModifierKey } from "../constants/keys";

// -------------------
// from karabiner.ts

export declare type FromKeyType = {
    key_code: FromKeyCode | number;
} | {
    consumer_key_code: FromConsumerKeyCode | number;
} | {
    pointing_button: PointingButton | number;
} | {
    any: 'key_code' | 'consumer_key_code' | 'pointing_button';
};

export declare type ModifierKeyCode = (typeof modifierKeyCodes)[number];
export declare let modifierKeyCodes: readonly ["left_control", "left_shift", "left_option", "left_command", "right_control", "right_shift", "right_option", "right_command", "fn", "caps_lock", "command", "control", "option", "shift"];

export declare type LetterKeyCode = (typeof letterKeyCodes)[number];
export declare let letterKeyCodes: readonly ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

export declare type NumberKeyCode = (typeof numberKeyCodes)[number];
export declare let numberKeyCodes: readonly ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export declare type ControlOrSymbolKeyCode = (typeof controlOrSymbolKeyCodes)[number];
export declare let controlOrSymbolKeyCodes: readonly ["return_or_enter", "escape", "delete_or_backspace", "delete_forward", "tab", "spacebar", "hyphen", "equal_sign", "open_bracket", "close_bracket", "backslash", "non_us_pound", "semicolon", "quote", "grave_accent_and_tilde", "comma", "period", "slash", "non_us_backslash"];

export declare type FunctionKeyCode = (typeof functionKeyCodes)[number];
export declare let functionKeyCodes: readonly ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "f13", "f14", "f15", "f16", "f17", "f18", "f19", "f20"];

export declare type ArrowKeyCode = (typeof arrowKeyCodes)[number];
export declare let arrowKeyCodes: readonly ["up_arrow", "down_arrow", "left_arrow", "right_arrow", "page_up", "page_down", "home", "end"];

export declare type KeypadKeyCode = (typeof keypadKeyCodes)[number];
export declare let keypadKeyCodes: readonly ["keypad_num_lock", "keypad_slash", "keypad_asterisk", "keypad_hyphen", "keypad_plus", "keypad_enter", "keypad_1", "keypad_2", "keypad_3", "keypad_4", "keypad_5", "keypad_6", "keypad_7", "keypad_8", "keypad_9", "keypad_0", "keypad_period", "keypad_equal_sign", "keypad_comma"];

export declare type OtherKeyCode = (typeof otherKeyCodes)[number];
export declare let otherKeyCodes: readonly ["volume_down", "volume_up", "mute", "volume_decrement", "volume_increment"];

export declare type PointingButton = (typeof pointingButtons)[number];
export declare let pointingButtons: readonly ["button1", "button2", "button3", "button4", "button5", "button6", "button7", "button8", "button9", "button10", "button11", "button12", "button13", "button14", "button15", "button16", "button17", "button18", "button19", "button20", "button21", "button22", "button23", "button24", "button25", "button26", "button27", "button28", "button29", "button30", "button31", "button32"];

export declare type PcKeyboardKeyCode = (typeof pcKeyboardKeyCodes)[number];
export declare let pcKeyboardKeyCodes: readonly ["print_screen", "scroll_lock", "pause", "insert", "application", "help", "power"];


export declare type FromOnlyKeyCode = (typeof fromOnlyKeyCodes)[number];
export declare let fromOnlyKeyCodes: readonly ["f21", "f22", "f23", "f24", "execute", "menu", "select", "stop", "again", "undo", "cut", "copy", "paste", "find", "international2", "international4", "international5", "international6", "international7", "international8", "international9", "lang3", "lang4", "lang5", "lang6", "lang7", "lang8", "lang9", "japanese_pc_nfer", "japanese_pc_xfer", "japanese_pc_katakana", "keypad_equal_sign_as400", "locking_caps_lock", "locking_num_lock", "locking_scroll_lock", "alternate_erase", "sys_req_or_attention", "cancel", "clear", "prior", "return", "separator", "out", "oper", "clear_or_again", "cr_sel_or_props", "ex_sel"];

export declare type FromOnlyConsumerKeyCode = (typeof fromOnlyConsumerKeyCodes)[number];
export declare let fromOnlyConsumerKeyCodes: readonly ["menu", "stop", "microphone", "selection", "bass_boost", "loudness", "bass_increment", "bass_decrement", "al_graphics_editor", "al_database_app", "al_newsreader", "al_voicemail", "al_contacts_or_address_book", "al_Calendar_Or_Schedule", "al_task_or_project_manager", "al_log_or_journal_or_timecard", "al_checkbook_or_finance", "al_a_or_v_capture_or_playback", "al_lan_or_wan_browser", "al_remote_networking_or_isp_connect", "al_network_conference", "al_network_chat", "al_telephony_or_dialer", "al_logon", "al_logoff", "al_logon_or_logoff", "al_control_panel", "al_command_line_processor_or_run", "al_process_or_task_manager", "al_select_task_or_application", "al_next_task_or_application", "al_previous_task_or_application", "al_preemptive_halt_task_or_application", "al_integrated_help_center", "al_documents", "al_thesaurus", "al_desktop", "al_spell_check", "al_grammer_check", "al_wireless_status", "al_keyboard_layout", "al_virus_protection", "al_encryption", "al_screen_saver", "al_alarms", "al_clock", "al_file_browser", "al_power_status", "al_image_browser", "al_audio_browser", "al_movie_browser", "al_digital_rights_manager", "al_digital_wallet", "al_instant_messaging", "al_oem_feature_browser", "al_oem_help", "al_online_community", "al_entertainment_content_browser", "al_online_shopping_browswer", "al_smart_card_information_or_help", "al_market_monitor_or_finance_browser", "al_customized_corporate_news_browser", "al_online_activity_browswer", "al_research_or_search_browswer", "al_audio_player", "al_message_status", "al_contact_sync", "al_navigation", "al_contextaware_desktop_assistant", "ac_home", "ac_back", "ac_forward", "ac_refresh", "ac_bookmarks", "ac_search", "ac_zoom_out", "ac_zoom_in", "menu_pick", "menu_up", "menu_down", "menu_left", "menu_right", "menu_escape", "menu_value_increase", "menu_value_decrease", "data_on_screen", "closed_caption", "closed_caption_select", "vcr_or_tv", "broadcast_mode", "snapshot", "still", "picture_in_picture_toggle", "picture_in_picture_swap", "red_menu_button", "green_menu_button", "blue_menu_button", "yellow_menu_button", "aspect", "three_dimensional_mode_select"];

export declare type FromAndToConsumerKeyCode = (typeof fromAndToConsumerKeyCodes)[number];
export declare let fromAndToConsumerKeyCodes: readonly ["rewind", "play_or_pause", "fast_forward", "mute", "volume_decrement", "volume_increment", "al_terminal_lock_or_screensaver", "eject", "scan_previous_track", "scan_next_track", "al_word_processor", "al_text_editor", "al_spreadsheet", "al_presentation_app", "al_email_reader", "al_calculator", "al_local_machine_browser", "al_internet_browser", "al_dictionary", "fastforward"];

export declare type ToOnlyKeyCode = (typeof toOnlyKeyCodes)[number];
export declare let toOnlyKeyCodes: readonly ["vk_none", "vk_consumer_brightness_down", "vk_consumer_brightness_up", "vk_mission_control", "vk_launchpad", "vk_dashboard", "vk_consumer_illumination_down", "vk_consumer_illumination_up", "vk_consumer_previous", "vk_consumer_play", "vk_consumer_next", "display_brightness_decrement", "display_brightness_increment", "rewind", "play_or_pause", "fastforward", "apple_display_brightness_decrement", "apple_display_brightness_increment", "dashboard", "launchpad", "mission_control", "apple_top_case_display_brightness_decrement", "apple_top_case_display_brightness_increment", "illumination_decrement", "illumination_increment"];

export declare type ToOnlyConsumerKeyCode = (typeof toOnlyConsumerKeyCodes)[number];
export declare let toOnlyConsumerKeyCodes: readonly ["display_brightness_decrement", "display_brightness_increment", "dictation"];

export declare type StickyModifierKeyCode = (typeof stickyModifierKeyCodes)[number];
export declare let stickyModifierKeyCodes: readonly ["left_control", "left_shift", "left_option", "left_command", "right_control", "right_shift", "right_option", "right_command", "fn"];

// ALIASES
export declare type ArrowKeyAlias = keyof typeof arrowKeyAliases;
export declare let arrowKeyAliases: {
    readonly '\u2191': "up_arrow";
    readonly '\u2193': "down_arrow";
    readonly '\u2190': "left_arrow";
    readonly '\u2192': "right_arrow";
    readonly '\u21DE': "page_up";
    readonly '\u21DF': "page_down";
    readonly '\u2196\uFE0E': "home";
    readonly '\u2198\uFE0E': "end";
};

export declare type ControlOrSymbolKeyAlias = keyof typeof controlOrSymbolKeyAliases;
export declare let controlOrSymbolKeyAliases: {
    readonly '\u23CE': "return_or_enter";
    readonly '\u238B': "escape";
    readonly '\u232B': "delete_or_backspace";
    readonly '\u2326': "delete_forward";
    readonly '\u21E5': "tab";
    readonly '\u2423': "spacebar";
    readonly '-': "hyphen";
    readonly '=': "equal_sign";
    readonly '[': "open_bracket";
    readonly ']': "close_bracket";
    readonly '\\': "backslash";
    readonly ';': "semicolon";
    readonly "'": "quote";
    readonly '`': "grave_accent_and_tilde";
    readonly ',': "comma";
    readonly '.': "period";
    readonly '/': "slash";
};

export declare type ModifierKeyAlias = keyof typeof modifierKeyAliases;
export declare let modifierKeyAliases: {
    readonly '\u2318': "command";
    readonly '\u2325': "option";
    readonly '\u2303': "control";
    readonly '\u21E7': "shift";
    readonly '\u21EA': "caps_lock";
};

export declare type KeyCode = FromAndToKeyCode | FromOnlyKeyCode | ToOnlyKeyCode;
export declare type FromKeyCode = FromAndToKeyCode | FromOnlyKeyCode;
export declare type FromAndToKeyCode = ModifierKeyCode | ControlOrSymbolKeyCode | ArrowKeyCode | LetterKeyCode | NumberKeyCode | FunctionKeyCode | KeypadKeyCode | PcKeyboardKeyCode | OtherKeyCode;
export declare type ConsumerKeyCode = FromAndToConsumerKeyCode | FromOnlyConsumerKeyCode | ToOnlyConsumerKeyCode;
export declare type FromConsumerKeyCode = FromAndToConsumerKeyCode | FromOnlyConsumerKeyCode;
