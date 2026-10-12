const { withProjectBuildGradle } = require('@expo/config-plugins');

const REPO_LINE =
    "    maven { url = uri(\"${rootDir}/../node_modules/@notifee/react-native/android/libs\") }";

// @notifee/react-native ships its native core (app.notifee:core) as a local
// Maven repo inside node_modules instead of publishing it to Maven Central.
// Without this repo in allprojects, the build fails with "Could not find any
// matches for app.notifee:core:+". expo prebuild regenerates
// android/build.gradle from scratch every time, so this has to be injected
// here rather than surviving as a manual edit.
module.exports = function withNotifeeMavenRepo(config) {
    return withProjectBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('@notifee/react-native/android/libs')) {
            config.modResults.contents = config.modResults.contents.replace(
                /allprojects\s*\{\s*repositories\s*\{/,
                (match) => `${match}\n${REPO_LINE}`,
            );
        }
        return config;
    });
};
