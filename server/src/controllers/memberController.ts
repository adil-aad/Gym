import { Request, Response, NextFunction } from 'express';
import Member from '../models/Member';
import Plan from '../models/Plan';

/**
 * GET /api/members
 * List members with filtering, search and pagination.
 *   ?status=active|expired|suspended
 *   ?search=<name or phone>
 *   ?page=1&limit=20
 */
export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20),
    );

    const filter: Record<string, unknown> = {};

    if (status && ['active', 'expired', 'suspended'].includes(String(status))) {
      filter.status = status;
    }

    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ fullName: rx }, { phone: rx }];
    }

    const [members, total] = await Promise.all([
      Member.find(filter)
        .populate('currentPlan', 'title durationInMonths price')
        .populate('createdAdmin', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Member.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: members.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: members,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/members/expiring
 * Members whose membership expires within the next N days (default 7).
 * Useful for the front-desk "follow up for renewal" list.
 */
export const getExpiringMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const days = Math.max(1, parseInt(String(req.query.days ?? '7'), 10) || 7);
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const members = await Member.find({
      status: 'active',
      expiryDate: { $gte: now, $lte: cutoff },
    })
      .populate('currentPlan', 'title price')
      .sort({ expiryDate: 1 });

    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/members/stats
 * Dashboard summary counts in a single aggregation:
 * status breakdown + new sign-ups this month vs last month.
 */
export const getMemberStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [stats] = await Member.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          newThisMonth: [
            { $match: { createdAt: { $gte: monthStart } } },
            { $count: 'count' },
          ],
          newLastMonth: [
            { $match: { createdAt: { $gte: lastMonthStart, $lt: monthStart } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const byStatus: Record<'active' | 'expired' | 'suspended', number> = {
      active: 0,
      expired: 0,
      suspended: 0,
    };
    for (const s of stats.byStatus as Array<{ _id: string; count: number }>) {
      if (s._id in byStatus) byStatus[s._id as keyof typeof byStatus] = s.count;
    }

    res.status(200).json({
      success: true,
      data: {
        total: byStatus.active + byStatus.expired + byStatus.suspended,
        byStatus,
        newThisMonth: stats.newThisMonth[0]?.count ?? 0,
        newLastMonth: stats.newLastMonth[0]?.count ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/members/:id
 */
export const getMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('currentPlan', 'title durationInMonths price')
      .populate('createdAdmin', 'name email');

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    res.status(200).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/members
 * Register a new member. `expiryDate` is auto-calculated from the plan's
 * duration by the Member pre-validate hook unless provided explicitly.
 * `createdAdmin` is always the logged-in user.
 */
export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      fullName,
      phone,
      email,
      gender,
      emergencyContact,
      currentPlan,
      startDate,
      expiryDate,
    } = req.body;

    // Reject plans that don't exist or were deactivated
    const plan = await Plan.findById(currentPlan);
    if (!plan || !plan.isActive) {
      res.status(400).json({
        success: false,
        message: 'Selected plan does not exist or is inactive.',
      });
      return;
    }

    const doc: Record<string, unknown> = {
      fullName,
      phone,
      email,
      gender,
      emergencyContact,
      currentPlan,
      createdAdmin: req.user!._id,
    };

    // Only set these when actually provided — explicitly passing `undefined`
    // marks the path as modified, which would stop the pre-validate hook
    // from auto-calculating expiryDate from the plan duration.
    if (startDate !== undefined) doc.startDate = startDate;
    if (expiryDate !== undefined) doc.expiryDate = expiryDate;

    const member = await Member.create(doc);

    const populated = await member.populate('currentPlan', 'title durationInMonths price');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/members/:id
 * Update profile fields and/or membership status.
 */
export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    const allowed = [
      'fullName',
      'phone',
      'email',
      'gender',
      'emergencyContact',
      'status',
    ] as const;

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (member as any)[field] = req.body[field];
      }
    }

    // Save (not findByIdAndUpdate) so the pre-validate hook runs
    await member.save();

    res.status(200).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/members/:id/renew
 * Renew a membership: assign a plan (same or new) and restart the clock.
 * New start date = today, or the current expiry date if it's still in the
 * future (so renewing early doesn't lose remaining days).
 */
export const renewMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    const planId = req.body.plan ?? member.currentPlan;
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      res.status(400).json({
        success: false,
        message: 'Selected plan does not exist or is inactive.',
      });
      return;
    }

    const now = new Date();
    const newStart = member.expiryDate > now ? member.expiryDate : now;

    const newExpiry = new Date(newStart);
    newExpiry.setMonth(newExpiry.getMonth() + plan.durationInMonths);

    member.currentPlan = plan._id;
    member.startDate = newStart;
    member.expiryDate = newExpiry;
    member.status = 'active';

    await member.save();

    const populated = await member.populate('currentPlan', 'title durationInMonths price');

    res.status(200).json({
      success: true,
      message: 'Membership renewed.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/members/:id
 * Hard delete. Owner-only (route-level) — admins should suspend instead.
 */
export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Member deleted.' });
  } catch (err) {
    next(err);
  }
};
