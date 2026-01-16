
/**
 * @fileoverview Unified Database Manager for River Studio
 *
 * This module provides a centralized database connection that consolidates
 * all data storage (tokens, recordings, settings) into a single SQLite database.
 *
 * The database file is stored at: {userData}/river-studio.db
 *
 * Tables:
 * - tokens: Encrypted platform authentication tokens
 * - recordings: Recording metadata and file references
 * - settings: Application settings and preferences
 *
 * @module database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Database instance - lazily initialized
 * @type {Database.Database|null}
 */
let db = null;

/**
 * Get or create the unified database connection.
 * Initializes all required tables on first call.
 *
 * @returns {Database.Database} The database connection
 */
/**
 * Set the database instance for testing purposes.
 * @param {Database.Database} database - The database instance
 */
function setDatabase(database) {
    db = database;
}

/**
 * Get or create the unified database connection.
 * Initializes all required tables on first call.
 *
 * @returns {Database.Database} The database connection
 */
function getDatabase() {
    if (db) return db; // Return existing instance if already initialized

    const { app } = require('electron');
    const dbPath = path.join(app.getPath('userData'), 'river-studio.db');

    db = new Database(dbPath);

    // Enable foreign keys for data integrity
    db.pragma('foreign_keys = ON');

    // Initialize all tables if they don't exist
    initializeSchema();

    // Migrate data from old databases if they exist
    migrateOldDatabases();

    return db;
}

/**
 * Initialize all database tables.
 * Creates tables if they don't exist.
 */
function initializeSchema() {
    // Tokens table - stores encrypted platform authentication tokens
    db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      token_encrypted TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

    // Recordings table - stores recording metadata
    db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      filename TEXT NOT NULL,
      date TEXT NOT NULL,
      duration TEXT,
      size TEXT,
      thumbnail TEXT,
      created_at INTEGER NOT NULL
    )
  `);

    // Settings table - stores application settings as key-value pairs
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);
}

/**
 * Migrate data from old separate database files.
 * This handles the transition from tokens.db and recordings.db
 * to the unified river-studio.db.
 */
function migrateOldDatabases() {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const now = Date.now();

    // Migrate tokens from old tokens.db
    const oldTokensDbPath = path.join(userDataPath, 'tokens.db');
    if (fs.existsSync(oldTokensDbPath)) {
        try {
            const oldDb = new Database(oldTokensDbPath, { readonly: true });

            // Check if tokens table exists in old db
            const tableExists = oldDb
                .prepare(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'"
                )
                .get();

            if (tableExists) {
                const oldTokens = oldDb.prepare('SELECT * FROM tokens').all();
                if (oldTokens.length > 0) {
                    const insertToken = db.prepare(`
                        INSERT OR IGNORE INTO tokens (platform, token_encrypted, created_at, updated_at)
                        VALUES (?, ?, ?, ?)
                    `);

                    for (const t of oldTokens) {
                        insertToken.run(
                            t.platform,
                            t.token_encrypted,
                            t.created_at || now,
                            t.updated_at || now
                        );
                    }
                }
            }

            oldDb.close();

            // Rename old database file to mark as migrated
            fs.renameSync(oldTokensDbPath, oldTokensDbPath + '.migrated');
        } catch (err) {
            console.error('Failed to migrate tokens.db:', err);
        }
    }

    // Migrate recordings from old recordings.db
    const oldRecordingsDbPath = path.join(userDataPath, 'recordings.db');
    if (fs.existsSync(oldRecordingsDbPath)) {
        try {
            const oldDb = new Database(oldRecordingsDbPath, { readonly: true });

            // Check if recordings table exists in old db
            const tableExists = oldDb
                .prepare(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='recordings'"
                )
                .get();

            if (tableExists) {
                const oldRecordings = oldDb.prepare('SELECT * FROM recordings').all();
                if (oldRecordings.length > 0) {
                    const insertRec = db.prepare(`
                        INSERT OR IGNORE INTO recordings (path, filename, date, duration, size, thumbnail, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    for (const r of oldRecordings) {
                        insertRec.run(
                            r.path,
                            r.filename,
                            r.date,
                            r.duration,
                            r.size,
                            r.thumbnail,
                            r.created_at || now
                        );
                    }
                }
            }

            oldDb.close();

            // Rename old database file to mark as migrated
            fs.renameSync(oldRecordingsDbPath, oldRecordingsDbPath + '.migrated');
        } catch (err) {
            console.error('Failed to migrate recordings.db:', err);
        }
    }
}

/**
 * Close the database connection.
 * Should be called when the application is shutting down.
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

module.exports = {
    getDatabase,
    closeDatabase,
    setDatabase,
};
