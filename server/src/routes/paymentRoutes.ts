import { Router } from 'express';
import {
  createPayment,
  getPayments,
  getPayment,
  getRevenueAnalytics,
} from '../controllers/paymentController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All payment routes require authentication
router.use(protect);

// Admins CAN record payments (front desk collects cash at registration/renewal)
router.post('/', createPayment);

// Everything below is owner-only: histories and revenue analytics
router.use(restrictTo('owner'));

router.get('/analytics/revenue', getRevenueAnalytics); // must come before /:id
router.get('/', getPayments);
router.get('/:id', getPayment);

export default router;
