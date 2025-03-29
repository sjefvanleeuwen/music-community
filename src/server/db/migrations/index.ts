import fs from 'fs';
import path from 'path';
import { getDb } from '../connection';
import { logger } from '../../utils/logger';

interface Migration {
  id: number;
  name: string;
  applied_at: string;
}

export async function runMigrations() {
  logger.info('Running database migrations...');
  
  const db = await getDb();
  
  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  
  // Get list of migrations that have already been applied
  const appliedMigrations = await db.all<Migration[]>('SELECT * FROM migrations ORDER BY id');
  const appliedMigrationNames = appliedMigrations.map(m => m.name);
  
  logger.info(`Found ${appliedMigrations.length} previously applied migrations`);
  
  // Find migration files
  const migrationsDir = path.join(__dirname);
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') && !file.startsWith('index'))
    .sort(); // Sort to ensure migrations run in order
  
  // Apply each migration that hasn't been run yet
  for (const migrationFile of migrationFiles) {
    const migrationName = migrationFile.replace('.ts', '');
    
    if (appliedMigrationNames.includes(migrationName)) {
      logger.info(`Skipping migration: ${migrationName} (already applied)`);
      continue;
    }
    
    logger.info(`Applying migration: ${migrationName}`);
    
    try {
      // Begin transaction for this migration
      await db.exec('BEGIN TRANSACTION');
      
      // Import and run the migration
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migration = require(migrationPath);
      
      if (typeof migration.up === 'function') {
        await migration.up(db);
      } else {
        throw new Error(`Migration ${migrationName} does not export an 'up' function`);
      }
      
      // Record that the migration was applied
      const currentTimestamp = new Date().toISOString(); // Use ISO string format
      await db.run(
        'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
        [migrationName, currentTimestamp]
      );
      
      // Commit the transaction
      await db.exec('COMMIT');
      
      logger.info(`Migration ${migrationName} applied successfully`);
    } catch (error) {
      // Rollback the transaction if anything fails
      await db.exec('ROLLBACK');
      logger.error(`Migration failed, rolling back changes`, error);
      throw error;
    }
  }
  
  logger.info('Database migrations completed successfully');
}

export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset not allowed in production environment');
  }
  
  const db = await getDb();
  logger.warn('Resetting database - all data will be lost!');
  
  // Get all tables
  const tables = await db.all(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name != 'sqlite_sequence'
  `);
  
  // Drop all tables
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const table of tables) {
      logger.info(`Dropping table: ${table.name}`);
      await db.exec(`DROP TABLE IF EXISTS ${table.name}`);
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    logger.error('Error during database reset', error);
    throw error;
  }
  
  // Run migrations to recreate schema
  await runMigrations();
  
  logger.info('Database reset and migrations completed successfully');
}
