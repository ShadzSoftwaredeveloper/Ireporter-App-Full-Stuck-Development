import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [users] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, profile_picture } = req.body;

    console.log('🔄 Updating profile for user:', userId);
    console.log('📥 Update data:', { name, email, profile_picture: profile_picture ? 'provided' : 'not provided' });

    if (email) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (profile_picture !== undefined) {
      updates.push('profile_picture = ?');
      params.push(profile_picture);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    const [users] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE id = ?',
      [userId]
    );

    console.log('✅ Profile updated successfully');
    res.json(users[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    
    // Prevent self-deletion
    if (req.user.userId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete user's media files
      await connection.execute(
        'DELETE mf FROM media_files mf JOIN incidents i ON mf.incident_id = i.id WHERE i.user_id = ?',
        [userId]
      );
      
      // Delete user's incidents
      await connection.execute(
        'DELETE FROM incidents WHERE user_id = ?',
        [userId]
      );
      
      // Delete user
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );
      
      await connection.commit();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;