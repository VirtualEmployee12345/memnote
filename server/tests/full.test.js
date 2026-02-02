const assert = require('assert');
const app = require('../index');

if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

async function run() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Create note
    const createRes = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello world', expiresIn: '1h' }),
    });
    assert.strictEqual(createRes.status, 201, 'create status should be 201');
    const createJson = await createRes.json();
    assert.ok(createJson.key, 'create should return key');
    assert.ok(createJson.url, 'create should return url');
    assert.ok(
      /^adj\d{4}-noun\d{4}-animal\d{4}$/.test(createJson.key),
      'key should match memorable format'
    );

    // Check exists
    const existsRes = await fetch(`${baseUrl}/api/notes/${createJson.key}`);
    assert.strictEqual(existsRes.status, 200, 'exists status should be 200');
    const existsJson = await existsRes.json();
    assert.strictEqual(existsJson.exists, true, 'note should exist');
    assert.strictEqual(existsJson.requiresPassword, false, 'note should not require password');

    // Read note
    const readRes = await fetch(`${baseUrl}/api/notes/${createJson.key}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(readRes.status, 200, 'read status should be 200');
    const readJson = await readRes.json();
    assert.strictEqual(readJson.content, 'hello world', 'read should return content');

    // Read again should fail
    const readAgainRes = await fetch(`${baseUrl}/api/notes/${createJson.key}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(readAgainRes.status, 404, 'read again should be 404');

    // Password-protected note
    const secureRes = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'secret', password: 'p@ss' }),
    });
    assert.strictEqual(secureRes.status, 201, 'secure create status should be 201');
    const secureJson = await secureRes.json();
    assert.ok(secureJson.key, 'secure create should return key');

    const noPassRes = await fetch(`${baseUrl}/api/notes/${secureJson.key}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(noPassRes.status, 401, 'read without password should be 401');

    const wrongPassRes = await fetch(`${baseUrl}/api/notes/${secureJson.key}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });
    assert.strictEqual(wrongPassRes.status, 401, 'read with wrong password should be 401');

    const correctPassRes = await fetch(`${baseUrl}/api/notes/${secureJson.key}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'p@ss' }),
    });
    assert.strictEqual(correctPassRes.status, 200, 'read with correct password should be 200');
    const correctPassJson = await correctPassRes.json();
    assert.strictEqual(correctPassJson.content, 'secret', 'read should return content');

    console.log('All full integration tests passed.');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('Full integration tests failed.');
  console.error(err);
  process.exit(1);
});
