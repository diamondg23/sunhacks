const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  try {
    const members = await redis.smembers('users');
    // for each user, check if inbox length > 0
    const result = [];
    for (const u of members) {
      const len = await redis.llen(`inbox:${u}`);
      result.push({ username: u, offlineMessages: len });
    }
    return res.json({ ok: true, users: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
