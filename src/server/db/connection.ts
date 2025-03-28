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
let db: Database | null = null;

/**
 * Initialize the database connection
 */
export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  try {
    logger.info(`Connecting to SQLite database at ${dbPath}`);
    
    // Open database connection
    db = await open(dbConfig);
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
    
    // Enable WAL mode for better concurrency
    await db.exec('PRAGMA journal_mode = WAL;');
    
    logger.info('Database connection established');
    return db;
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    return initializeDatabase();
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
