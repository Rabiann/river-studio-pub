/**
 * @fileoverview Settings Database Service
 *
 * This module provides CRUD operations for application settings.
 * Settings are stored as key-value pairs in the settings table.
 *
 * Supported settings:
 * - theme: 'light' | 'dark'
 * - rtmpUrl: Custom RTMP server URL
 * - recordingPath: Default path for saving recordings
 * - recordingFormat: 'webm' | 'mp4' | 'mkv'
 * - hotkeys: JSON string of hotkey bindings
 *
 * @module database/settings
 */

const { getDatabase } = require('./index');

/**
 * Default settings values.
 * Used when a setting hasn't been configured yet.
 */
const DEFAULT_SETTINGS = {
    theme: 'dark',
    rtmpUrl: '',
    recordingPath: '',
    recordingFormat: 'webm',

};

/**
 * Get a single setting value by key.
 *
 * @param {string} key - The setting key to retrieve
 * @returns {string|null} The setting value, or null if not found
 */
function getSetting(key) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
}

/**
 * Set a single setting value.
 * Uses UPSERT to insert or update the setting.
 *
 * @param {string} key - The setting key
 * @param {string} value - The setting value (must be a string)
 * @returns {boolean} True if the operation succeeded
 */
function setSetting(key, value) {
    const db = getDatabase();
    const now = Date.now();

    const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

    const result = stmt.run(key, String(value), now);
    return result.changes > 0;
}

/**
 * Get all settings as a key-value object.
 * Includes default values for any settings not yet configured.
 *
 * @returns {Object} Settings object with all application settings
 */
function getAllSettings() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all();

    // Start with defaults
    const settings = { ...DEFAULT_SETTINGS };

    // Override with stored values
    for (const row of rows) {
        settings[row.key] = row.value;
    }



    return settings;
}

/**
 * Delete a setting by key.
 *
 * @param {string} key - The setting key to delete
 * @returns {boolean} True if the setting was deleted
 */
function deleteSetting(key) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM settings WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
}

/**
 * Set multiple settings at once.
 *
 * @param {Object} settings - Object with key-value pairs of settings
 * @returns {boolean} True if all settings were saved
 */
function setMultipleSettings(settings) {
    const db = getDatabase();
    const now = Date.now();

    const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

    const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
            // Convert objects to JSON strings
            const stringValue =
                typeof value === 'object' ? JSON.stringify(value) : String(value);
            stmt.run(key, stringValue, now);
        }
    });

    try {
        transaction();
        return true;
    } catch (err) {
        console.error('Failed to save settings:', err);
        return false;
    }
}

module.exports = {
    getSetting,
    setSetting,
    getAllSettings,
    deleteSetting,
    setMultipleSettings,
    DEFAULT_SETTINGS,
};
