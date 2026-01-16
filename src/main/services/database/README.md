# Database Services

This directory contains the database layer for River Studio, using SQLite (better-sqlite3).

## Unified Database

All application data is consolidated into a single unified database file located at:
`{userData}/river-studio.db`

### [index.js](./index.js)
The core database manager. It:
- Initializes the unified connection
- Sets up the schema (tokens, recordings, settings tables)
- Handles automated migration from legacy separate databases (`tokens.db`, `recordings.db`)

## Services

### [settings.js](./settings.js)
Manages application configuration and user preferences.
- Efficient key-value storage
- Handles complex objects (like hotkeys) via JSON serialization
- Provides default values for all settings

### [tokens.js](./tokens.js)
Secure storage for platform authentication tokens (Twitch, YouTube, etc.)
- Transparent encryption/decryption using AES-256-GCM
- Unique key management per user

### [recordings.js](./recordings.js)
Tracks metadata for all local recordings.
- Path, filename, duration, and thumbnail references
- Ordered retrieval for the recordings library

## Usage
Services import the shared connection from `index.js` to ensure transaction safety and connection pooling.
```javascript
const { getDatabase } = require('./index');
const db = getDatabase();
```
