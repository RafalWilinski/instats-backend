const postgres = require('../../../postgres');

const isUserRegistered = (instagram_id) => new Promise((resolve, reject) =>
  postgres('users')
    .select('*')
    .where({
      instagram_id,
    })
    .then((data) => {
      if (data.length > 0) return resolve(data[0]);
      else return reject();
    })
    .catch((error) => reject())
);

module.exports = isUserRegistered;
