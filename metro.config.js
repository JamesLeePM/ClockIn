const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to use the correct hostname
config.server = {
    ...config.server,
    hostname: '0.0.0.0', // This allows connections from any IP
};

module.exports = config;
