'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(path.join(dataDir, 'tinder.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL UNIQUE,
        password    TEXT,
        photo_path  TEXT    NOT NULL,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ratings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL REFERENCES users(id),
        image_name  TEXT    NOT NULL,
        rating      TEXT    NOT NULL CHECK(rating IN ('like', 'dislike')),
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, image_name)
    );
`);

module.exports = db;
