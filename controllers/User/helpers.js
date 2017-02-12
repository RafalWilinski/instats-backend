const postgres = require('../../postgres');
const logger = require('../../log');

const updateAccessToken = (body) => new Promise((resolve, reject) => {
  postgres('users')
    .where({
      instagram_id: body.user.id
    })
    .increment('logins_count', 1)
    .returning('*')
    .update({
      last_login: new Date().toUTCString(),
      access_token: body.access_token
    })
    .then((data) => {
      logger.info('User info updated', {
        result: data,
        body
      });
      return resolve(data);
    })
    .catch((error) => {
      logger.error('Error while registering new user', {
        error,
        body
      });
      return reject(error);
    });
});

const isUserRegistered = (instagram_id) => new Promise((resolve, reject) =>
  postgres('users')
    .select('*')
    .where({
      instagram_id
    })
    .then((data) => {
      if (data.length > 0) return resolve(data[0]);
      else return reject();
    })
    .catch((error) => reject())
);

module.exports = {
  updateAccessToken,
  isUserRegistered,
};
