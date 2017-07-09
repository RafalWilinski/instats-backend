const postgres = require('../../postgres');
const responses = require('./../responses');
const helpers = require('../helpers');

const getUser = (req, res) => {
  if (req.query.access_token == null) {
    return responses.returnStatus('access_token not provided', 422, res);
  }

  postgres('users')
    .where({
      access_token: req.query.access_token,
    })
    .increment('logins_count', 1)
    .returning('*')
    .update({
      last_login: new Date().toUTCString(),
    })
    .then((data) => {
      if (Boolean(data[0].access_token_validity)) return responses.returnData(data[0], res);
      return responses.returnStatus({ err: 'ACCESS_TOKEN_REVOKED' }, 403, res, data);
    })
    .catch((error) => {
      return responses.returnStatus(error, 500, res, error);
    });
};

module.exports = getUser;
