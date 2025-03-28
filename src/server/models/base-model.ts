import { getDatabase } from '../db/connection';
import { Database } from 'sqlite';
import { logger } from '../utils/logger';

/**
 * Base model class with common CRUD operations
 */
export abstract class BaseModel<T> {
  protected tableName: string;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  /**
   * Get the database instance
   */
  protected async getDb(): Promise<Database> {
    return getDatabase();
  }
  
  /**
   * Find all records
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
    where?: Record<string, any>;
  } = {}): Promise<T[]> {
    const db = await this.getDb();
    
    const {
      limit = 100,
      offset = 0,
      orderBy = 'id',
      orderDir = 'ASC',
      where = {}
    } = options;
    
    // Build WHERE clause if needed
    let whereClause = '';
    const params: any[] = [];
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    try {
      return await db.all(query, params);
    } catch (error) {
      logger.error(`Error finding records in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Find record by ID
   */
  async findById(id: number): Promise<T | null> {
    const db = await this.getDb();
    
    try {
      const record = await db.get(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      
      return record || null;
    } catch (error) {
      logger.error(`Error finding record by ID in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Find records by field value
   */
  async findBy(field: string, value: any): Promise<T[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(
        `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
        [value]
      );
    } catch (error) {
      logger.error(`Error finding records by field in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<number> {
    const db = await this.getDb();
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `;
    
    try {
      const result = await db.run(query, values);
      return result.lastID!;
    } catch (error) {
      logger.error(`Error creating record in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Update a record
   */
  async update(id: number, data: Partial<T>): Promise<boolean> {
    const db = await this.getDb();
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) {
      return false;
    }
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    try {
      const result = await db.run(query, [...values, id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error updating record in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a record
   */
  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    
    try {
      const result = await db.run(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error deleting record in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Count records
   */
  async count(where: Record<string, any> = {}): Promise<number> {
    const db = await this.getDb();
    
    // Build WHERE clause if needed
    let whereClause = '';
    const params: any[] = [];
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const query = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      ${whereClause}
    `;
    
    try {
      const result = await db.get(query, params);
      return result.count;
    } catch (error) {
      logger.error(`Error counting records in ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Execute a custom query
   */
  async query(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.all(sql, params);
    } catch (error) {
      logger.error(`Error executing custom query on ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    const db = await this.getDb();
    await db.exec('BEGIN TRANSACTION');
  }
  
  /**
   * Commit a transaction
   */
  async commitTransaction(): Promise<void> {
    const db = await this.getDb();
    await db.exec('COMMIT');
  }
  
  /**
   * Rollback a transaction
   */
  async rollbackTransaction(): Promise<void> {
    const db = await this.getDb();
    await db.exec('ROLLBACK');
  }
}
