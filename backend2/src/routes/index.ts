import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import incidentRoutes from './incidentRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/incidents', incidentRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;