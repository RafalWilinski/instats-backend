const instagram = require('../../instagram');
const responses = require('./responses');
const { isUserRegistered, registerUser, updateAccessToken } = require('./index');

const exchangeCodeForToken = (req, res) => {
  if (req.body.code == null) {
    return responses.requestCodeMissing(res);
  }

  instagram.exchangeToken(req.body.code).then((body) => {
    if (body.hasOwnProperty('code') && body.code !== 200) {
      return responses.instagramCodeNotPresent(body, res);
    }

    isUserRegistered(body.user.id).then((user) => {
      updateAccessToken(body, user)
        .then((data) => responses.returnData(data, res))
        .catch((error) => responses.failedToUpdateAccessToken(error, res));
      }).catch(() => {
        registerUser(body)
          .then((data) => responses.returnData(data[0], res))
          .catch((error) => responses.failedToReqisterUser(error, res));
      });
  }).catch((error) => responses.instagramApiError(error, res));
};

module.exports = exchangeCodeForToken;
