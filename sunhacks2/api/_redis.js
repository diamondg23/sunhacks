// Lightweight adapter: prefer Upstash REST (existing) else fall back to a normal Redis URL (ioredis)
// Exports a small subset of Redis commands used by the APIs: hset, sadd, lpush, lrange, rpop, smembers, llen
let client = null;

function getClient() {
  if (client) return client;
  // If UPSTASH_REDIS_REST_URL + TOKEN exist, use @upstash/redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require('@upstash/redis');
    client = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    // upstash redis methods are already promise-based and named the same as we use.
    return client;
  }

  // Else try REDIS_URL (standard redis connection string)
  if (process.env.REDIS_URL) {
    const IORedis = require('ioredis');
    const r = new IORedis(process.env.REDIS_URL);
    // wrap ioredis with simple methods matching the subset we need
    client = {
      hset: (key, obj) => r.hset(key, obj),
      sadd: (key, val) => r.sadd(key, val),
      lpush: (key, val) => r.lpush(key, val),
      lrange: (key, start, stop) => r.lrange(key, start, stop),
      rpop: (key) => r.rpop(key),
      smembers: (key) => r.smembers(key),
      llen: (key) => r.llen(key),
      // expose the raw client in case someone needs it
      raw: r,
    };
    return client;
  }

  // No redis configured
  throw new Error('No Redis configuration found. Set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN or REDIS_URL');
}

module.exports = getClient();
