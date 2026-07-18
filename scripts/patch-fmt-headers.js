#!/usr/bin/env node
/**
 * scripts/patch-fmt-headers.js
 *
 * Third-layer safety net: directly patches fmt C++ headers AFTER pod install.
 * Called by `eas-build-post-install` in package.json on iOS EAS builds.
 *
 * This is a fallback in case the Podfile post_install hook approach fails.
 * It adds `#define FMT_USE_CONSTEVAL 0` before fmt's own header guards,
 * disabling consteval usage that breaks compilation with iOS 26 SDK / Xcode 26+.
 */

const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '// [fmt-consteval-patch]';
const DEFINE_LINE = '#define FMT_USE_CONSTEVAL 0';

// Possible locations where fmt headers live after pod install
const FMT_SEARCH_ROOTS = [
  path.join(process.cwd(), 'ios', 'Pods', 'fmt', 'include', 'fmt'),
  path.join(process.cwd(), 'Pods', 'fmt', 'include', 'fmt'),
];

const HEADERS_TO_PATCH = ['core.h', 'base.h', 'format.h'];
const TARGET_GUARD = '#ifndef FMT_USE_CONSTEVAL';

let patched = 0;
let skipped = 0;
let notFound = 0;

for (const root of FMT_SEARCH_ROOTS) {
  if (!fs.existsSync(root)) {
    console.log(`[patch-fmt-headers] Directory not found: ${root}`);
    notFound++;
    continue;
  }

  console.log(`[patch-fmt-headers] Scanning: ${root}`);

  for (const headerName of HEADERS_TO_PATCH) {
    const headerPath = path.join(root, headerName);

    if (!fs.existsSync(headerPath)) {
      console.log(`  ⏭  ${headerName} — not present, skipping`);
      continue;
    }

    let content = fs.readFileSync(headerPath, 'utf-8');

    if (content.includes(PATCH_MARKER)) {
      console.log(`  ✅ ${headerName} — already patched, skipping`);
      skipped++;
      continue;
    }

    if (!content.includes(TARGET_GUARD)) {
      console.log(`  ⚠️  ${headerName} — '${TARGET_GUARD}' not found, may be a different fmt version. Skipping.`);
      continue;
    }

    const injection = [
      `${PATCH_MARKER} Injected by scripts/patch-fmt-headers.js`,
      `${PATCH_MARKER} Disables consteval in fmt for iOS 26 SDK / Xcode 26+ compatibility.`,
      `${PATCH_MARKER} See: https://github.com/fmtlib/fmt/issues — FMT_USE_CONSTEVAL=0`,
      DEFINE_LINE,
      TARGET_GUARD, // keep the original line
    ].join('\n');

    content = content.replace(TARGET_GUARD, injection);
    fs.writeFileSync(headerPath, content, 'utf-8');
    console.log(`  ✅ ${headerName} — patched with FMT_USE_CONSTEVAL=0`);
    patched++;
  }
}

console.log(`\n[patch-fmt-headers] Done. Patched: ${patched}, Already patched/skipped: ${skipped}, Dirs not found: ${notFound}`);

if (notFound === FMT_SEARCH_ROOTS.length) {
  console.log('[patch-fmt-headers] ⚠️  No fmt Pods directory found. This is expected if pod install has not run yet, or if running outside EAS.');
  process.exit(0); // Non-fatal — the Podfile hook should cover this case
}
