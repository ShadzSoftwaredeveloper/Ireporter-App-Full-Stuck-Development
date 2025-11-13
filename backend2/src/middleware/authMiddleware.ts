import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/authUtils';
import { AuthRequest } from '../types';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = AuthUtils.verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = AuthUtils.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Ignore invalid token for optional auth
    }
  }
  
  next();
};