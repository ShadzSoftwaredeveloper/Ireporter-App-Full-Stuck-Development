import pool from '../config/database';
import { MediaFile } from '../types';

export class MediaFileModel {
  static async create(media: Omit<MediaFile, 'id' | 'createdAt'> & { incidentId: string }): Promise<MediaFile> {
    const { incidentId, type, url, thumbnail } = media;
    
    const [result] = await pool.execute(
      'INSERT INTO media_files (incident_id, type, url, thumbnail) VALUES (?, ?, ?, ?)',
      [incidentId, type, url, thumbnail]
    );

    const insertResult = result as any;
    const [rows] = await pool.execute(
      'SELECT * FROM media_files WHERE id = ?',
      [insertResult.insertId]
    );
    
    const mediaFiles = rows as MediaFile[];
    return mediaFiles[0];
  }

  static async findByIncidentId(incidentId: string): Promise<MediaFile[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM media_files WHERE incident_id = ? ORDER BY created_at',
      [incidentId]
    );
    return rows as MediaFile[];
  }

  static async findById(id: string): Promise<MediaFile | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM media_files WHERE id = ?',
      [id]
    );
    const mediaFiles = rows as MediaFile[];
    return mediaFiles.length > 0 ? mediaFiles[0] : null;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM media_files WHERE id = ?', [id]);
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }

  static async deleteByIncidentId(incidentId: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM media_files WHERE incident_id = ?', [incidentId]);
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }
}