import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function makeAdmin() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/slackclone';
  await mongoose.connect(uri);
  const user = await User.findOneAndUpdate(
    { email: 'testuser1@mail.com' },
    { role: 'admin' },
    { new: true }
  );
  if (user) {
    console.log('Successfully updated testuser1 to admin:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('User testuser1@mail.com not found!');
  }
  await mongoose.disconnect();
}

makeAdmin();
