const postgres = require('../../postgres');
const responses = require('./../responses');

const registerNotificationsToken = (req, res) => {
  if (req.params.userId == null) {
    return responses.returnStatus('UserId not provided', 422, res);
  }

  postgres('users')
    .where({
      id: req.params.userId,
    })
    .update({
      notifications_token: req.body.notifications_token
    })
    .then((data) => res.send({}))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res));
};

module.exports = registerNotificationsToken;
