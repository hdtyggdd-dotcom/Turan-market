module.exports = function (api) {
  const localizationPlugin = require.resolve('./scripts/localize-ui.cjs');
  const pluginHash = () => require('node:crypto').createHash('sha256')
    .update(require('node:fs').readFileSync(localizationPlugin)).digest('hex');
  api.cache.using(pluginHash);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    // Include the plugin source in Metro's persistent transform cache identity.
    plugins: [[localizationPlugin, { cacheKey: pluginHash() }]],
  };
};
