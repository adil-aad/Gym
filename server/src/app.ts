import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import planRoutes from './routes/planRoutes';
import memberRoutes from './routes/memberRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  // Mongoose validation errors → 400
  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // Malformed ObjectId in a route param → 400 (not 500)
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid id format.' });
    return;
  }

  // Duplicate key (e.g., unique email/phone) → 409
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate value for a unique field.' });
    return;
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
