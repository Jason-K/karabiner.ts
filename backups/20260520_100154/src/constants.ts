const runtimeProcess = globalThis as {
	process?: {
		env?: Record<string, string | undefined>;
	};
};

export const HOME_DIR = runtimeProcess.process?.env?.HOME ?? "/Users/jason";

export const SPACE_LAYER_DEBUG = false;
export const SPACE_LAYER_DEBUG_LOG_PATH = "~/.config/hammerspoon/logs/space_layer.log";
export const SPACE_LAYER_PREFIX = "space";
export const SPACE_LAYER_LEADER_KEY = "spacebar";
export const SPACE_LAYER_LABEL = "SPACE";
export const SPACE_LAYER_INDICATOR_ROOT = "space";

export const DESCRIPTION_SEPARATOR = "        →    ";

export const KEY_LABEL_OVERRIDES: Record<string, string> = {
	backslash: "\\",
	caps_lock: "CAPS",
	close_bracket: "]",
	comma: ",",
	delete_or_backspace: "DELETE",
	down_arrow: "DOWN",
	end: "END",
	equal_sign: "=",
	escape: "ESC",
	forward_delete: "DEL",
	grave_accent_and_tilde: "~",
	home: "HOME",
	hyphen: "-",
	keypad_asterisk: "*",
	keypad_enter: "RETURN",
	keypad_equal_sign: "PAD =",
	keypad_hyphen: "-",
	keypad_plus: "+",
	keypad_slash: "/",
	left_arrow: "LEFT",
	left_command: "CMD",
	left_control: "CTRL",
	left_option: "OPT",
	left_shift: "SHIFT",
	open_bracket: "[",
	page_down: "PGDN",
	page_up: "PGUP",
	period: ".",
	quote: "'",
	return_or_enter: "RETURN",
	right_arrow: "RIGHT",
	right_command: "CMD",
	right_control: "CTRL",
	right_option: "OPT",
	right_shift: "SHIFT",
	semicolon: ";",
	slash: "/",
	space: "SPACE",
	spacebar: "SPACE",
	tab: "TAB",
	up_arrow: "UP",
};

export const MODIFIER_SYMBOLS: Record<string, string> = {
	alt: "⌥",
	command: "⌘",
	cmd: "⌘",
	control: "⌃",
	ctrl: "⌃",
	hyper: "✦",
	option: "⌥",
	opt: "⌥",
	shift: "⇧",
};

export const appRegistry = {
	activityMonitor: "com.apple.ActivityMonitor",
	antinote: "com.chabomakers.Antinote-setapp",
	antinoteLegacy: "com.chabomakers.Antinote",
	browser: "app.zen-browser.zen",
	calendar: "com.busymac.busycal-setapp",
	claude: "com.anthropic.claudefordesktop",
	code: "com.microsoft.VSCode",
	excel: "com.microsoft.Excel",
	folderOpener: "__folder_opener__",
	helium: "net.imput.helium",
	kitty: "net.kovidgoyal.kitty",
	messages: "com.apple.MobileSMS",
	numi: "com.nikolaeu.numi-setapp",
	onePiece: "jp.fuji.1Piece",
	outlook: "com.microsoft.Outlook",
	processSpy: "com.itone.ProcessSpy",
	protonMail: "ch.protonmail.desktop",
	qspace: "com.jinghaoshe.qspace.pro",
	ringCentral: "com.ringcentral.glip",
	securityAgent: "com.apple.SecurityAgent",
	settings: "com.apple.systempreferences",
	settingsPrivacySecurityExtension: "com.apple.settings.PrivacySecurity.extension",
	skim: "net.sourceforge.skim-app.skim",
	spotify: "com.spotify.client",
	teams: "com.microsoft.teams2",
	todoist: "com.todoist.mac.Todoist",
	word: "com.microsoft.Word",
} as const;

export type AppRef = keyof typeof appRegistry;

export const folderRegistry = {
	applications: "/Applications/",
	cases: `${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/`,
	chezmoi: `${HOME_DIR}/.local/share/chezmoi/`,
	downloads: `${HOME_DIR}/Downloads/`,
	downloads3dPrinting: `${HOME_DIR}/Downloads/3dPrinting`,
	downloadsArchives: `${HOME_DIR}/Downloads/Archives`,
	downloadsInstalls: `${HOME_DIR}/Downloads/Installs`,
	downloadsOffice: `${HOME_DIR}/Downloads/Office`,
	downloadsPdfs: `${HOME_DIR}/Downloads/PDFs/`,
	gits: `${HOME_DIR}/gits/`,
	home: `${HOME_DIR}/`,
	library: `${HOME_DIR}/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/`,
	scripts: `${HOME_DIR}/Scripts/`,
	workspaces: `${HOME_DIR}/Scripts/workspaces/`,
} as const;

