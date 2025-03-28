import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface Track {
  id: number;
  title: string;
  user_id: number;
  album_id: number | null;
  file_path: string;
  duration: number | null;
  release_date: string | null;
  cover_art: string | null;
  description: string | null;
  lyrics: string | null;
  plays: number;
  downloads: number;
  allow_downloads: boolean;
  allow_remix: boolean;
  is_remix: boolean;
  original_track_id: number | null;
  license_type: string | null;
  created_at: string;
  updated_at: string;
}

export class TrackModel extends BaseModel<Track> {
  constructor() {
    super('tracks');
  }
  
  /**
   * Get track with user information
   */
  async getTrackWithUser(trackId: number): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_image,
          a.title as album_title,
          (SELECT COUNT(*) FROM ratings WHERE track_id = t.id) as ratings_count,
          (SELECT AVG(rating) FROM ratings WHERE track_id = t.id) as average_rating,
          (SELECT COUNT(*) FROM stems WHERE track_id = t.id) as stems_count
        FROM tracks t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN albums a ON t.album_id = a.id
        WHERE t.id = ?
      `, [trackId]);
    } catch (error) {
      logger.error('Error getting track with user', error);
      throw error;
    }
  }
  
  /**
   * Get recent tracks with user information
   */
  async getRecentTracks(limit: number = 10): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_image,
          (SELECT COUNT(*) FROM ratings WHERE track_id = t.id) as ratings_count,
          (SELECT AVG(rating) FROM ratings WHERE track_id = t.id) as average_rating
        FROM tracks t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT ?
      `, [limit]);
    } catch (error) {
      logger.error('Error getting recent tracks', error);
      throw error;
    }
  }
  
  /**
   * Get tracks by genre
   */
  async getTracksByGenre(genreId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_image,
          (SELECT AVG(rating) FROM ratings WHERE track_id = t.id) as average_rating
        FROM tracks t
        JOIN users u ON t.user_id = u.id
        JOIN track_genres tg ON t.id = tg.track_id
        WHERE tg.genre_id = ?
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [genreId, limit, offset]);
    } catch (error) {
      logger.error('Error getting tracks by genre', error);
      throw error;
    }
  }
  
  /**
   * Get remixes of a track
   */
  async getRemixes(trackId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_image,
          (SELECT AVG(rating) FROM ratings WHERE track_id = t.id) as average_rating
        FROM tracks t
        JOIN users u ON t.user_id = u.id
        WHERE t.is_remix = 1 AND t.original_track_id = ?
        ORDER BY t.created_at DESC
      `, [trackId]);
    } catch (error) {
      logger.error('Error getting remixes', error);
      throw error;
    }
  }
  
  /**
   * Increment play count
   */
  async incrementPlayCount(trackId: number): Promise<void> {
    const db = await this.getDb();
    
    try {
      await db.run(`
        UPDATE tracks
        SET plays = plays + 1
        WHERE id = ?
      `, [trackId]);
    } catch (error) {
      logger.error('Error incrementing play count', error);
      throw error;
    }
  }
  
  /**
   * Increment download count
   */
  async incrementDownloadCount(trackId: number): Promise<void> {
    const db = await this.getDb();
    
    try {
      await db.run(`
        UPDATE tracks
        SET downloads = downloads + 1
        WHERE id = ?
      `, [trackId]);
    } catch (error) {
      logger.error('Error incrementing download count', error);
      throw error;
    }
  }
  
  /**
   * Search tracks
   */
  async searchTracks(query: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_image,
          (SELECT AVG(rating) FROM ratings WHERE track_id = t.id) as average_rating,
          snippet(tracks_fts, 0, '<b>', '</b>', '...', 15) as title_snippet,
          snippet(tracks_fts, 1, '<b>', '</b>', '...', 15) as description_snippet,
          snippet(tracks_fts, 2, '<b>', '</b>', '...', 15) as lyrics_snippet
        FROM tracks_fts
        JOIN tracks t ON tracks_fts.rowid = t.id
        JOIN users u ON t.user_id = u.id
        WHERE tracks_fts MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `, [query, limit, offset]);
    } catch (error) {
      logger.error('Error searching tracks', error);
      throw error;
    }
  }
}
