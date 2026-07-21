import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment';
import Member from '../models/Member';
import Plan from '../models/Plan';

/**
 * POST /api/payments
 * Record a payment. Admins CAN record payments (front desk collects cash) —
 * they just can't view histories or revenue. `processedBy` is always the
 * logged-in user; `amount` defaults to the plan price when omitted.
 */
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { member, plan, amount, paymentMethod, paymentDate, notes } = req.body;

    const [memberDoc, planDoc] = await Promise.all([
      Member.findById(member),
      Plan.findById(plan),
    ]);

    if (!memberDoc) {
      res.status(400).json({ success: false, message: 'Member not found.' });
      return;
    }
    if (!planDoc) {
      res.status(400).json({ success: false, message: 'Plan not found.' });
      return;
    }

    const payment = await Payment.create({
      member,
      plan,
      amount: amount ?? planDoc.price,
      paymentMethod,
      paymentDate,
      notes,
      processedBy: req.user!._id,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments               (owner only)
 * Payment history with filtering and pagination.
 *   ?member=<id>  ?from=YYYY-MM-DD  ?to=YYYY-MM-DD  ?page=1&limit=20
 */
export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { member, from, to } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20),
    );

    const filter: Record<string, unknown> = {};

    if (member) filter.member = member;

    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.$gte = new Date(String(from));
      if (to) range.$lte = new Date(String(to));
      filter.paymentDate = range;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('member', 'fullName phone')
        .populate('plan', 'title')
        .populate('processedBy', 'name')
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/:id           (owner only)
 */
export const getPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('member', 'fullName phone')
      .populate('plan', 'title durationInMonths price')
      .populate('processedBy', 'name email');

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found.' });
      return;
    }

    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/analytics/revenue      (owner only)
 * Revenue summary + monthly breakdown, powered by the
 * { paymentDate, amount } index.
 *   ?year=2026   (defaults to current year)
 */
export const getRevenueAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const year =
      parseInt(String(req.query.year ?? ''), 10) || new Date().getFullYear();

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const [summary] = await Payment.aggregate([
      {
        $facet: {
          allTime: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalPayments: { $sum: 1 },
              },
            },
          ],
          byMonth: [
            { $match: { paymentDate: { $gte: yearStart, $lt: yearEnd } } },
            {
              $group: {
                _id: { $month: '$paymentDate' },
                revenue: { $sum: '$amount' },
                payments: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                month: '$_id',
                revenue: 1,
                payments: 1,
              },
            },
          ],
          byMethod: [
            { $match: { paymentDate: { $gte: yearStart, $lt: yearEnd } } },
            {
              $group: {
                _id: '$paymentMethod',
                revenue: { $sum: '$amount' },
                payments: { $sum: 1 },
              },
            },
            { $project: { _id: 0, method: '$_id', revenue: 1, payments: 1 } },
          ],
        },
      },
    ]);

    const allTime = summary.allTime[0] ?? { totalRevenue: 0, totalPayments: 0 };
    const yearRevenue = summary.byMonth.reduce(
      (sum: number, m: { revenue: number }) => sum + m.revenue,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        year,
        totalRevenue: allTime.totalRevenue,
        totalPayments: allTime.totalPayments,
        yearRevenue,
        monthlyBreakdown: summary.byMonth,
        byPaymentMethod: summary.byMethod,
      },
    });
  } catch (err) {
    next(err);
  }
};
