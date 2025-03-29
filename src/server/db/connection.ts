import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Ensure storage directory exists
const dbDir = path.resolve(process.cwd(), 'storage');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');

// SQLite connection configuration
const dbConfig = {
  filename: dbPath,
  driver: sqlite3.Database
};

// Connection pool (singleton pattern)
let db: Database;

/**
 * Get the database connection
 */
export async function getDb(): Promise<Database> {
  if (db) {
    return db;
  }
  
  try {
    logger.info('Initializing database connection...');
    
    // Ensure the database directory exists
    const dbDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      logger.info(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.resolve(dbDir, 'music_community.db');
    logger.info(`Database path: ${dbPath}`);
    
    // Open the database connection with extended timeout
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      timeout: 5000 // 5 second timeout
    });
    
    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');
    
    // Test connection with a simple query
    await db.get('SELECT 1');
    
    logger.info('Database connection initialized successfully');
    return db;
  } catch (error) {
    logger.error('Failed to initialize database connection', error);
    throw new Error(`Database connection error: ${error.message}`);
  }
}

/**
 * Initialize the database and tables
 */
export async function initializeDatabase(): Promise<void> {
  logger.info('Initializing database...');
  
  try {
    const db = await getDb();
    
    // Simple test to verify connection
    const result = await db.get('SELECT sqlite_version() as version');
    logger.info(`Connected to SQLite version: ${result.version}`);
    
    // Check if users table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    
    if (tableExists) {
      logger.info('Database tables already exist');
    } else {
      logger.warn('Users table not found, database may need initialization');
    }
    
    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    return getDb();
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

// Handle unexpected shutdowns
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});
