# Ref Primitives (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every `data/` registry to labeled `RefSpec`/`VarSpec`/`DeviceSpec` objects and switch `ActionSpec`/`Condition` to direct object refs (`ref: appRegistry.excel`, not `ref: "excel"`), keeping all Karabiner output byte-identical.

**Architecture:** Registries gain `{type, name, refDesc}` entries; resolvers read `.name` instead of doing a string-key lookup. This is pure infrastructure — the `refDesc` labels are unused in Phase 1 (they feed the Phase 2 description synthesizer). Because output is unchanged, the gate is byte-identity, not new tests. Phases 2 (synthesizer) and 3 (tap-hold) are planned separately after this lands.

**Tech Stack:** TypeScript, `karabiner.ts`, `node:test` (`tsx --test`), `tsx` to run `src/index.ts`.

## Global Constraints

- **Byte-identical gate:** after each task, `CI=true npx tsx src/index.ts` then `git diff --stat karabiner-output.json` must be **empty**. (Phase 1 changes types/structure only; `resolveActionToEvents`/`resolveCondition` still emit identical events/conditions.)
- **Never `npm run build` during iteration** — it writes the live Karabiner profile + reloads Hammerspoon. Use `CI=true npx tsx src/index.ts` to regenerate the golden.
- **Tests gate:** `npm run typecheck && npm run lint && npm test` must stay green (currently 117 pass / 0 fail / 6 skipped).
- **Commits unsigned in this env:** `git -c commit.gpgsign=false commit …` (repo signs via 1Password non-interactively; user re-signs on the feature branch).
- **RefSpec shape:** `{ type: RefSpecType; name: string | string[]; refDesc: string }`. `name` holds the value(s) (bundle id / path / deeplink / command / url); `refDesc` is the human label.
- **No new behavior.** If a task changes `karabiner-output.json`, stop and fix before continuing.

**Spec:** `docs/superpowers/specs/2026-07-22-auto-derived-descriptions-design.md` (§4 primitives, §5 actions, §6 conditions, §10 inventory, §11 Phase 1).

---

## File Structure

- **Create `src/data/refs.ts`** — the `RefSpec`/`VarSpec`/`DeviceSpec` types + category aliases (`AppRef`, `FolderRef`, `RaycastRef`, `CleanShotRef`, `CommandRef`, `UrlRef`). Type-only.
- **Modify `src/data/apps.ts`** — `appRegistry: Record<string, AppRef>`; `QUICK_FILL_APP_BUNDLE_IDENTIFIERS: AppRef[]`.
- **Modify `src/data/folders.ts`** — `Record<string, FolderRef>`.
- **Modify `src/data/raycast.ts`** — `Record<string, RaycastRef>`.
- **Modify `src/data/cleanshot.ts`** — `Record<string, CleanShotRef>`.
- **Modify `src/data/commands.ts`** — `Record<string, CommandRef>`.
- **Modify `src/data/accessibility.ts`** — `ACCESSIBILITY_VARIABLES: Record<string, VarSpec>`.
- **Modify `src/data/devices.ts`** — `DEVICE_IDENTIFIERS: Record<string, DeviceSpec>` (add `deviceDesc`).
- **Modify `src/data/index.ts`** — re-export the new types.
- **Modify `src/core/action-dsl.ts`** — `ref` fields become object refs; add `command` variant.
- **Modify `src/engine/action-resolver.ts`** — resolve via `.name`.
- **Modify `src/engine/binding.ts`** — `Condition` app/var/device accept specs; `resolveCondition` reads `.name`.
- **Modify `src/core/mouse.ts` + `src/engine/mouse-rules.ts`** — mouse `when.app` accepts `AppRef`; resolve via `.name`.
- **Modify every definition** — sweep `ref: "x"` → `ref: xRegistry.x`; `var: ACCESSIBILITY_VARIABLES.x` stays (now a `VarSpec`); `{type:"shell", command: commandRegistry.x}` → `{type:"command", ref: commandRegistry.x}`.

---

## Task 1: Create the ref-primitive types

**Files:**
- Create: `src/data/refs.ts`
- Modify: `src/data/index.ts` (re-export)

**Interfaces:**
- Produces: `RefSpec`, `RefSpecType`, `VarSpec`, `DeviceSpec`, and aliases `AppRef`/`FolderRef`/`RaycastRef`/`CleanShotRef`/`CommandRef`/`UrlRef` (all = `RefSpec`).

