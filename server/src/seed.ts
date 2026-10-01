import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User';
import Plan from './models/Plan';

const PLANS = [
  { title: 'Monthly', durationInMonths: 1, price: 3000 },
  { title: 'Quarterly', durationInMonths: 3, price: 8000 },
  { title: 'Half-Yearly', durationInMonths: 6, price: 14000 },
  { title: 'Yearly', durationInMonths: 12, price: 25000 },
];

const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const run = async () => {
  if (!OWNER_PASSWORD || !ADMIN_PASSWORD) {
    throw new Error(
      'Set SEED_OWNER_PASSWORD and SEED_ADMIN_PASSWORD in server/.env before seeding.'
    );
  }

  await mongoose.connect(process.env.MONGO_URI!);

  const existing = await User.findOne({ email: 'owner@gym.com' });
  if (!existing) {
    await User.create({ name: 'Gym Owner', email: 'owner@gym.com', password: OWNER_PASSWORD, role: 'owner' });
    console.log('owner created');
  } else {
    console.log('owner already exists');
  }

  const existingAdmin = await User.findOne({ email: 'admin@gym.com' });
  if (!existingAdmin) {
    await User.create({ name: 'Gym Admin', email: 'admin@gym.com', password: ADMIN_PASSWORD, role: 'admin' });
    console.log('admin created');
  } else {
    console.log('admin already exists');
  }

  for (const plan of PLANS) {
    const found = await Plan.findOne({ durationInMonths: plan.durationInMonths });
    if (!found) {
      await Plan.create(plan);
      console.log(`plan created: ${plan.title}`);
    } else {
      console.log(`plan already exists: ${found.title}`);
    }
  }

  await mongoose.disconnect();
};
run();
