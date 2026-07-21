import { Router } from 'express';
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/planController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All plan routes require authentication
router.use(protect);

// Admins and owners can view and manage plans (day-to-day staff work)
router.get('/', getPlans);
router.get('/:id', getPlan);
router.post('/', createPlan);
router.patch('/:id', updatePlan);

// Only the owner can deactivate a plan
router.delete('/:id', restrictTo('owner'), deletePlan);

export default router;
