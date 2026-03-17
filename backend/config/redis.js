import { createClient } from 'redis';

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️  Redis error (non-fatal):', err.message);
    });

    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️  Redis not available, running without cache:', error.message);
    redisClient = null;
  }
};

export { redisClient, connectRedis };
