import express from 'express';
import { pool } from '../config/database.js'; // Adjust path as needed
import { authenticateToken } from '../middleware/auth.js'; // Adjust path as needed

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

// ⭐⭐ EXPORT STATEMENT - ADD THIS ⭐⭐
export default router;