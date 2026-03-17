import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function setupUsers() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/slackclone';
  await mongoose.connect(uri);

  const salt = await bcrypt.genSalt(10);
  const adminHashedPassword = await bcrypt.hash('sriharsha123', salt);
  const userHashedPassword = await bcrypt.hash('testuser1', salt);

  // Setup Admin
  await User.findOneAndUpdate(
    { email: 'sriharshaswamy@gmail.com' },
    { 
      username: 'sriharsha', 
      password: adminHashedPassword, 
      role: 'admin' 
    },
    { upsert: true, new: true }
  );

  // Setup Regular User
  await User.findOneAndUpdate(
    { email: 'testuser1@mail.com' },
    { 
      username: 'testuser1', 
      password: userHashedPassword, 
      role: 'user' 
    },
    { upsert: true, new: true }
  );

  console.log('Database users updated with requested credentials.');
  await mongoose.disconnect();
}

setupUsers();
