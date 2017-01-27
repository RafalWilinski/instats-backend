const logger = require('../../log');
const instagram = require('../../instagram');
const { isUserRegistered, registerUser, updateAccessToken } = require('./index');

// region Failures
const requestCodeMissing = res => {
  res.status(403);
  return res.json({
    error: 'Exchange code is missing'
  });
};

const instagramCodeNotPresent = (body, res) => {
  res.status(403);

  logger.error('Instagram API responded with non-200 status', {
    statusCode: body.code,
    body,
  });

  return res.json({
    error: 'Failed to exchange token',
    code: body.code,
  });
};

const failedToUpdateAccessToken = (error, res) => {
  logger.error('failed to update access token', {
    error,
    body
  });

  res.status(403);
  return res.json({
    error: 'Failed to exchange token'
  });
};

const failedToReqisterUser = (error, res) => {
  logger.error('Failed to register new user to DB', {
    error,
    body
  });

  res.status(400);
  return res.json({
    error: 'failed to register user'
  });
};

const instagramApiError = (error, res) => {
  logger.error('Failed to register new user - Instagram API Responded with error', error);
  res.status(403);
  return res.json({
    error: 'Failed to exchange token'
  });
};
// endregion

// region Successes
const respondWithSuccess = (data, res) => {
  res.status(200);
  return res.json({
    data: data[0],
  });
};

// endregion

const exchangeCodeForToken = (req, res) => {
  if (req.body.code == null) {
    return requestCodeMissing(res);
  }

  instagram.exchangeToken(req.body.code).then((body) => {
    if (body.hasOwnProperty('code') && body.code !== 200) {
      instagramCodeNotPresent(body, res);
    }

    isUserRegistered(body.user.id).then((user) => {
      updateAccessToken(body, user)
        .then((data) => respondWithSuccess(data, res))
        .catch((error) => failedToUpdateAccessToken(error, res));
      }).catch(() => {
        registerUser(body)
          .then((data) => respondWithSuccess(data, res))
          .catch((error) => failedToReqisterUser(error, res));
      });
  }).catch((error) => instagramApiError(error, res));
};

module.exports = exchangeCodeForToken;
