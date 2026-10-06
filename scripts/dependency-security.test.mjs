import assert from 'node:assert/strict';
import { generateKeyPairSync, privateEncrypt, constants } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// pnpm's active transitive links, not abandoned copies left in its store.
const dependencies = createRequire(path.join(root, 'node_modules/.pnpm/node_modules/security-test.cjs'));
const app = createRequire(path.join(root, 'artifacts/osavdo-app/package.json'));
const cli = createRequire(app.resolve('@expo/cli/package.json'));
const forge = cli('node-forge');
const braces = dependencies('braces');
const { sprintf } = dependencies('sprintf-js');

test('the publish-blocking proxy-addr package is upgraded', () => {
  assert.equal(dependencies('proxy-addr/package.json').version, '2.0.8');
});

test('braces preserves ordinary patterns and rejects deep patterns before recursion', () => {
  assert.deepEqual(braces.expand('file-{a,b}.js'), ['file-a.js', 'file-b.js']);
  assert.equal(braces.compile('{a,b}'), '(a|b)');
  for (const pattern of ['{'.repeat(12000) + 'a' + '}'.repeat(12000),
    '('.repeat(12000) + 'a' + ')'.repeat(12000)]) {
    for (const run of [braces.parse, braces.compile, braces.expand, braces.stringify]) {
      assert.throws(() => run(pattern), { name: 'SyntaxError' });
    }
  }
});

test('all braces walkers also reject externally supplied deep or cyclic ASTs', () => {
  let ast = { type: 'text', value: 'a' };
  for (let i = 0; i < 1000; i++) ast = { type: 'brace', nodes: [ast] };
  const cycle = { type: 'root', nodes: [] };
  cycle.nodes.push(cycle);
  for (const run of [braces.compile, braces.expand, braces.stringify]) {
    assert.throws(() => run(ast), { name: 'SyntaxError' });
    assert.throws(() => run(cycle), { name: 'SyntaxError' });
  }
});

test('sprintf preserves valid formatting and bounds oversized precision', () => {
  assert.equal(sprintf('%.2f', 1.234), '1.23');
  assert.equal(sprintf('%.2e', 12.34), '1.23e+1');
  assert.equal(sprintf('%.2g', 12.34), '12');
  for (const type of ['e', 'f', 'g']) {
    const output = sprintf(`%.${'9'.repeat(400)}${type}`, 1.25);
    assert.ok(output.length < 120);
  }
  assert.doesNotThrow(() => sprintf('%.0g', 1.25));
});

test('forge accepts valid signatures and rejects extra DigestAlgorithm children', () => {
  const keys = generateKeyPairSync('rsa', { modulusLength: 1024, publicExponent: 3 });
  const key = forge.pki.publicKeyFromPem(keys.publicKey.export({ type: 'spki', format: 'pem' }));
  const privateKey = forge.pki.privateKeyFromPem(keys.privateKey.export({ type: 'pkcs1', format: 'pem' }));
  const md = forge.md.sha256.create().update('security regression');
  const digest = md.digest().getBytes();
  assert.equal(key.verify(digest, privateKey.sign(md)), true);
  const { asn1 } = forge;
  const node = (type, constructed, value) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  const algorithm = () => [
    node(asn1.Type.OID, false, asn1.oidToDer(forge.oids.sha256).getBytes()),
    node(asn1.Type.NULL, false, ''),
  ];
  const signature = children => {
    const der = asn1.toDer(node(asn1.Type.SEQUENCE, true, [
      node(asn1.Type.SEQUENCE, true, children), node(asn1.Type.OCTETSTRING, false, digest),
    ])).getBytes();
    const data = Buffer.from(der, 'binary');
    const padding = Buffer.alloc(128 - data.length - 3, 0xff);
    const encoded = Buffer.concat([Buffer.from([0, 1]), padding, Buffer.from([0]), data]);
    return privateEncrypt({ key: keys.privateKey, padding: constants.RSA_NO_PADDING }, encoded).toString('binary');
  };
  assert.equal(key.verify(digest, signature(algorithm())), true);
  assert.equal(key.verify(digest, signature(algorithm().slice(0, 1))), true);
  assert.throws(() => key.verify(digest, signature([
    ...algorithm(), node(asn1.Type.OCTETSTRING, false, 'garbage'),
  ])), /DigestInfo/);
  const nonemptyNull = algorithm();
  nonemptyNull[1].value = 'garbage';
  assert.throws(() => key.verify(digest, signature(nonemptyNull)), /DigestInfo/);
});

test('uuid keeps CommonJS callers working and checks output-buffer bounds', () => {
  const uuid = dependencies('uuid');
  assert.match(uuid.v4(), /^[0-9a-f-]{36}$/);
  assert.throws(() => uuid.v5('test', uuid.v5.DNS, new Uint8Array(8)), RangeError);
});

test('both Expo and React Native Metro can measure image assets with image-size 2', async () => {
  const expo = createRequire(app.resolve('expo/package.json'));
  const expoMetro = createRequire(expo.resolve('@expo/metro/package.json'));
  const native = createRequire(app.resolve('react-native/package.json'));
  const communityCli = createRequire(native.resolve('@react-native/community-cli-plugin/package.json'));
  const icon = path.join(root, 'artifacts/osavdo-app/assets/images/turan-logo.png');
  const bytes = readFileSync(icon);
  for (const parent of [expoMetro, communityCli]) {
    const assetsPath = path.join(path.dirname(parent.resolve('metro/package.json')), 'src/Assets.js');
    const { getAssetData } = parent(assetsPath);
    const data = await getAssetData(icon, 'turan-logo.png', [], 'android', '/assets');
    assert.equal(data.width, bytes.readUInt32BE(16));
    assert.equal(data.height, bytes.readUInt32BE(20));
  }
});
