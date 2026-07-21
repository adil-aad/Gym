import { Router } from 'express';
import {
  getMembers,
  getExpiringMembers,
  getMember,
  createMember,
  updateMember,
  renewMember,
  deleteMember,
} from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All member routes require authentication
router.use(protect);

// Admins and owners: full day-to-day member management
router.get('/', getMembers);
router.get('/expiring', getExpiringMembers); // must come before /:id
router.get('/:id', getMember);
router.post('/', createMember);
router.patch('/:id', updateMember);
router.post('/:id/renew', renewMember);

// Hard delete is owner-only — admins should suspend instead
router.delete('/:id', restrictTo('owner'), deleteMember);

export default router;
