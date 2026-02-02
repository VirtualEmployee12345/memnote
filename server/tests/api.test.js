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
    // Health
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200, 'health status should be 200');
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, 'ok', 'health status should be ok');

    // Create
    const createRes = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello' }),
    });
    assert.strictEqual(createRes.status, 201, 'create status should be 201');
    const createJson = await createRes.json();
    assert.ok(createJson.key, 'create should return key');

    // Exists
    const getRes = await fetch(`${baseUrl}/api/notes/${createJson.key}`);
    assert.strictEqual(getRes.status, 200, 'get status should be 200');
    const getJson = await getRes.json();
    assert.strictEqual(getJson.exists, true, 'get should return exists');

    console.log('All API tests passed.');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('API tests failed.');
  console.error(err);
  process.exit(1);
});
