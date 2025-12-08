const express = require('express');
const router = express.Router();
const usersDal = require('../services/users');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (admin)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await require('../database').query(`SELECT id, email, name, role, profilePicture, createdAt, updatedAt FROM Users ORDER BY createdAt DESC`);

    res.json({
      status: 'success',
      count: users.length,
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await usersDal.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    await require('../database').query(`DELETE FROM Users WHERE id = ?`, [req.params.id]);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;