- [ ] **Step 1: Create `src/data/refs.ts`**

```ts
/** Labeled registry entry. `name` is the value(s) consumed by resolvers;
 *  `refDesc` is the human label used to derive descriptions (Phase 2). */
export type RefSpecType =
  | "app"
  | "folder"
  | "raycast"
  | "cleanShot"
  | "command"
  | "url";

export type RefSpec = {
  type: RefSpecType;
  name: string | string[];
  refDesc: string;
};

export type VarSpec = {
  name: string;
  varDesc: string;
};

export type DeviceSpec = {
  name: string;
  deviceDesc: string;
  product_id: number;
  vendor_id: number;
  is_keyboard?: boolean;
};

// Category aliases keep action refs type-safe (an app ref can't be a folder).
export type AppRef = RefSpec;
export type FolderRef = RefSpec;
export type RaycastRef = RefSpec;
export type CleanShotRef = RefSpec;
export type CommandRef = RefSpec;
export type UrlRef = RefSpec;
```

- [ ] **Step 2: Re-export from the data barrel**

In `src/data/index.ts`, add (alphabetized near the other `data/` exports):
```ts
export type {
  AppRef,
  CleanShotRef,
  CommandRef,
  DeviceSpec,
  FolderRef,
  RaycastRef,
  RefSpec,
  RefSpecType,
  UrlRef,
  VarSpec,
} from "./refs";
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (types only; nothing consumes them yet).

- [ ] **Step 4: Commit**

```bash
git add src/data/refs.ts src/data/index.ts
git -c commit.gpgsign=false commit -m "feat(data): add RefSpec/VarSpec/DeviceSpec primitives"
```

---

## Task 2: Migrate the `apps` registry end-to-end (the exemplar)

This task proves the full pattern — registry → `ActionSpec`/`Condition` types → resolvers → mouse adaptation → call sites — on `apps`, gated byte-identical. Later tasks fan the pattern out to the other registries.

**Files:**
- Modify: `src/data/apps.ts`
- Modify: `src/core/action-dsl.ts` (the `app` variant)
- Modify: `src/engine/action-resolver.ts` (`resolveAppBundleId`)
- Modify: `src/engine/binding.ts` (`Condition` app arm + `resolveCondition`)
- Modify: `src/core/mouse.ts:69` (mouse `when.app` type)
- Modify: `src/engine/mouse-rules.ts:73-74` (mouse app resolution)
- Modify: `src/definitions/escape.ts`, `src/definitions/hyper.ts`, `src/definitions/single-key.ts`, `src/definitions/right-option.ts`, `src/definitions/apps/skim.ts`, `src/definitions/apps/onepiece.ts`, `src/definitions/apps/zen.ts`, `src/definitions/apps/word.ts`, `src/definitions/system.ts`, `src/definitions/mouse.ts`, `src/definitions/enter-equals.ts` (call sites)

**Interfaces:**
- Produces: `appRegistry: Record<string, AppRef>`; `QUICK_FILL_APP_BUNDLE_IDENTIFIERS: AppRef[]`; `ActionSpec.app.ref: AppRef`; `Condition` app arm `app: AppRef | AppRef[]`; mouse `when.app: AppRef`.
- Consumes: `RefSpec`/`AppRef` from Task 1.

- [ ] **Step 1: Rewrite `src/data/apps.ts`**

```ts
import { getFolderOpenerBundleId } from "../core/folder-opener";

const app = (name: string, refDesc: string) => ({ type: "app" as const, name, refDesc });

