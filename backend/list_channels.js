import mongoose from 'mongoose';
import Channel from './models/Channel.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkChannels() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/slackclone';
  await mongoose.connect(uri);
  const channels = await Channel.find({}, 'name _id');
  console.log('Channels in DB:');
  console.log(JSON.stringify(channels, null, 2));
  await mongoose.disconnect();
}

checkChannels();
