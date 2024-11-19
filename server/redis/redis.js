const Redis = require("ioredis");
const { REDIS_KEYS } = require("../constants");
const dotenv = require("dotenv");

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

async function enqueJobInQueue(job) {
  return await redis.lpush(
    REDIS_KEYS.VIDEO_TRANSCODING_QUEUE,
    JSON.stringify(job)
  );
}

async function dequeueJobFromQueue() {
  const job = await redis.rpop(REDIS_KEYS.VIDEO_TRANSCODING_QUEUE);
  return job ? JSON.parse(job) : null;
}

async function getKey(key) {
  return await redis.get(key);
}

async function setKey(key, value, options = {}) {
  if (!redis) {
    console.log("Redis connection not established");
    return;
  }

  try {
    const defaultOptions = {
      expire: 0,
      setIfNotExist: false,
    };
    const mergedOptions = { ...defaultOptions, ...options };

    const params = [key, value];
    if (mergedOptions.expire > 0) {
      params.push("EX", mergedOptions.expire);
    }
    if (mergedOptions.setIfNotExist) {
      params.push("NX");
    }

    const response = await redis.send_command("SET", params);

    if (response === "OK") {
      console.log(`${key} set to ${value}`);
      return true;
    } else {
      throw new Error("Failed to set key");
    }
  } catch (error) {
    console.error(`Error setting key ${key}:`, error);
    return false;
  }
}

async function deleteKey(key) {
  return await redis.del(key);
}

async function increment(key) {
  const value = await redis.incr(key);
  console.log("Incremented value: ", value);
  return value;
}

async function decrement(key) {
  const value = await redis.decr(key);
  console.log("Decremented value: ", value);
  return value;
}

async function getQueueLength() {
  return redis.llen(REDIS_KEYS.VIDEO_TRANSCODING_QUEUE);
}

async function deleteAllKeys() {
  return redis.flushall();
}

// deleteKey(REDIS_KEYS.VIDEO_TRANSCODING_QUEUE).then((value) => {
//   console.log("Value: ", value);
// });

// deleteKey(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT).then((value) => {
//   console.log("Value: ", value);
// });

// dequeueJobFromQueue().then((job) => {
//   console.log("Job: ", job);
// });

module.exports = {
  enqueJobInQueue,
  dequeueJobFromQueue,
  getKey,
  setKey,
  deleteKey,
  increment,
  decrement,
  getQueueLength,
  deleteAllKeys,
};
