const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  try {
    const { user, withUser } = req.query || {};
    if (!user || !withUser) return res.status(400).json({ error: 'user and withUser query params required' });
    // get last 100 messages
    const key = `history:${user}:${withUser}`;
    const items = await redis.lrange(key, 0, 99);
    const messages = items.map(i => JSON.parse(i)).reverse();
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
