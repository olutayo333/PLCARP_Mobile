/**
 * withFmtCxxStandard.js
 *
 * WHY THIS FILE EXISTS:
 * The `fmt` library (bundled inside React Native's Folly dependency) uses C++20's
 * `consteval` keyword via its `FMT_STRING` macro. Starting with Xcode 16+ / iOS 26 SDK,
 * Apple's clang enforces that consteval arguments MUST be compile-time constants.
 * Since `fmt` passes runtime strings to consteval functions, the build fails with:
 *   "call to consteval function is not a constant expression"
 *
 * STRATEGY: Inject our fix code INTO the existing `post_install` block (before its
 * closing `end`). CocoaPods 1.15+ forbids multiple `post_install` blocks — this is
 * why previous attempts that appended a new block failed with:
 *   "Specifying multiple `post_install` hooks is unsupported"
 *
 * The fix directly patches the fmt C++ header files on disk (most reliable), and also
 * applies Xcode build settings as a backup.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const INJECTION_MARKER = '# fmt-consteval-fix';

/**
 * Finds the index of the matching `end` keyword for the `post_install do` block,
 * tracking Ruby `do`/`end` nesting depth from the given start position.
 *
 * @param {string} contents - Full Podfile text
 * @param {number} startIndex - Character index to start scanning from (at the `do` keyword)
 * @returns {number} Index of the matching `end`, or -1 if not found
 */
function findMatchingEnd(contents, startIndex) {
  const tokenRegex = /\b(do|end)\b/g;
  tokenRegex.lastIndex = startIndex;

  let depth = 0;
  let token;

  while ((token = tokenRegex.exec(contents)) !== null) {
    if (token[1] === 'do') {
      depth++;
    } else {
      // token[1] === 'end'
      depth--;
      if (depth === 0) {
        return token.index;
      }
    }
  }

  return -1;
}

/**
 * Injects `codeToInject` into the existing `post_install` block in the Podfile,
 * right before its closing `end`. Creates a new `post_install` block only if none exists.
 *
 * @param {string} contents - Full Podfile text
 * @param {string} codeToInject - Ruby code to inject
 * @returns {string} Modified Podfile text
 */
function injectIntoPostInstall(contents, codeToInject) {
  const postInstallRegex = /post_install\s+do\b/;
  const match = postInstallRegex.exec(contents);

  if (!match) {
    // No post_install block at all — create one
    console.log('[withFmtCxxStandard] No post_install block found. Creating one.');
    return contents + `\npost_install do |installer|\n${codeToInject}\nend\n`;
  }

  // Find the closing `end` that matches the `do` in `post_install do`
  const endIndex = findMatchingEnd(contents, match.index);

  if (endIndex === -1) {
    console.error('[withFmtCxxStandard] Could not find matching end for post_install block. Aborting injection.');
    return contents;
  }

  // Insert our code just before the closing `end`
  return (
    contents.substring(0, endIndex) +
    codeToInject +
    '\n' +
    contents.substring(endIndex)
  );
}

const withFmtCxxStandard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(filePath, 'utf-8');

      // Idempotency guard — do not inject twice
      if (contents.includes(INJECTION_MARKER)) {
        return config;
      }

      // Ruby code to inject inside the existing post_install block.
      // Two strategies:
      //  1. (Primary)  Directly patch fmt C++ header files on disk — bypasses Xcode settings entirely.
      //  2. (Backup)   Set Xcode build settings on the fmt target as belt-and-suspenders.
      const fmtPatch = `
  ${INJECTION_MARKER}
  # Fixes: "call to consteval function is not a constant expression" (iOS 26 SDK / Xcode 26+)
  # The fmt library (used by React Native's Folly) calls consteval with non-constant runtime
  # arguments. iOS 26's stricter clang rejects this. We disable consteval in fmt entirely.

  # Strategy 1 (Primary): Directly patch fmt header files.
  # Sets #define FMT_USE_CONSTEVAL 0 before fmt's own header guard checks it.
  # This is the most reliable approach — it does not depend on Xcode build settings.
  begin
    fmt_include_dir = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt')
    %w[core.h base.h format.h].each do |header_name|
      header_path = File.join(fmt_include_dir, header_name)
      next unless File.exist?(header_path)
      content = File.read(header_path)
      next if content.include?('// [fmt-consteval-patch]')
      next unless content.include?('#ifndef FMT_USE_CONSTEVAL')
      patched = content.sub(
        '#ifndef FMT_USE_CONSTEVAL',
        "// [fmt-consteval-patch] Injected by withFmtCxxStandard Expo plugin\\n" \\
        "#define FMT_USE_CONSTEVAL 0\\n" \\
        "#ifndef FMT_USE_CONSTEVAL"
      )
      File.write(header_path, patched)
      puts "  [withFmtCxxStandard] Patched fmt/#{header_name} with FMT_USE_CONSTEVAL=0"
    end
  rescue => e
    puts "  [withFmtCxxStandard] Header patch warning: #{e.message}"
  end

  # Strategy 2 (Backup): Xcode build settings on the fmt target.
  installer.pods_project.targets.each do |target|
    next unless target.name == 'fmt'
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
      if defs.kind_of?(Array)
        defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
      elsif defs.kind_of?(String)
        defs = "#{defs} FMT_USE_CONSTEVAL=0" unless defs.include?('FMT_USE_CONSTEVAL=0')
      end
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
      cxx_flags = config.build_settings['OTHER_CPLUSPLUSFLAGS'].to_s.strip
      cxx_flags = '$(inherited)' if cxx_flags.empty?
      unless cxx_flags.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = "#{cxx_flags} -DFMT_USE_CONSTEVAL=0"
      end
    end
  end
`;

      contents = injectIntoPostInstall(contents, fmtPatch);
      fs.writeFileSync(filePath, contents, 'utf-8');
      return config;
    },
  ]);
};

module.exports = withFmtCxxStandard;
