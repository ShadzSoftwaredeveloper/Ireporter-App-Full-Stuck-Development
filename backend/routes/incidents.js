import express from 'express';
import { pool } from '../config/database.js'; // Adjust path as needed
import { authenticateToken } from '../middleware/auth.js'; // Adjust path as needed
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create incident - FIXED VERSION
router.post('/', authenticateToken, async (req, res) => {
    try {
      console.log('📥 CREATE INCIDENT - Request received');
      console.log('📥 User ID:', req.user?.userId);
      console.log('📥 Request Body:', JSON.stringify(req.body, null, 2));
  
      const { type, title, description, location, media, status } = req.body;
      const userId = req.user.userId;
  
      // Validate and log all parameters
      console.log('🔍 Validating parameters:');
      console.log('  - type:', type, typeof type);
      console.log('  - title:', title, typeof title);
      console.log('  - description:', description, typeof description);
      console.log('  - location:', location, typeof location);
      console.log('  - media:', media, typeof media);
      console.log('  - status:', status, typeof status);
      console.log('  - userId:', userId, typeof userId);
  
      // Validate required fields with detailed errors
      if (!type) {
        console.log('❌ Missing type');
        return res.status(400).json({ error: 'Incident type is required' });
      }
      if (!title) {
        console.log('❌ Missing title');
        return res.status(400).json({ error: 'Title is required' });
      }
      if (!description) {
        console.log('❌ Missing description');
        return res.status(400).json({ error: 'Description is required' });
      }
      if (!location) {
        console.log('❌ Missing location');
        return res.status(400).json({ error: 'Location is required' });
      }
  
      // Validate location structure
      if (!location.lat || location.lat === undefined) {
        console.log('❌ Invalid location.lat:', location.lat);
        return res.status(400).json({ error: 'Location latitude is required' });
      }
      if (!location.lng || location.lng === undefined) {
        console.log('❌ Invalid location.lng:', location.lng);
        return res.status(400).json({ error: 'Location longitude is required' });
      }
  
      const connection = await pool.getConnection();
      console.log('✅ Database connection acquired');
      
      try {
        await connection.beginTransaction();
        console.log('✅ Transaction started');
  
        // Generate UUID for incident (table uses UUID primary key, not auto-increment)
        const incidentId = uuidv4();
        console.log('🆔 Generated UUID for incident:', incidentId);
  
        // Prepare parameters with null checks
        const insertParams = [
          incidentId,
          type || null,
          title || null,
          description || null,
          location.lat !== undefined ? location.lat : null,
          location.lng !== undefined ? location.lng : null,
          location.address || null,
          status || 'draft',
          userId || null
        ];
  
        // Log final parameters to check for undefined
        console.log('📝 Final INSERT parameters:');
        insertParams.forEach((param, index) => {
          console.log(`  [${index}]:`, param, typeof param);
          if (param === undefined) {
            console.log(`  ❌ ERROR: Parameter ${index} is undefined!`);
          }
        });
  
        // Check for any undefined parameters
        const hasUndefined = insertParams.some(param => param === undefined);
        if (hasUndefined) {
          throw new Error('One or more parameters are undefined. Check logs above.');
        }
  
        const insertQuery = `
          INSERT INTO incidents 
          (id, type, title, description, location_lat, location_lng, location_address, status, user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
  
        console.log('📝 Executing INSERT query:', insertQuery);
        
        const [incidentResult] = await connection.execute(insertQuery, insertParams);
  
        console.log('✅ Incident inserted with ID:', incidentId);
  
        // Insert media files if any
        if (media && Array.isArray(media) && media.length > 0) {
          console.log('📸 Processing media files:', media.length);
          for (const mediaFile of media) {
            // Validate media file structure
            if (!mediaFile.type || !mediaFile.url) {
              console.log('⚠️  Skipping invalid media file:', mediaFile);
              continue;
            }
            
            const mediaQuery = 'INSERT INTO media_files (incident_id, type, url, thumbnail) VALUES (?, ?, ?, ?)';
            const mediaParams = [
              incidentId,
              mediaFile.type,
              mediaFile.url,
              mediaFile.thumbnail || null
            ];
  
            console.log('  - Inserting media:', mediaFile.type, mediaFile.url);
            await connection.execute(mediaQuery, mediaParams);
          }
          console.log('✅ All media files inserted');
        } else {
          console.log('📸 No media files to insert');
        }
  
        await connection.commit();
        console.log('✅ Transaction committed');
  
        // Get the created incident with media
        const [incidents] = await connection.execute(
          'SELECT * FROM incidents WHERE id = ?',
          [incidentId]
        );
        
        if (incidents.length === 0) {
          throw new Error('Failed to retrieve created incident');
        }
  
        const createdIncident = incidents[0];
        console.log('✅ Created incident from DB:', createdIncident);
  
        const [mediaFiles] = await connection.execute(
          'SELECT * FROM media_files WHERE incident_id = ?',
          [incidentId]
        );
        createdIncident.media = mediaFiles;
        console.log('✅ Attached media files:', mediaFiles.length);
  
        connection.release();
        
        console.log('🎉 SUCCESS - Incident created and returned');
        res.status(201).json(createdIncident);
  
      } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('❌ Transaction error:', error);
        console.error('❌ Error stack:', error.stack);
        throw error;
      }
    } catch (error) {
      console.error('❌ Create incident error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Internal server error: ' + error.message
      });
    }
});

// Add other routes here as needed...

// Get all incidents (for admin: all, for users: all as well but front-end filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT i.*, u.name as user_name, u.email as user_email FROM incidents i LEFT JOIN users u ON i.user_id = u.id ORDER BY i.created_at DESC`
      );

      // Attach media for each incident
      for (const incident of rows) {
        const [mediaFiles] = await connection.execute('SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?', [incident.id]);
        incident.media = mediaFiles;
      }

      connection.release();
      res.json(rows);
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Get user's incidents (must come BEFORE /:id to avoid matching it)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;
  try {
    const connection = await pool.getConnection();
    try {
      const [incidents] = await connection.execute(
        'SELECT i.*, u.name as user_name, u.email as user_email FROM incidents i LEFT JOIN users u ON i.user_id = u.id WHERE i.user_id = ? ORDER BY i.created_at DESC',
        [userId]
      );

      // Attach media for each incident
      for (const incident of incidents) {
        const [mediaFiles] = await connection.execute('SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?', [incident.id]);
        incident.media = mediaFiles;
      }

      connection.release();
      res.json(incidents);
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Get user incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch user incidents' });
  }
});

// Get single incident by id
router.get('/:id', authenticateToken, async (req, res) => {
  const incidentId = req.params.id;
  try {
    const connection = await pool.getConnection();
    try {
      const [incidents] = await connection.execute('SELECT i.*, u.name as user_name, u.email as user_email FROM incidents i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ?', [incidentId]);
      if (incidents.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Incident not found' });
      }

      const incident = incidents[0];
      const [mediaFiles] = await connection.execute('SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?', [incidentId]);
      incident.media = mediaFiles;
      connection.release();
      res.json(incident);
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Get incident by id error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// Update incident (admin can update status and add admin comment)
router.put('/:id', authenticateToken, async (req, res) => {
  const incidentId = req.params.id;
  const { status, adminComment } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const params = [];

      if (status) {
        updates.push('status = ?');
        params.push(status);
      }
      if (adminComment !== undefined) {
        updates.push('admin_comment = ?');
        params.push(adminComment);
      }

      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      params.push(incidentId);

      const updateQuery = `UPDATE incidents SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await connection.execute(updateQuery, params);

      // Return updated incident
      const [incidents] = await connection.execute('SELECT * FROM incidents WHERE id = ?', [incidentId]);
      const incident = incidents[0];
      const [mediaFiles] = await connection.execute('SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?', [incidentId]);
      incident.media = mediaFiles;

      connection.release();
      res.json(incident);
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// Delete incident (owner can delete draft or admin can delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  const incidentId = req.params.id;
  try {
    const connection = await pool.getConnection();
    try {
      // Check ownership and status
      const [incidents] = await connection.execute('SELECT * FROM incidents WHERE id = ?', [incidentId]);
      if (incidents.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Incident not found' });
      }
      const incident = incidents[0];

      // Allow if admin or owner and status is draft
      if (req.user.role !== 'admin' && !(req.user.userId === incident.user_id && incident.status === 'draft')) {
        connection.release();
        return res.status(403).json({ error: 'Not authorized to delete this incident' });
      }

      await connection.beginTransaction();
      await connection.execute('DELETE FROM media_files WHERE incident_id = ?', [incidentId]);
      await connection.execute('DELETE FROM incidents WHERE id = ?', [incidentId]);
      await connection.commit();
      connection.release();
      res.json({ message: 'Incident deleted' });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

// ⭐⭐ EXPORT STATEMENT - ADD THIS ⭐⭐
export default router;