import { TrackModel, Track } from '../models/track-model';
import { StemModel, Stem } from '../models/stem-model';
import { GenreModel } from '../models/genre-model';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const trackModel = new TrackModel();
const stemModel = new StemModel();
const genreModel = new GenreModel();

export class MusicService {
  /**
   * Get a track by ID with all related information
   */
  async getTrack(trackId: number) {
    try {
      // Get track with basic info
      const track = await trackModel.getTrackWithUser(trackId);
      
      if (!track) {
        return null;
      }
      
      // Get genres
      const genres = await genreModel.getTrackGenres(trackId);
      
      // Get stems
      const stems = await stemModel.getStemsWithUser(trackId);
      
      // Get remixes if original track
      const remixes = await trackModel.getRemixes(trackId);
      
      // Get original track if remix
      let originalTrack = null;
      if (track.is_remix && track.original_track_id) {
        originalTrack = await trackModel.getTrackWithUser(track.original_track_id);
      }
      
      // Get stems used if remix or uses stems from other tracks
      const usedStems = await stemModel.getStemsUsedInTrack(trackId);
      
      // Increment play count (consider moving this to a separate method for explicit plays)
      // await trackModel.incrementPlayCount(trackId);
      
      return {
        ...track,
        genres,
        stems,
        remixes,
        originalTrack,
        usedStems
      };
    } catch (error) {
      logger.error(`Error getting track ${trackId}`, error);
      throw error;
    }
  }
  
  /**
   * Create a new track
   */
  async createTrack(trackData: {
    title: string;
    user_id: number;
    album_id?: number;
    file_path: string;
    duration?: number;
    release_date?: string;
    cover_art?: string;
    description?: string;
    lyrics?: string;
    allow_downloads?: boolean;
    allow_remix?: boolean;
    is_remix?: boolean;
    original_track_id?: number;
    license_type?: string;
    genres?: Array<{ id: number; is_primary?: boolean }>;
  }) {
    try {
      // Create the track
      const trackId = await trackModel.create({
        title: trackData.title,
        user_id: trackData.user_id,
        album_id: trackData.album_id || null,
        file_path: trackData.file_path,
        duration: trackData.duration || null,
        release_date: trackData.release_date || null,
        cover_art: trackData.cover_art || null,
        description: trackData.description || null,
        lyrics: trackData.lyrics || null,
        allow_downloads: trackData.allow_downloads !== undefined ? trackData.allow_downloads : true,
        allow_remix: trackData.allow_remix !== undefined ? trackData.allow_remix : false,
        is_remix: trackData.is_remix !== undefined ? trackData.is_remix : false,
        original_track_id: trackData.original_track_id || null,
        license_type: trackData.license_type || null,
        plays: 0,
        downloads: 0
      });
      
      // Add genres if provided
      if (trackData.genres && trackData.genres.length > 0) {
        for (const genre of trackData.genres) {
          await genreModel.assignGenreToTrack(
            trackId,
            genre.id,
            genre.is_primary || false
          );
        }
      }
      
      // Record stem usage if this is a remix
      if (trackData.is_remix && trackData.original_track_id) {
        // This could be further expanded to record specific stems used
      }
      
      return trackId;
    } catch (error) {
      logger.error('Error creating track', error);
      throw error;
    }
  }
  
  /**
   * Add a stem to a track
   */
  async addStem(stemData: {
    track_id: number;
    user_id: number;
    title: string;
    file_path: string;
    instrument_type: string;
    duration?: number;
    description?: string;
  }) {
    try {
      return await stemModel.create({
        track_id: stemData.track_id,
        user_id: stemData.user_id,
        title: stemData.title,
        file_path: stemData.file_path,
        instrument_type: stemData.instrument_type,
        duration: stemData.duration || null,
        description: stemData.description || null
      });
    } catch (error) {
      logger.error('Error adding stem', error);
      throw error;
    }
  }
  
  /**
   * Handle file upload for a track or stem
   */
  async handleFileUpload(
    fileBuffer: Buffer,
    fileName: string,
    userId: number,
    type: 'track' | 'stem'
  ): Promise<string> {
    try {
      // Define storage path
      const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', `${type}s`);
      
      // Ensure directory exists
      await mkdir(storageDir, { recursive: true });
      
      // Generate unique filename
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
      const filePath = path.join(storageDir, uniqueFileName);
      
      // Write file
      await fs.promises.writeFile(filePath, fileBuffer);
      
      // Return relative path for database storage
      return path.join('storage', 'uploads', `${type}s`, uniqueFileName);
    } catch (error) {
      logger.error(`Error handling ${type} file upload`, error);
      throw error;
    }
  }
  
  /**
   * Search for tracks
   */
  async searchMusic(query: string, limit = 20, offset = 0) {
    try {
      return await trackModel.searchTracks(query, limit, offset);
    } catch (error) {
      logger.error('Error searching tracks', error);
      throw error;
    }
  }
  
  /**
   * Get recent tracks
   */
  async getRecentTracks(limit = 10) {
    try {
      return await trackModel.getRecentTracks(limit);
    } catch (error) {
      logger.error('Error getting recent tracks', error);
      throw error;
    }
  }
  
  /**
   * Get genre hierarchy
   */
  async getGenreHierarchy() {
    try {
      return await genreModel.getGenreTree();
    } catch (error) {
      logger.error('Error getting genre hierarchy', error);
      throw error;
    }
  }
  
  /**
   * Get tracks by genre
   */
  async getTracksByGenre(genreId: number, limit = 20, offset = 0) {
    try {
      return await trackModel.getTracksByGenre(genreId, limit, offset);
    } catch (error) {
      logger.error('Error getting tracks by genre', error);
      throw error;
    }
  }
}
