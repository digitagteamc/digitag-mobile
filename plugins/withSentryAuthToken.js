const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Sentry's own Expo plugin deliberately refuses to accept authToken in
// app.json (it would get written into ios/sentry.properties and shipped
// inside the app package) — it must come from a SENTRY_AUTH_TOKEN
// environment variable at build time instead. Xcode's build-phase scripts
// only see vars sourced from ios/.xcode.env(.local), and expo prebuild
// regenerates that file from scratch each time, so the token (read from the
// gitignored root .env, never committed) has to be re-injected here on every
// prebuild rather than surviving as a manual edit.
module.exports = function withSentryAuthToken(config) {
    return withDangerousMod(config, [
        'ios',
        (config) => {
            const token = process.env.SENTRY_AUTH_TOKEN;
            if (!token) return config;
            const envLocalPath = path.join(config.modRequest.platformProjectRoot, '.xcode.env.local');
            let contents = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
            contents = contents
                .split('\n')
                .filter((line) => !line.includes('SENTRY_AUTH_TOKEN') && !line.includes('SENTRY_DISABLE_AUTO_UPLOAD'))
                .join('\n');
            if (!contents.endsWith('\n') && contents.length > 0) contents += '\n';
            contents += `export SENTRY_AUTH_TOKEN=${token}\n`;
            fs.writeFileSync(envLocalPath, contents);
            return config;
        },
    ]);
};
