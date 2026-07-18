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
 * This plugin fixes that by injecting a Podfile post_install hook that:
 *  1. Directly patches the fmt header file to set `#define FMT_USE_CONSTEVAL 0`
 *     BEFORE fmt's own header guards check it — this is the nuclear/guaranteed fix.
 *  2. Also sets build settings as belt-and-suspenders backup.
 *
 * WHY DIRECT HEADER PATCHING:
 * The build settings approach (GCC_PREPROCESSOR_DEFINITIONS, OTHER_CPLUSPLUSFLAGS)
 * was being silently ignored because Expo SDK 53 generates a final `post_install`
 * block at the END of the Podfile. CocoaPods only runs the LAST post_install block,
 * so injecting into the first one means our build settings changes never execute.
 * Direct header patching bypasses Xcode settings entirely.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const INJECTION_MARKER = '# fmt-consteval-nuclear-fix';

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

      // ---------------------------------------------------------------------------
      // The post_install hook that runs after `pod install`.
      // STRATEGY 1 (Primary): Directly patch the fmt C++ header files on disk.
      //   This inserts `#define FMT_USE_CONSTEVAL 0` before fmt's own header guard
      //   checks it, disabling consteval unconditionally. This works regardless of
      //   how Xcode resolves build settings.
      // STRATEGY 2 (Backup): Set build settings on the fmt Xcode target.
      // ---------------------------------------------------------------------------
      const postInstallHook = `
  ${INJECTION_MARKER}
  # Fixes: "call to consteval function is not a constant expression" with iOS 26 SDK / Xcode 26+
  # The fmt library (used by React Native's Folly) uses consteval via FMT_STRING, which
  # Apple's clang now rejects when arguments are not compile-time constants.

  # --- STRATEGY 1: Direct header patching (primary / most reliable) ---
  # Directly modify the fmt header to define FMT_USE_CONSTEVAL=0 before fmt's own guards.
  # This bypasses Xcode build settings entirely.
  fmt_include_dir = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt')
  %w[core.h base.h format.h].each do |header_name|
    header_path = File.join(fmt_include_dir, header_name)
    next unless File.exist?(header_path)
    content = File.read(header_path)

    # Skip if already patched
    next if content.include?('// [fmt-consteval-patch]')

    if content.include?('#ifndef FMT_USE_CONSTEVAL')
      patched = content.sub(
        '#ifndef FMT_USE_CONSTEVAL',
        "// [fmt-consteval-patch] Injected by withFmtCxxStandard Expo plugin\\n" \\
        "// Disables consteval usage in fmt for iOS 26 SDK / Xcode 26+ compatibility.\\n" \\
        "#define FMT_USE_CONSTEVAL 0\\n" \\
        "#ifndef FMT_USE_CONSTEVAL"
      )
      File.write(header_path, patched)
      puts "  [withFmtCxxStandard] ✅ Patched fmt/#{header_name} — FMT_USE_CONSTEVAL=0 injected"
    else
      puts "  [withFmtCxxStandard] ⚠️  fmt/#{header_name} exists but #ifndef FMT_USE_CONSTEVAL not found — skipping patch"
    end
  end

  # --- STRATEGY 2: Xcode build settings (belt-and-suspenders backup) ---
  installer.pods_project.targets.each do |target|
    next unless target.name == 'fmt'
    target.build_configurations.each do |config|
      # Force C++17 standard — consteval is a C++20 feature
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'

      # GCC_PREPROCESSOR_DEFINITIONS
      defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
      if defs.kind_of?(Array)
        defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
      elsif defs.kind_of?(String)
        defs = "#{defs} FMT_USE_CONSTEVAL=0" unless defs.include?('FMT_USE_CONSTEVAL=0')
      end
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs

      # OTHER_CPLUSPLUSFLAGS — passed directly to clang invocation
      cxx_flags = config.build_settings['OTHER_CPLUSPLUSFLAGS'].to_s.strip
      cxx_flags = '$(inherited)' if cxx_flags.empty?
      unless cxx_flags.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = "#{cxx_flags} -DFMT_USE_CONSTEVAL=0"
      end
    end
  end
`;

      // Inject at the end of the LAST post_install block, or create a new one.
      // We append a NEW standalone post_install block at the very end of the Podfile.
      // This ensures it runs AFTER all other post_install hooks (CocoaPods runs the last one).
      contents += `\npost_install do |installer|\n${postInstallHook}\nend\n`;

      fs.writeFileSync(filePath, contents, 'utf-8');
      return config;
    },
  ]);
};

module.exports = withFmtCxxStandard;
