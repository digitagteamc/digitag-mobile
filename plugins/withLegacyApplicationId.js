const { withAppBuildGradle } = require('@expo/config-plugins');

// expo-iap's plugin rewrites `applicationId 'x'` to the newer
// `applicationId = 'x'` Gradle syntax, but the SDK 54 Expo CLI only finds the
// app id with /applicationId ['"](.*)['"]/ — so `expo run:android` fails with
// "Failed to locate the android application identifier". Both forms are valid
// Groovy, so put the CLI-readable one back. expo prebuild regenerates
// android/app/build.gradle from scratch every time, so this has to be
// injected here rather than surviving as a manual edit.
module.exports = function withLegacyApplicationId(config) {
    return withAppBuildGradle(config, (config) => {
        config.modResults.contents = config.modResults.contents.replace(
            /^(\s*)applicationId\s*=\s*(['"][^'"]+['"])\s*$/gm,
            '$1applicationId $2',
        );
        return config;
    });
};
