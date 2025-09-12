// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  config.resolver.alias = {
    ...(config.resolver.alias || {}),
    '@radix-ui/react-dialog': require.resolve('./shims/radix-dialog-web.tsx'),
    '@react-native-community/datetimepicker': require.resolve('./shims/datetimepicker-web.tsx'),
  };

  return config;
})();