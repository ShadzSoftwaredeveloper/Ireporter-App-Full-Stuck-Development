import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController';
import { validate } from '../middleware/validationMiddleware';
import { incidentValidation } from '../utils/validationUtils';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { handleMediaUpload } from '../middleware/uploadMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all incidents (public listing)
router.get('/', IncidentController.getAllIncidents);

// Get user's incidents
router.get('/my-incidents', IncidentController.getUserIncidents);

// Create incident with media upload
router.post(
  '/',
  handleMediaUpload,
  validate(incidentValidation.create),
  IncidentController.createIncident
);

// Get specific incident
router.get('/:id', IncidentController.getIncidentById);

// Update incident
router.put(
  '/:id',
  validate(incidentValidation.update),
  IncidentController.updateIncident
);

// Delete incident
router.delete('/:id', IncidentController.deleteIncident);

// Admin only - update incident status
router.patch(
  '/:id/status',
  requireAdmin,
  IncidentController.updateIncidentStatus
);

export default router;