const { withAppDelegate } = require('@expo/config-plugins');

// PushKit VoIP pushes are what let an incoming call wake the app and ring
// via CallKit even when it's fully backgrounded or killed on iOS — a plain
// remote-notification push can't guarantee that. The `voip` UIBackgroundModes
// entry is declared statically in app.json; this plugin handles the part
// app.json can't express — hooking AppDelegate's PKPushRegistryDelegate
// conformance to RNVoipPushNotification, which expo prebuild doesn't
// generate on its own and would otherwise need re-adding by hand after
// every prebuild.
const IMPORT_LINE = 'import PushKit';
const CONFORMANCE_MARKER = 'PKPushRegistryDelegate';
const REGISTRATION_LINE = '    RNVoipPushNotificationManager.voipRegistration()';

// Despite the raw Objective-C header declaring
// +didUpdatePushCredentials:forType: and +didReceiveIncomingPushWithPayload:
// forType:, the library carries explicit Swift-facing renames — the
// compiler outright refuses the literal selector-derived names ("has been
// renamed to..."; confirmed by an actual build, not guessed) in favor of
// didUpdate(_:forType:) and didReceiveIncomingPush(with:forType:).
const DELEGATE_EXTENSION = `
extension AppDelegate: PKPushRegistryDelegate {
  public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)
    completion()
  }
}
`;

module.exports = function withPushKit(config) {
    config = withAppDelegate(config, (config) => {
        let contents = config.modResults.contents;

        if (!contents.includes(IMPORT_LINE)) {
            contents = contents.replace('import Expo', `import Expo\n${IMPORT_LINE}\nimport RNVoipPushNotification`);
        }

        if (!contents.includes(REGISTRATION_LINE)) {
            contents = contents.replace(
                /(reactNativeFactory = factory\n\s*bindReactNativeFactory\(factory\))/,
                `$1\n\n${REGISTRATION_LINE}`,
            );
        }

        if (!contents.includes(CONFORMANCE_MARKER)) {
            contents = `${contents}\n${DELEGATE_EXTENSION}`;
        }

        config.modResults.contents = contents;
        return config;
    });

    return config;
};
