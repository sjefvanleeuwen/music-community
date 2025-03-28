import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface Genre {
  id: number;
  name: string;
  parent_id: number | null;
  description: string | null;
  created_at: string;
}

export class GenreModel extends BaseModel<Genre> {
  constructor() {
    super('genres');
  }
  
  /**
   * Get all top-level genres (no parent)
   */
  async getRootGenres(): Promise<Genre[]> {
    try {
      return await this.findBy('parent_id', null);
    } catch (error) {
      logger.error('Error getting root genres', error);
      throw error;
    }
  }
  
  /**
   * Get subgenres for a parent genre
   */
  async getChildGenres(parentId: number): Promise<Genre[]> {
    try {
      return await this.findBy('parent_id', parentId);
    } catch (error) {
      logger.error('Error getting child genres', error);
      throw error;
    }
  }
  
  /**
   * Get full genre tree
   */
  async getGenreTree(): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        WITH RECURSIVE genre_tree AS (
          SELECT 
            id, 
            name, 
            parent_id, 
            description,
            0 AS level,
            name AS path
          FROM genres
          WHERE parent_id IS NULL
          
          UNION ALL
          
          SELECT 
            g.id, 
            g.name, 
            g.parent_id, 
            g.description,
            gt.level + 1 AS level,
            gt.path || ' > ' || g.name AS path
          FROM genres g
          JOIN genre_tree gt ON g.parent_id = gt.id
        )
        SELECT * FROM genre_tree
        ORDER BY path
      `);
    } catch (error) {
      logger.error('Error getting genre tree', error);
      throw error;
    }
  }
  
  /**
   * Get genre ancestry (parent chain)
   */
  async getGenreAncestry(genreId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        WITH RECURSIVE genre_ancestors AS (
          SELECT 
            id, 
            name, 
            parent_id, 
            description,
            0 AS level
          FROM genres
          WHERE id = ?
          
          UNION ALL
          
          SELECT 
            g.id, 
            g.name, 
            g.parent_id, 
            g.description,
            ga.level + 1 AS level
          FROM genres g
          JOIN genre_ancestors ga ON g.id = ga.parent_id
        )
        SELECT * FROM genre_ancestors
        ORDER BY level DESC
      `, [genreId]);
    } catch (error) {
      logger.error('Error getting genre ancestry', error);
      throw error;
    }
  }
  
  /**
   * Get popular genres based on track count
   */
  async getPopularGenres(limit: number = 10): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          g.*,
          COUNT(tg.track_id) as track_count
        FROM genres g
        JOIN track_genres tg ON g.id = tg.genre_id
        GROUP BY g.id
        ORDER BY track_count DESC
        LIMIT ?
      `, [limit]);
    } catch (error) {
      logger.error('Error getting popular genres', error);
      throw error;
    }
  }
  
  /**
   * Assign genre to track
   */
  async assignGenreToTrack(
    trackId: number, 
    genreId: number, 
    isPrimary: boolean = false
  ): Promise<void> {
    const db = await this.getDb();
    
    try {
      // If setting as primary, first unset any existing primary
      if (isPrimary) {
        await db.run(`
          UPDATE track_genres
          SET is_primary = 0
          WHERE track_id = ?
        `, [trackId]);
      }
      
      // Insert or update genre assignment
      await db.run(`
        INSERT INTO track_genres (track_id, genre_id, is_primary)
        VALUES (?, ?, ?)
        ON CONFLICT (track_id, genre_id) 
        DO UPDATE SET is_primary = ?
      `, [trackId, genreId, isPrimary ? 1 : 0, isPrimary ? 1 : 0]);
    } catch (error) {
      logger.error('Error assigning genre to track', error);
      throw error;
    }
  }
  
  /**
   * Get genres for a track
   */
  async getTrackGenres(trackId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          g.*,
          tg.is_primary
        FROM track_genres tg
        JOIN genres g ON tg.genre_id = g.id
        WHERE tg.track_id = ?
        ORDER BY tg.is_primary DESC, g.name
      `, [trackId]);
    } catch (error) {
      logger.error('Error getting track genres', error);
      throw error;
    }
  }
}