export const appRegistry = {
  activityMonitor: app("com.apple.ActivityMonitor", "Activity Monitor"),
  antinote: app("com.chabomakers.Antinote", "Antinote"),
  brewUpdater: app("org.gpgtools.pinentry-mac", "PIN entry"),
  browser: app("app.zen-browser.zen", "Zen browser"),
  calendar: app("com.busymac.busycal-setapp", "BusyCal"),
  claude: app("com.anthropic.claudefordesktop", "Claude"),
  code: app("com.microsoft.VSCode", "VS Code"),
  excel: app("com.microsoft.Excel", "Microsoft Excel"),
  folderOpener: app(getFolderOpenerBundleId(), "Folder opener"),
  helium: app("net.imput.helium", "Helium"),
  kitty: app("net.kovidgoyal.kitty", "Kitty"),
  messages: app("com.apple.MobileSMS", "Messages"),
  numi: app("com.nikolaeu.numi-setapp", "Numi"),
  onePiece: app("jp.fuji.1Piece", "1Piece"),
  outlook: app("com.microsoft.Outlook", "Microsoft Outlook"),
  processSpy: app("com.itone.ProcessSpy", "Process Spy"),
  protonMail: app("ch.protonmail.desktop", "Proton Mail"),
  qspace: app("com.jinghaoshe.qspace.pro", "QSpace"),
  ringCentral: app("com.ringcentral.glip", "RingCentral"),
  securityAgent: app("com.apple.SecurityAgent", "Security Agent"),
  settings: app("com.apple.systempreferences", "System Settings"),
  settingsPrivacySecurityExtension: app(
    "com.apple.settings.PrivacySecurity.extension",
    "Privacy & Security extension",
  ),
  skim: app("net.sourceforge.skim-app.skim", "Skim"),
  spotify: app("com.spotify.client", "Spotify"),
  systemSettings: app("com.apple.systempreferences", "System Settings"),
  teams: app("com.microsoft.teams2", "Microsoft Teams"),
  todoist: app("com.todoist.mac.Todoist", "Todoist"),
  word: app("com.microsoft.Word", "Microsoft Word"),
  zen: app("app.zen-browser.zen", "Zen browser"),
} as const;

export type AppRef = import("./refs").AppRef;

export const QUICK_FILL_APP_BUNDLE_IDENTIFIERS: AppRef[] = [
  appRegistry.securityAgent,
  appRegistry.settings,
  appRegistry.settingsPrivacySecurityExtension,
  appRegistry.brewUpdater,
];
```

> `getFolderOpenerBundleId` is the same helper `action-resolver.ts` already imports; move its use to registry-load time. The four `QUICK_FILL` bundles are the same four ids currently in the array (SecurityAgent, systempreferences, PrivacySecurityExtension, pinentry-mac).

- [ ] **Step 2: Update `ActionSpec.app` in `src/core/action-dsl.ts`**

Change the `app` variant's `ref` type from `AppRef` (string-key union) to the object. Replace the existing `app` arm:
```ts
  | {
      type: "app";
      ref: AppRef;
      mode?: "open" | "focus" | "shell";
    }
```
(`AppRef` is now `RefSpec` re-exported from `./data`; the import `import type { AppRef } from "../data/apps"` still resolves because `apps.ts` still exports the `AppRef` alias in Step 1.)

- [ ] **Step 3: Update `resolveAppBundleId` in `src/engine/action-resolver.ts`**

Replace the function (lines ~39-45) — no more string-key lookup or `folderOpener` special case (now encoded in the registry):
```ts
function resolveAppBundleId(ref: AppRef): string {
  return Array.isArray(ref.name) ? ref.name[0]! : ref.name;
}
```
Add `AppRef` to the imports from `../data` (or `../data/apps`). Remove the now-unused `appRegistry` import if nothing else in the file uses it (it doesn't after this change) — but keep `folderRegistry` (still used by `resolveShellCommand` until Task 3).

- [ ] **Step 4: Update `Condition` + `resolveCondition` in `src/engine/binding.ts`**

Change the app arm of `Condition`:
```ts
export type Condition =
  | { app: AppRef | AppRef[]; unless?: boolean; description?: string }
  | { var: string; equals: string | number; unless?: boolean; description?: string }
  | { device: string; unless?: boolean; description?: string };
```
Update `resolveCondition`'s app branch to read `.name`:
```ts
export function resolveCondition(c: Condition): unknown {
  if ("app" in c) {
    const ref = Array.isArray(c.app) ? c.app[0]! : c.app;
    const ids = Array.isArray(ref.name) ? ref.name : [ref.name];
    return c.unless ? ifApp(ids).unless().build() : ifApp(ids).build();
  }
  // ...var and device unchanged for now
}
```
(`var`/`device` stay string-based until Tasks 5/6.) Add `AppRef` import from `../data`.

- [ ] **Step 5: Adapt mouse to `AppRef`**

In `src/core/mouse.ts:69`, change the override-condition `app` field from `app: string` to `app: AppRef` (import `AppRef` from `../data`).
In `src/engine/mouse-rules.ts:73-74`, resolve via `.name`:
```ts
      ? ifApp(resolveAppName(condition.app)).unless().build()
      : ifApp(resolveAppName(condition.app)).build();
