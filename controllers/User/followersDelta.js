const postgres = require('../../postgres');
const helpers = require('../helpers');

const idNotProvidedError = (res) => {
  res.status(400);
  return res.json({
    error: 'id not provided',
  });
};


const getFollowersDelta = (req, res) => {
  if (req.query.userId == null) {
    return idNotProvidedError(res);
  }

  postgres('followers_deltas')
    .select('*')
    .where({
      user_ref: req.query.userId,
    })
    .limit(helpers.getLimit(req))
    .then((data) => returnData(data, res))
    .catch((error) => postgresError(error, res));
};

module.exports = getFollowersDelta;
