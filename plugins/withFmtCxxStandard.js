const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const withFmtCxxStandard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(filePath, 'utf-8');

      const targetOverride = `
    # Force fmt to compile with C++17 and disable consteval to bypass Xcode 16+ / iOS 26 SDK error
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'

          # Method 1: GCC_PREPROCESSOR_DEFINITIONS (works for most Xcode versions)
          defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
          if defs.kind_of?(Array)
            defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
          elsif defs.kind_of?(String)
            defs = defs + ' FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
          end
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs

          # Method 2: OTHER_CPLUSPLUSFLAGS — passes define directly to clang invocation.
          # More reliable with iOS 26 SDK / Xcode 26 where GCC_PREPROCESSOR_DEFINITIONS
          # may not compose correctly with inherited Xcode variable references.
          cxx_flags = config.build_settings['OTHER_CPLUSPLUSFLAGS'].to_s
          cxx_flags = '$(inherited)' if cxx_flags.empty?
          unless cxx_flags.include?('FMT_USE_CONSTEVAL=0')
            config.build_settings['OTHER_CPLUSPLUSFLAGS'] = cxx_flags + ' -DFMT_USE_CONSTEVAL=0'
          end
        end
      end
    end`;

      if (contents.includes("target.name == 'fmt'")) {
        // Already injected
        return config;
      }

      if (contents.match(/post_install\s+do\s+\|.*?\|/)) {
        contents = contents.replace(
          /(post_install\s+do\s+\|.*?\|)/,
          `$1\n${targetOverride}`
        );
      } else {
        contents += `\npost_install do |installer|\n${targetOverride}\nend\n`;
      }

      fs.writeFileSync(filePath, contents, 'utf-8');
      return config;
    },
  ]);
};

module.exports = withFmtCxxStandard;
