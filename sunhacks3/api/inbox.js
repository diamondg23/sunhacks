const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  try {
    const user = req.query.user;
    if (!user) return res.status(400).json({ error: 'user query param required' });
    // pop all messages from inbox
    const items = [];
    while (true) {
      const item = await redis.rpop(`inbox:${user}`);
      if (!item) break;
      items.push(JSON.parse(item));
    }
    return res.json({ ok: true, messages: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
