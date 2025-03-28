import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface Stem {
  id: number;
  track_id: number;
  user_id: number;
  title: string;
  file_path: string;
  instrument_type: string;
  duration: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class StemModel extends BaseModel<Stem> {
  constructor() {
    super('stems');
  }
  
  /**
   * Get stems for a track
   */
  async getStemsByTrack(trackId: number): Promise<Stem[]> {
    try {
      return await this.findBy('track_id', trackId);
    } catch (error) {
      logger.error('Error getting stems by track', error);
      throw error;
    }
  }
  
  /**
   * Get stems with user information
   */
  async getStemsWithUser(trackId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          s.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM stems s
        JOIN users u ON s.user_id = u.id
        WHERE s.track_id = ?
        ORDER BY s.instrument_type
      `, [trackId]);
    } catch (error) {
      logger.error('Error getting stems with user', error);
      throw error;
    }
  }
  
  /**
   * Record stem usage in another track
   */
  async recordStemUsage(stemId: number, trackId: number): Promise<void> {
    const db = await this.getDb();
    
    try {
      await db.run(`
        INSERT OR IGNORE INTO stem_usage (stem_id, track_id)
        VALUES (?, ?)
      `, [stemId, trackId]);
    } catch (error) {
      logger.error('Error recording stem usage', error);
      throw error;
    }
  }
  
  /**
   * Get tracks using a stem
   */
  async getTracksUsingStem(stemId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_image,
          su.created_at as usage_date
        FROM stem_usage su
        JOIN tracks t ON su.track_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE su.stem_id = ?
        ORDER BY su.created_at DESC
      `, [stemId]);
    } catch (error) {
      logger.error('Error getting tracks using stem', error);
      throw error;
    }
  }
  
  /**
   * Get stems used in a track (that aren't from the original track)
   */
  async getStemsUsedInTrack(trackId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          s.*,
          u.username,
          u.display_name,
          u.profile_image,
          t.title as source_track_title,
          t.id as source_track_id,
          su.created_at as usage_date
        FROM stem_usage su
        JOIN stems s ON su.stem_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN tracks t ON s.track_id = t.id
        WHERE su.track_id = ? AND s.track_id != ?
        ORDER BY s.instrument_type
      `, [trackId, trackId]);
    } catch (error) {
      logger.error('Error getting stems used in track', error);
      throw error;
    }
  }
  
  /**
   * Get popular instrument types
   */
  async getPopularInstrumentTypes(limit: number = 20): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          instrument_type,
          COUNT(*) as count
        FROM stems
        GROUP BY instrument_type
        ORDER BY count DESC
        LIMIT ?
      `, [limit]);
    } catch (error) {
      logger.error('Error getting popular instrument types', error);
      throw error;
    }
  }
}
