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


module.exports = {
  postgresError,
  returnData,
  idNotProvidedError,
  instagramError,
  accessTokenMissingError,
  userNotFoundError,
};
