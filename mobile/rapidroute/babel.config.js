module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated v3+ — MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
