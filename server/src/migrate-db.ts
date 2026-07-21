import 'dotenv/config';
import mongoose from 'mongoose';

const dst = process.env.MONGO_URI!; // Hammer-one
const src = dst.replace(/\/[^/?]+(\?|$)/, '/test$1'); // same cluster, test db

const run = async () => {
  const srcConn = await mongoose.createConnection(src).asPromise();
  const dstConn = await mongoose.createConnection(dst).asPromise();

  const cols = await srcConn.db!.listCollections().toArray();
  for (const { name } of cols) {
    const docs = await srcConn.db!.collection(name).find({}).toArray();
    if (docs.length === 0) { console.log(`${name}: empty, skipped`); continue; }
    try {
      await dstConn.db!.collection(name).insertMany(docs, { ordered: false });
      console.log(`${name}: copied ${docs.length}`);
    } catch (e: any) {
      if (e.code === 11000) console.log(`${name}: copied (some duplicates skipped)`);
      else throw e;
    }
  }

  await srcConn.close();
  await dstConn.close();
};

run();
