const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ error: 'username required' });
    const key = `user:${username}`;
    await redis.hset(key, { username, createdAt: Date.now().toString() });
    // add to users set
    await redis.sadd('users', username);
    return res.json({ ok: true, username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
