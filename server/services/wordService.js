const crypto = require('crypto');
const { adjectives, nouns, animals } = require('../utils/wordlist');
const { connectRedis } = require('../config/redis');

const MAX_ATTEMPTS = 10;
const KEY_PREFIX = 'note:';

function pickRandom(list) {
  return list[crypto.randomInt(0, list.length)];
}

async function keyExists(client, key) {
  const exists = await client.exists(`${KEY_PREFIX}${key}`);
  return exists === 1;
}

async function generateUniqueKey() {
  const client = await connectRedis();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const words = [pickRandom(adjectives), pickRandom(nouns), pickRandom(animals)];
    const key = words.join('-');

    if (!(await keyExists(client, key))) {
      return { key, words };
    }
  }

  throw new Error('Failed to generate unique key');
}

module.exports = {
  generateUniqueKey,
  KEY_PREFIX,
};
