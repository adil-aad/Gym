import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updatePassword,
  getUsers,
  updateUser,
  deleteUser,
} from '../controllers/authController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// ─── Public ─────────────────────────────────────────────────────────────────
router.post('/login', login);

// ─── Protected ──────────────────────────────────────────────────────────────
router.get('/me', protect, getMe);
router.patch('/update-password', protect, updatePassword);

// Owner-only staff management
router.post('/register', protect, restrictTo('owner'), register);
router.get('/users', protect, restrictTo('owner'), getUsers);
router.patch('/users/:id', protect, restrictTo('owner'), updateUser);
router.delete('/users/:id', protect, restrictTo('owner'), deleteUser);

export default router;