export type FolderRef = keyof typeof folderRegistry;

export const PATHS = {
	karabinerConfig: `${HOME_DIR}/.config/karabiner/karabiner.json`,
	killAppBin: "~/.local/bin/kill-app",
	openAppBin: "~/.local/bin/open-app",
	recentDownloadsScript: `${HOME_DIR}/Scripts/filesystem/recent_changes/recent_dl.sh`,
	takeActionHereScript: "~/Scripts/active_process/take_action_here/take_action_here.sh",
	textProcessorDir: "~/Scripts/strings/text_processor",
	textProcessorEntrypoint: "interfaces/cli.py",
	textProcessorUvBin: "~/.local/bin/uv",
	typinatorEditLastAppleScript: "~/Scripts/apps/Typinator/Edit_Last_Typinator_Expansion.applescript",
	typinatorPythonBin: "~/.venv/typinator/bin/python",
	typinatorNewRuleScript: "~/Scripts/apps/Typinator/new_rule.py",
	wordDocumentPathAppleScript:
		"~/Scripts/apps/karabiner/karabiner.ts/scripts/applescripts/get-word-document-path.applescript",
} as const;

export const TIMINGS = {
	commandQuitProtectionMs: 300,
	conditionalTapHoldMs: 200,
	deviceUpdateDelayMs: 1000,
	escapeTapHoldMs: 250,
	mouseDefaultMs: 300,
	mouseDisplaySwitchMs: 400,
	mouseWheelChordMs: 200,
	privilegesPostElevationDelayMs: 1300,
	spotifyTapHoldMs: 400,
} as const;

export const ACCESSIBILITY_VARIABLES = {
	focusedUiRole: "accessibility.focused_ui_element.role_string",
	focusedUiSubrole: "accessibility.focused_ui_element.subrole_string",
} as const;

export const ACCESSIBILITY_VALUES = {
	secureTextFieldSubrole: "AXSecureTextField",
	textFieldRole: "AXTextField",
} as const;

export const DEVICE_IDENTIFIERS = {
	appleNumericKeypad: {
		vendor_id: 76,
		product_id: 802,
		is_keyboard: true,
	},
	logitechG502X: {
		product_id: 49305,
		vendor_id: 1133,
	},
} as const;

export const APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS = [
	{
		from: { key_code: "keypad_asterisk" },
		to: [{ key_code: "keypad_hyphen" }],
	},
	{
		from: { key_code: "keypad_equal_sign" },
		to: [{ key_code: "keypad_slash" }],
	},
	{
		from: { key_code: "keypad_hyphen" },
		to: [{ key_code: "keypad_plus" }],
	},
	{
		from: { key_code: "keypad_plus" },
		to: [{ key_code: "keypad_equal_sign" }],
	},
	{
		from: { key_code: "keypad_slash" },
		to: [{ key_code: "keypad_asterisk" }],
	},
	{ from: { key_code: "left_control" }, to: [{ key_code: "fn" }] },
	{ from: { key_code: "fn" }, to: [{ key_code: "left_control" }] },
] as const;

export type FocusAppBehavior = {
	appName: string;
	activationDelaySeconds: number;
	createWindowShortcut: {
		key: string;
		modifiers?: string[];
	};
};

export const FOCUS_APP_BEHAVIORS: Partial<
	Record<(typeof appRegistry)[AppRef], FocusAppBehavior>
> = {
	[appRegistry.antinote]: {
		appName: "Antinote",
		activationDelaySeconds: 0.2,
		createWindowShortcut: {
			key: "n",
			modifiers: ["command down"],
		},
	},
	[appRegistry.antinoteLegacy]: {
		appName: "Antinote",
		activationDelaySeconds: 0.2,
		createWindowShortcut: {
			key: "n",
			modifiers: ["command down"],
		},
	},
};

export const DEFAULT_PROFILE_NAME = "Default profile";
export const PREFERRED_PROFILE_NAME = "JJK_Default";