```
Add a small helper near the top of `mouse-rules.ts`:
```ts
function resolveAppName(ref: AppRef): string[] {
  return Array.isArray(ref.name) ? ref.name : [ref.name];
}
```
(import `AppRef` from `../data`.)

- [ ] **Step 6: Sweep app call sites**

In every definition, replace string-key refs with object refs. The current `ref: "<key>"` → `ref: appRegistry.<key>`; the `app: appRegistry.<key>` condition sites already reference the (now-object) value, so they need no text change — only the type now fits. Specifically change these `ref:` literals:
- `src/definitions/escape.ts:30` — `ref: "activityMonitor"` → `ref: appRegistry.activityMonitor`
- `src/definitions/escape.ts:31` — `ref: "processSpy"` → `ref: appRegistry.processSpy`
- `src/definitions/hyper.ts:32` — `ref: "systemSettings"` → `ref: appRegistry.systemSettings`
- `src/definitions/hyper.ts:42` — `ref: "activityMonitor"` → `ref: appRegistry.activityMonitor`
- `src/definitions/single-key.ts:117` — `ref: "claude"` → `ref: appRegistry.claude`
- `src/definitions/single-key.ts:127` — `ref: "kitty"` → `ref: appRegistry.kitty`
- `src/definitions/single-key.ts:158` — `ref: "qspace"` → `ref: appRegistry.qspace`
- `src/definitions/single-key.ts:215` — `ref: "ringCentral"` → `ref: appRegistry.ringCentral`
- `src/definitions/right-option.ts:31` — `ref: "spotifySearch"` is a **raycast** ref — leave it for Task 4 (it will error now; that's expected until Task 4). *(If you prefer zero intermediate errors, do Task 4's raycast change in the same step.)*

Ensure each edited file imports `appRegistry` from `../data` (most already do via existing imports; verify).

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: PASS once every `app` ref is an object. (The one `raycast` ref in `right-option.ts` still passes a string — fix it in Task 4, or now if you chose that option in Step 6.)

- [ ] **Step 8: Verify byte-identical + tests**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: **empty**.
Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS (117/0/6).

- [ ] **Step 9: Commit**

```bash
git add src/data/apps.ts src/core/action-dsl.ts src/engine/action-resolver.ts src/engine/binding.ts src/core/mouse.ts src/engine/mouse-rules.ts src/definitions
git -c commit.gpgsign=false commit -m "refactor(data): migrate apps registry to AppRef (ref-as-object)"
```

---

## Task 3: Migrate the `folders` registry

**Files:**
- Modify: `src/data/folders.ts`
- Modify: `src/core/action-dsl.ts` (`folder` variant)
- Modify: `src/engine/action-resolver.ts` (`resolveShellCommand` folder branch)

**Interfaces:**
- Produces: `folderRegistry: Record<string, FolderRef>`; `ActionSpec.folder.ref: FolderRef`.

- [ ] **Step 1: Rewrite `src/data/folders.ts`**

```ts
import { HOME_DIR } from "./environment";

const folder = (name: string, refDesc: string) => ({ type: "folder" as const, name, refDesc });

export const folderRegistry = {
  applications: folder("/Applications/", "Applications"),
  cases: folder(`${HOME_DIR}/Library/CloudStorage/OneDrive-BoxerandGerson,LLP/Documents/Cases/`, "Cases"),
  chezmoi: folder(`${HOME_DIR}/.local/share/chezmoi/`, "chezmoi"),
  dotConfig: folder(`${HOME_DIR}/.config/`, "~/.config"),
  dotLocal: folder(`${HOME_DIR}/.local/`, "~/.local"),
  dotBin: folder(`${HOME_DIR}/.local/bin/`, "~/.local/bin"),
  dotState: folder(`${HOME_DIR}/.local/state/`, "~/.local/state"),
  downloads: folder(`${HOME_DIR}/Downloads/`, "Downloads"),
  downloads3dPrinting: folder(`${HOME_DIR}/Downloads/3dPrinting`, "3D Printing downloads"),
  downloadsArchives: folder(`${HOME_DIR}/Downloads/Archives`, "Archives"),
  downloadsInstalls: folder(`${HOME_DIR}/Downloads/Installs`, "Installs"),
  downloadsOffice: folder(`${HOME_DIR}/Downloads/Office`, "Office downloads"),
  downloadsPdfs: folder(`${HOME_DIR}/Downloads/PDFs/`, "PDFs"),
  gits: folder(`${HOME_DIR}/gits/`, "~/gits"),
  home: folder(`${HOME_DIR}/`, "Home"),
  library: folder(`${HOME_DIR}/Library/CloudStorage/OneDrive-Personal/1 - Work/0 - Library/`, "Library"),
  scripts: folder(`${HOME_DIR}/Scripts/`, "~/Scripts"),
  workspaces: folder(`${HOME_DIR}/Scripts/workspaces/`, "Workspaces"),
} as const;

