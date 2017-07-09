const postgres = require('../../../postgres');
const logger = require('../../../log');

const updateAccessToken = (body) => new Promise((resolve, reject) => {
  postgres('users')
    .where({
      instagram_id: body.user.id
    })
    .increment('logins_count', 1)
    .returning('*')
    .update({
      last_login: new Date().toUTCString(),
      access_token: body.access_token,
    })
    .then((data) => {
      logger.info('User info updated', {
        result: data,
        body
      });
      return resolve(data);
    })
    .catch((error) => {
      logger.error('Error while updating user', {
        error,
        body
      });
      return reject(error);
    });
});

module.exports = updateAccessToken;

