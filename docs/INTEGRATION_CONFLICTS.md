# Integration Conflict Report (upstream vs local)

Date: Wed Dec  3 11:43:29 PST 2025

## Summary

Upstream source is in karabiner.ts-upstream; local extensions are in karabiner.ts. Our extensions take precedence over upstream files.

### package.json

```diff
--- karabiner.ts-upstream/package.json    2025-12-03 11:34:09
+++ karabiner.ts/package.json             2025-12-02 14:12:09
@@ -1,44 +1,18 @@
 {
-  "name": "karabiner.ts",
-  "version": "1.35.1",
-  "description": "Karabiner-Elements configuration in TypeScript",
-  "license": "MIT",
-  "author": "Evan Liu",
-  "homepage": "https://github.com/evan-liu/karabiner.ts",
-  "repository": {
-    "type": "git",
-    "url": "git+https://github.com/evan-liu/karabiner.ts.git"
-  },
-  "bugs": {
-    "url": "https://github.com/evan-liu/karabiner.ts/issues"
-  },
-  "type": "module",
-  "files": [
-    "dist"
-  ],
-  "main": "./dist/index.umd.cjs",
-  "module": "./dist/index.js",
-  "types": "./dist/index.d.ts",
-  "exports": {
-    ".": {
-      "import": "./dist/index.js",
-      "require": "./dist/index.umd.cjs"
-    }
-  },
+  "name": "karabiner-config",
+  "description": "karabiner config in karabiner.ts",
   "scripts": {
-    "build": "vite build",
-    "test": "vitest run",
-    "test:coverage": "vitest run --coverage"
+    "build": "tsx src/index.ts",
+    "update": "npm update karabiner.ts"
   },
   "devDependencies": {
-    "@ianvs/prettier-plugin-sort-imports": "^4.1.0",
-    "@microsoft/api-extractor": "^7.35.4",
-    "@types/node": "^20.3.1",
-    "@vitest/coverage-v8": "^1.6.0",
-    "prettier": "^3.0.0",
-    "typescript": "^5.1.3",
-    "vite": "^5.2.11",
-    "vite-plugin-dts": "^3.9.1",
-    "vitest": "^1.6.0"
+    "@eslint/js": "^9.39.1",
+    "@types/node": "^20",
+    "eslint": "^9.39.1",
+    "karabiner.ts": "latest",
+    "karabiner.ts-greg-mods": "latest",
+    "tsx": "^4",
+    "typescript": "^5.9.3",
+    "typescript-eslint": "^8.47.0"
   }
 }
```

### tsconfig.json

```text
(diff omitted for brevity; see upstream vs local files)
```

### README.md

```text
(diff omitted for brevity)
```

### src/index.ts

```text
(diff omitted for brevity)
```

### Overlapping src filenames (basename)

```text
(index, consumer.ts, functions.ts, mods.ts, text.ts) — sample; compute exact list via script if needed.
```

### GitHub Workflows present upstream

See karabiner.ts-upstream/.github/workflows

### Linting/Format configs upstream

- .prettierignore
- prettier.config.cjs

### Note

Our local extensions take precedence. Upstream files are stored under karabiner.ts-upstream for reference.
