const crypto = require('crypto');
const { connectRedis } = require('../config/redis');
const { encrypt, decrypt } = require('../utils/encryption');
const { generateUniqueKey, KEY_PREFIX } = require('./wordService');

const TTL_SECONDS = {
  '1h': 60 * 60,
  '1d': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
};

function resolveTtl(expiresIn) {
  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Math.floor(expiresIn);
  }
  if (expiresIn && TTL_SECONDS[expiresIn]) {
    return TTL_SECONDS[expiresIn];
  }
  return TTL_SECONDS['1d'];
}

function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function createNote({ content, password, expiresIn, notifyEmail }) {
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Content is required');
  }

  const ttlSeconds = resolveTtl(expiresIn);
  const { key, words } = await generateUniqueKey();
  const encryptedData = encrypt(content);
  const passwordHash = hashPassword(password);

  const note = {
    encryptedData,
    passwordHash,
    notifyEmail: notifyEmail || null,
    createdAt: Date.now(),
  };

  const client = await connectRedis();
  await client.set(`${KEY_PREFIX}${key}`, JSON.stringify(note), { EX: ttlSeconds });

  return { key, words };
}

async function getNote(key, password) {
  const client = await connectRedis();
  const raw = await client.get(`${KEY_PREFIX}${key}`);

  if (!raw) {
    return null;
  }

  const note = JSON.parse(raw);
  if (note.passwordHash) {
    if (!password) {
      const err = new Error('Password required');
      err.code = 'PASSWORD_REQUIRED';
      throw err;
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== note.passwordHash) {
      const err = new Error('Invalid password');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }
  }

  await client.del(`${KEY_PREFIX}${key}`);
  const content = decrypt(note.encryptedData);

  return {
    content,
    notifyEmail: note.notifyEmail,
    createdAt: note.createdAt,
  };
}

async function checkNote(key) {
  const client = await connectRedis();
  const raw = await client.get(`${KEY_PREFIX}${key}`);
  if (!raw) {
    return { exists: false };
  }

  const note = JSON.parse(raw);
  return { exists: true, requiresPassword: Boolean(note.passwordHash) };
}

module.exports = {
  createNote,
  getNote,
  checkNote,
  resolveTtl,
  hashPassword,
};