export type FolderRef = import("./refs").FolderRef;
```

- [ ] **Step 2: Update `ActionSpec.folder` in `src/core/action-dsl.ts`**

The `folder` variant `ref: FolderRef` — now an object (the import resolves via `folders.ts`'s re-exported alias).

- [ ] **Step 3: Update `resolveShellCommand`'s folder branch in `src/engine/action-resolver.ts`**

Change `return getOpenFolderCommand(folderRegistry[action.ref]);` to:
```ts
      return getOpenFolderCommand(
        Array.isArray(action.ref.name) ? action.ref.name[0]! : action.ref.name,
      );
```
(`folderRegistry` import may now be unused — remove if so.)

- [ ] **Step 4: Sweep folder call sites**

No live `ref: "<folderKey>"` call sites exist (the only ones are commented out in `right-option.ts`). So no definition edits — but verify with: `rg -n 'type: "folder"' src/definitions`.

- [ ] **Step 5: Verify byte-identical + tests + commit**

Run: `npm run typecheck && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: typecheck PASS, diff empty.
Run: `npm test` → PASS (117/0/6).
```bash
git add src/data/folders.ts src/core/action-dsl.ts src/engine/action-resolver.ts
git -c commit.gpgsign=false commit -m "refactor(data): migrate folders registry to FolderRef"
```

---

## Task 4: Migrate the `raycast` + `cleanshot` registries

**Files:**
- Modify: `src/data/raycast.ts`, `src/data/cleanshot.ts`
- Modify: `src/core/action-dsl.ts` (`raycast`, `cleanShot` variants)
- Modify: `src/engine/action-resolver.ts` (`resolveShellCommand` raycast/cleanShot branches)
- Modify: `src/definitions/single-key.ts`, `src/definitions/right-option.ts` (call sites)

**Interfaces:**
- Produces: `raycastRegistry: Record<string, RaycastRef>`; `cleanShotRegistry: Record<string, CleanShotRef>`.

- [ ] **Step 1: Rewrite `src/data/raycast.ts`**

```ts
const r = (name: string, refDesc: string) => ({ type: "raycast" as const, name, refDesc });

export const raycastRegistry = {
  clipboardHistory: r("raycast/clipboard-history/clipboard-history", "Clipboard history"),
  hereToThereActiveToTarget: r("Jason/here-to-there/activeToTarget", "Here2There (active to target)"),
  recentApplications: r("jason/recents/recentApplications", "Recent applications"),
  recentCustom: r("jason/recents/recentCustom", "Recent custom"),
  recentDownloads: r("jason/recents/recentDownloads", "Recent downloads"),
  recentFiles: r("jason/recents/recents", "Recent files"),
  recentFolders: r("jason/recents/recentFolders", "Recent folders"),
  spotifySearch: r("mattisssa/spotify-player/search", "Spotify search"),
  zoxideSearchDirectories: r("mrpunkin/raycast-zoxide/search-directories", "zoxide search directories"),
} as const;

export type RaycastRef = import("./refs").RaycastRef;
```

- [ ] **Step 2: Rewrite `src/data/cleanshot.ts`**

```ts
const cs = (name: string, refDesc: string) => ({ type: "cleanShot" as const, name, refDesc });

export const cleanShotRegistry = {
  captureArea: cs("capture-area", "Capture area"),
  captureFullscreen: cs("capture-fullscreen", "Capture fullscreen"),
  captureTextNoLinebreaks: cs("capture-text?linebreaks=false", "Capture text (no line breaks)"),
  captureWindow: cs("capture-window", "Capture window"),
  recordScreen: cs("record-screen", "Record screen"),
} as const;

export type CleanShotRef = import("./refs").CleanShotRef;
```

