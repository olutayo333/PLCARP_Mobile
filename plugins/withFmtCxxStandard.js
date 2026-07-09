const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFmtCxxStandard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(filePath, 'utf-8');

      const targetOverride = `
    # Force fmt to compile with C++17 to bypass C++20 consteval error in Xcode 16+
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

      if (!contents.includes("target.name == 'fmt'")) {
        contents = contents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${targetOverride}`
        );
        fs.writeFileSync(filePath, contents, 'utf-8');
      }

      return config;
    },
  ]);
};

module.exports = withFmtCxxStandard;
