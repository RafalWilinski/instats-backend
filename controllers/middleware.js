const postgres = require('./../postgres');

const authMiddleware = (req, res, next) => {
  postgres('users')
    .select('*')
    .where({
      id: req.params.userId,
      access_token: req.query.access_token,
    })
    .then((data) => {
      if (data.length === 1) return next();

      return res.status(403).json({ error: 'Unauthorized' });
    })
    .catch(() => {
      return res.status(403).json({ error: 'Unauthorized' });
    });
};

module.exports = authMiddleware;
