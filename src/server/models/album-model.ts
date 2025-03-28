import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface Album {
  id: number;
  title: string;
  user_id: number;
  release_date: string | null;
  cover_art: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class AlbumModel extends BaseModel<Album> {
  constructor() {
    super('albums');
  }
  
  /**
   * Get albums with user information
   */
  async getAlbumsWithUserInfo(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
    userId?: number;
  } = {}): Promise<any[]> {
    const db = await this.getDb();
    
    const {
      limit = 20,
      offset = 0,
      orderBy = 'a.created_at',
      orderDir = 'DESC',
      userId
    } = options;
    
    // Build WHERE clause if needed
    let whereClause = '';
    const params: any[] = [];
    
    if (userId) {
      whereClause = 'WHERE a.user_id = ?';
      params.push(userId);
    }
    
    try {
      const result = await db.all(`
        SELECT 
          a.*,
          u.username,
          u.display_name,
          u.profile_image,
          (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as track_count
        FROM albums a
        JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY ${orderBy} ${orderDir}
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      
      return result;
    } catch (error) {
      logger.error('Error getting albums with user info', error);
      throw error;
    }
  }
  
  /**
   * Get album with all tracks
   */
  async getAlbumWithTracks(albumId: number): Promise<any> {
    const db = await this.getDb();
    
    try {
      // Get album with user info
      const album = await db.get(`
        SELECT 
          a.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM albums a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `, [albumId]);
      
      if (!album) {
        return null;
      }
      
      // Get tracks for this album
      const tracks = await db.all(`
        SELECT 
          t.*,
          (SELECT COUNT(*) FROM ratings WHERE track_id = t.id) as ratings_count,
          (SELECT AVG(rating) FROM ratings WHERE track_id = t.id) as average_rating
        FROM tracks t
        WHERE t.album_id = ?
        ORDER BY t.created_at ASC
      `, [albumId]);
      
      // Add tracks to the album object
      return {
        ...album,
        tracks
      };
    } catch (error) {
      logger.error(`Error getting album with tracks for album ${albumId}`, error);
      throw error;
    }
  }
  
  /**
   * Get user's albums
   */
  async getUserAlbums(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    return this.getAlbumsWithUserInfo({
      limit,
      offset,
      userId
    });
  }
}
