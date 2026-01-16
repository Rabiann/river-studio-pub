import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';

// 1. No need to mock electron anymore as we use lazy requires

// 2. Import modules
const { setDatabase } = require('../index');
const { createToken, getTokens, getTokenByPlatform, updateToken, deleteToken, setEncryptionKey } = require('../tokens');

// 3. Setup Mock DB Helper
function setupMockDb() {
    const db = new Database(':memory:');
    // Initialize schema manually since we bypass initializeTables
    db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      token_encrypted TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
    return db;
}

describe('Tokens Database Service', () => {
    const testKey = 'test-key-32-bytes-long-for-tests';

    beforeEach(() => {
        // initialize in-memory DB for each test
        const db = setupMockDb();

        // Inject dependencies
        setDatabase(db);
        setEncryptionKey(testKey);
    });

    it('should create and retrieve a token', () => {
        const platform = 'twitch';
        const token = 'oauth:12345';

        createToken(platform, token);

        // Check retrieval
        const retrieved = getTokenByPlatform(platform);
        expect(retrieved).not.toBeNull();
        expect(retrieved.platform).toBe(platform);
        expect(retrieved.token).toBe(token);
    });

    it('should return null for non-existent token', () => {
        const result = getTokenByPlatform('non-existent');
        expect(result).toBeNull();
    });

    it('should list all tokens', () => {
        createToken('twitch', 'oauth:123');
        createToken('youtube', 'oauth:456');

        const tokens = getTokens();
        expect(tokens).toHaveLength(2);
        expect(tokens.map(t => t.platform).sort()).toEqual(['twitch', 'youtube']);
    });

    it('should update a token', () => {
        const platform = 'twitch';
        createToken(platform, 'old-token');

        updateToken(platform, 'new-token');

        const retrieved = getTokenByPlatform(platform);
        expect(retrieved.token).toBe('new-token');
    });

    it('should delete a token', () => {
        createToken('twitch', 'oauth:123');

        deleteToken('twitch');

        const result = getTokenByPlatform('twitch');
        expect(result).toBeNull();
    });
});
