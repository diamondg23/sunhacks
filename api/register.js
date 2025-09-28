const redis = require('./_redis');

module.exports = async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ error: 'username required' });
    const key = `user:${username}`;
    await redis.hset(key, { username, createdAt: Date.now().toString() });
    await redis.sadd('users', username);
    return res.json({ ok: true, username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
