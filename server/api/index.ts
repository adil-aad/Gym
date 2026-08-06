import 'dotenv/config';
import { connectDB } from '../src/db';
import app from '../src/app';

// Vercel serverless entry point — connects to MongoDB on cold start
// then delegates to the Express app.
export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
