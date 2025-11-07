# Karabiner.ts Configuration

## ✅ Conversion Complete!

All JSON rules from `src/inputRules.json` have been successfully converted to TypeScript with abstraction helpers.

## Files

- **`src/index.ts`** - All rules converted to TypeScript using abstractions
- **`src/lib/mods.ts`** - Custom modifier definitions (HYPER, SUPER, MEH)
- **`src/lib/builders.ts`** - Helper functions (`tapHold`, `varTapTapHold`, `cmd`)
- **`src/inputRules.json`** - Original JSON (preserved for reference)

## Custom Modifier Definitions

Your local definitions in `src/lib/mods.ts`:
- **HYPER** = `command + option + control`
- **SUPER** = `command + option + control + shift`
- **MEH** = `command + option + shift`

These override upstream defaults and remain stable under your control.

## Build & Deploy

```bash
# Test (dry-run to console)
npm run build

# Deploy to Karabiner (edit src/index.ts, change '--dry-run' to 'JJK_Default')
npm run build
```

## Rules Implemented

### Tap-Hold Keys
- **A** → RaycastAI (hold)
- **B** → MEH+B (hold)
- **C** → OCR via CleanShot (hold)
- **D** → Quick date format (hold)
- **F** → ProFind search (hold)
- **G** → ChatGPT (hold)
- **H** → Hammerspoon console (hold)
- **I** → Indent line (hold)
- **M** → Unminimize window (hold)
- **Q** → QSpace Pro (hold)
- **R** → Latest Download (hold)
- **S** → RaycastAI (hold)
- **T** → iTerm2 (hold)
- **V** → Maccy clipboard (hold)
- **W** → Writing Tools (hold)
- **8** → 8x8 app (hold)
- **/** → File search (hold)
- **=** → Quick date (hold)
- **Enter** → Quick format (hold)
- **Tab** → Mission Control (hold)

### Caps Lock System
- Tap alone → HSLauncher (F15+HYPER)
- Hold → HYPER modifier
- Hold + Shift → SUPER modifier
- Hold + Ctrl → MEH modifier

### Space Layer
Hold Space to activate, then:
- **D** (hold) opens Downloads sublayer:
  - **P** → PDFs folder
  - **A** → Archives folder
  - **O** → Office folder
  - **3** → 3dPrinting folder
  - **I** → Installs folder

### Special Behaviors
- **HOME/END** → Mac-style navigation (Cmd+arrows)
- **CMD+Q** → Requires double-tap (300ms window)
- **CTRL+OPT+ESC** → Activity Monitor (tap) or Force Quit (tap-tap)
- **CMD+SHIFT+K** → Delete line (except VSCode Insiders)
- **CMD+H/M** → Disabled (hide/minimize prevention)

### App-Specific
- **Passwords** (SecurityAgent): CMD+/ → Quick fill
- **Skim**: CMD+H/U remapped
- **Antinote**: CMD+D double-tap to delete note

## Next Steps

Now that all rules are converted, you can:

1. **Test the configuration**: Run `npm run build` to verify output
2. **Deploy to Karabiner**: Change `'--dry-run'` to `'JJK_Default'` in `src/index.ts`
3. **Implement layer abstractions**: Use karabiner.ts layer helpers for cleaner layer definitions
4. **Add new rules**: Use the abstraction helpers in `src/lib/builders.ts`

## Benefits

- ✅ **Type-safe**: TypeScript catches errors before build
- ✅ **Maintainable**: Helper functions reduce boilerplate
- ✅ **Custom modifiers**: HYPER/SUPER/MEH under your control
- ✅ **Documented**: Clear rule descriptions and comments
- ✅ **Version-controllable**: Human-readable diffs
