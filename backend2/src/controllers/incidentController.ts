import { Request, Response } from 'express';
import { IncidentModel } from '../models/Incident';
import { MediaFileModel } from '../models/MediaFile';
import { getFileUrl } from '../utils/fileUpload';
import { AuthRequest, CreateIncidentRequest, UpdateIncidentRequest } from '../types';

export class IncidentController {
  static async createIncident(req: AuthRequest, res: Response) {
    try {
      const { type, title, description, location, status } = req.body as CreateIncidentRequest;
      const userId = req.user?.userId || 'user-001'; // Demo user ID

      // Create incident
      const incident = await IncidentModel.create({
        userId,
        type,
        title,
        description,
        location,
        status: status || 'draft'
      });

      // Handle media files
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
          const fileUrl = getFileUrl(file.filename, fileType);
          
          await MediaFileModel.create({
            incidentId: incident.id,
            type: fileType,
            url: fileUrl,
            thumbnail: fileType === 'video' ? getFileUrl('thumbnail.jpg', 'image') : undefined
          });
        }
      }

      // Get the complete incident with media
      const completeIncident = await IncidentModel.findById(incident.id);

      res.status(201).json({
        message: 'Incident created successfully',
        incident: completeIncident
      });
    } catch (error) {
      console.error('Create incident error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllIncidents(req: Request, res: Response) {
    try {
      const incidents = await IncidentModel.findAll();
      res.json({ incidents });
    } catch (error) {
      console.error('Get incidents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIncidentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incident = await IncidentModel.findById(id);

      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      res.json({ incident });
    } catch (error) {
      console.error('Get incident error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserIncidents(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 'user-001'; // Demo user ID
      const incidents = await IncidentModel.findByUserId(userId);
      res.json({ incidents });
    } catch (error) {
      console.error('Get user incidents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateIncident(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates: UpdateIncidentRequest = req.body;

      // Check if incident exists
      const existingIncident = await IncidentModel.findById(id);
      if (!existingIncident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Check if user owns the incident or is admin
      const isOwner = existingIncident.userId === req.user?.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update incident
      const success = await IncidentModel.update(id, updates);

      if (!success) {
        return res.status(400).json({ error: 'Failed to update incident' });
      }

      const updatedIncident = await IncidentModel.findById(id);
      res.json({
        message: 'Incident updated successfully',
        incident: updatedIncident
      });
    } catch (error) {
      console.error('Update incident error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteIncident(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if incident exists
      const existingIncident = await IncidentModel.findById(id);
      if (!existingIncident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Check if user owns the incident or is admin
      const isOwner = existingIncident.userId === req.user?.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete incident (cascade will delete media files)
      const success = await IncidentModel.delete(id);

      if (!success) {
        return res.status(400).json({ error: 'Failed to delete incident' });
      }

      res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
      console.error('Delete incident error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateIncidentStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, adminComment } = req.body;

      // Only admins can update status with admin comments
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const success = await IncidentModel.update(id, { status, adminComment });

      if (!success) {
        return res.status(400).json({ error: 'Failed to update incident status' });
      }

      const updatedIncident = await IncidentModel.findById(id);
      res.json({
        message: 'Incident status updated successfully',
        incident: updatedIncident
      });
    } catch (error) {
      console.error('Update incident status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}