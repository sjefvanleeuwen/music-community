import fs from 'fs';
import path from 'path';
import { getDatabase } from '../connection';
import { logger } from '../../utils/logger';

const MIGRATIONS_TABLE = 'migrations';

/**
 * Initialize migrations table if it doesn't exist
 */
async function ensureMigrationsTable() {
  const db = await getDatabase();
  
  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const db = await getDatabase();
  await ensureMigrationsTable();
  
  const result = await db.all(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`);
  return result.map(row => row.name);
}

/**
 * Register a migration as executed
 */
async function registerMigration(name: string): Promise<void> {
  const db = await getDatabase();
  await db.run(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`, name);
}

/**
 * Get pending migrations ordered by name
 */
async function getPendingMigrations(): Promise<string[]> {
  // Read migration files from directory
  const migrationsDir = path.join(__dirname);
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
    .filter(file => file !== 'index.js' && file !== 'index.ts')
    .sort();
  
  // Get executed migrations
  const executedMigrations = await getExecutedMigrations();
  
  // Return migrations that haven't been executed yet
  return migrationFiles.filter(file => !executedMigrations.includes(file));
}

/**
 * Run migrations
 */
export async function runMigrations(): Promise<void> {
  logger.info('Checking database migrations...');
  
  // Get pending migrations
  const pendingMigrations = await getPendingMigrations();
  
  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations');
    return;
  }
  
  logger.info(`Running ${pendingMigrations.length} migrations...`);
  const db = await getDatabase();
  
  // Start transaction
  await db.exec('BEGIN TRANSACTION');
  
  try {
    // Execute each pending migration
    for (const migrationFile of pendingMigrations) {
      logger.info(`Applying migration: ${migrationFile}`);
      
      // Import migration module
      const migration = require(path.join(__dirname, migrationFile));
      
      // Execute up function
      await migration.up(db);
      
      // Register migration as executed
      await registerMigration(migrationFile);
      
      logger.info(`Migration applied: ${migrationFile}`);
    }
    
    // Commit transaction
    await db.exec('COMMIT');
    logger.info('All migrations completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await db.exec('ROLLBACK');
    logger.error('Migration failed, rolling back changes', error);
    throw error;
  }
}

/**
 * Rollback the last executed migration
 */
export async function rollbackLastMigration(): Promise<void> {
  logger.info('Rolling back last migration...');
  
  const db = await getDatabase();
  await ensureMigrationsTable();
  
  // Get the last executed migration
  const lastMigration = await db.get(`
    SELECT name FROM ${MIGRATIONS_TABLE} 
    ORDER BY id DESC LIMIT 1
  `);
  
  if (!lastMigration) {
    logger.info('No migrations to roll back');
    return;
  }
  
  const migrationName = lastMigration.name;
  
  // Start transaction
  await db.exec('BEGIN TRANSACTION');
  
  try {
    logger.info(`Rolling back migration: ${migrationName}`);
    
    // Import migration module
    const migration = require(path.join(__dirname, migrationName));
    
    // Execute down function
    await migration.down(db);
    
    // Remove migration from executed list
    await db.run(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`, migrationName);
    
    // Commit transaction
    await db.exec('COMMIT');
    logger.info(`Migration rolled back: ${migrationName}`);
  } catch (error) {
    // Rollback transaction on error
    await db.exec('ROLLBACK');
    logger.error('Rollback failed', error);
    throw error;
  }
}
