import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updatePassword,
} from '../controllers/authController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// ─── Public ─────────────────────────────────────────────────────────────────
router.post('/login', login);

// ─── Protected ──────────────────────────────────────────────────────────────
router.get('/me', protect, getMe);
router.patch('/update-password', protect, updatePassword);

// Only the owner can create new system users (admins/owners)
router.post('/register', protect, restrictTo('owner'), register);

export default router;
