import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { signToken } from '../utils/jwt';

/** Strip the password field before sending a user in a response */
const sanitizeUser = (user: IUser) => {
  const { password, ...rest } = user.toObject();
  return rest;
};

/**
 * POST /api/auth/register
 * Owner-only: create a new admin (or owner) account.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email and password are required.',
      });
      return;
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
      return;
    }

    // Password hashing happens in the User pre-save hook
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'owner' ? 'owner' : 'admin',
    });

    res.status(201).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Public: authenticate and receive a JWT.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    // password has `select: false`, so request it explicitly
    const user = await User.findOne({ email: String(email).toLowerCase() }).select(
      '+password',
    );

    // Same message for "no user" and "wrong password" — don't leak which
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact the owner.',
      });
      return;
    }

    const token = signToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected: return the currently authenticated user.
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // `protect` middleware has already loaded req.user
    res.status(200).json({
      success: true,
      data: sanitizeUser(req.user!),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/update-password
 * Protected: change own password (requires current password).
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
      return;
    }

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!(await user.comparePassword(currentPassword))) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
      return;
    }

    user.password = newPassword; // re-hashed by the pre-save hook
    await user.save();

    // Issue a fresh token so the client can keep the session going
    const token = signToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      token,
    });
  } catch (err) {
    next(err);
  }
};
