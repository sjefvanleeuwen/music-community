import { Database } from 'sqlite';

/**
 * Create initial database schema
 */
export async function up(db: Database): Promise<void> {
  // Users table
  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      profile_image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    )
  `);
  
  // Albums table
  await db.exec(`
    CREATE TABLE albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      release_date TEXT,
      cover_art TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Tracks table
  await db.exec(`
    CREATE TABLE tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      album_id INTEGER,
      file_path TEXT NOT NULL,
      duration INTEGER,
      release_date TEXT,
      cover_art TEXT,
      description TEXT,
      lyrics TEXT,
      plays INTEGER NOT NULL DEFAULT 0,
      downloads INTEGER NOT NULL DEFAULT 0,
      allow_downloads BOOLEAN NOT NULL DEFAULT 1,
      allow_remix BOOLEAN NOT NULL DEFAULT 0,
      is_remix BOOLEAN NOT NULL DEFAULT 0,
      original_track_id INTEGER,
      license_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
      FOREIGN KEY (original_track_id) REFERENCES tracks(id) ON DELETE SET NULL
    )
  `);
  
  // Stems table
  await db.exec(`
    CREATE TABLE stems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      instrument_type TEXT NOT NULL,
      duration INTEGER,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Stem usage tracking
  await db.exec(`
    CREATE TABLE stem_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stem_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (stem_id) REFERENCES stems(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      UNIQUE(stem_id, track_id)
    )
  `);
  
  // Genre hierarchy table
  await db.exec(`
    CREATE TABLE genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      parent_id INTEGER,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES genres(id) ON DELETE SET NULL
    )
  `);
  
  // Track genre assignments (many-to-many)
  await db.exec(`
    CREATE TABLE track_genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      is_primary BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
      UNIQUE(track_id, genre_id)
    )
  `);
  
  // Ratings table
  await db.exec(`
    CREATE TABLE ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      review TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(track_id, user_id)
    )
  `);

  // Events table
  await db.exec(`
    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      location TEXT,
      venue TEXT,
      ticket_url TEXT,
      image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Blog posts table
  await db.exec(`
    CREATE TABLE blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      published BOOLEAN NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Comments table (for tracks and blog posts)
  await db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      track_id INTEGER,
      blog_post_id INTEGER,
      parent_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
      CHECK ((track_id IS NULL AND blog_post_id IS NOT NULL) OR (track_id IS NOT NULL AND blog_post_id IS NULL))
    )
  `);
  
  // Create indexes for performance
  await db.exec(`
    CREATE INDEX idx_tracks_user_id ON tracks(user_id);
    CREATE INDEX idx_tracks_album_id ON tracks(album_id);
    CREATE INDEX idx_tracks_original_track_id ON tracks(original_track_id);
    CREATE INDEX idx_stems_track_id ON stems(track_id);
    CREATE INDEX idx_stems_user_id ON stems(user_id);
    CREATE INDEX idx_stem_usage_stem_id ON stem_usage(stem_id);
    CREATE INDEX idx_stem_usage_track_id ON stem_usage(track_id);
    CREATE INDEX idx_genres_parent_id ON genres(parent_id);
    CREATE INDEX idx_track_genres_track_id ON track_genres(track_id);
    CREATE INDEX idx_track_genres_genre_id ON track_genres(genre_id);
    CREATE INDEX idx_ratings_track_id ON ratings(track_id);
    CREATE INDEX idx_ratings_user_id ON ratings(user_id);
    CREATE INDEX idx_events_user_id ON events(user_id);
    CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);
    CREATE INDEX idx_comments_user_id ON comments(user_id);
    CREATE INDEX idx_comments_track_id ON comments(track_id);
    CREATE INDEX idx_comments_blog_post_id ON comments(blog_post_id);
    CREATE INDEX idx_comments_parent_id ON comments(parent_id);
  `);
  
  // Create FTS5 virtual table for full-text search on tracks
  await db.exec(`
    CREATE VIRTUAL TABLE tracks_fts USING fts5(
      title, 
      description, 
      lyrics,
      content='tracks',
      content_rowid='id'
    );
  `);
  
  // Create triggers to keep FTS table in sync
  await db.exec(`
    CREATE TRIGGER tracks_ai AFTER INSERT ON tracks BEGIN
      INSERT INTO tracks_fts(rowid, title, description, lyrics)
      VALUES (new.id, new.title, new.description, new.lyrics);
    END;
    
    CREATE TRIGGER tracks_ad AFTER DELETE ON tracks BEGIN
      INSERT INTO tracks_fts(tracks_fts, rowid, title, description, lyrics)
      VALUES ('delete', old.id, old.title, old.description, old.lyrics);
    END;
    
    CREATE TRIGGER tracks_au AFTER UPDATE ON tracks BEGIN
      INSERT INTO tracks_fts(tracks_fts, rowid, title, description, lyrics)
      VALUES ('delete', old.id, old.title, old.description, old.lyrics);
      INSERT INTO tracks_fts(rowid, title, description, lyrics)
      VALUES (new.id, new.title, new.description, new.lyrics);
    END;
  `);
}

/**
 * Drop all tables in reverse order
 */
export async function down(db: Database): Promise<void> {
  await db.exec(`
    PRAGMA foreign_keys = OFF;
    
    DROP TRIGGER IF EXISTS tracks_au;
    DROP TRIGGER IF EXISTS tracks_ad;
    DROP TRIGGER IF EXISTS tracks_ai;
    DROP TABLE IF EXISTS tracks_fts;
    DROP INDEX IF EXISTS idx_comments_parent_id;
    DROP INDEX IF EXISTS idx_comments_blog_post_id;
    DROP INDEX IF EXISTS idx_comments_track_id;
    DROP INDEX IF EXISTS idx_comments_user_id;
    DROP INDEX IF EXISTS idx_blog_posts_user_id;
    DROP INDEX IF EXISTS idx_events_user_id;
    DROP INDEX IF EXISTS idx_ratings_user_id;
    DROP INDEX IF EXISTS idx_ratings_track_id;
    DROP INDEX IF EXISTS idx_track_genres_genre_id;
    DROP INDEX IF EXISTS idx_track_genres_track_id;
    DROP INDEX IF EXISTS idx_genres_parent_id;
    DROP INDEX IF EXISTS idx_stem_usage_track_id;
    DROP INDEX IF EXISTS idx_stem_usage_stem_id;
    DROP INDEX IF EXISTS idx_stems_user_id;
    DROP INDEX IF EXISTS idx_stems_track_id;
    DROP INDEX IF EXISTS idx_tracks_original_track_id;
    DROP INDEX IF EXISTS idx_tracks_album_id;
    DROP INDEX IF EXISTS idx_tracks_user_id;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS blog_posts;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS ratings;
    DROP TABLE IF EXISTS track_genres;
    DROP TABLE IF EXISTS genres;
    DROP TABLE IF EXISTS stem_usage;
    DROP TABLE IF EXISTS stems;
    DROP TABLE IF EXISTS tracks;
    DROP TABLE IF EXISTS albums;
    DROP TABLE IF EXISTS users;
    
    PRAGMA foreign_keys = ON;
  `);
}
