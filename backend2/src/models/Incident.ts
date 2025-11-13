import pool from '../config/database';
import { Incident, IncidentType, IncidentStatus, Location } from '../types';
import { MediaFileModel } from './MediaFile';

export class IncidentModel {
  static async create(incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'media'> & { userId: string }): Promise<Incident> {
    const { userId, type, title, description, location, status } = incident;
    
    const [result] = await pool.execute(
      `INSERT INTO incidents (user_id, type, title, description, latitude, longitude, address, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, title, description, location.lat, location.lng, location.address, status || 'draft']
    );

    const insertResult = result as any;
    return this.findById(insertResult.insertId.toString()) as Promise<Incident>;
  }

  static async findById(id: string): Promise<Incident | null> {
    const [rows] = await pool.execute(
      `SELECT i.*, u.name as user_name, u.email as user_email 
       FROM incidents i 
       LEFT JOIN users u ON i.user_id = u.id 
       WHERE i.id = ?`,
      [id]
    );

    const incidents = rows as any[];
    if (incidents.length === 0) return null;

    const incident = incidents[0];
    const media = await MediaFileModel.findByIncidentId(id);

    return {
      id: incident.id,
      type: incident.type,
      title: incident.title,
      description: incident.description,
      location: {
        lat: parseFloat(incident.latitude),
        lng: parseFloat(incident.longitude),
        address: incident.address
      },
      media,
      status: incident.status,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      userId: incident.user_id,
      adminComment: incident.admin_comment,
      user: {
        id: incident.user_id,
        name: incident.user_name,
        email: incident.user_email
      }
    };
  }

  static async findAll(): Promise<Incident[]> {
    const [rows] = await pool.execute(
      `SELECT i.*, u.name as user_name, u.email as user_email 
       FROM incidents i 
       LEFT JOIN users u ON i.user_id = u.id 
       ORDER BY i.created_at DESC`
    );

    const incidents = rows as any[];
    const result: Incident[] = [];

    for (const incident of incidents) {
      const media = await MediaFileModel.findByIncidentId(incident.id);
      result.push({
        id: incident.id,
        type: incident.type,
        title: incident.title,
        description: incident.description,
        location: {
          lat: parseFloat(incident.latitude),
          lng: parseFloat(incident.longitude),
          address: incident.address
        },
        media,
        status: incident.status,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        userId: incident.user_id,
        adminComment: incident.admin_comment,
        user: {
          id: incident.user_id,
          name: incident.user_name,
          email: incident.user_email
        }
      });
    }

    return result;
  }

  static async findByUserId(userId: string): Promise<Incident[]> {
    const [rows] = await pool.execute(
      `SELECT i.*, u.name as user_name, u.email as user_email 
       FROM incidents i 
       LEFT JOIN users u ON i.user_id = u.id 
       WHERE i.user_id = ? 
       ORDER BY i.created_at DESC`,
      [userId]
    );

    const incidents = rows as any[];
    const result: Incident[] = [];

    for (const incident of incidents) {
      const media = await MediaFileModel.findByIncidentId(incident.id);
      result.push({
        id: incident.id,
        type: incident.type,
        title: incident.title,
        description: incident.description,
        location: {
          lat: parseFloat(incident.latitude),
          lng: parseFloat(incident.longitude),
          address: incident.address
        },
        media,
        status: incident.status,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        userId: incident.user_id,
        adminComment: incident.admin_comment,
        user: {
          id: incident.user_id,
          name: incident.user_name,
          email: incident.user_email
        }
      });
    }

    return result;
  }

  static async update(id: string, updates: Partial<Incident>): Promise<boolean> {
    const { type, title, description, location, status, adminComment } = updates;
    
    let query = 'UPDATE incidents SET ';
    const params: any[] = [];
    const updatesList: string[] = [];

    if (type) {
      updatesList.push('type = ?');
      params.push(type);
    }
    if (title) {
      updatesList.push('title = ?');
      params.push(title);
    }
    if (description) {
      updatesList.push('description = ?');
      params.push(description);
    }
    if (location) {
      updatesList.push('latitude = ?, longitude = ?, address = ?');
      params.push(location.lat, location.lng, location.address);
    }
    if (status) {
      updatesList.push('status = ?');
      params.push(status);
    }
    if (adminComment !== undefined) {
      updatesList.push('admin_comment = ?');
      params.push(adminComment);
    }

    if (updatesList.length === 0) return false;

    query += updatesList.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.execute(query, params);
    const updateResult = result as any;
    return updateResult.affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM incidents WHERE id = ?', [id]);
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }
}