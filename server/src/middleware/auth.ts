import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { verifyToken } from '../utils/jwt';

// Augment Express's Request so `req.user` is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Require a valid Bearer token. Attaches the authenticated user to `req.user`.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    const user = await User.findById(payload.id);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists or is deactivated.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restrict a route to specific roles. Must run AFTER `protect`.
 *
 *   router.get('/revenue', protect, restrictTo('owner'), getRevenue);
 */
export const restrictTo = (...roles: Array<'owner' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
};