- [ ] **Step 3: Update `ActionSpec` raycast/cleanShot variants in `src/core/action-dsl.ts`**

Both `ref` fields now resolve to object aliases (via the re-exports).

- [ ] **Step 4: Update `resolveShellCommand` in `src/engine/action-resolver.ts`**

Replace the two branches:
```ts
    case "raycast":
      return raycastExtensionCommand(resolveName(action.ref));
    case "cleanShot":
      return cleanShotCommand(resolveName(action.ref));
```
Add a shared helper (and use it for folder too if you like):
```ts
function resolveName(ref: { name: string | string[] }): string {
  return Array.isArray(ref.name) ? ref.name[0]! : ref.name;
}
```
Remove now-unused `raycastRegistry`/`cleanShotRegistry` imports.

- [ ] **Step 5: Sweep raycast/cleanShot call sites**

- `src/definitions/single-key.ts:121` — `ref: "hereToThereActiveToTarget"` → `ref: raycastRegistry.hereToThereActiveToTarget`
- `src/definitions/single-key.ts:125` — `ref: "recentDownloads"` → `ref: raycastRegistry.recentDownloads`
- `src/definitions/single-key.ts:140` — `ref: "captureTextNoLinebreaks"` → `ref: cleanShotRegistry.captureTextNoLinebreaks`
- `src/definitions/single-key.ts:175` — `ref: "captureArea"` → `ref: cleanShotRegistry.captureArea`
- `src/definitions/single-key.ts:179` — `ref: "captureWindow"` → `ref: cleanShotRegistry.captureWindow`
- `src/definitions/single-key.ts:197` — `ref: "clipboardHistory"` → `ref: raycastRegistry.clipboardHistory`
- `src/definitions/single-key.ts:211` — `ref: "zoxideSearchDirectories"` → `ref: raycastRegistry.zoxideSearchDirectories`
- `src/definitions/right-option.ts:31` — `ref: "spotifySearch"` → `ref: raycastRegistry.spotifySearch`

Add `raycastRegistry`/`cleanShotRegistry` imports to `single-key.ts` (from `../data`) and `raycastRegistry` to `right-option.ts`.

- [ ] **Step 6: Verify byte-identical + tests + commit**

Run: `npm run typecheck && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json && npm test`
Expected: typecheck PASS, diff empty, 117/0/6.
```bash
git add src/data/raycast.ts src/data/cleanshot.ts src/core/action-dsl.ts src/engine/action-resolver.ts src/definitions/single-key.ts src/definitions/right-option.ts
git -c commit.gpgsign=false commit -m "refactor(data): migrate raycast + cleanshot registries to RefSpec"
```

---

## Task 5: Migrate the `commands` registry + add the `command` action variant

**Files:**
- Modify: `src/data/commands.ts`
- Modify: `src/core/action-dsl.ts` (add `command` variant)
- Modify: `src/engine/action-resolver.ts` (`command` case)
- Modify: `src/definitions/system.ts` (call sites)

**Interfaces:**
- Produces: `commandRegistry: Record<string, CommandRef>`; `ActionSpec` gains `{ type: "command"; ref: CommandRef; actionDesc?: string }`.

- [ ] **Step 1: Rewrite `src/data/commands.ts`**

```ts
import { PATHS } from "./paths";

const cmdEntry = (name: string, refDesc: string) => ({ type: "command" as const, name, refDesc });

export const commandRegistry = {
  fillPassword: cmdEntry(
    `${PATHS.privCLI} -r && sleep 0.1 && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:/:command,option,control>"`,
    "Fill password",
  ),
  fillUsernameAndPassword: cmdEntry(
    `${PATHS.privCLI} -r && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:a:command>Jason<c:tab><c:/:command,option,control>"`,
    "Fill username and password",
  ),
} as const;

export type CommandRef = import("./refs").CommandRef;

export const FILL_PW_SENDKEYS = commandRegistry.fillPassword.name;
export const FILL_UN_PW_SENDKEYS = commandRegistry.fillUsernameAndPassword.name;
```

> `FILL_PW_SENDKEYS`/`FILL_UN_PW_SENDKEYS` keep their existing string values (now sourced from the registry entry's `.name`).

- [ ] **Step 2: Add the `command` variant to `ActionSpec` in `src/core/action-dsl.ts`**

Insert before the `shell` variant:
```ts
  | {
      type: "command";
      ref: CommandRef;
      actionDesc?: string;
    }
