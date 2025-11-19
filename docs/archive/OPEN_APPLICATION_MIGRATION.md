# open_application Migration

## Overview

Migrated from shell command-based app launching (`open -b`, `open -a`) to Karabiner's native `open_application` software function for improved performance and reliability.

## Changes Made

### 1. Added `openApp()` Helper Function

**File:** `src/lib/builders.ts`

Created new `openApp()` function that generates Karabiner's native `open_application` events:

```typescript
export interface OpenAppOpts {
  bundleIdentifier?: string;  // Preferred: e.g., 'com.openai.chat'
  filePath?: string;          // Alternative: '/Applications/MyApp.app'
  historyIndex?: number;      // Switch to recently used app (1 = previous app)
  excludeBundleIdentifiers?: string[];  // Don't launch if these apps are frontmost
  excludeFilePathRegex?: string[];      // Regex patterns to exclude
}

export function openApp(opts: OpenAppOpts): ToEvent
```

### 2. Updated SubLayerConfig Type

**File:** `src/lib/functions.ts`

Added `openAppOpts` field to sublayer mapping configuration:

```typescript
export type SubLayerConfig = {
  // ... existing fields
  mappings: Record<string, {
    openAppOpts?: OpenAppOpts;  // NEW: Use native open_application
    command?: string;            // Legacy: Shell commands (still supported)
    // ... other fields
  }>;
};
```

### 3. Converted Tap-Hold Keys

**File:** `src/index.ts`

Converted 6 tap-hold key definitions:

- `a`: Launcher → `openApp({ bundleIdentifier: 'com.apple.apps.launcher' })`
- `g`: ChatGPT → `openApp({ bundleIdentifier: 'com.openai.chat' })`
- `q`: QSpace Pro → `openApp({ filePath: '/System/Volumes/Data/Applications/QSpace Pro.app' })`
- `8`: 8x8 → `openApp({ bundleIdentifier: 'com.electron.8x8---virtual-office' })`
- `escape`: ProcessSpy → `openApp({ bundleIdentifier: 'com.itone.ProcessSpy' })`

### 4. Converted Space Layer Mappings

**File:** `src/index.ts`

Converted 14 app launches in the "Applications" sublayer (Space+A):

- All entries now use `openAppOpts: { bundleIdentifier: '...' }`
- Includes: ChatGPT, VS Code, Safari, Teams, Word, Outlook, Messages, etc.

### 5. Folder Commands Unchanged

Commands that open folders with arguments remain as shell commands since `open_application` doesn't support passing arguments to apps:

- Downloads sublayer (Space+D): 3dPrinting, Archives, Installs, Office, PDFs
- Folders sublayer (Space+F): All folder paths

## Benefits

1. **Performance**: Native Karabiner function is faster than shell commands
2. **Reliability**: No shell escaping issues, direct app activation
3. **Focus Management**: Automatically brings app to focus if already running
4. **Priority System**: `bundle_identifier` > `file_path` > `historyIndex`

## Testing

Build completed successfully:

```bash
npm run build
✓ Profile Karabiner.ts updated.
✓ Wrote workspace copy: karabiner-output.json
```

Generated JSON verified with 19 `open_application` entries using correct structure:

```json
{
  "software_function": {
    "open_application": {
      "bundle_identifier": "com.openai.chat"
    }
  }
}
```

## Migration Notes

- Shell command pattern: `cmd('open -b com.example.app')`
- New pattern: `openApp({ bundleIdentifier: 'com.example.app' })`
- File path pattern: `openApp({ filePath: '/Applications/MyApp.app' })`
- Commands with arguments remain as `cmd(...)` (e.g., folder opening)
