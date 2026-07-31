import type { FolderOpener } from "../engine/resolvers";

export const FINDER_REPLACEMENT: FolderOpener = "qspace";

export const DEFAULT_GLOBAL_SETTINGS = {
    check_for_updates_on_startup: true,
    show_in_menu_bar: true,
    show_profile_name_in_menu_bar: false,
} as const;