```
(import `CommandRef` from `../data/commands`.)

- [ ] **Step 3: Resolve `command` in `src/engine/action-resolver.ts`**

In `resolveActionToEvents`, add a case (the `default` branch's `resolveShellCommand` already returns the string for `shell`; for `command` return it directly):
```ts
    case "command":
      return [cmd(resolveName(action.ref))];
```
(`cmd` and `resolveName` are already imported/defined in this file.)

- [ ] **Step 4: Sweep command call sites in `src/definitions/system.ts`**

Replace the two shell+commandRegistry actions:
- `{ type: "shell", command: commandRegistry.fillPassword }` → `{ type: "command", ref: commandRegistry.fillPassword }`
- `{ type: "shell", command: commandRegistry.fillUsernameAndPassword }` → `{ type: "command", ref: commandRegistry.fillUsernameAndPassword }`

Verify no other `commandRegistry` string usage remains: `rg -n "commandRegistry" src/definitions`.

- [ ] **Step 5: Verify byte-identical + tests + commit**

Run: `npm run typecheck && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json && npm test`
Expected: typecheck PASS, diff empty (the `command` event == the old `shell` event), 117/0/6.
```bash
git add src/data/commands.ts src/core/action-dsl.ts src/engine/action-resolver.ts src/definitions/system.ts
git -c commit.gpgsign=false commit -m "refactor(data): migrate commands to CommandRef + add command action variant"
```

---

## Task 6: Migrate `accessibility` vars + `devices`

**Files:**
- Modify: `src/data/accessibility.ts`, `src/data/devices.ts`
- Modify: `src/engine/binding.ts` (`Condition.var` arm + `resolveCondition`)
- Modify: `src/definitions/system.ts` (var call sites)
- Modify: `src/data/devices.ts` consumers (none read `deviceDesc` yet; reserved)

**Interfaces:**
- Produces: `ACCESSIBILITY_VARIABLES: Record<string, VarSpec>`; `Condition.var: VarSpec`; `DEVICE_IDENTIFIERS: Record<string, DeviceSpec>`.

- [ ] **Step 1: Rewrite `src/data/accessibility.ts`**

```ts
const v = (name: string, varDesc: string) => ({ name, varDesc });

export const ACCESSIBILITY_VARIABLES = {
  focusedUiRole: v("accessibility.focused_ui_element.role_string", "Focused UI role"),
  focusedUiSubrole: v("accessibility.focused_ui_element.subrole_string", "Focused UI subrole"),
} as const;

export const ACCESSIBILITY_VALUES = {
  textFieldRole: "AXTextField",
  secureTextFieldSubrole: "AXSecureTextField",
} as const;
```

- [ ] **Step 2: Rewrite `src/data/devices.ts` (add `deviceDesc`, keep values)**

```ts
const dev = (
  name: string,
  deviceDesc: string,
  ids: { product_id: number; vendor_id: number; is_keyboard?: boolean },
) => ({ name, deviceDesc, ...ids });

export const DEVICE_IDENTIFIERS = {
  appleNumericKeypad: dev("appleNumericKeypad", "Apple numeric keypad", {
    vendor_id: 76,
    product_id: 802,
    is_keyboard: true,
  }),
  logitechG502X: dev("logitechG502X", "Logitech G502 X", {
    product_id: 49305,
    vendor_id: 1133,
  }),
} as const;

export const APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS = [
  // ...unchanged array contents (keep verbatim)
] as const;
```

(Keep the existing `APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS` entries exactly as-is.)

- [ ] **Step 3: Update `Condition.var` + `resolveCondition` in `src/engine/binding.ts`**

Change the var arm:
```ts
  | { var: VarSpec; equals: string | number; unless?: boolean; description?: string }
```
Update `resolveCondition`'s var branch to read `.name`:
```ts
  if ("var" in c) {
    return {
      type: c.unless ? "variable_unless" : "variable_if",
      name: c.var.name,
      value: c.equals,
    };
  }
