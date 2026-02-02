const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce for GCM

function getKey() {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is required');
  }

  let key;
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    key = Buffer.from(rawKey, 'hex');
  } else {
    try {
      key = Buffer.from(rawKey, 'base64');
    } catch (err) {
      key = Buffer.from(rawKey, 'utf8');
    }
  }

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes');
  }

  return key;
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
    throw new Error('Invalid encrypted payload');
  }

  const key = getKey();
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');
  const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};
