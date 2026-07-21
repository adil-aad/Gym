import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym';

const start = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✔ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`✔ Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✖ Failed to start server:', err);
    process.exit(1);
  }
};

start();
