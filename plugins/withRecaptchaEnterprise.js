const { withPodfile } = require('@expo/config-plugins');

const POD_LINE = "  pod 'RecaptchaEnterprise'";

// FirebaseAuth 12.x falls back to reCAPTCHA Enterprise verification on iOS
// whenever silent APNs push verification isn't available (debug/dev-client
// builds, or before a real APNs token is registered) — without this pod,
// that fallback throws "[auth/unknown] The reCAPTCHA SDK is not linked to
// your app" instead of showing the verification challenge. expo prebuild
// regenerates ios/Podfile from scratch every time, so this has to be
// injected here rather than surviving as a manual edit.
module.exports = function withRecaptchaEnterprise(config) {
    return withPodfile(config, (config) => {
        if (!config.modResults.contents.includes(POD_LINE.trim())) {
            config.modResults.contents = config.modResults.contents.replace(
                'use_expo_modules!',
                `use_expo_modules!\n\n${POD_LINE}`,
            );
        }
        return config;
    });
};
