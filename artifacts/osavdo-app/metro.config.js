const { getDefaultConfig } = require('expo/metro-config');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');

const config = getDefaultConfig(__dirname);
// Metro otherwise reuses old application transforms when only a custom plugin changes.
const localizationHash = createHash('sha256')
  .update(readFileSync(require.resolve('./scripts/localize-ui.cjs')))
  .digest('hex');
config.cacheVersion = `${config.cacheVersion ?? '1'}:${localizationHash}`;
module.exports = config;
