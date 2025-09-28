const redis = require('./_redis');

module.exports = async (req, res) => {
  try {
    // Attempt a cheap read used elsewhere (smembers) to verify connection
    await redis.smembers('users');
    return res.json({ ok: true, redis: true });
  } catch (err) {
    console.error('ping error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, redis: false, error: String(err) });
  }
};
