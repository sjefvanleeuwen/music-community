import { getDatabase } from '../connection';
import { logger } from '../../utils/logger';
import { hashPassword } from '../../utils/auth';
import path from 'path';

/**
 * Seed the database with initial data
 */
export async function seedDatabase(): Promise<void> {
  logger.info('Seeding database with initial data...');
  
  const db = await getDatabase();
  
  // Check if database has been seeded already
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count > 0) {
    logger.info('Database already contains data, skipping seed');
    return;
  }
  
  // Start transaction
  await db.exec('BEGIN TRANSACTION');
  
  try {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await db.run(`
      INSERT INTO users (username, email, password_hash, display_name, bio)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'admin',
      'admin@musiccommunity.com',
      adminPassword,
      'Administrator',
      'System administrator'
    ]);
    
    // Create demo user
    const demoPassword = await hashPassword('demo123');
    const demoUser = await db.run(`
      INSERT INTO users (username, email, password_hash, display_name, bio)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'demo',
      'demo@musiccommunity.com',
      demoPassword,
      'Demo User',
      'This is a demo account for testing purposes'
    ]);
    
    // Insert genre hierarchy
    // Root genres
    const rock = await db.run('INSERT INTO genres (name, description) VALUES (?, ?)', [
      'Rock', 'Rock music is a broad genre of popular music that originated as "rock and roll" in the United States in the late 1940s and early 1950s.'
    ]);
    
    const electronic = await db.run('INSERT INTO genres (name, description) VALUES (?, ?)', [
      'Electronic', 'Electronic music is music that employs electronic musical instruments, digital instruments, or circuitry-based music technology.'
    ]);
    
    const hiphop = await db.run('INSERT INTO genres (name, description) VALUES (?, ?)', [
      'Hip-Hop', 'Hip hop music, also known as rap music, is a genre of popular music that originated in New York City in the 1970s.'
    ]);
    
    const jazz = await db.run('INSERT INTO genres (name, description) VALUES (?, ?)', [
      'Jazz', 'Jazz is a music genre that originated in the African-American communities of New Orleans, Louisiana in the late 19th and early 20th centuries.'
    ]);
    
    // Sub-genres
    await db.run('INSERT INTO genres (name, parent_id, description) VALUES (?, ?, ?)', [
      'Alternative Rock', rock.lastID, 'Alternative rock is a style of rock music that emerged from the independent music underground of the 1970s.'
    ]);
    
    await db.run('INSERT INTO genres (name, parent_id, description) VALUES (?, ?, ?)', [
      'Metal', rock.lastID, 'Metal is a genre of rock music that developed in the late 1960s and early 1970s.'
    ]);
    
    await db.run('INSERT INTO genres (name, parent_id, description) VALUES (?, ?, ?)', [
      'Punk', rock.lastID, 'Punk rock is a music genre that emerged in the mid-1970s.'
    ]);
    
    await db.run('INSERT INTO genres (name, parent_id, description) VALUES (?, ?, ?)', [
      'House', electronic.lastID, 'House is a genre of electronic dance music.'
    ]);
    
    await db.run('INSERT INTO genres (name, parent_id, description) VALUES (?, ?, ?)', [
      'Techno', electronic.lastID, 'Techno is a genre of electronic dance music.'
    ]);
    
    await db.run('INSERT INTO genres (name, parent_id, description) VALUES (?, ?, ?)', [
      'Trap', hiphop.lastID, 'Trap is a subgenre of hip hop music that originated in the Southern United States.'
    ]);
    
    // Create a sample album
    const album = await db.run(`
      INSERT INTO albums (title, user_id, release_date, description)
      VALUES (?, ?, ?, ?)
    `, [
      'Demo Album',
      demoUser.lastID,
      '2023-01-01',
      'A demonstration album with sample tracks'
    ]);
    
    // Create a sample track
    const track = await db.run(`
      INSERT INTO tracks (
        title, user_id, album_id, file_path, duration, 
        description, release_date, allow_downloads, allow_remix
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Demo Track',
      demoUser.lastID,
      album.lastID,
      path.join('storage', 'uploads', 'tracks', 'demo-track.mp3'),
      180, // 3 minutes
      'A demonstration track',
      '2023-01-01',
      true,
      true
    ]);
    
    // Add genre to track
    await db.run(`
      INSERT INTO track_genres (track_id, genre_id, is_primary)
      VALUES (?, ?, ?)
    `, [track.lastID, electronic.lastID, true]);
    
    // Create sample stems
    await db.run(`
      INSERT INTO stems (track_id, user_id, title, file_path, instrument_type, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      track.lastID,
      demoUser.lastID,
      'Demo Drums',
      path.join('storage', 'uploads', 'stems', 'demo-drums.wav'),
      'Drums',
      180
    ]);
    
    await db.run(`
      INSERT INTO stems (track_id, user_id, title, file_path, instrument_type, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      track.lastID,
      demoUser.lastID,
      'Demo Bass',
      path.join('storage', 'uploads', 'stems', 'demo-bass.wav'),
      'Bass',
      180
    ]);
    
    await db.run(`
      INSERT INTO stems (track_id, user_id, title, file_path, instrument_type, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      track.lastID,
      demoUser.lastID,
      'Demo Synth',
      path.join('storage', 'uploads', 'stems', 'demo-synth.wav'),
      'Synthesizer',
      180
    ]);
    
    // Create a sample event
    await db.run(`
      INSERT INTO events (
        user_id, title, description, start_date, 
        location, venue, ticket_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      demoUser.lastID,
      'Demo Event',
      'A demonstration event',
      '2023-12-31 20:00:00',
      'New York, NY',
      'Demo Venue',
      'https://example.com/tickets'
    ]);
    
    // Create a sample blog post
    await db.run(`
      INSERT INTO blog_posts (
        user_id, title, content, published, published_at
      )
      VALUES (?, ?, ?, ?, ?)
    `, [
      demoUser.lastID,
      'Welcome to Music Community',
      'This is a sample blog post welcoming users to the music community platform.',
      true,
      '2023-01-01 12:00:00'
    ]);
    
    // Commit transaction
    await db.exec('COMMIT');
    logger.info('Database seeded successfully');
  } catch (error) {
    // Rollback transaction on error
    await db.exec('ROLLBACK');
    logger.error('Database seeding failed', error);
    throw error;
  }
}
