/**
 * @fileoverview Token Database Service
 *
 * This module provides secure storage for platform authentication tokens.
 * Tokens are encrypted using AES-256-GCM before being stored in the database.
 *
 * @module database/tokens
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('./index');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get or create encryption key lazily
let encryptionKey = null;

/**
 * Set the encryption key for testing purposes.
 * @param {Buffer|string} key - The 32-byte encryption key or string
 */
function setEncryptionKey(key) {
  if (typeof key === 'string') {
    encryptionKey = Buffer.from(key.padEnd(KEY_LENGTH, ' ')).subarray(0, KEY_LENGTH);
  } else {
    encryptionKey = key;
  }
}

/**
 * Get or create the encryption key for token encryption.
 * The key is stored in a file in the user data directory.
 *
 * @returns {Buffer} The 256-bit encryption key
 */
function getEncryptionKey() {
  if (encryptionKey) {
    return encryptionKey;
  }

  const { app } = require('electron');
  const keyPath = path.join(app.getPath('userData'), '.token_key');

  if (fs.existsSync(keyPath)) {
    encryptionKey = fs.readFileSync(keyPath);
  } else {
    // Generate new key
    const key = crypto.randomBytes(KEY_LENGTH);
    fs.writeFileSync(keyPath, key, { mode: 0o600 }); // Restrict permissions
    encryptionKey = key;
  }

  return encryptionKey;
}

/**
 * Encrypt a token using AES-256-GCM.
 *
 * @param {string} plaintext - The token to encrypt
 * @returns {string} Base64-encoded encrypted token (IV + ciphertext + authTag)
 */
function encryptToken(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted + authTag
  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

/**
 * Decrypt a token using AES-256-GCM.
 *
 * @param {string} encryptedData - Base64-encoded encrypted token
 * @returns {string} The decrypted token
 */
function decryptToken(encryptedData) {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');

    if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(buffer.length - AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH, buffer.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Failed to decrypt token:', err.message);
    return null;
  }
}

/**
 * Get the unified database connection.
 * Uses the centralized database manager.
 *
 * @returns {Database.Database} The database connection
 */
function getDb() {
  return getDatabase();
}

// CRUD operations
function createToken(platform, token) {
  const encrypted = encryptToken(token);
  const now = Date.now();

  const stmt = getDb().prepare(`
        INSERT INTO tokens (platform, token_encrypted, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(platform) DO UPDATE SET
            token_encrypted = excluded.token_encrypted,
            updated_at = excluded.updated_at
    `);

  const result = stmt.run(platform, encrypted, now, now);
  return result.lastInsertRowid;
}

function getTokens() {
  const stmt = getDb().prepare(
    'SELECT id, platform, token_encrypted, created_at, updated_at FROM tokens'
  );
  const rows = stmt.all();

  return rows
    .map((row) => {
      try {
        return {
          id: row.id,
          platform: row.platform,
          token: decryptToken(row.token_encrypted),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err) {
        console.error(`Failed to decrypt token for platform ${row.platform}:`, err.message);
        return null;
      }
    })
    .filter((t) => t !== null);
}

function getTokenByPlatform(platform) {
  const stmt = getDb().prepare(
    'SELECT id, platform, token_encrypted, created_at, updated_at FROM tokens WHERE platform = ?'
  );
  const row = stmt.get(platform);

  if (!row) return null;

  try {
    const token = decryptToken(row.token_encrypted);
    if (!token) return null;

    return {
      id: row.id,
      platform: row.platform,
      token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error(`Failed to get token for platform ${platform}:`, err.message);
    return null;
  }
}

function updateToken(platform, token) {
  const encrypted = encryptToken(token);
  const now = Date.now();

  const stmt = getDb().prepare(
    'UPDATE tokens SET token_encrypted = ?, updated_at = ? WHERE platform = ?'
  );
  const result = stmt.run(encrypted, now, platform);

  return result.changes > 0;
}

function deleteToken(platform) {
  const stmt = getDb().prepare('DELETE FROM tokens WHERE platform = ?');
  const result = stmt.run(platform);

  return result.changes > 0;
}

module.exports = {
  createToken,
  getTokens,
  getTokenByPlatform,
  updateToken,
  deleteToken,
  setEncryptionKey,
};
