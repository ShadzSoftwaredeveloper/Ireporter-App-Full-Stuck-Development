import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthUtils } from '../utils/authUtils';
import { authValidation } from '../utils/validationUtils';
import { SignUpRequest, SignInRequest } from '../types';

export class AuthController {
  static async signUp(req: Request<{}, {}, SignUpRequest>, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Create user
      const user = await UserModel.create({
        email,
        name,
        password: hashedPassword,
        role: role || 'user'
      });

      // Generate token
      const token = AuthUtils.generateToken(user.id, user.role);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async signIn(req: Request<{}, {}, SignInRequest>, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // In a real app, you'd get the hashed password from database
      // For demo purposes, we'll check against demo credentials
      const isDemoUser = email === 'user@demo.com' && password === 'password';
      const isDemoAdmin = email === 'admin@demo.com' && password === 'admin';
      
      if (!isDemoUser && !isDemoAdmin) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = AuthUtils.generateToken(user.id, user.role);

      res.json({
        message: 'Sign in successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      // This would use the authenticated user from middleware
      // For now, return demo response
      res.json({
        user: {
          id: 'user-001',
          email: 'user@demo.com',
          name: 'Demo User',
          role: 'user',
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}