```
(import `VarSpec` from `../data`.)

- [ ] **Step 4: Sweep var call sites in `src/definitions/system.ts`**

The four `{ var: ACCESSIBILITY_VARIABLES.focusedUiRole, … }` / `…focusedUiSubrole…` sites need **no text change** — they already reference the (now-`VarSpec`) value; the type now fits.

- [ ] **Step 5: Verify byte-identical + tests + commit**

Run: `npm run typecheck && CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json && npm test`
Expected: typecheck PASS, diff empty, 117/0/6.
```bash
git add src/data/accessibility.ts src/data/devices.ts src/engine/binding.ts
git -c commit.gpgsign=false commit -m "refactor(data): migrate accessibility vars to VarSpec + devices to DeviceSpec"
```

---

## Task 7: Final verification + description-agnostic diff sanity

**Files:** none (verification only).

- [ ] **Step 1: Confirm full byte-identity across all of Phase 1**

Run: `CI=true npx tsx src/index.ts && git diff --stat karabiner-output.json`
Expected: **empty** (cumulative Phase 1 = no output change).

- [ ] **Step 2: Description-agnostic diff baseline (for Phase 2)**

Capture the current description-stripped output as the Phase 2 baseline:
```bash
jq 'del(.complex_modifications.rules[] | .ruleDescription) | del(.complex_modifications.rules[].manipulatorSources[]? | .description)' karabiner-output.json > /tmp/phase1-structural.json
```
(This file is the reference Phase 2's synthesizer must not disturb. Note its path for the Phase 2 plan.)

- [ ] **Step 3: Full gate**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS (117/0/6). No new typecheck/lint errors.

- [ ] **Step 4: Confirm no leftover string-key refs**

Run: `rg -n 'ref:\s*"[a-zA-Z]' src/definitions src/core`
Expected: only commented-out lines in `right-option.ts` (the dead launcher examples) — no live string-key refs.

- [ ] **Step 5: Update progress ledger**

Append to `.superpowers/sdd/progress.md`: Phase 1 complete (list the 7 commits), golden byte-identical, Phase 2 baseline captured at `/tmp/phase1-structural.json` (re-capture if regenerated). Note `refDesc` labels are populated but unused (Phase 2 consumes them).

```bash
git add .superpowers/sdd/progress.md
git -c commit.gpgsign=false commit -m "docs(progress): ref-primitives Phase 1 complete"
```

---

## Self-Review (completed during authoring)

**Spec coverage:**
- §4.1 RefSpec → Task 1 (type) + Tasks 2–5 (registries). ✓
- §4.2 VarSpec → Task 1 (type) + Task 6 (accessibility). ✓
- §4.3 DeviceSpec → Task 1 (type) + Task 6 (devices). ✓
- §5 ref-as-object → Tasks 2–5 (`ActionSpec` variants). ✓
- §5 new `command` variant → Task 5. ✓
- §6 Condition app/var → Task 2 (app) + Task 6 (var); device reserved (no live device conditions). ✓
- §10 registry inventory → Tasks 2–6 cover apps/folders/raycast/cleanshot/commands/accessibility/devices; `urls.ts` is empty (structure-ready, no migration needed). ✓
- §11 Phase 1 byte-identical → every task gated on `git diff --stat karabiner-output.json` empty. ✓
- §12 description-agnostic diff baseline → Task 7 Step 2 captures it for Phase 2. ✓

**Placeholder scan:** every code step contains real code; the `APPLE_NUMERIC_KEYPAD_SIMPLE_MODIFICATIONS` "unchanged" reference in Task 6 Step 2 is an explicit "keep verbatim" of existing content (not a placeholder) — the implementer copies the existing array. refDesc labels are real values, not TBD.

**Type consistency:** `RefSpec`/`AppRef`/`FolderRef`/`RaycastRef`/`CleanShotRef`/`CommandRef`/`VarSpec`/`DeviceSpec` defined once (Task 1) and reused with identical names. `resolveName` helper introduced in Task 4 and reused in Task 5. `Condition` app arm changed in Task 2, var arm in Task 6 — both match the §6 shape.

**Deferred to Phase 2 plan:** the synthesizer, `Binding.description` auto-derive, removing `formatRuleDescription` calls, manipulator slice-labels. **Deferred to Phase 3 plan:** tap-hold family migration (A/B choice), `assertUniqueTriggers`, dead-adapter deletion (final tranche).
