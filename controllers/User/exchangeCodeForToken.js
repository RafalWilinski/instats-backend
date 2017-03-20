const instagram = require('../../instagram');
const responses = require('./../responses');
const { isUserRegistered, registerUser, updateAccessToken } = require('./index');

const exchangeCodeForToken = (req, res) => {
  if (req.body.code == null) {
    return responses.returnStatus('Request code missing', 403, res);
  }

  instagram.exchangeToken(req.body.code).then((body) => {
    if (body.hasOwnProperty('code') && body.code !== 200) {
      return responses.returnStatus('Instagram Exchange code not present in response', 403, res);
    }

    isUserRegistered(body.user.id).then((user) => {
      updateAccessToken(body, user)
        .then((data) => responses.returnData(data, res))
        .catch((error) => responses.returnStatus('Failed to update access token', 403, res, error));
      }).catch(() => {
        registerUser(body)
          .then((data) => responses.returnData(data[0], res))
          .catch((error) => responses.returnStatus('Failed to register user', 500, res, error));
      });
  }).catch((error) => responses.returnStatus('Instagram API Error', 422, res, error));
};

module.exports = exchangeCodeForToken;
