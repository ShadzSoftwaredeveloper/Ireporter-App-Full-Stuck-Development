import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create incident - FIXED VERSION
router.post('/', authenticateToken, async (req, res) => {
    let connection;
    try {
      console.log('📥 CREATE INCIDENT - Request received');
      console.log('📥 User ID:', req.user?.userId);
      console.log('📥 Request Body:', JSON.stringify(req.body, null, 2));
  
      const { type, title, description, location, media, status } = req.body;
      const userId = req.user.userId;
  
      console.log('🔍 Validating parameters:');
      console.log('  - type:', type, typeof type);
      console.log('  - title:', title, typeof title);
      console.log('  - description:', description, typeof description);
      console.log('  - location:', location, typeof location);
      console.log('  - media:', media, typeof media);
      console.log('  - status:', status, typeof status);
      console.log('  - userId:', userId, typeof userId);
  
      // Validate required fields
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

      connection = await pool.getConnection();
      console.log('✅ Database connection acquired');
      
      await connection.beginTransaction();
      console.log('✅ Transaction started');

      // Prepare parameters with null checks
      const insertParams = [
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
        (type, title, description, location_lat, location_lng, location_address, status, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      console.log('📝 Executing INSERT query:', insertQuery);
      
      const [incidentResult] = await connection.execute(insertQuery, insertParams);
      const incidentId = incidentResult.insertId;

      console.log('✅ Incident inserted with ID:', incidentId);

      // Insert media files if any - AFTER incident is inserted
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
        'SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?',
        [incidentId]
      );
      createdIncident.media = mediaFiles;
      console.log('✅ Attached media files:', mediaFiles.length);

      console.log('🎉 SUCCESS - Incident created and returned');
      res.status(201).json(createdIncident);

    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('❌ Create incident error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Internal server error: ' + error.message
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
});

// Get all incidents
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📥 GET ALL INCIDENTS - Request received');
    
    const [incidents] = await pool.execute(`
      SELECT i.*, u.name as user_name, u.email as user_email 
      FROM incidents i 
      LEFT JOIN users u ON i.user_id = u.id 
      ORDER BY i.created_at DESC
    `);
    
    console.log(`✅ Found ${incidents.length} incidents`);
    
    // Get media for each incident
    for (let incident of incidents) {
      const [media] = await pool.execute(
        'SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?',
        [incident.id]
      );
      incident.media = media;
      console.log(`📸 Incident ${incident.id} has ${media.length} media files`);
    }
    
    res.json(incidents);
  } catch (error) {
    console.error('❌ Get incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get incident by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 GET INCIDENT ${id} - Request received`);
    
    const [incidents] = await pool.execute(`
      SELECT i.*, u.name as user_name, u.email as user_email 
      FROM incidents i 
      LEFT JOIN users u ON i.user_id = u.id 
      WHERE i.id = ?
    `, [id]);
    
    if (incidents.length === 0) {
      console.log(`❌ Incident ${id} not found`);
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    const incident = incidents[0];
    const [media] = await pool.execute(
      'SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?',
      [id]
    );
    incident.media = media;
    
    console.log(`✅ Incident ${id} fetched successfully with ${media.length} media files`);
    res.json(incident);
  } catch (error) {
    console.error('❌ Get incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update incident
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;
    const userId = req.user.userId;
    
    console.log(`🔄 UPDATE INCIDENT ${id} - Request received`);
    console.log('📥 Update data:', { status, adminComment });
    
    // Check if incident exists and user has permission
    const [incidents] = await pool.execute(
      'SELECT * FROM incidents WHERE id = ?',
      [id]
    );
    
    if (incidents.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    const incident = incidents[0];
    
    // Only admin or incident owner can update
    if (req.user.role !== 'admin' && incident.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
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
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    await pool.execute(
      `UPDATE incidents SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
    
    console.log(`✅ Incident ${id} updated successfully`);
    res.json({ message: 'Incident updated successfully' });
  } catch (error) {
    console.error('❌ Update incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete incident
router.delete('/:id', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    console.log(`🗑️ DELETE INCIDENT ${id} - Request received`);
    
    const [incidents] = await pool.execute(
      'SELECT * FROM incidents WHERE id = ?',
      [id]
    );
    
    if (incidents.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    const incident = incidents[0];
    
    // Only admin or incident owner can delete
    if (req.user.role !== 'admin' && incident.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete media files first
      await connection.execute(
        'DELETE FROM media_files WHERE incident_id = ?',
        [id]
      );
      
      // Delete incident
      await connection.execute(
        'DELETE FROM incidents WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      console.log(`✅ Incident ${id} deleted successfully`);
      res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('❌ Delete incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Get user incidents
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 GET USER INCIDENTS for user ${userId}`);
    
    // Check if user is accessing their own data or is admin
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [incidents] = await pool.execute(
      'SELECT * FROM incidents WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    console.log(`✅ Found ${incidents.length} incidents for user ${userId}`);
    
    // Get media for each incident
    for (let incident of incidents) {
      const [media] = await pool.execute(
        'SELECT id, type, url, thumbnail FROM media_files WHERE incident_id = ?',
        [incident.id]
      );
      incident.media = media;
    }
    
    res.json(incidents);
  } catch (error) {
    console.error('❌ Get user incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router