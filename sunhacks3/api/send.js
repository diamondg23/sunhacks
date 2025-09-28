const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  try {
    const { username, recipient, text } = req.body || {};
    if (!username || !recipient || !text) return res.status(400).json({ error: 'username, recipient and text required' });
    const ts = Date.now();
    const msg = JSON.stringify({ sender: username, recipient, text, timestamp: ts });
    // push to recipient inbox list
    await redis.lpush(`inbox:${recipient}`, msg);
    // store history for both participants (as lists)
    await redis.lpush(`history:${username}:${recipient}`, msg);
    await redis.lpush(`history:${recipient}:${username}`, msg);
    return res.json({ ok: true, msg: JSON.parse(msg) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
