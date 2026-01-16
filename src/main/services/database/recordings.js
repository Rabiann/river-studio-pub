
/**
 * @fileoverview Recordings Database Service
 *
 * This module provides CRUD operations for recording metadata.
 * Recordings store file path, duration, size, and thumbnail references.
 *
 * @module database/recordings
 */

const { getDatabase } = require('./index');

/**
 * Get the unified database connection.
 *
 * @returns {Database.Database} The database connection
 */
function getDb() {
  return getDatabase();
}

// CRUD operations
function createRecording(recording) {
  const now = Date.now();

  const stmt = getDb().prepare(`
        INSERT INTO recordings (path, filename, date, duration, size, thumbnail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

  const result = stmt.run(
    recording.path,
    recording.filename,
    recording.date,
    recording.duration || '00:00:00',
    recording.size || '0 B',
    recording.thumbnail || '',
    now
  );
  return result.lastInsertRowid;
}

function getRecordings() {
  const stmt = getDb().prepare(
    'SELECT * FROM recordings ORDER BY created_at DESC'
  );
  return stmt.all();
}

function getRecording(id) {
  const stmt = getDb().prepare('SELECT * FROM recordings WHERE id = ?');
  return stmt.get(id);
}

function deleteRecording(id) {
  const stmt = getDb().prepare('DELETE FROM recordings WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

module.exports = {
  createRecording,
  getRecordings,
  getRecording,
  deleteRecording,
};
