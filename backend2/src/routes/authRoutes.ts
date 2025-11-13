import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../utils/validationUtils';
import { authValidation } from '../utils/validationUtils';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/signup', validate(authValidation.signUp), AuthController.signUp);
router.post('/signin', validate(authValidation.signIn), AuthController.signIn);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

export default router;