import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface Rating {
  id: number;
  track_id: number;
  user_id: number;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export class RatingModel extends BaseModel<Rating> {
  constructor() {
    super('ratings');
  }
  
  /**
   * Get user's rating for a track
   */
  async getUserRating(userId: number, trackId: number): Promise<Rating | null> {
    const db = await this.getDb();
    
    try {
      const rating = await db.get(`
        SELECT * FROM ratings
        WHERE user_id = ? AND track_id = ?
      `, [userId, trackId]);
      
      return rating || null;
    } catch (error) {
      logger.error('Error getting user rating', error);
      throw error;
    }
  }
  
  /**
   * Get all ratings for a track
   */
  async getTrackRatings(trackId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          r.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.track_id = ?
        ORDER BY r.created_at DESC
      `, [trackId]);
    } catch (error) {
      logger.error('Error getting track ratings', error);
      throw error;
    }
  }
  
  /**
   * Get rating statistics for a track
   */
  async getTrackRatingStats(trackId: number): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`
        SELECT 
          COUNT(*) as count,
          AVG(rating) as average,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM ratings
        WHERE track_id = ?
      `, [trackId]);
    } catch (error) {
      logger.error('Error getting track rating stats', error);
      throw error;
    }
  }
  
  /**
   * Get user's ratings
   */
  async getUserRatings(userId: number): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          r.*,
          t.title as track_title,
          t.cover_art as track_cover,
          u.username as track_creator_username,
          u.display_name as track_creator_display_name
        FROM ratings r
        JOIN tracks t ON r.track_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE r.user_id = ?
        ORDER BY r.updated_at DESC
      `, [userId]);
    } catch (error) {
      logger.error('Error getting user ratings', error);
      throw error;
    }
  }
  
  /**
   * Create or update a rating
   */
  async setRating(
    userId: number, 
    trackId: number, 
    rating: number, 
    review: string | null = null
  ): Promise<number> {
    // Validate rating value
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const db = await this.getDb();
    
    try {
      // Check if rating exists
      const existingRating = await this.getUserRating(userId, trackId);
      
      if (existingRating) {
        // Update existing rating
        await this.update(existingRating.id, { rating, review });
        return existingRating.id;
      } else {
        // Create new rating
        return await this.create({
          user_id: userId,
          track_id: trackId,
          rating,
          review
        });
      }
    } catch (error) {
      logger.error('Error setting rating', error);
      throw error;
    }
  }
}
