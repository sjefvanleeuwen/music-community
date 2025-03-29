const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  console.log('Running database migrations...');
  
  const dbDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const dbPath = path.resolve(dbDir, 'music_community.db');
  console.log(`Database path: ${dbPath}`);
  
  // Open database connection
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Drop all tables and recreate them (for development)
  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    console.log('Resetting database...');
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name != 'sqlite_sequence'
    `);
    
    for (const table of tables) {
      console.log(`Dropping table: ${table.name}`);
      await db.exec(`DROP TABLE IF EXISTS ${table.name}`);
    }
  }

  // Now create the migrations table (since we dropped it if it existed)
  console.log('Creating migrations table...');
  await db.exec(`
    CREATE TABLE migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  
  // Load and execute migrations
  try {
    console.log('Running initial schema migration...');
    
    // Directly execute the SQL here instead of requiring a TS file
    await db.exec(`
      -- Create users table with password field
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
    
    console.log('Applied initial schema migration');
    
    // Record migration
    await db.run(`
      INSERT INTO migrations (name, applied_at) 
      VALUES (?, datetime('now'))
    `, ['001-initial-schema']);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

runMigrations().catch(console.error);
