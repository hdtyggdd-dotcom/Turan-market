const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const output = path.join(projectRoot, 'web-build');
const result = spawnSync('pnpm', [
  'exec', 'expo', 'export', '--platform', 'web', '--output-dir', 'web-build',
], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const config = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8')).expo;
const icon = fs.readFileSync(path.resolve(projectRoot, config.icon));
fs.writeFileSync(path.join(output, 'app-icon.png'), icon);
fs.writeFileSync(path.join(output, 'manifest.webmanifest'), JSON.stringify({
  id: '/',
  name: config.name,
  short_name: 'Turan Market',
  description: 'Tovarlar va yuk tashish bozori',
  lang: 'uz',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#10b981',
  icons: [{
    src: '/app-icon.png',
    sizes: `${icon.readUInt32BE(16)}x${icon.readUInt32BE(20)}`,
    type: 'image/png',
    purpose: 'any',
  }],
}, null, 2));

const index = path.join(output, 'index.html');
let html = fs.readFileSync(index, 'utf8');
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(config.name)}</title>`);
html = html.replace(/<html\b([^>]*)>/i, (_, attrs) =>
  `<html lang="uz"${attrs.replace(/\s+lang=(?:"[^"]*"|'[^']*')/gi, '')}>`);
html = html.replace('</head>', [
  '<meta name="description" content="Turan Market — tovarlar va yuk tashish bozori">',
  '<meta name="theme-color" content="#10b981">',
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="/app-icon.png">',
  '</head>',
].join('\n'));
fs.writeFileSync(index, html);
console.log('Production web app exported with home-screen metadata. Internet is required; no private API responses are cached.');
