import { Request, Response, NextFunction } from 'express';
import Plan from '../models/Plan';

/**
 * GET /api/plans
 * List plans. Pass ?includeInactive=true to also get deactivated plans.
 */
export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filter =
      req.query.includeInactive === 'true' ? {} : { isActive: true };

    const plans = await Plan.find(filter).sort({ price: 1 });

    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/plans/:id
 */
export const getPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/plans
 */
export const createPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, durationInMonths, price, description } = req.body;

    const plan = await Plan.create({ title, durationInMonths, price, description });

    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/plans/:id
 */
export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, durationInMonths, price, description, isActive } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { title, durationInMonths, price, description, isActive },
      { new: true, runValidators: true },
    );

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/plans/:id
 * Soft delete — members and payments still reference the plan, so we only
 * deactivate it (it disappears from the default plan list).
 */
export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Plan deactivated.',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
};
