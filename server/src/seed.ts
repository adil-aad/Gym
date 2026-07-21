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

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI!);

  const existing = await User.findOne({ email: 'owner@gym.com' });
  if (!existing) {
    await User.create({ name: 'Gym Owner', email: 'owner@gym.com', password: 'secret123', role: 'owner' });
    console.log('owner created');
  } else {
    console.log('owner already exists');
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
