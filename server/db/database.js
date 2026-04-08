const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'job_tracker.db');
const db = new Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  // Create applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      date_applied TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Applied',
      source TEXT NOT NULL DEFAULT 'manual',
      job_url TEXT,
      notes TEXT,
      gmail_thread_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create oauth_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expiry_date INTEGER NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create activity_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('Database initialized successfully');
}

// Close database connection
function closeDatabase() {
  db.close();
}

module.exports = {
  db,
  initializeDatabase,
  closeDatabase
};
