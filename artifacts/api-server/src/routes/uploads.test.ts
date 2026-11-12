import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createUploadsRouter, imageStore } from './uploads.js';

test('an image missing from this instance is read from persistence and served', async () => {
  const id = 'img_read_through_test';
  imageStore.delete(id);
  let reads = 0;
  const app = express();
  app.use('/api', createUploadsRouter(async (requestedId) => {
    reads++;
    return requestedId === id ? 'data:image/jpeg;base64,/9j/2Q==' : undefined;
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}/api/images/`;
  try {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}${id}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type') ?? '', /image\/jpeg/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from('/9j/2Q==', 'base64'));
    }
    assert.equal(reads, 1, 'second read can use the instance cache');
    assert.equal((await fetch(`${base}img_missing`)).status, 404);
  } finally {
    imageStore.delete(id);
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
