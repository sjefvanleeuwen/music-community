import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  // Create users table with password field
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      profile_image TEXT,
      bio TEXT,
      verification_code TEXT,
      verification_code_expiry TEXT,
      email_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      role TEXT DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Create tracks table
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      genre_id INTEGER,
      file_path TEXT NOT NULL,
      duration INTEGER,
      plays INTEGER DEFAULT 0,
      cover_art TEXT,
      public INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (genre_id) REFERENCES genres(id)
    );

    -- Create genres table
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Create comments table
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (track_id) REFERENCES tracks(id)
    );

    -- Create likes table
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (track_id) REFERENCES tracks(id),
      UNIQUE(user_id, track_id)
    );

    -- Create follows table
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id),
      UNIQUE(follower_id, following_id)
    );

    -- Create stems table
    CREATE TABLE IF NOT EXISTS stems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      instrument TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (track_id) REFERENCES tracks(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

export async function down(db: Database): Promise<void> {
  // Drop tables in reverse dependency order
  await db.exec(`
    DROP TABLE IF EXISTS stems;
    DROP TABLE IF EXISTS follows;
    DROP TABLE IF EXISTS likes;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS tracks;
    DROP TABLE IF EXISTS genres;
    DROP TABLE IF EXISTS users;
  `);
}
