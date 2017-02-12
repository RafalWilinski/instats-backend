const logger = require('../../log');

const postgresError = (error, res) => {
  res.status(500);
  return res.json({
    error,
  });
};

const returnData = (data, res) => {
  res.status(200);
  return res.json(data);
};

const idNotProvidedError = (res) => {
  res.status(400);
  return res.json({
    error: 'id not provided',
  });
};

const instagramError = (req, res) => {
  logger.error('Error while getStats request', {
    access_token: req.query.access_token
  });

  res.status(400);
  return res.json({
    error: 'failed to fetch stats from instagram'
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

const accessTokenMissingError = (res) => {
  res.status(400);
  return res.json({
    error: 'access_token not provided'
  });
};

const userNotFoundError = (res) => {
  res.status(400);
  return res.json({
    error: 'users not found'
  });
};

const requestCodeMissing = res => {
  res.status(403);
  return res.json({
    error: 'exchange code is missing',
  });
};

const failedToUpdateAccessToken = (error, res) => {
  logger.error('failed to update access token', {
    error,
    body,
  });

  res.status(403);
  return res.json({
    error: 'Failed to exchange token'
  });
};

const failedToReqisterUser = (error, res) => {
  logger.error('Failed to register new user to DB', {
    error,
    body,
  });

  res.status(400);
  return res.json({
    error: 'failed to register user',
  });
};

const instagramApiError = (error, res) => {
  logger.error('Failed to register new user - Instagram API Responded with error', error);
  res.status(403);
  return res.json({
    error: 'Failed to exchange token',
  });
};

module.exports = {
  postgresError,
  returnData,
  idNotProvidedError,
  instagramError,
  accessTokenMissingError,
  userNotFoundError,
  requestCodeMissing,
  instagramCodeNotPresent,
  failedToUpdateAccessToken,
  failedToReqisterUser,
  instagramApiError,
};
