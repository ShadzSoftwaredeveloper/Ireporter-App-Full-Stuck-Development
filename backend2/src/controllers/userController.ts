import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthUtils } from '../utils/authUtils';
import { AuthRequest } from '../types';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user as any;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { name, email, profilePicture } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if email is being changed and if it's already taken
      if (email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      const success = await UserModel.update(userId, { name, email, profilePicture });

      if (!success) {
        return res.status(400).json({ error: 'Failed to update profile' });
      }

      const updatedUser = await UserModel.findById(userId);
      const { password, ...userWithoutPassword } = updatedUser as any;
      
      res.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // In a real app, verify current password
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // For demo, we'll skip current password verification
      // In production: const isValid = await AuthUtils.comparePassword(currentPassword, user.password);

      const hashedPassword = await AuthUtils.hashPassword(newPassword);
      const success = await UserModel.updatePassword(userId, hashedPassword);

      if (!success) {
        return res.status(400).json({ error: 'Failed to change password' });
      }

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      // Only admins can get all users
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const users = await UserModel.findAll();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user as any;
        return userWithoutPassword;
      });

      res.json({ users: usersWithoutPasswords });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Only admins can delete users
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Prevent self-deletion
      if (userId === req.user.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const success = await UserModel.delete(userId);

      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}