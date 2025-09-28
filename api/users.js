const redis = require('./_redis');

module.exports = async (req, res) => {
  try {
    const members = await redis.smembers('users');
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
