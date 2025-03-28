import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface Event {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  venue: string | null;
  ticket_url: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export class EventModel extends BaseModel<Event> {
  constructor() {
    super('events');
  }
  
  /**
   * Get events with user information
   */
  async getEventsWithUserInfo(options: {
    limit?: number;
    offset?: number;
    includePast?: boolean;
    userId?: number;
  } = {}): Promise<any[]> {
    const db = await this.getDb();
    
    const {
      limit = 20,
      offset = 0,
      includePast = false,
      userId
    } = options;
    
    // Build WHERE clause
    let whereConditions = [];
    const params: any[] = [];
    
    // Filter by user if provided
    if (userId) {
      whereConditions.push('e.user_id = ?');
      params.push(userId);
    }
    
    // Filter out past events if not including them
    if (!includePast) {
      whereConditions.push('e.start_date >= date(\'now\')');
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    try {
      const result = await db.all(`
        SELECT 
          e.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM events e
        JOIN users u ON e.user_id = u.id
        ${whereClause}
        ORDER BY e.start_date ASC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      
      return result;
    } catch (error) {
      logger.error('Error getting events with user info', error);
      throw error;
    }
  }
  
  /**
   * Get event with user information
   */
  async getEventWithUserInfo(eventId: number): Promise<any> {
    const db = await this.getDb();
    
    try {
      const result = await db.get(`
        SELECT 
          e.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
      `, [eventId]);
      
      return result || null;
    } catch (error) {
      logger.error(`Error getting event with user info for event ${eventId}`, error);
      throw error;
    }
  }
  
  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 20, offset: number = 0): Promise<any[]> {
    return this.getEventsWithUserInfo({
      limit,
      offset,
      includePast: false
    });
  }
  
  /**
   * Get past events
   */
  async getPastEvents(limit: number = 20, offset: number = 0): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      const result = await db.all(`
        SELECT 
          e.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.start_date < date('now')
        ORDER BY e.start_date DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      return result;
    } catch (error) {
      logger.error('Error getting past events', error);
      throw error;
    }
  }
  
  /**
   * Get user's events
   */
  async getUserEvents(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    return this.getEventsWithUserInfo({
      limit,
      offset,
      userId
    });
  }
}
