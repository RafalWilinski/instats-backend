const postgres = require('../../postgres');
const logger = require('../../log');

const registerUser = (payload) => new Promise((resolve, reject) => {
  postgres('users')
    .insert({
      instagram_id: payload.user.id,
      instagram_name: payload.user.username,
      access_token: payload.access_token,
      profile_picture: payload.user.profile_picture,
      last_login: new Date().toUTCString(),
      access_token_validity: true,
      is_premium: false,
      register_date: new Date().toUTCString()
    })
    .returning('*')
    .then((data) => {
      logger.info('New user registered', {
        result: data,
        payload
      });

      return resolve(data);
    })
    .catch((error) => {
      logger.error('Error while registering new user', {
        error,
        payload
      });

      return reject(error);
    });
});

module.exports = registerUser;
