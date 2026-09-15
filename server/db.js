const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'vault.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    dob TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS diaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT DEFAULT 'Nostalgia',
    image_url TEXT,
    weather TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    media_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS capsules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    media_urls TEXT,
    unlock_date DATETIME NOT NULL,
    is_opened INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Check and migrate columns if needed
try {
  const diaryCols = db.prepare('PRAGMA table_info(diaries)').all().map(c => c.name);
  if (!diaryCols.includes('image_url')) {
    db.exec('ALTER TABLE diaries ADD COLUMN image_url TEXT');
  }
  if (!diaryCols.includes('weather')) {
    db.exec('ALTER TABLE diaries ADD COLUMN weather TEXT');
  }

  const mediaCols = db.prepare('PRAGMA table_info(media)').all().map(c => c.name);
  if (!mediaCols.includes('source')) {
    db.exec("ALTER TABLE media ADD COLUMN source TEXT DEFAULT 'vault'");
  }
} catch (e) {
  console.warn('Migration note:', e.message);
}

console.log('Database initialized successfully at', dbPath);

module.exports = db;
