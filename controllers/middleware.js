const postgres = require('./../postgres');
const responses = require('./responses');

const authMiddleware = (req, res, next) => {
  if (req.query.access_token == null) {
    return responses.returnStatus('access_token query param missing', 403, res);
  }

  if (req.params.userId == null && req.query.userId == null) {
    return responses.returnStatus('userId query/param missing', 422, res);
  }

  postgres('users')
    .select('*')
    .where({
      id: req.params.userId,
      access_token: req.query.access_token,
    })
    .then((data) => {
      if (data.length === 1) return next();

      return responses.returnStatus('unauthorized', 403, res);
    })
    .catch(() => {
      return responses.returnStatus('unauthorized', 403, res);
    });
};

module.exports = authMiddleware;
