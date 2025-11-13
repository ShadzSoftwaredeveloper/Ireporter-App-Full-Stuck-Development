import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middleware/validationMiddleware';
import { userValidation } from '../utils/validationUtils';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', UserController.getProfile);
router.put('/profile', validate(userValidation.updateProfile), UserController.updateProfile);
router.patch('/password', validate(userValidation.changePassword), UserController.changePassword);

// Admin only routes
router.get('/', requireAdmin, UserController.getAllUsers);
router.delete('/:userId', requireAdmin, UserController.deleteUser);

export default router;