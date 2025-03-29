import { Database } from 'sqlite';
import { logger } from '../../utils/logger';
import bcrypt from 'bcrypt';

/**
 * Seed the database with initial data
 */
export async function seedDatabase(db: Database): Promise<void> {
  logger.info('Seeding database with initial data...');
  
  try {
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    // Check if there are existing users
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    
    if (userCount.count === 0) {
      logger.info('Creating admin user...');
      
      // Create an admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const now = new Date().toISOString();
      
      await db.run(`
        INSERT INTO users (
          username, 
          email, 
          password, 
          display_name, 
          role,
          status,
          email_verified,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'admin',
        'admin@example.com',
        hashedPassword,
        'Administrator',
        'admin',
        'active',
        1,
        now,
        now
      ]);
      
      logger.info('Admin user created');
    } else {
      logger.info('Users already exist, skipping user seed');
    }
    
    // Seed genres if they don't exist
    const genreCount = await db.get('SELECT COUNT(*) as count FROM genres');
    
    if (genreCount.count === 0) {
      logger.info('Creating genres...');
      
      const genres = [
        'Rock', 'Pop', 'Hip Hop', 'Jazz', 'Classical', 'Electronic',
        'R&B', 'Country', 'Folk', 'Blues', 'Metal', 'Reggae'
      ];
      
      const now = new Date().toISOString();
      
      for (const genre of genres) {
        await db.run(`
          INSERT INTO genres (name, created_at, updated_at)
          VALUES (?, ?, ?)
        `, [genre, now, now]);
      }
      
      logger.info(`${genres.length} genres created`);
    } else {
      logger.info('Genres already exist, skipping genre seed');
    }
    
    // Commit transaction
    await db.exec('COMMIT');
    logger.info('Database seeding completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await db.exec('ROLLBACK');
    logger.error('Database seeding failed', error);
    throw error;
  }
}
