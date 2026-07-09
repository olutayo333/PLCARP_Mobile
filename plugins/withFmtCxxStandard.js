const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const withFmtCxxStandard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(filePath, 'utf-8');

      const targetOverride = `
    # Force fmt to compile with C++17 and disable consteval to bypass Xcode 16+ error
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
          
          # Bulletproof addition of FMT_USE_CONSTEVAL=0 to GCC_PREPROCESSOR_DEFINITIONS
          defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
          if defs.kind_of?(Array)
            defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
          elsif defs.kind_of?(String)
            defs = defs + ' FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
          end
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
        end
      end
    end`;

      const result = mergeContents({
        tag: 'fmt-consteval-fix',
        src: contents,
        newSrc: targetOverride,
        anchor: /post_install do \|installer\|/i,
        offset: 1,
        comment: '#',
      });

      if (result.didMerge || result.didClear) {
        fs.writeFileSync(filePath, result.contents, 'utf-8');
      } else {
        // Fallback injection if the anchor doesn't perfectly match
        const fallback = contents.replace(
          /post_install do \\|installer\\|/,
          `post_install do |installer|${targetOverride}`
        );
        fs.writeFileSync(filePath, fallback, 'utf-8');
      }

      return config;
    },
  ]);
};

module.exports = withFmtCxxStandard;
