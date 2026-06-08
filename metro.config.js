const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure gif and webp animated assets are bundled
const { assetExts } = config.resolver;
if (!assetExts.includes('gif')) assetExts.push('gif');

module.exports = withNativeWind(config, {
  input: "./global.css"
});
